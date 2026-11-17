const test = require("node:test");
const assert = require("node:assert/strict");
const { authenticate, publicProfile, registerAccount, resumeSession } = require("./auth");

test("account registration hashes the password and returns a resumable token", () => {
	const accounts = {};
	const { profile, token } = registerAccount(accounts, "Joueuse", "MotDePasseTresSolide", "psg");
	assert.notEqual(profile.passwordHash, "MotDePasseTresSolide");
	assert.equal(profile.teamId, "psg");
	assert.equal(resumeSession(accounts, token), profile);
	assert.equal(publicProfile(profile).passwordHash, undefined);
	assert.equal(publicProfile(profile).sessions, undefined);
});

test("usernames are unique regardless of case", () => {
	const accounts = {};
	registerAccount(accounts, "Joueur", "MotDePasseTresSolide", "barcelona");
	assert.throws(() => registerAccount(accounts, "joueur", "AutreMotDePasseFort", "psg"), /déjà utilisé/);
});

test("authentication rejects a wrong password and resumes a valid login", () => {
	const accounts = {};
	const created = registerAccount(accounts, "Joueur", "MotDePasseTresSolide", "barcelona");
	assert.equal(authenticate(accounts, "Joueur", "MotDePasseIncorrect"), null);
	const login = authenticate(accounts, "Joueur", "MotDePasseTresSolide");
	assert.equal(login.profile, created.profile);
	assert.equal(resumeSession(accounts, login.token), created.profile);
});

test("registration rejects short passwords and invalid usernames", () => {
	assert.throws(() => registerAccount({}, "AB", "MotDePasseTresSolide", "psg"), /pseudo/);
	assert.throws(() => registerAccount({}, "Joueur", "court", "psg"), /mot de passe/);
});