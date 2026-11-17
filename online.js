(() => {
	const fields = {
		name: document.querySelector("#online-name"),
		password: document.querySelector("#online-password"),
		team: document.querySelector("#online-team"),
		register: document.querySelector("#online-register-button"),
		login: document.querySelector("#online-login-button"),
		queue: document.querySelector("#online-queue-button"),
		cancel: document.querySelector("#online-cancel-button"),
		status: document.querySelector("#online-status"),
	};
	let storedProfile = readStoredProfile();
	let sessionToken = readSessionToken();
	let socket = null;
	let pendingAuth = null;
	let pendingQueue = false;
	let isQueued = false;
	let isInMatch = false;
	let isAuthenticated = false;
	const leaderboardList = document.querySelector("#leaderboard-list");
	const leaderboardStatus = document.querySelector("#leaderboard-status");
	const leaderboardCount = document.querySelector("#leaderboard-count");
	const playerCard = document.querySelector("#player-card");

	fields.name.value = storedProfile?.name || "";
	fields.team.value = storedProfile?.teamId || "barcelona";
	fields.queue.disabled = true;
	if (storedProfile) updateStats(storedProfile);

	function readStoredProfile() {
		try { return JSON.parse(localStorage.getItem("onze-online-profile") || "null"); }
		catch { return null; }
	}

	function readSessionToken() {
		try { return localStorage.getItem("onze-online-session"); }
		catch { return null; }
	}

	function saveProfile(profile = storedProfile) {
		storedProfile = {
			...(profile || {}),
			name: fields.name.value.trim().slice(0, 16),
			teamId: fields.team.value,
		};
		try { localStorage.setItem("onze-online-profile", JSON.stringify(storedProfile)); }
		catch {}
	}

	function updateStats(profile) {
		const values = {
			"online-rating": profile.rating ?? 1000,
			"online-played": profile.played ?? 0,
			"online-wins": profile.wins ?? 0,
			"online-goals": profile.goals ?? 0,
			"online-win-rate": `${profile.winRate ?? 0}%`,
		};
		for (const [id, value] of Object.entries(values)) document.querySelector(`#${id}`).textContent = String(value);
	}

	function addText(parent, tag, className, value) {
		const element = document.createElement(tag);
		if (className) element.className = className;
		element.textContent = String(value);
		parent.append(element);
		return element;
	}

	function makeRankBadge(rank, compact = false) {
		const badge = document.createElement("span");
		badge.className = `rank-badge rank-${rank.tier.toLowerCase()}${compact ? " is-compact" : ""}`;
		badge.textContent = rank.tier === "Masters" ? "M" : rank.tier.slice(0, 1);
		badge.setAttribute("aria-hidden", "true");
		return badge;
	}

	function showPlayerCard(profile) {
		const rank = profile.rank || window.onzeRanks.getRank(profile.rating);
		playerCard.replaceChildren();
		addText(playerCard, "p", "eyebrow", "FICHE JOUEUR");
		const identity = document.createElement("div");
		identity.className = "player-card-identity";
		identity.append(makeRankBadge(rank));
		const name = document.createElement("div");
		addText(name, "h3", "", profile.name);
		addText(name, "p", "player-team", profile.teamName || "Équipe inconnue");
		identity.append(name);
		playerCard.append(identity);
		addText(playerCard, "p", "player-rank-label", rank.label);
		const progress = document.createElement("div");
		progress.className = "rank-progress";
		progress.setAttribute("role", "progressbar");
		progress.setAttribute("aria-label", `Progression vers le rang suivant : ${rank.progress} %`);
		progress.setAttribute("aria-valuemin", "0");
		progress.setAttribute("aria-valuemax", "100");
		progress.setAttribute("aria-valuenow", String(rank.progress));
		const progressFill = document.createElement("span");
		progressFill.style.width = `${rank.progress}%`;
		progress.append(progressFill);
		playerCard.append(progress);
		addText(playerCard, "p", "rank-points", `${rank.points} POINTS DE RANG · ELO ${profile.rating}`);
		const stats = document.createElement("dl");
		stats.className = "player-stat-grid";
		const values = [
			["Matchs", profile.played], ["Victoires", profile.wins], ["Nuls", profile.draws], ["Défaites", profile.losses],
			["Taux de victoire", `${profile.winRate ?? 0}%`], ["Buts marqués", profile.goals], ["Buts encaissés", profile.goalsAgainst],
			["Différence de buts", (profile.goals || 0) - (profile.goalsAgainst || 0)],
		];
		for (const [label, value] of values) {
			const item = document.createElement("div");
			addText(item, "dt", "", label);
			addText(item, "dd", "", value ?? 0);
			stats.append(item);
		}
		playerCard.append(stats);
	}

	async function selectLeaderboardPlayer(playerId, button) {
		leaderboardList.querySelectorAll("button").forEach((row) => {
			row.classList.toggle("is-selected", row === button);
			row.setAttribute("aria-pressed", String(row === button));
		});
		playerCard.replaceChildren();
		addText(playerCard, "p", "eyebrow", "FICHE JOUEUR");
		addText(playerCard, "p", "player-card-empty", "Chargement des statistiques…");
		try {
			const response = await fetch(`/api/players/${encodeURIComponent(playerId)}`);
			if (!response.ok) throw new Error("Fiche joueur indisponible.");
			showPlayerCard(await response.json());
		} catch (error) {
			playerCard.replaceChildren();
			addText(playerCard, "p", "eyebrow", "FICHE JOUEUR");
			addText(playerCard, "p", "player-card-empty", error.message || "Impossible de charger la fiche.");
		}
	}

	async function loadLeaderboard() {
		leaderboardStatus.textContent = "Chargement du classement…";
		try {
			const response = await fetch("/api/leaderboard");
			if (!response.ok) throw new Error("Classement indisponible.");
			const players = await response.json();
			leaderboardList.replaceChildren();
			leaderboardCount.textContent = `${players.length} JOUEUR${players.length === 1 ? "" : "S"}`;
			if (!players.length) {
				leaderboardStatus.textContent = "Aucun joueur classé pour le moment.";
				playerCard.replaceChildren();
				addText(playerCard, "p", "eyebrow", "FICHE JOUEUR");
				addText(playerCard, "p", "player-card-empty", "Les premières fiches apparaîtront après la création d’un compte.");
				return;
			}
			leaderboardStatus.textContent = "Sélectionne un joueur pour consulter son rang et ses statistiques.";
			let selectedButton = null;
			players.forEach((profile, index) => {
				const item = document.createElement("li");
				const button = document.createElement("button");
				button.type = "button";
				button.className = "leaderboard-player";
				button.setAttribute("aria-pressed", "false");
				addText(button, "span", "leaderboard-position", String(index + 1).padStart(2, "0"));
				button.append(makeRankBadge(profile.rank, true));
				const details = document.createElement("span");
				details.className = "leaderboard-player-details";
				addText(details, "strong", "", profile.name);
				addText(details, "small", "", `${profile.rank.label} · ${profile.wins} V · ${profile.played} M`);
				button.append(details);
				addText(button, "strong", "leaderboard-rating", String(profile.rating));
				button.addEventListener("click", () => selectLeaderboardPlayer(profile.id, button));
				item.append(button);
				leaderboardList.append(item);
				if (index === 0) selectedButton = button;
			});
			if (selectedButton) selectLeaderboardPlayer(players[0].id, selectedButton);
		} catch (error) {
			leaderboardStatus.textContent = error.message || "Impossible de charger le classement.";
		}
	}

	function setStatus(message, state = "") {
		fields.status.textContent = message;
		fields.status.classList.toggle("is-error", state === "error");
		fields.status.classList.toggle("is-connected", state === "connected");
	}

	function emit(name, detail = {}) {
		document.dispatchEvent(new CustomEvent(`online:${name}`, { detail }));
	}

	function send(message) {
		if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
	}

	function setQueueState(active) {
		isQueued = active;
		fields.queue.disabled = active || isInMatch || !isAuthenticated;
		fields.queue.querySelector("span").textContent = active ? "RECHERCHE EN COURS" : "TROUVER UN MATCH";
		fields.cancel.hidden = !active;
		fields.name.disabled = active || isInMatch;
		fields.team.disabled = active || isInMatch;
	}

	function joinQueue() {
		if (!isAuthenticated) { setStatus("Crée un compte ou connecte-toi avant de jouer.", "error"); return; }
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			pendingQueue = true;
			connect();
			setStatus("Connexion au serveur…");
			return;
		}
		saveProfile();
		setQueueState(true);
		setStatus("Recherche d’un adversaire…");
		send({ type: "queue", teamId: fields.team.value });
	}

	function authenticate(action) {
		if (!fields.name.reportValidity() || !fields.password.reportValidity()) return;
		pendingAuth = action;
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			connect();
			return;
		}
		sendAuthRequest();
	}

	function sendAuthRequest() {
		if (!pendingAuth) return;
		const type = pendingAuth;
		pendingAuth = null;
		send({ type, name: fields.name.value.trim(), password: fields.password.value, teamId: fields.team.value });
	}

	function connect() {
		if (socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) return;
		setStatus("Connexion au serveur en ligne…");
		const protocol = location.protocol === "https:" ? "wss:" : "ws:";
		socket = new WebSocket(`${protocol}//${location.host}/ws`);
		socket.addEventListener("open", () => {
			if (sessionToken) {
				send({ type: "resume", token: sessionToken });
			} else if (pendingAuth) {
				sendAuthRequest();
			} else setStatus("Crée un compte ou connecte-toi.");
		});
		socket.addEventListener("message", (event) => {
			let message;
			try { message = JSON.parse(event.data); }
			catch { return; }
			switch (message.type) {
				case "authOk":
					isAuthenticated = true;
					if (message.token) sessionToken = message.token;
					try { if (sessionToken) localStorage.setItem("onze-online-session", sessionToken); }
					catch {}
					storedProfile = message.profile;
					fields.name.value = message.profile.name;
					fields.name.disabled = true;
					fields.password.value = "";
					fields.password.disabled = true;
					fields.register.hidden = true;
					fields.login.hidden = true;
					updateStats(message.profile);
					saveProfile(message.profile);
					setQueueState(false);
					setStatus(`Connecté · ${message.profile.name}`, "connected");
					if (pendingQueue) {
						pendingQueue = false;
						joinQueue();
					}
					break;
				case "queued":
					setQueueState(true);
					setStatus("En attente d’un autre joueur…");
					break;
				case "matchFound":
					isInMatch = true;
					setQueueState(false);
					fields.queue.disabled = true;
					fields.name.disabled = true;
					fields.team.disabled = true;
					setStatus(`Adversaire trouvé : ${message.opponent.name} · préparation…`, "connected");
					emit("matchFound", message);
					break;
				case "matchStart":
					emit("matchStart", message);
					break;
				case "state":
					emit("state", message);
					break;
				case "matchResult":
					updateStats(message.profile);
					saveProfile(message.profile);
					isInMatch = false;
					fields.name.disabled = false;
					fields.team.disabled = false;
					fields.queue.disabled = false;
					setStatus(`Match terminé · ELO ${message.ratingChange >= 0 ? "+" : ""}${message.ratingChange}`, "connected");
					emit("matchResult", message);
					break;
				case "opponentDisconnected":
					isInMatch = false;
					setQueueState(false);
					setStatus("L’adversaire a quitté le match.", "error");
					emit("opponentDisconnected");
					break;
				case "afkWarning":
					emit("afkWarning", message);
					break;
				case "afkClear":
					emit("afkClear");
					break;
				case "queueCancelled":
					setQueueState(false);
					setStatus("Recherche annulée.");
					break;
				case "error":
					pendingQueue = false;
					if (message.message?.startsWith("Session expirée")) {
						sessionToken = null;
						isAuthenticated = false;
						try { localStorage.removeItem("onze-online-session"); }
						catch {}
						fields.name.disabled = false;
						fields.password.disabled = false;
						fields.register.hidden = false;
						fields.login.hidden = false;
					}
					setQueueState(false);
					setStatus(message.message || "Une erreur est survenue.", "error");
					break;
			}
		});
		socket.addEventListener("close", () => {
			const wasInMatch = isInMatch;
			socket = null;
			pendingQueue = false;
			isInMatch = false;
			setQueueState(false);
			setStatus("Serveur indisponible · lance le serveur en ligne.", "error");
			if (wasInMatch) emit("opponentDisconnected");
		});
		socket.addEventListener("error", () => setStatus("Impossible de joindre le serveur en ligne.", "error"));
	}

	document.querySelector('[data-menu-tab="online"]').addEventListener("click", connect);
	document.querySelector('[data-menu-tab="leaderboard"]').addEventListener("click", loadLeaderboard);
	fields.register.addEventListener("click", () => authenticate("register"));
	fields.login.addEventListener("click", () => authenticate("login"));
	fields.queue.addEventListener("click", joinQueue);
	fields.cancel.addEventListener("click", () => {
		pendingQueue = false;
		send({ type: "cancelQueue" });
	});
	fields.name.addEventListener("change", () => saveProfile());
	fields.team.addEventListener("change", () => saveProfile());

	window.onlinePlay = {
		ready: () => send({ type: "ready" }),
		sendInput: (input) => send({ type: "input", input }),
		forfeit: () => send({ type: "forfeit" }),
		setStatus,
	};
})();