const sides = ["home", "away"];

function createSideStats() {
	return {
		goals: 0,
		touches: 0,
		possessions: 0,
		possessionSeconds: 0,
		recoveries: 0,
		dribbles: 0,
		fouls: 0,
		shots: 0,
		shotsOnTarget: 0,
	};
}

function createMatchStats() {
	return {
		elapsed: 0,
		possessionOwner: null,
		home: createSideStats(),
		away: createSideStats(),
	};
}

function setPossession(stats, side) {
	if (side !== null && !sides.includes(side) || stats.possessionOwner === side) return;
	const previousOwner = stats.possessionOwner;
	stats.possessionOwner = side;
	if (side) {
		stats[side].touches += 1;
		stats[side].possessions += 1;
		if (previousOwner && previousOwner !== side) stats[side].recoveries += 1;
	}
}

function updateMatchStats(stats, delta) {
	const time = Math.max(0, Number(delta) || 0);
	stats.elapsed += time;
	if (stats.possessionOwner) stats[stats.possessionOwner].possessionSeconds += time;
}

function recordTouch(stats, side) {
	if (sides.includes(side)) stats[side].touches += 1;
}

function recordDribble(stats, side) {
	if (sides.includes(side)) stats[side].dribbles += 1;
}

function recordFoul(stats, side) {
	if (sides.includes(side)) stats[side].fouls += 1;
}

function recordShot(stats, side, onTarget) {
	if (!sides.includes(side)) return;
	stats[side].shots += 1;
	if (onTarget) stats[side].shotsOnTarget += 1;
}

function recordGoal(stats, side) {
	if (sides.includes(side)) stats[side].goals += 1;
}

function summarizeMatchStats(stats) {
	return Object.fromEntries(sides.map((side) => {
		const values = stats[side];
		return [side, {
			goals: values.goals,
			touches: values.touches,
			recoveries: values.recoveries,
			dribbles: values.dribbles,
			fouls: values.fouls,
			possessionPercent: stats.elapsed ? values.possessionSeconds / stats.elapsed : 0,
			possessionSeconds: values.possessionSeconds,
			averagePossessionSeconds: values.possessions ? values.possessionSeconds / values.possessions : 0,
			shots: values.shots,
			shotsOnTarget: values.shotsOnTarget,
			shotAccuracy: values.shots ? values.shotsOnTarget / values.shots : 0,
			efficiency: values.shots ? values.goals / values.shots : 0,
		}];
	}));
}

const matchStats = { createMatchStats, recordDribble, recordFoul, recordGoal, recordShot, recordTouch, setPossession, summarizeMatchStats, updateMatchStats };
if (typeof module !== "undefined" && module.exports) module.exports = matchStats;
else globalThis.onzeMatchStats = matchStats;