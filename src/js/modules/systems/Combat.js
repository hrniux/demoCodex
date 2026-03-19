import { aabbIntersect } from '../core/MathUtil.js';

export class Hitbox {
  constructor({ x, y, w, h, life = 0.1, owner, damage = 10, element = null }) {
    this.x = x; this.y = y; this.w = w; this.h = h; this.life = life; this.owner = owner;
    this.damage = damage; this.element = element; this.dead = false;
  }
  bbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
}

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitboxes = [];
  }
  spawnHitbox(hb) { this.hitboxes.push(hb); }
  update(dt) {
    // Resolve hitboxes to entities
    for (const hb of this.hitboxes) hb.update(dt);
    for (const hb of this.hitboxes) {
      if (hb.dead) continue;
      for (const e of this.scene.entities) {
        if (e === hb.owner || e.dead) continue;
        if (aabbIntersect(hb.bbox(), e.bbox())) {
          // Block check
          let dmg = hb.damage;
          const attackerDir = Math.sign(hb.owner.x - e.x) || 1;
          if (e.blocking && attackerDir === e.facing) {
            // Only block when facing attacker
            // reduce and spend stamina
            const cost = 20;
            if (e.stamina >= cost) {
              e.stamina -= cost;
              dmg *= 0.25; // mitigate
            }
          }
          e.applyDamage(dmg, { element: hb.element, fromFacing: hb.owner.facing });
          this.scene.shake = Math.min(8, (this.scene.shake || 0) + 3);
          hb.dead = true;
          break;
        }
      }
    }
    this.hitboxes = this.hitboxes.filter(h => !h.dead);
  }
}
