const { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } = require("node:crypto");

const validTeams = new Set([
	"barcelona", "real-madrid", "man-city", "arsenal", "psg", "marseille",
	"nation-france", "nation-spain", "nation-england", "nation-germany", "nation-argentina",
	"nation-brazil", "nation-portugal", "nation-morocco",
]);
const dummySalt = "onze-account-lookup-salt";
const dummyHash = scryptSync("invalid-password", dummySalt, 64);

function validateCredentials(name, password) {
	const normalizedName = String(name || "").normalize("NFKC").trim();
	if (normalizedName.length < 3 || normalizedName.length > 16 || !/^[\p{L}\p{N} _.-]+$/u.test(normalizedName)) {
		throw new Error("Le pseudo doit contenir 3 à 16 lettres ou chiffres.");
	}
	if (typeof password !== "string" || password.length < 10 || password.length > 128) {
		throw new Error("Le mot de passe doit contenir 10 à 128 caractères.");
	}
	return normalizedName;
}

function usernameKey(name) {
	return name.normalize("NFKC").trim().toLocaleLowerCase("fr");
}

function hashPassword(password, salt) {
	return scryptSync(password, salt, 64);
}

function createSession(profile) {
	const token = randomBytes(32).toString("base64url");
	profile.sessions = [...(profile.sessions || []), createHash("sha256").update(token).digest("hex")].slice(-5);
	return token;
}

function registerAccount(accounts, name, password, teamId) {
	const normalizedName = validateCredentials(name, password);
	const key = usernameKey(normalizedName);
	if (Object.values(accounts).some((profile) => profile.usernameKey === key)) {
		throw new Error("Ce pseudo est déjà utilisé.");
	}
	const salt = randomBytes(16).toString("hex");
	const profile = {
		id: randomUUID(),
		name: normalizedName,
		usernameKey: key,
		passwordSalt: salt,
		passwordHash: hashPassword(password, salt).toString("hex"),
		sessions: [],
		teamId: validTeams.has(teamId) ? teamId : "barcelona",
		rating: 1000, played: 0, wins: 0, losses: 0, draws: 0, goals: 0, goalsAgainst: 0,
	};
	const token = createSession(profile);
	accounts[profile.id] = profile;
	return { profile, token };
}

function authenticate(accounts, name, password) {
	const key = usernameKey(String(name || "").normalize("NFKC").trim());
	const profile = Object.values(accounts).find((account) => account.usernameKey === key);
	if (!profile || typeof password !== "string" || password.length > 128) {
		hashPassword("invalid-password", dummySalt).equals(dummyHash);
		return null;
	}
	const actual = hashPassword(password, profile.passwordSalt);
	const expected = Buffer.from(profile.passwordHash, "hex");
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
	return { profile, token: createSession(profile) };
}

function resumeSession(accounts, token) {
	if (typeof token !== "string" || token.length < 40 || token.length > 64) return null;
	const tokenHash = createHash("sha256").update(token).digest("hex");
	return Object.values(accounts).find((profile) => profile.sessions?.includes(tokenHash)) || null;
}

function publicProfile(profile) {
	const { passwordSalt, passwordHash, sessions, usernameKey: _usernameKey, ...publicData } = profile;
	return { ...publicData, winRate: profile.played ? Math.round(profile.wins / profile.played * 100) : 0 };
}

module.exports = { authenticate, publicProfile, registerAccount, resumeSession, validTeams, validateCredentials };