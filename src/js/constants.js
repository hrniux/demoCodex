/**
 * Global configuration shared across the Tank Blitz modules.
 */
export const WORLD = Object.freeze({
  tileSize: 16,
  width: 16,
  height: 16,
  scale: 3,
  tickRate: 1 / 60,
});

export const PLAYER_CONFIG = Object.freeze({
  speed: 48,
  fireCooldown: 0.4,
  lives: 3,
});

export const ENEMY_CONFIG = Object.freeze({
  speed: 36,
  fireCooldown: 1.1,
  spawnInterval: 5,
  maxActive: 4,
});

export const PROJECTILE_CONFIG = Object.freeze({
  speed: 140,
  radius: 2,
});

export const COLORS = Object.freeze({
  background: "#0b141e",
  grid: "#142030",
  wall: "#ffbf69",
  steel: "#7189ff",
  player: "#16db65",
  enemy: "#ff595e",
  shell: "#f6f7eb",
  explosion: "#ffca3a",
});

export const DIRECTIONS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1, rotation: 0 }),
  right: Object.freeze({ x: 1, y: 0, rotation: Math.PI / 2 }),
  down: Object.freeze({ x: 0, y: 1, rotation: Math.PI }),
  left: Object.freeze({ x: -1, y: 0, rotation: (3 * Math.PI) / 2 }),
});

export const TILE_TYPES = Object.freeze({
  empty: 0,
  wall: 1,
  steel: 2,
  playerSpawn: 3,
  enemySpawn: 4,
  base: 5,
});

export const SCORE_VALUES = Object.freeze({
  enemy: 100,
  basePenalty: 300,
});
