const K_FACTOR = 32;

function calculateElo(ratingA, ratingB, scoreA) {
	if (!Number.isFinite(ratingA) || !Number.isFinite(ratingB) || ![0, 0.5, 1].includes(scoreA)) {
		throw new TypeError("Ratings must be finite and scoreA must be 0, 0.5, or 1");
	}
	const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
	const changeA = Math.round(K_FACTOR * (scoreA - expectedA));
	return { changeA, changeB: -changeA };
}

module.exports = { calculateElo };