const test = require("node:test");
const assert = require("node:assert/strict");
const { getRank } = require("./ranks");

test("rank divisions advance through the Brawl Stars-style tiers", () => {
	assert.deepEqual(getRank(1000), { points: 0, tier: "Bronze", division: "I", label: "Bronze I", progress: 0, nextRankAt: 100 });
	assert.equal(getRank(1100).label, "Bronze II");
	assert.equal(getRank(1300).label, "Silver I");
	assert.equal(getRank(2800).label, "Masters");
});

test("ratings below the starting value remain in Bronze I", () => {
	assert.equal(getRank(850).points, 0);
	assert.equal(getRank(850).label, "Bronze I");
});