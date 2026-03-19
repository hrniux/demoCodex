import {
  COLORS,
  ENEMY_CONFIG,
  PLAYER_CONFIG,
  SCORE_VALUES,
  TILE_TYPES,
  WORLD,
} from "../constants.js";
import { KeyboardInput } from "./input.js";
import { BattlefieldMap } from "../world/map.js";
import { createEnemyTank, createPlayerTank } from "../entities/tank.js";

const DIRECTIONS_ARRAY = Object.freeze([
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]);

const BASE_WIDTH = WORLD.width * WORLD.tileSize;
const BASE_HEIGHT = WORLD.height * WORLD.tileSize;

export class GameEngine {
  #ctx;
  #input;
  #animationFrame;
  #hud;
  #overlay;

  constructor({ canvas, hud, overlay }) {
    this.canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width = BASE_WIDTH * dpr;
    canvas.height = BASE_HEIGHT * dpr;
    canvas.style.width = `${BASE_WIDTH * WORLD.scale}px`;
    canvas.style.height = `${BASE_HEIGHT * WORLD.scale}px`;
    this.#ctx.scale(dpr, dpr);
    this.#ctx.imageSmoothingEnabled = false;

    this.#hud = hud;
    this.#overlay = overlay;

    this.map = new BattlefieldMap();
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.explosions = [];

    this.level = 1;
    this.score = 0;
    this.lives = PLAYER_CONFIG.lives;

    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.enemySpawnTimer = 0;
    this.respawnTimer = 0;
  }

  start() {
    this.stop();
    if (this.#overlay) this.#overlay.hide();
    this.#input = new KeyboardInput(window);
    this.reset();
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    const loop = (timestamp) => {
      this.#animationFrame = requestAnimationFrame(loop);
      this.#step(timestamp);
    };
    this.#animationFrame = requestAnimationFrame(loop);
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
    if (this.#input) {
      this.#input.dispose();
      this.#input = null;
    }
    this.running = false;
  }

  reset() {
    this.map.reset();
    this.lives = PLAYER_CONFIG.lives;
    this.score = 0;
    this.level = 1;
    this.projectiles = [];
    this.enemySpawnTimer = 1;
    this.enemies = [];
    this.respawnTimer = 0;
    this.player = createPlayerTank(this.map.getPlayerSpawn());
    this.#updateHud();
    this.#draw();
  }

  #step(timestamp) {
    if (!this.running || !this.#input) return;

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.#input.consumePause()) {
      this.paused = !this.paused;
      if (this.#overlay) this.#overlay.toggle(this.paused);
    }

    if (this.paused) {
      this.#draw();
      return;
    }

    this.accumulator += delta;
    const fixedDelta = WORLD.tickRate;
    while (this.accumulator >= fixedDelta) {
      this.#update(fixedDelta);
      this.accumulator -= fixedDelta;
    }
    this.#draw();
  }

  #update(delta) {
    if (!this.player.alive) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0 && this.lives > 0) {
        const spawn = this.map.getPlayerSpawn();
        this.player.respawn({
          x: spawn.x * WORLD.tileSize + 1,
          y: spawn.y * WORLD.tileSize + 1,
        });
      }
    }

    const intent = this.player.alive
      ? {
          direction: this.#input.getDirection(),
          fire: this.#input.consumeFire(),
        }
      : null;

    const projectile = this.player.update(delta, intent, this.map);
    if (projectile) {
      this.projectiles.push(projectile);
    }

    this.enemySpawnTimer -= delta;
    if (this.enemySpawnTimer <= 0 && this.enemies.length < ENEMY_CONFIG.maxActive) {
      if (this.#spawnEnemy()) {
        this.enemySpawnTimer = ENEMY_CONFIG.spawnInterval;
      } else {
        this.enemySpawnTimer = 1;
      }
    }

    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      if (!enemy.ai) {
        enemy.ai = {
          changeTimer: 0,
          direction: DIRECTIONS_ARRAY[Math.floor(Math.random() * DIRECTIONS_ARRAY.length)],
          fireTimer: Math.random() * 1.5,
        };
      }
      enemy.ai.changeTimer -= delta;
      if (enemy.ai.changeTimer <= 0) {
        enemy.ai.changeTimer = 1 + Math.random() * 2;
        enemy.ai.direction = DIRECTIONS_ARRAY[Math.floor(Math.random() * DIRECTIONS_ARRAY.length)];
      }

      if (this.player.alive) {
        const alignedHorizontally = Math.abs(enemy.position.y - this.player.position.y) < WORLD.tileSize / 2;
        const alignedVertically = Math.abs(enemy.position.x - this.player.position.x) < WORLD.tileSize / 2;
        if (alignedHorizontally) {
          enemy.ai.direction = {
            x: Math.sign(this.player.position.x - enemy.position.x),
            y: 0,
          };
        } else if (alignedVertically) {
          enemy.ai.direction = {
            x: 0,
            y: Math.sign(this.player.position.y - enemy.position.y),
          };
        }
      }

      const enemyProjectile = enemy.update(
        delta,
        {
          direction: enemy.ai.direction || { x: 0, y: 0 },
          fire: this.#shouldEnemyFire(enemy, delta),
        },
        this.map,
      );
      if (enemyProjectile) {
        this.projectiles.push(enemyProjectile);
      }
    });

    this.#updateProjectiles(delta);
    this.#cleanup();
    this.#updateHud();
    this.#checkEndConditions();
  }

  #updateProjectiles(delta) {
    const maxX = BASE_WIDTH;
    const maxY = BASE_HEIGHT;
    this.projectiles.forEach((projectile) => {
      if (!projectile.active) return;
      projectile.update(delta);
      const { left, right, top, bottom } = projectile.getBounds();
      if (right < 0 || left > maxX || bottom < 0 || top > maxY) {
        projectile.active = false;
        return;
      }

      const tileX = this.map.worldToTile(projectile.position.x);
      const tileY = this.map.worldToTile(projectile.position.y);
      const tile = this.map.tileAt(tileX, tileY);
      if (tile !== TILE_TYPES.empty && tile !== TILE_TYPES.playerSpawn && tile !== TILE_TYPES.enemySpawn) {
        const result = this.map.registerExplosion(tileX, tileY);
        projectile.active = false;
        if (result === "base") {
          this.score = Math.max(0, this.score - SCORE_VALUES.basePenalty);
        }
        return;
      }

      if (this.player.alive && projectile.ownerId !== this.player.id && this.#intersectsTank(projectile, this.player)) {
        this.#handlePlayerHit();
        projectile.active = false;
        return;
      }

      for (const enemy of this.enemies) {
        if (!enemy.alive || projectile.ownerId === enemy.id) continue;
        if (this.#intersectsTank(projectile, enemy)) {
          enemy.destroy();
          projectile.active = false;
          this.score += SCORE_VALUES.enemy;
          break;
        }
      }
    });
  }

  #cleanup() {
    this.projectiles = this.projectiles.filter((projectile) => projectile.active);
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  #checkEndConditions() {
    if (this.lives <= 0 || this.map.baseDestroyed) {
      this.#gameOver("Mission Failed", "The base was lost. Press Start to retry.");
    }
  }

  #handlePlayerHit() {
    if (!this.player.alive) return;
    this.player.destroy();
    this.lives -= 1;
    this.respawnTimer = 2;
  }

  #shouldEnemyFire(enemy, delta) {
    if (!enemy.ai) return false;
    enemy.ai.fireTimer -= delta;
    if (enemy.ai.fireTimer <= 0) {
      enemy.ai.fireTimer = ENEMY_CONFIG.fireCooldown + Math.random();
      return true;
    }
    return false;
  }

  #intersectsTank(projectile, tank) {
    const { left, right, top, bottom } = projectile.getBounds();
    const tankLeft = tank.position.x;
    const tankTop = tank.position.y;
    const tankRight = tankLeft + tank.size;
    const tankBottom = tankTop + tank.size;

    return !(right < tankLeft || left > tankRight || bottom < tankTop || top > tankBottom);
  }

  #spawnEnemy() {
    const spawn = this.map.getEnemySpawn();
    const spawnX = spawn.x * WORLD.tileSize + 1;
    const spawnY = spawn.y * WORLD.tileSize + 1;
    const occupied =
      this.player.alive && this.#overlapsSquare(this.player, spawnX, spawnY);
    if (occupied) return false;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (this.#overlapsSquare(enemy, spawnX, spawnY)) {
        return false;
      }
    }
    const enemy = createEnemyTank(spawn);
    enemy.ai = {
      changeTimer: 0,
      direction: DIRECTIONS_ARRAY[Math.floor(Math.random() * DIRECTIONS_ARRAY.length)],
      fireTimer: Math.random(),
    };
    this.enemies.push(enemy);
    return true;
  }

  #overlapsSquare(tank, x, y) {
    const size = tank.size;
    return (
      tank.position.x < x + size &&
      tank.position.x + size > x &&
      tank.position.y < y + size &&
      tank.position.y + size > y
    );
  }

  #draw() {
    this.map.draw(this.#ctx);

    if (this.player.alive) {
      this.#drawTank(this.player);
    }
    this.enemies.forEach((enemy) => {
      if (enemy.alive) this.#drawTank(enemy);
    });

    this.projectiles.forEach((projectile) => {
      if (!projectile.active) return;
      this.#ctx.fillStyle = projectile.color;
      this.#ctx.fillRect(
        projectile.position.x - projectile.radius,
        projectile.position.y - projectile.radius,
        projectile.radius * 2,
        projectile.radius * 2,
      );
    });
  }

  #drawTank(tank) {
    this.#ctx.save();
    this.#ctx.fillStyle = tank.color;
    this.#ctx.fillRect(tank.position.x, tank.position.y, tank.size, tank.size);
    this.#ctx.fillStyle = COLORS.shell;
    const barrelWidth = 4;
    const barrelLength = 10;
    const centerX = tank.position.x + tank.size / 2;
    const centerY = tank.position.y + tank.size / 2;
    this.#ctx.translate(centerX, centerY);
    this.#ctx.rotate(tank.direction.rotation ?? 0);
    this.#ctx.fillRect(-barrelWidth / 2, -tank.size / 2, barrelWidth, -barrelLength);
    this.#ctx.restore();
  }

  #gameOver(title, message) {
    this.stop();
    if (this.#overlay) this.#overlay.show(title, message);
  }

  #updateHud() {
    if (!this.#hud) return;
    this.#hud.level.textContent = `Level ${this.level}`;
    this.#hud.score.textContent = `Score ${this.score}`;
    this.#hud.lives.textContent = `Lives ${Math.max(this.lives, 0)}`;
  }
}
