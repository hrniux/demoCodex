export class Projectile {
  constructor({ x, y, vx, vy, w = 18, h = 12, life = 1.8, owner, damage = 10, element = null, knockback = 260 }) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.w = w; this.h = h; this.life = life; this.owner = owner;
    this.damage = damage; this.element = element; this.knockback = knockback;
    this.dead = false;
  }
  bbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

