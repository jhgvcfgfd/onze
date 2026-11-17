const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const WebSocket = require("ws");

function nextMessage(socket, type, timeoutMs = 5000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			socket.off("message", onMessage);
			reject(new Error(`Timed out waiting for ${type}`));
		}, timeoutMs);
		function onMessage(data) {
			const message = JSON.parse(data);
			if (Array.isArray(type) ? !type.includes(message.type) : message.type !== type) return;
			clearTimeout(timer);
			socket.off("message", onMessage);
			resolve(message);
		}
		socket.on("message", onMessage);
	});
}

async function connectAccount(url, name, teamId) {
	const socket = new WebSocket(url);
	await once(socket, "open");
	const response = nextMessage(socket, "authOk");
	socket.send(JSON.stringify({ type: "register", name, password: "MotDePasseTresSolide", teamId }));
	const result = await response;
	socket.profile = result.profile;
	socket.sessionToken = result.token;
	return socket;
}

function queuePlayer(socket, teamId) {
	socket.send(JSON.stringify({ type: "queue", teamId }));
}

async function startMatch(home, away) {
	const homeFound = nextMessage(home, ["matchFound", "error"]);
	const homeQueued = nextMessage(home, "queued");
	queuePlayer(home, home.profile.teamId);
	await homeQueued;
	const awayFound = nextMessage(away, ["matchFound", "error"]);
	queuePlayer(away, away.profile.teamId);
	const [homePair, awayPair] = await Promise.all([homeFound, awayFound]);
	assert.equal(homePair.type, "matchFound", homePair.message);
	assert.equal(awayPair.type, "matchFound", awayPair.message);
	assert.equal(homePair.side, "home");
	assert.equal(awayPair.side, "away");
	const homeStarted = nextMessage(home, "matchStart");
	const awayStarted = nextMessage(away, "matchStart");
	home.send(JSON.stringify({ type: "ready" }));
	away.send(JSON.stringify({ type: "ready" }));
	await Promise.all([homeStarted, awayStarted]);
}

test("accounts, authoritative match results, forfeits, disconnects, and AFK", { timeout: 20000 }, async (t) => {
	const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "onze-online-"));
	const serverProcess = spawn(process.execPath, [path.join(__dirname, "server.js")], {
		cwd: __dirname,
		env: { ...process.env, PORT: "0", DATA_DIR: dataDirectory, AFK_TIMEOUT_MS: "1800" },
		stdio: ["ignore", "pipe", "pipe"],
	});
	let output = "";
	serverProcess.stdout.on("data", (chunk) => { output += chunk.toString(); });
	const port = await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 5000);
		serverProcess.stdout.on("data", () => {
			const match = output.match(/localhost:(\d+)/);
			if (!match) return;
			clearTimeout(timer);
			resolve(Number(match[1]));
		});
		serverProcess.once("error", reject);
	});
	const url = `ws://127.0.0.1:${port}/ws`;
	const pageResponse = await fetch(`http://127.0.0.1:${port}/`);
	assert.equal(pageResponse.status, 200);
	const privateFileResponse = await fetch(`http://127.0.0.1:${port}/server.js`);
	assert.equal(privateFileResponse.status, 403);
	const unauthenticated = new WebSocket(url);
	await once(unauthenticated, "open");
	const authRequired = nextMessage(unauthenticated, "error");
	queuePlayer(unauthenticated, "barcelona");
	assert.match((await authRequired).message, /compte/);

	const home = await connectAccount(url, "Joueur A", "barcelona");
	const away = await connectAccount(url, "Joueur B", "real-madrid");
	const third = await connectAccount(url, "Joueur C", "psg");
	const boardResponse = await fetch(`http://127.0.0.1:${port}/api/leaderboard`);
	assert.equal(boardResponse.status, 200);
	const leaderboard = await boardResponse.json();
	assert.equal(leaderboard.length, 3);
	assert.ok(leaderboard.every((profile) => profile.rank.label === "Bronze I"));
	assert.equal(leaderboard[0].passwordHash, undefined);
	assert.equal(leaderboard[0].sessions, undefined);
	const playerResponse = await fetch(`http://127.0.0.1:${port}/api/players/${home.profile.id}`);
	assert.equal(playerResponse.status, 200);
	assert.equal((await playerResponse.json()).name, "Joueur A");
	assert.equal((await fetch(`http://127.0.0.1:${port}/api/players/unknown`)).status, 404);
	const clients = [unauthenticated, home, away, third];
	t.after(async () => {
		for (const socket of clients) if (socket.readyState === WebSocket.OPEN) socket.close();
		if (serverProcess.exitCode === null) {
			const exited = once(serverProcess, "exit");
			serverProcess.kill();
			await exited;
		}
		fs.rmSync(dataDirectory, { recursive: true, force: true });
	});

	const login = new WebSocket(url);
	clients.push(login);
	await once(login, "open");
	const resumed = nextMessage(login, "authOk");
	login.send(JSON.stringify({ type: "resume", token: home.sessionToken }));
	assert.equal((await resumed).profile.id, home.profile.id);
	const wrongLogin = new WebSocket(url);
	clients.push(wrongLogin);
	await once(wrongLogin, "open");
	const loginError = nextMessage(wrongLogin, "error");
	wrongLogin.send(JSON.stringify({ type: "login", name: "Joueur A", password: "MauvaisMotDePasse" }));
	assert.match((await loginError).message, /incorrect/);

	await startMatch(home, away);
	const homeState = nextMessage(home, "state");
	const awayState = nextMessage(away, "state");
	const input = { x: 1, y: -1, sprint: true, shoot: false };
	home.send(JSON.stringify({ type: "input", input }));
	away.send(JSON.stringify({ type: "input", input: { ...input, x: -1 } }));
	const [homeSnapshot, awaySnapshot] = await Promise.all([homeState, awayState]);
	assert.equal(homeSnapshot.homeGoals, 0);
	assert.equal(awaySnapshot.remaining, homeSnapshot.remaining);
	assert.notEqual(homeSnapshot.home.x, homeSnapshot.away.x);
	const rejectedCheat = nextMessage(home, "error");
	home.send(JSON.stringify({ type: "finish", homeGoals: 99, awayGoals: 0 }));
	assert.match((await rejectedCheat).message, /calculés par le serveur/);

	const homeForfeit = nextMessage(home, "matchResult");
	const awayForfeit = nextMessage(away, "matchResult");
	home.send(JSON.stringify({ type: "forfeit" }));
	const [homeForfeitResult, awayForfeitResult] = await Promise.all([homeForfeit, awayForfeit]);
	assert.equal(homeForfeitResult.reason, "forfeit");
	assert.equal(homeForfeitResult.winnerSide, "away");
	assert.equal(homeForfeitResult.ratingChange, -16);
	assert.equal(awayForfeitResult.ratingChange, 16);

	await startMatch(home, away);
	const disconnectResult = nextMessage(home, "matchResult");
	away.close();
	assert.equal((await disconnectResult).reason, "disconnect");

	await startMatch(home, third);
	const afkWarning = nextMessage(home, "afkWarning", 3000);
	const afkClear = nextMessage(home, "afkClear", 3000);
	const homeAfkResult = nextMessage(home, "matchResult", 5000);
	const thirdAfkResult = nextMessage(third, "matchResult", 5000);
	assert.ok((await afkWarning).seconds > 0);
	home.send(JSON.stringify({ type: "input", input: { x: 1 } }));
	assert.equal((await afkClear).type, "afkClear");
	const [homeAfk, thirdAfk] = await Promise.all([homeAfkResult, thirdAfkResult]);
	assert.equal(homeAfk.reason, "afk");
	assert.equal(homeAfk.winnerSide, "home");
	assert.equal(thirdAfk.reason, "afk");

	await startMatch(home, third);
	const homeWarningAgain = nextMessage(home, "afkWarning", 3000);
	const homeDrawResult = nextMessage(home, "matchResult", 5000);
	const thirdDrawResult = nextMessage(third, "matchResult", 5000);
	await Promise.all([homeWarningAgain, nextMessage(third, "afkWarning", 3000)]);
	const [homeDraw, thirdDraw] = await Promise.all([homeDrawResult, thirdDrawResult]);
	assert.equal(homeDraw.reason, "double-afk");
	assert.equal(homeDraw.winnerSide, null);
	assert.equal(homeDraw.profile.draws, 1);
	assert.equal(thirdDraw.profile.draws, 1);
});