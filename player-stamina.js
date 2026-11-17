const maximumStamina = 100;
const drainPerSecond = 10;
const regenerationPerSecond = 50;

function updateStamina(stamina, moving, delta) {
	const change = (moving ? -drainPerSecond : regenerationPerSecond) * Math.max(0, delta);
	return Math.max(0, Math.min(maximumStamina, stamina + change));
}

function getSpeedMultiplier(stamina) {
	const level = Math.max(0, Math.min(maximumStamina, stamina));
	return level === 0 ? 0.5 : 1 + 0.2 * level / maximumStamina;
}

function limitShotCharge(stamina, charge) {
	const level = Math.max(0, Math.min(1, charge));
	return stamina <= 0 ? Math.min(level, 0.25) : level;
}

function shouldShowTrail(stamina, moving) {
	return moving && stamina >= 70;
}

const playerStamina = { updateStamina, getSpeedMultiplier, limitShotCharge, shouldShowTrail };
if (typeof module !== "undefined" && module.exports) module.exports = playerStamina;
else globalThis.onzePlayerStamina = playerStamina;