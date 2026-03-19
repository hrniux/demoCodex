import {
  COLORS,
  DIRECTIONS,
  ENEMY_CONFIG,
  PLAYER_CONFIG,
  PROJECTILE_CONFIG,
  WORLD,
} from "../constants.js";
import { Projectile } from "./projectile.js";

let tankIdCounter = 0;

export class Tank {
  constructor({ position, speed, fireCooldown, color, isPlayer }) {
    this.id = `tank-${(tankIdCounter += 1)}`;
    this.position = { ...position };
    this.speed = speed;
    this.fireCooldown = fireCooldown;
    this.color = color;
    this.isPlayer = isPlayer;
    this.direction = DIRECTIONS.up;
    this.cooldownTimer = 0;
    this.alive = true;
    this.size = WORLD.tileSize - 2;
  }

  update(delta, intent, map) {
    if (!this.alive) return null;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }

    if (intent) {
      this.#applyMovement(delta, intent.direction, map);
      if (intent.fire && this.cooldownTimer === 0) {
        return this.#spawnProjectile();
      }
    }
    return null;
  }

  respawn(position) {
    this.position = { ...position };
    this.direction = DIRECTIONS.up;
    this.alive = true;
    this.cooldownTimer = 0.2;
  }

  destroy() {
    this.alive = false;
  }

  #applyMovement(delta, direction, map) {
    if (!direction) return;
    let { x, y } = direction;
    if (!x && !y) return;

    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }

    if (Math.abs(x) > Math.abs(y)) {
      this.direction = x < 0 ? DIRECTIONS.left : DIRECTIONS.right;
      y = 0;
    } else {
      this.direction = y < 0 ? DIRECTIONS.up : DIRECTIONS.down;
      x = 0;
    }

    const moveX = x * this.speed * delta;
    const moveY = y * this.speed * delta;
    const nextX = this.position.x + moveX;
    const nextY = this.position.y + moveY;

    if (!this.#collides(nextX, this.position.y, map)) {
      this.position.x = Math.max(0, Math.min(nextX, WORLD.width * WORLD.tileSize - this.size));
    }
    if (!this.#collides(this.position.x, nextY, map)) {
      this.position.y = Math.max(0, Math.min(nextY, WORLD.height * WORLD.tileSize - this.size));
    }
  }

  #collides(nextX, nextY, map) {
    const margin = 0.1;
    const left = nextX + margin;
    const top = nextY + margin;
    const right = nextX + this.size - margin;
    const bottom = nextY + this.size - margin;

    const leftTile = map.worldToTile(left);
    const rightTile = map.worldToTile(right);
    const topTile = map.worldToTile(top);
    const bottomTile = map.worldToTile(bottom);

    if (left < 0 || top < 0 || right > WORLD.width * WORLD.tileSize || bottom > WORLD.height * WORLD.tileSize) {
      return true;
    }

    for (let y = topTile; y <= bottomTile; y += 1) {
      for (let x = leftTile; x <= rightTile; x += 1) {
        if (map.isBlocking(x, y)) return true;
      }
    }
    return false;
  }

  #spawnProjectile() {
    this.cooldownTimer = this.fireCooldown;
    const originX = this.position.x + this.size / 2;
    const originY = this.position.y + this.size / 2;

    return new Projectile({
      position: { x: originX, y: originY },
      direction: this.direction,
      speed: PROJECTILE_CONFIG.speed,
      color: this.isPlayer ? COLORS.shell : COLORS.explosion,
      ownerId: this.id,
    });
  }
}

export function createPlayerTank(spawnPoint) {
  const position = {
    x: spawnPoint.x * WORLD.tileSize + 1,
    y: spawnPoint.y * WORLD.tileSize + 1,
  };
  return new Tank({
    position,
    speed: PLAYER_CONFIG.speed,
    fireCooldown: PLAYER_CONFIG.fireCooldown,
    color: COLORS.player,
    isPlayer: true,
  });
}

export function createEnemyTank(spawnPoint) {
  const position = {
    x: spawnPoint.x * WORLD.tileSize + 1,
    y: spawnPoint.y * WORLD.tileSize + 1,
  };
  return new Tank({
    position,
    speed: ENEMY_CONFIG.speed,
    fireCooldown: ENEMY_CONFIG.fireCooldown,
    color: COLORS.enemy,
    isPlayer: false,
  });
}
