const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");
const { calculateElo } = require("./elo");
const { getRank } = require("./ranks");
const { authenticate, publicProfile: sanitizeProfile, registerAccount, resumeSession, validTeams } = require("./auth");
const { createMatch, matchDuration, setInput, snapshot, tickMatch } = require("./match-engine");

const root = __dirname;
const port = Number(process.env.PORT ?? 3000);
const dataDirectory = process.env.DATA_DIR || path.join(root, "data");
const profilesPath = path.join(dataDirectory, "profiles.json");
const afkTimeoutMs = Math.max(1000, Number(process.env.AFK_TIMEOUT_MS) || 45000);
const afkWarningMs = Math.max(500, afkTimeoutMs - 15000);
const teams = {
	barcelona: "FC Barcelona", "real-madrid": "Real Madrid", "man-city": "Manchester City", arsenal: "Arsenal",
	psg: "Paris Saint-Germain", marseille: "Olympique de Marseille", "nation-france": "France", "nation-spain": "Espagne",
	"nation-england": "Angleterre", "nation-germany": "Allemagne", "nation-argentina": "Argentine", "nation-brazil": "Brésil",
	"nation-portugal": "Portugal", "nation-morocco": "Maroc",
};
const contentTypes = {
	".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
	".webp": "image/webp", ".avif": "image/avif", ".celeb": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2",
};
const publicRoots = new Set(["index.html", "game.js", "online.js", "ranks.js", "match-stats.js", "player-stamina.js", "shot-physics.js", "styme.css", "1"]);
let profiles = loadProfiles();
const queue = [];
const rooms = new Map();
const authAttempts = new Map();

function loadProfiles() {
	try {
		return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
	} catch {
		return {};
	}
}

function persistProfiles() {
	fs.mkdirSync(dataDirectory, { recursive: true });
	const temporaryPath = `${profilesPath}.tmp`;
	fs.writeFileSync(temporaryPath, JSON.stringify(profiles, null, 2));
	fs.renameSync(temporaryPath, profilesPath);
}

function publicProfile(profile) {
	return { ...sanitizeProfile(profile), teamName: teams[profile.teamId] || teams.barcelona, rank: getRank(profile.rating) };
}

function send(socket, message) {
	if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function removeFromQueue(socket) {
	const index = queue.findIndex((entry) => entry.socket === socket);
	if (index !== -1) queue.splice(index, 1);
}

function sendError(socket, message) {
	send(socket, { type: "error", message });
}

function pairPlayers(first, second) {
	const id = randomUUID();
	const room = {
		id,
		home: first,
		away: second,
		ready: new Set(),
		match: null,
		started: false,
		finished: false,
		lastActivity: new Map(),
		afkWarnings: new Set(),
		lastBroadcastAt: 0,
	};
	first.socket.room = room;
	first.socket.side = "home";
	second.socket.room = room;
	second.socket.side = "away";
	rooms.set(id, room);
	for (const [player, opponent, side] of [[first, second, "home"], [second, first, "away"]]) {
		send(player.socket, {
			type: "matchFound",
			matchId: id,
			side,
			teams: { home: { teamId: first.profile.teamId, name: first.profile.name }, away: { teamId: second.profile.teamId, name: second.profile.name } },
			opponent: publicProfile(opponent.profile),
		});
	}
}

function cleanInput(value) {
	if (!value || typeof value !== "object") return null;
	const number = (input) => Number.isFinite(input) ? Math.max(-1, Math.min(1, input)) : 0;
	return {
		x: number(value.x), y: number(value.y), slow: Boolean(value.slow),
		shoot: Boolean(value.shoot), feint: Boolean(value.feint),
	};
}

function finishMatch(room, winnerSide, reason) {
	if (room.finished) return;
	const homeProfile = room.home.profile;
	const awayProfile = room.away.profile;
	const homeGoals = room.match?.goals.home || 0;
	const awayGoals = room.match?.goals.away || 0;
	const scoreA = winnerSide === null ? 0.5 : winnerSide === "home" ? 1 : 0;
	const changes = calculateElo(homeProfile.rating, awayProfile.rating, scoreA);
	for (const [profile, opponent, goals, goalsAgainst, change, score] of [
		[homeProfile, awayProfile, homeGoals, awayGoals, changes.changeA, scoreA],
		[awayProfile, homeProfile, awayGoals, homeGoals, changes.changeB, 1 - scoreA],
	]) {
		profile.played += 1;
		profile.goals += goals;
		profile.goalsAgainst += goalsAgainst;
		profile.rating += change;
		if (score === 0.5) profile.draws += 1;
		else if (score === 1) profile.wins += 1;
		else profile.losses += 1;
		send(profile === homeProfile ? room.home.socket : room.away.socket, {
			type: "matchResult", homeGoals, awayGoals, winnerSide, reason, ratingChange: change,
			profile: publicProfile(profile), opponent: publicProfile(opponent),
		});
	}
	persistProfiles();
	room.finished = true;
	rooms.delete(room.id);
	for (const player of [room.home, room.away]) {
		if (player.socket.room === room) {
			player.socket.room = null;
			player.socket.side = null;
		}
	}
}

const server = http.createServer((request, response) => {
	if (request.method !== "GET") {
		response.writeHead(405).end("Method not allowed");
		return;
	}
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
	} catch {
		response.writeHead(400).end("Bad request");
		return;
	}
	if (pathname === "/api/leaderboard") {
		const leaderboard = Object.values(profiles)
			.sort((first, second) => second.rating - first.rating || second.wins - first.wins || first.name.localeCompare(second.name, "fr"))
			.slice(0, 100)
			.map(publicProfile);
		response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
		response.end(JSON.stringify(leaderboard));
		return;
	}
	const playerMatch = pathname.match(/^\/api\/players\/([^/]+)$/);
	if (playerMatch) {
		const profile = Object.values(profiles).find((player) => player.id === playerMatch[1]);
		if (!profile) {
			response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify({ error: "Joueur introuvable." }));
			return;
		}
		response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
		response.end(JSON.stringify(publicProfile(profile)));
		return;
	}
	const targetPath = path.resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
	const relativePath = path.relative(root, targetPath);
	const publicRoot = relativePath.split(path.sep)[0];
	if (targetPath !== root && (!targetPath.startsWith(`${root}${path.sep}`) || !publicRoots.has(publicRoot))) {
		response.writeHead(403).end("Forbidden");
		return;
	}
	fs.stat(targetPath, (error, stats) => {
		if (error || !stats.isFile()) {
			response.writeHead(404).end("Not found");
			return;
		}
		response.writeHead(200, { "Content-Type": contentTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
		fs.createReadStream(targetPath).pipe(response);
	});
});

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 8192 });
server.on("upgrade", (request, socket, head) => {
	if (new URL(request.url, "http://localhost").pathname !== "/ws") {
		socket.destroy();
		return;
	}
	webSockets.handleUpgrade(request, socket, head, (webSocket) => webSockets.emit("connection", webSocket));
});

function allowAuthAttempt(socket) {
	const key = socket._socket.remoteAddress || "unknown";
	const now = Date.now();
	const recent = (authAttempts.get(key) || []).filter((time) => now - time < 60000);
	if (recent.length >= 8) return false;
	recent.push(now);
	authAttempts.set(key, recent);
	return true;
}

function startRoom(room) {
	if (room.started || room.ready.size !== 2) return;
	room.match = createMatch();
	room.started = true;
	const now = Date.now();
	room.lastActivity.set("home", now);
	room.lastActivity.set("away", now);
	for (const player of [room.home, room.away]) send(player.socket, { type: "matchStart", duration: matchDuration });
}

function advanceRooms() {
	const now = Date.now();
	for (const room of rooms.values()) {
		if (!room.started || room.finished) continue;
		const idleSides = ["home", "away"].filter((side) => now - room.lastActivity.get(side) >= afkTimeoutMs);
		if (idleSides.length === 2) {
			finishMatch(room, null, "double-afk");
			continue;
		}
		if (idleSides.length === 1) {
			finishMatch(room, idleSides[0] === "home" ? "away" : "home", "afk");
			continue;
		}
		for (const side of ["home", "away"]) {
			const idleFor = now - room.lastActivity.get(side);
			if (idleFor >= afkWarningMs && !room.afkWarnings.has(side)) {
				room.afkWarnings.add(side);
				send(room[side].socket, { type: "afkWarning", seconds: Math.ceil((afkTimeoutMs - idleFor) / 1000) });
			}
		}
		const endReason = tickMatch(room.match);
		if (now - room.lastBroadcastAt >= 50) {
			room.lastBroadcastAt = now;
			const state = { type: "state", ...snapshot(room.match) };
			for (const player of [room.home, room.away]) send(player.socket, state);
		}
		if (endReason) {
			const { home, away } = room.match.goals;
			finishMatch(room, home === away ? null : home > away ? "home" : "away", endReason);
		}
	}
}

const simulationTimer = setInterval(advanceRooms, 1000 / 60);
simulationTimer.unref();

webSockets.on("connection", (socket) => {
	socket.lastInputAt = 0;
	socket.on("message", (data) => {
		let message;
		try { message = JSON.parse(data); } catch { sendError(socket, "Message invalide."); return; }
		if (!message || typeof message.type !== "string") return;

		if (message.type === "register" || message.type === "login") {
			if (socket.profile || !allowAuthAttempt(socket)) { sendError(socket, "Trop de tentatives. Réessaie dans une minute."); return; }
			try {
				const result = message.type === "register"
					? registerAccount(profiles, message.name, message.password, message.teamId)
					: authenticate(profiles, message.name, message.password);
				if (!result) { sendError(socket, "Pseudo ou mot de passe incorrect."); return; }
				socket.profile = result.profile;
				persistProfiles();
				send(socket, { type: "authOk", token: result.token, profile: publicProfile(result.profile) });
			} catch (error) {
				sendError(socket, error.message || "Impossible de créer le compte.");
			}
			return;
		}

		if (message.type === "resume") {
			if (socket.profile) return;
			const profile = resumeSession(profiles, message.token);
			if (!profile) { sendError(socket, "Session expirée. Connecte-toi de nouveau."); return; }
			socket.profile = profile;
			send(socket, { type: "authOk", profile: publicProfile(profile) });
			return;
		}

		if (!socket.profile) { sendError(socket, "Crée un compte ou connecte-toi avant de jouer."); return; }
		if (message.type === "queue") {
			if (socket.room) return;
			removeFromQueue(socket);
			const alreadyQueued = queue.some((entry) => entry.profile.id === socket.profile.id && entry.socket !== socket);
			const alreadyPlaying = [...rooms.values()].some((room) => room.home.profile.id === socket.profile.id || room.away.profile.id === socket.profile.id);
			if (alreadyQueued || alreadyPlaying) { sendError(socket, "Ce compte est déjà dans une recherche ou un match."); return; }
			if (validTeams.has(message.teamId)) socket.profile.teamId = message.teamId;
			persistProfiles();
			const entry = { socket, profile: socket.profile, queuedAt: Date.now() };
			const opponentIndex = queue.findIndex((candidate) => candidate.socket.readyState === WebSocket.OPEN && candidate.profile.id !== entry.profile.id);
			if (opponentIndex === -1) {
				queue.push(entry);
				send(socket, { type: "queued", waiting: queue.length });
			} else {
				const [opponent] = queue.splice(opponentIndex, 1);
				pairPlayers(opponent, entry);
			}
			return;
		}

		if (message.type === "cancelQueue") {
			removeFromQueue(socket);
			send(socket, { type: "queueCancelled" });
			return;
		}

		const room = socket.room;
		if (!room || room.finished) return;
		if (message.type === "ready") {
			room.ready.add(socket);
			startRoom(room);
		} else if (message.type === "input" && room.started && Date.now() - socket.lastInputAt >= 30) {
			socket.lastInputAt = Date.now();
			const input = cleanInput(message.input);
			if (!input) return;
			setInput(room.match, socket.side, input);
			const active = input.x !== 0 || input.y !== 0 || input.slow || input.shoot || input.feint;
			if (active) {
				room.lastActivity.set(socket.side, Date.now());
				if (room.afkWarnings.delete(socket.side)) send(socket, { type: "afkClear" });
			}
		} else if (message.type === "forfeit") {
			finishMatch(room, socket.side === "home" ? "away" : "home", "forfeit");
		} else if (message.type === "state" || message.type === "finish") {
			sendError(socket, "Les positions et scores sont calculés par le serveur.");
		}
	});
	socket.on("close", () => {
		removeFromQueue(socket);
		const room = socket.room;
		if (room && !room.finished) {
			if (room.started) finishMatch(room, socket.side === "home" ? "away" : "home", "disconnect");
			else {
				const opponent = room.home.socket === socket ? room.away.socket : room.home.socket;
				send(opponent, { type: "opponentDisconnected" });
				rooms.delete(room.id);
				socket.room = null;
				opponent.room = null;
				opponent.side = null;
			}
		}
	});
});

server.listen(port, "0.0.0.0", () => console.log(`Onze en ligne : http://localhost:${server.address().port}`));