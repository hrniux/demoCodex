export const CONFIG = {
  world: {
    gravity: 2000, // px/s^2
    width: 960,
    height: 540,
    groundY: 460,
  },
  player: {
    runSpeed: 320,
    jumpSpeed: 760,
    dashSpeed: 720,
    dashTime: 0.16,
    dashIFrames: 0.18,
    width: 36,
    height: 84,
    mass: 1,
    maxHealth: 100,
    maxStamina: 100,
    maxEnergy: 100,
    staminaRegen: 20, // per second
    energyRegen: 12,
    blockMitigation: 0.75, // 75% reduced when blocking
    blockStaminaPerHit: 20,
    doubleJumpCount: 1,
    attackCooldown: 0.35,
    attackDamage: 8,
  },
  enemy: {
    runSpeed: 280,
    jumpSpeed: 720,
    width: 36,
    height: 84,
    maxHealth: 140,
    ai: {
      engageDistance: 480,
      attackDistance: 68,
      blockChance: 0.35,
      dodgeChance: 0.25,
      skillChance: 0.25,
      reactionTime: [0.08, 0.22],
    },
  },
  combat: {
    hitstun: 0.22,
    invulnOnDodge: 0.12,
    burnDPS: 6,
    burnTime: 3,
    slowPct: 0.5,
    slowTime: 2.5,
    stunTime: 0.6,
    armorPct: 0.4,
    armorTime: 3.5,
    knockback: 240,
  },
  skills: {
    // durations are used for cooldown fill ratio
    wind: { code: 'Digit1', cd: 5, label: '风' },
    earth: { code: 'Digit2', cd: 10, label: '土' },
    water: { code: 'Digit3', cd: 9, label: '水' },
    fire: { code: 'Digit4', cd: 6, label: '火' },
    lightning: { code: 'Digit5', cd: 7, label: '雷' },
  },
};

