const tiers = ["Bronze", "Silver", "Gold", "Diamond", "Mythic", "Legendary"];
const divisions = ["I", "II", "III"];

function getRank(rating) {
	const points = Math.max(0, Math.floor((Number(rating) || 1000) - 1000));
	if (points >= 1800) return { points, tier: "Masters", division: null, label: "Masters", progress: 100, nextRankAt: null };
	const tierIndex = Math.floor(points / 300);
	const divisionIndex = Math.floor((points % 300) / 100);
	return {
		points,
		tier: tiers[tierIndex],
		division: divisions[divisionIndex],
		label: `${tiers[tierIndex]} ${divisions[divisionIndex]}`,
		progress: points % 100,
		nextRankAt: (Math.floor(points / 100) + 1) * 100,
	};
}

if (typeof module !== "undefined" && module.exports) module.exports = { getRank };
else globalThis.onzeRanks = { getRank };