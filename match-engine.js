const Matter = require("matter-js");
const { Engine, Bodies, Body, Composite, Events } = Matter;
const shotPhysics = require("./shot-physics");
const playerStamina = require("./player-stamina");

const worldWidth = 1200;
const field = { left: 80, right: 1120, top: 70, bottom: 650 };
const goal = { top: 285, bottom: 435 };
const matchDuration = 90;

function makePlayer(x, y, label) {
	return Bodies.circle(x, y, 21, {
		label, density: 0.004, friction: 0.07, frictionAir: 0.12, restitution: 0.08,
		collisionFilter: { category: 0x0004, mask: 0x0001 | 0x0002 | 0x0004 },
	});
}

function wall(x, y, width, height) {
	return Bodies.rectangle(x, y, width, height, {
		isStatic: true, restitution: 0.48, friction: 0.02,
		label: "wall",
		collisionFilter: { category: 0x0001, mask: 0x0002 | 0x0004 },
	});
}

function createMatch() {
	const engine = Engine.create({ gravity: { x: 0, y: 0 }, positionIterations: 8, velocityIterations: 6 });
	engine.enableSleeping = false;
	const ball = Bodies.circle(600, 360, 11, {
		label: "ball", density: 0.0012, friction: 0.055, frictionAir: 0.008, restitution: 0.58,
		collisionFilter: { category: 0x0002, mask: 0x0001 | 0x0004 },
	});
	const home = makePlayer(430, 360, "human");
	const away = makePlayer(775, 360, "rival");
	const boundaries = [
		wall(600, field.top - 10, 1060, 20), wall(600, field.bottom + 10, 1060, 20),
		wall(field.left - 10, 177, 20, 214), wall(field.left - 10, 543, 20, 214),
		wall(field.right + 10, 177, 20, 214), wall(field.right + 10, 543, 20, 214),
		wall(51, goal.top - 8, 58, 16), wall(51, goal.bottom + 8, 58, 16),
		wall(1149, goal.top - 8, 58, 16), wall(1149, goal.bottom + 8, 58, 16),
		wall(22, 360, 14, 150), wall(1178, 360, 14, 150),
	];
	Composite.add(engine.world, [...boundaries, ball, home, away]);
	const match = {
		engine, ball, home, away,
		inputs: { home: emptyInput(), away: emptyInput() },
		kickStartedAt: { home: null, away: null },
		lastKickAt: { home: -1, away: -1 },
		stamina: { home: 100, away: 100 },
		shotMotion: null,
		feintCooldown: { home: 0, away: 0 },
		goals: { home: 0, away: 0 },
		elapsed: 0,
		remaining: matchDuration,
		finishedReason: null,
	};
	Events.on(engine, "collisionStart", ({ pairs }) => {
		if (pairs.some(({ bodyA, bodyB }) => (bodyA === ball ? bodyB : bodyB === ball ? bodyA : null)?.label === "wall")) {
			match.wallImpactPending = true;
		}
	});
	return match;
}

function emptyInput() {
	return { x: 0, y: 0, slow: false, shoot: false, feint: false };
}

function setInput(match, side, input) {
	if (!match || match.finishedReason || !["home", "away"].includes(side)) return false;
	const next = { ...emptyInput(), ...input };
	const previous = match.inputs[side];
	const wasKicking = previous.shoot;
	const isKicking = next.shoot;
	match.inputs[side] = next;
	if (!wasKicking && isKicking) match.kickStartedAt[side] = match.elapsed;
	else if (wasKicking && !isKicking) releaseKick(match, side, previous);
	if (next.feint && !previous.feint) performFeint(match, side);
	return true;
}

function normalizeMovement(input) {
	const x = Math.max(-1, Math.min(1, Number(input.x) || 0));
	const y = Math.max(-1, Math.min(1, Number(input.y) || 0));
	const magnitude = Math.hypot(x, y) || 1;
	return { x: x / magnitude, y: y / magnitude, moving: x !== 0 || y !== 0 };
}

function releaseKick(match, side, input) {
	const started = match.kickStartedAt[side];
	match.kickStartedAt[side] = null;
	if (started === null || match.elapsed - match.lastKickAt[side] < 0.28) return;
	const player = side === "home" ? match.home : match.away;
	if (Math.hypot(match.ball.position.x - player.position.x, match.ball.position.y - player.position.y) > 69) return;
	const charge = playerStamina.limitShotCharge(match.stamina[side], Math.max(0, Math.min(1, (match.elapsed - started) / 1.2)));
	const movement = normalizeMovement(input);
	const direction = side === "home" ? 1 : -1;
	const targetX = movement.moving ? movement.x * 0.65 + direction * 1.4 : direction;
	const targetY = movement.moving ? movement.y : (360 - match.ball.position.y) * 0.0014;
	const length = Math.hypot(targetX, targetY) || 1;
	const power = 5 + charge * 10;
	const profile = shotPhysics.createShotProfile(charge, match.ball.position.y);
	Body.setVelocity(match.ball, { x: targetX / length * power, y: targetY / length * power });
	Body.setAngularVelocity(match.ball, profile.spin);
	match.shotMotion = { ...profile, age: 0, initialSpeed: Math.hypot(match.ball.velocity.x, match.ball.velocity.y) };
	match.lastKickAt[side] = match.elapsed;
}

function performFeint(match, side) {
	if (match.feintCooldown[side] > match.elapsed) return;
	const player = side === "home" ? match.home : match.away;
	const movement = normalizeMovement(match.inputs[side]);
	let x = movement.x;
	let y = movement.y;
	if (!movement.moving) {
		const dx = match.ball.position.x - player.position.x;
		const dy = match.ball.position.y - player.position.y;
		const length = Math.hypot(dx, dy) || 1;
		x = -dy / length;
		y = dx / length;
	}
	Body.setVelocity(player, { x: player.velocity.x + x * 3.4, y: player.velocity.y + y * 3.4 });
	match.feintCooldown[side] = match.elapsed + 6;
}

function limitSpeed(body, maxSpeed) {
	const speed = Math.hypot(body.velocity.x, body.velocity.y);
	if (speed > maxSpeed) Body.setVelocity(body, { x: body.velocity.x * maxSpeed / speed, y: body.velocity.y * maxSpeed / speed });
}

function resetAfterGoal(match) {
	match.stamina.home = 100;
	match.stamina.away = 100;
	match.shotMotion = null;
	Body.setPosition(match.ball, { x: 600, y: 360 });
	Body.setVelocity(match.ball, { x: 0, y: 0 });
	Body.setAngularVelocity(match.ball, 0);
	Body.setPosition(match.home, { x: 430, y: 360 });
	Body.setVelocity(match.home, { x: 0, y: 0 });
	Body.setPosition(match.away, { x: 775, y: 360 });
	Body.setVelocity(match.away, { x: 0, y: 0 });
}

function scoreGoal(match, side) {
	if (match.finishedReason || !["home", "away"].includes(side)) return false;
	match.goals[side] += 1;
	resetAfterGoal(match);
	if (match.goals[side] >= 4) {
		match.finishedReason = "four-goals";
		return true;
	}
	return false;
}

function tickMatch(match, delta = 1 / 60) {
	if (match.finishedReason) return match.finishedReason;
	match.elapsed += delta;
	match.remaining = Math.max(0, match.remaining - delta);
	for (const side of ["home", "away"]) {
		const input = match.inputs[side];
		const movement = normalizeMovement(input);
		const player = side === "home" ? match.home : match.away;
		match.stamina[side] = playerStamina.updateStamina(match.stamina[side], movement.moving, delta);
		const multiplier = (input.slow ? 0.68 : 1) * playerStamina.getSpeedMultiplier(match.stamina[side]);
		if (movement.moving) {
			Body.applyForce(player, player.position, { x: movement.x * 0.0025 * multiplier, y: movement.y * 0.0025 * multiplier });
			limitSpeed(player, 8.1 * multiplier);
		}
	}

	if (match.shotMotion) {
		const motion = shotPhysics.advanceShotMotion(match.shotMotion, match.ball.velocity, delta);
		if (!motion) match.shotMotion = null;
		else {
			Body.setVelocity(match.ball, { x: match.ball.velocity.x * motion.velocityScale, y: match.ball.velocity.y * motion.velocityScale });
			if (motion.forceX || motion.forceY) Body.applyForce(match.ball, match.ball.position, { x: motion.forceX, y: motion.forceY });
		}
	}
	const ballSpeed = Math.hypot(match.ball.velocity.x, match.ball.velocity.y);
	if (ballSpeed > 0.15 && Math.abs(match.ball.angularVelocity) >= 0.01) {
		const magnus = match.ball.angularVelocity * 0.00007;
		Body.applyForce(match.ball, match.ball.position, { x: -match.ball.velocity.y * magnus, y: match.ball.velocity.x * magnus });
		Body.setAngularVelocity(match.ball, match.ball.angularVelocity * 0.995);
	}
	Engine.update(match.engine, 1000 / 60);
	if (match.wallImpactPending) {
		Body.setVelocity(match.ball, shotPhysics.reduceVelocityAfterWall(match.ball.velocity));
		match.wallImpactPending = false;
	}
	limitSpeed(match.ball, 17);
	if (Math.hypot(match.ball.velocity.x, match.ball.velocity.y) < 0.18) {
		Body.setVelocity(match.ball, { x: 0, y: 0 });
		Body.setAngularVelocity(match.ball, 0);
	}
	if (match.ball.position.y > goal.top && match.ball.position.y < goal.bottom) {
		if (match.ball.position.x > 1128) scoreGoal(match, "home");
		else if (match.ball.position.x < 72) scoreGoal(match, "away");
	}
	if (!match.finishedReason && match.remaining <= 0) match.finishedReason = "time";
	return match.finishedReason;
}

function snapshot(match) {
	const bodyState = (body) => ({ x: body.position.x, y: body.position.y, vx: body.velocity.x, vy: body.velocity.y });
	return {
		ball: bodyState(match.ball), home: bodyState(match.home), away: bodyState(match.away),
		homeGoals: match.goals.home, awayGoals: match.goals.away, remaining: match.remaining,
		homeStamina: match.stamina.home, awayStamina: match.stamina.away,
	};
}

module.exports = { createMatch, matchDuration, scoreGoal, setInput, snapshot, tickMatch };