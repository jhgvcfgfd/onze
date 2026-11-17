const test = require("node:test");
const assert = require("node:assert/strict");
const { Body } = require("matter-js");
const shotPhysics = require("./shot-physics");
const matchStats = require("./match-stats");
const playerStamina = require("./player-stamina");
const { createMatch, scoreGoal, setInput, snapshot, tickMatch } = require("./match-engine");

test("server simulation moves players from validated input", () => {
	const match = createMatch();
	const before = snapshot(match).home;
	setInput(match, "home", { x: 1 });
	for (let index = 0; index < 60; index += 1) tickMatch(match);
	assert.ok(snapshot(match).home.x > before.x);
});

test("a free ball slows progressively from air friction", () => {
	const match = createMatch();
	Body.setPosition(match.ball, { x: 600, y: 120 });
	Body.setVelocity(match.ball, { x: 12, y: 0 });
	const launchSpeed = Math.hypot(match.ball.velocity.x, match.ball.velocity.y);

	for (let index = 0; index < 30; index += 1) tickMatch(match);
	const halfSecondSpeed = Math.hypot(match.ball.velocity.x, match.ball.velocity.y);
	for (let index = 0; index < 60; index += 1) tickMatch(match);
	const oneAndHalfSecondSpeed = Math.hypot(match.ball.velocity.x, match.ball.velocity.y);

	assert.ok(halfSecondSpeed < launchSpeed);
	assert.ok(halfSecondSpeed > launchSpeed * 0.5);
	assert.ok(oneAndHalfSecondSpeed < halfSecondSpeed);
	assert.ok(oneAndHalfSecondSpeed > 0.1);
});

test("a free ball eventually comes to rest", () => {
	const match = createMatch();
	Body.setPosition(match.ball, { x: 600, y: 120 });
	Body.setVelocity(match.ball, { x: 12, y: 0 });
	for (let index = 0; index < 1200; index += 1) tickMatch(match);
	assert.deepEqual(match.ball.velocity, { x: 0, y: 0 });
	assert.equal(match.ball.angularVelocity, 0);
});

test("charged shot profiles match the requested power ranges", () => {
	const low = shotPhysics.createShotProfile(0.29, 300);
	const light = shotPhysics.createShotProfile(0.3, 300);
	const straight = shotPhysics.createShotProfile(0.6, 300);
	const strong = shotPhysics.createShotProfile(0.8, 300);
	const nearFull = shotPhysics.createShotProfile(0.95, 300);
	const ninetyNine = shotPhysics.createShotProfile(0.99, 300);
	const full = shotPhysics.createShotProfile(1, 300);

	assert.ok(Math.abs(low.spin) < Math.abs(light.spin));
	assert.ok(low.acceleration > 0);
	assert.ok(light.spin > 0);
	assert.equal(straight.spin, 0);
	assert.ok(strong.spin > light.spin);
	assert.ok(nearFull.spin > strong.spin);
	assert.ok(ninetyNine.spin > nearFull.spin);
	assert.ok(Math.abs(ninetyNine.spin - 1) < 1e-12);
	assert.equal(full.spin, 0);
	assert.ok(full.wobble > 0);
	assert.ok(full.acceleration > 0);
});

test("wall impacts retain one quarter of the ball speed", () => {
	assert.deepEqual(shotPhysics.reduceVelocityAfterWall({ x: 12, y: -8 }), { x: 3, y: -2 });
});

test("the server slows the ball after a wall collision", () => {
	const match = createMatch();
	Body.setPosition(match.ball, { x: 90, y: 100 });
	Body.setVelocity(match.ball, { x: -10, y: 0 });
	tickMatch(match);
	assert.ok(Math.hypot(match.ball.velocity.x, match.ball.velocity.y) < 2);
});

test("the bot increases its shot charge when behind", () => {
	const defaultCharge = 0.55;
	assert.equal(shotPhysics.chooseBotShotCharge(0, defaultCharge, 0), defaultCharge);
	assert.equal(shotPhysics.chooseBotShotCharge(1, defaultCharge, 0.1), 1);
	assert.equal(shotPhysics.chooseBotShotCharge(1, defaultCharge, 0.6), 0.95);
	assert.equal(shotPhysics.chooseBotShotCharge(1, defaultCharge, 0.9), 0.5);
	assert.ok(shotPhysics.chooseBotShotCharge(3, defaultCharge, 0.5) >= 0.95);
});

test("match statistics track possession, touches, and shooting efficiency", () => {
	const stats = matchStats.createMatchStats();
	matchStats.setPossession(stats, "home");
	matchStats.updateMatchStats(stats, 10);
	matchStats.recordTouch(stats, "home");
	matchStats.recordDribble(stats, "home");
	matchStats.recordShot(stats, "home", true);
	matchStats.recordFoul(stats, "away");
	matchStats.recordGoal(stats, "home");
	matchStats.setPossession(stats, "away");
	matchStats.updateMatchStats(stats, 5);

	const summary = matchStats.summarizeMatchStats(stats);
	assert.equal(summary.home.touches, 2);
	assert.equal(summary.home.dribbles, 1);
	assert.equal(summary.home.possessionPercent, 2 / 3);
	assert.equal(summary.home.averagePossessionSeconds, 10);
	assert.equal(summary.home.shotAccuracy, 1);
	assert.equal(summary.home.efficiency, 1);
	assert.equal(summary.away.possessionPercent, 1 / 3);
	assert.equal(summary.away.recoveries, 1);
	assert.equal(summary.away.fouls, 1);
});

test("player stamina empties in ten seconds and recovers in two", () => {
	assert.equal(playerStamina.updateStamina(100, true, 10), 0);
	assert.equal(playerStamina.updateStamina(0, false, 1), 50);
	assert.equal(playerStamina.updateStamina(0, false, 2), 100);
	assert.equal(playerStamina.getSpeedMultiplier(100), 1.2);
	assert.equal(playerStamina.getSpeedMultiplier(0), 0.5);
	assert.equal(playerStamina.limitShotCharge(0, 1), 0.25);
	assert.equal(playerStamina.limitShotCharge(1, 1), 1);
	assert.equal(playerStamina.shouldShowTrail(100, true), true);
	assert.equal(playerStamina.shouldShowTrail(70, true), true);
	assert.equal(playerStamina.shouldShowTrail(69.9, true), false);
	assert.equal(playerStamina.shouldShowTrail(100, false), false);
});

test("server match state drains and restores player stamina", () => {
	const match = createMatch();
	setInput(match, "home", { x: 1 });
	for (let index = 0; index < 600; index += 1) tickMatch(match);
	assert.equal(snapshot(match).homeStamina, 0);

	setInput(match, "home", { x: 0 });
	for (let index = 0; index < 120; index += 1) tickMatch(match);
	assert.ok(Math.abs(snapshot(match).homeStamina - 100) < 1e-9);
});

test("shot curl bends toward the center of the goal", () => {
	const getShotSpin = (ballY) => {
		const match = createMatch();
		Body.setPosition(match.ball, { x: match.home.position.x + 30, y: ballY });
		setInput(match, "home", { shoot: true });
		for (let index = 0; index < 6; index += 1) tickMatch(match);
		setInput(match, "home", { shoot: false });
		return match.ball.angularVelocity;
	};

	assert.ok(getShotSpin(320) > 0);
	assert.ok(getShotSpin(400) < 0);
});

test("full-charge shots accelerate and wobble during flight", () => {
	const match = createMatch();
	Body.setPosition(match.ball, { x: match.home.position.x + 30, y: match.home.position.y });
	setInput(match, "home", { shoot: true });
	for (let index = 0; index < 72; index += 1) tickMatch(match);
	setInput(match, "home", { shoot: false });
	const initialSpeed = Math.hypot(match.ball.velocity.x, match.ball.velocity.y);
	let sawLateralMotion = false;
	for (let index = 0; index < 35; index += 1) {
		tickMatch(match);
		if (Math.abs(match.ball.velocity.y) > 0.02) sawLateralMotion = true;
	}

	assert.ok(Math.hypot(match.ball.velocity.x, match.ball.velocity.y) > initialSpeed * 1.05);
	assert.ok(sawLateralMotion);
});

test("the first player to score four goals immediately wins", () => {
	const match = createMatch();
	match.goals.away = 1;
	for (let index = 0; index < 3; index += 1) assert.equal(scoreGoal(match, "home"), false);
	assert.equal(scoreGoal(match, "home"), true);
	assert.equal(match.finishedReason, "four-goals");
	assert.equal(scoreGoal(match, "away"), false);
});

test("scoring refills both players' stamina", () => {
	const match = createMatch();
	match.stamina.home = 35;
	match.stamina.away = 60;
	scoreGoal(match, "home");
	assert.equal(snapshot(match).homeStamina, 100);
	assert.equal(snapshot(match).awayStamina, 100);
});

test("a one-goal lead does not trigger the early finish", () => {
	const match = createMatch();
	assert.equal(scoreGoal(match, "home"), false);
	assert.equal(match.finishedReason, null);
});

test("the match can end at four goals even when the score is not four-zero", () => {
	const match = createMatch();
	match.goals.away = 2;
	for (let index = 0; index < 4; index += 1) scoreGoal(match, "home");
	assert.deepEqual(match.goals, { home: 4, away: 2 });
	assert.equal(match.finishedReason, "four-goals");
});

test("the server clock finishes a tied match", () => {
	const match = createMatch();
	match.remaining = 1 / 60;
	assert.equal(tickMatch(match), "time");
	assert.equal(match.remaining, 0);
});