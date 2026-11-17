const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateElo } = require("./elo");

test("equal-rated players exchange 16 points after a win", () => {
	assert.deepEqual(calculateElo(1000, 1000, 1), { changeA: 16, changeB: -16 });
});

test("losing to a lower-rated opponent costs more", () => {
	assert.ok(calculateElo(1000, 800, 0).changeA < calculateElo(1000, 1200, 0).changeA);
});

test("beating a higher-rated opponent earns more", () => {
	assert.ok(calculateElo(1000, 1200, 1).changeA > calculateElo(1000, 800, 1).changeA);
});

test("a draw changes ratings by equal and opposite amounts", () => {
	const result = calculateElo(1200, 1000, 0.5);
	assert.equal(result.changeA, -result.changeB);
});