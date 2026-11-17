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