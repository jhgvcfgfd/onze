(() => {
  function createShotProfile(charge, ballY) {
    const level = Math.max(0, Math.min(1, charge));
    const towardGoalCenter = Math.sign(360 - ballY);
    if (level < 0.3) return { spin: towardGoalCenter * 0.08, acceleration: 0.2, wobble: 0 };
    if (level < 0.6) return { spin: towardGoalCenter * 0.22, acceleration: 0, wobble: 0 };
    if (level < 0.8) return { spin: 0, acceleration: 0, wobble: 0 };
    if (level < 1) {
      const curlProgress = Math.max(0, Math.min(1, (level - 0.8) / 0.19));
      return { spin: towardGoalCenter * (0.4 + curlProgress * 0.6), acceleration: 0, wobble: 0 };
    }
    return { spin: 0, acceleration: 0.1, wobble: 0.0011 };
  }

  function reduceVelocityAfterWall(velocity) {
    return { x: velocity.x * 0.25, y: velocity.y * 0.25 };
  }

  function chooseBotShotCharge(deficit, defaultCharge, randomValue = Math.random()) {
    if (deficit <= 0) return defaultCharge;
    const fullChargeChance = Math.min(0.78, 0.42 + Math.min(3, deficit - 1) * 0.12);
    const highChargeChance = Math.min(0.95, fullChargeChance + 0.32);
    if (randomValue < fullChargeChance) return 1;
    if (randomValue < highChargeChance) return 0.95;
    return 0.5;
  }

  function advanceShotMotion(shot, velocity, delta) {
    shot.age += delta;
    if (shot.age > 1.5) return null;

    const progress = Math.max(0, Math.min(1, (shot.age - 0.25) / 0.55));
    const easedProgress = progress * progress * (3 - 2 * progress);
    const multiplier = 1 + shot.acceleration * easedProgress;
    const speed = Math.hypot(velocity.x, velocity.y);
    const oscillation = shot.wobble * Math.sin(shot.age * 13.5);
    return {
      velocityScale: speed > 0.15 ? shot.initialSpeed * multiplier / speed : 1,
      forceX: speed > 0.15 ? -velocity.y / speed * oscillation : 0,
      forceY: speed > 0.15 ? velocity.x / speed * oscillation : 0,
      multiplier,
    };
  }

  const shotPhysics = { createShotProfile, reduceVelocityAfterWall, chooseBotShotCharge, advanceShotMotion };
  if (typeof module !== "undefined" && module.exports) module.exports = shotPhysics;
  else globalThis.onzeShotPhysics = shotPhysics;
})();