import { COLORS, TILE_TYPES, WORLD } from "../constants.js";

const LAYOUT = [
  "@@@@....@@@@....",
  "@..#....#..@....",
  "@..#BB##..@..#..",
  "@..#..#..@@..@@.",
  "....####....##..",
  "##..@..@..##..#.",
  "..@@....@@..#...",
  "..##PPPP##..#...",
  "....####....#...",
  "@@..@..@..##..@@",
  "@@..@EE@..##..@@",
  "....####....#...",
  "..##....##..#...",
  "..##....##..#...",
  "....B..B....#PP.",
  "@@@@....@@@@PPP.",
];

const LEGEND = Object.freeze({
  ".": TILE_TYPES.empty,
  "#": TILE_TYPES.wall,
  "@": TILE_TYPES.steel,
  "P": TILE_TYPES.playerSpawn,
  "E": TILE_TYPES.enemySpawn,
  "B": TILE_TYPES.base,
});

export class BattlefieldMap {
  constructor() {
    this.grid = LAYOUT.map((row) => Array.from(row, (symbol) => LEGEND[symbol] ?? TILE_TYPES.empty));
    this.enemySpawns = this.#collectPositions(TILE_TYPES.enemySpawn);
    this.playerSpawns = this.#collectPositions(TILE_TYPES.playerSpawn);
    this.baseTiles = this.#collectPositions(TILE_TYPES.base);
    this.baseDestroyed = false;
  }

  tileAt(tileX, tileY) {
    return this.grid[tileY]?.[tileX] ?? TILE_TYPES.steel;
  }

  isBlocking(tileX, tileY) {
    const tile = this.tileAt(tileX, tileY);
    return tile === TILE_TYPES.wall || tile === TILE_TYPES.steel || tile === TILE_TYPES.base;
  }

  worldToTile(value) {
    return Math.floor(value / WORLD.tileSize);
  }

  registerExplosion(tileX, tileY) {
    const row = this.grid[tileY];
    if (!row) {
      return "blocked";
    }
    const tile = row[tileX];
    if (tile === TILE_TYPES.wall) {
      row[tileX] = TILE_TYPES.empty;
      return "cleared";
    }
    if (tile === TILE_TYPES.base) {
      this.baseDestroyed = true;
      return "base";
    }
    return "blocked";
  }

  getPlayerSpawn(index = 0) {
    return this.playerSpawns[index % this.playerSpawns.length];
  }

  getEnemySpawn() {
    const spawn = this.enemySpawns[Math.floor(Math.random() * this.enemySpawns.length)];
    return spawn ?? { x: 0, y: 0 };
  }

  draw(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, WORLD.width * WORLD.tileSize, WORLD.height * WORLD.tileSize);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 1) {
      const pos = x * WORLD.tileSize;
      ctx.moveTo(pos + 0.5, 0);
      ctx.lineTo(pos + 0.5, WORLD.height * WORLD.tileSize);
    }
    for (let y = 0; y <= WORLD.height; y += 1) {
      const pos = y * WORLD.tileSize;
      ctx.moveTo(0, pos + 0.5);
      ctx.lineTo(WORLD.width * WORLD.tileSize, pos + 0.5);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let y = 0; y < WORLD.height; y += 1) {
      for (let x = 0; x < WORLD.width; x += 1) {
        const tile = this.grid[y][x];
        if (tile === TILE_TYPES.empty || tile === TILE_TYPES.playerSpawn || tile === TILE_TYPES.enemySpawn) {
          continue;
        }
        ctx.fillStyle = tile === TILE_TYPES.wall ? COLORS.wall : tile === TILE_TYPES.steel ? COLORS.steel : COLORS.base;
        ctx.fillRect(x * WORLD.tileSize, y * WORLD.tileSize, WORLD.tileSize, WORLD.tileSize);
      }
    }
  }

  reset() {
    this.grid = LAYOUT.map((row) => Array.from(row, (symbol) => LEGEND[symbol] ?? TILE_TYPES.empty));
    this.baseDestroyed = false;
  }

  #collectPositions(tileType) {
    const positions = [];
    for (let y = 0; y < WORLD.height; y += 1) {
      for (let x = 0; x < WORLD.width; x += 1) {
        if (this.grid[y][x] === tileType) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}
