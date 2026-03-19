import { PROJECTILE_CONFIG } from "../constants.js";

let projectileCounter = 0;

export class Projectile {
  constructor({ position, direction, speed, color, ownerId }) {
    this.id = `projectile-${projectileCounter += 1}`;
    this.position = { ...position };
    this.direction = direction;
    this.speed = speed;
    this.color = color;
    this.ownerId = ownerId;
    this.active = true;
    this.radius = PROJECTILE_CONFIG.radius;
  }

  update(delta) {
    if (!this.active) return;
    this.position.x += this.direction.x * this.speed * delta;
    this.position.y += this.direction.y * this.speed * delta;
  }

  getBounds() {
    const { x, y } = this.position;
    const r = this.radius;
    return {
      left: x - r,
      right: x + r,
      top: y - r,
      bottom: y + r,
    };
  }
}
