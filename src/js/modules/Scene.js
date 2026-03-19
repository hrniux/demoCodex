import { CONFIG } from './Config.js';
import { Physics } from './systems/Physics.js';
import { CombatSystem, Hitbox } from './systems/Combat.js';
import { Projectile } from './entities/Projectile.js';
import { aabbIntersect } from './core/MathUtil.js';

export class Scene {
  constructor({ player, enemy, renderer, audio }) {
    this.player = player;
    this.enemy = enemy;
    this.entities = [player, enemy];
    this.renderer = renderer;
    this.audio = audio;
    this.platforms = this._buildPlatforms();
    this.physics = new Physics(this.platforms);
    this.combat = new CombatSystem(this);
    this.projectiles = [];
    this.tip = '';
    this.shake = 0;
    this.reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _buildPlatforms() {
    // simple multi-level arena
    return [
      { x: 0, y: CONFIG.world.groundY, w: CONFIG.world.width, h: 80 },
      { x: 160, y: 340, w: 180, h: 16 },
      { x: 620, y: 340, w: 180, h: 16 },
      { x: 380, y: 260, w: 200, h: 16 },
    ];
  }

  update(dt) {
    // Entities update (input/AI handled inside each)
    this.player.update(dt, this);
    this.enemy.update(dt, this);

    // Physics pass
    for (const e of this.entities) this.physics.integrate(e, dt);

    // Projectiles
    for (const p of this.projectiles) p.update(dt);
    // Projectile collisions
    for (const p of this.projectiles) {
      if (p.dead) continue;
      for (const e of this.entities) {
        if (e === p.owner || e.dead) continue;
        if (aabbIntersect(p.bbox(), e.bbox())) {
          e.applyDamage(p.damage, { element: p.element, fromFacing: Math.sign(p.vx), knockback: p.knockback });
          p.dead = true;
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Combat resolution
    this.combat.update(dt);

    // Screen shake decay
    if (this.reduceMotion) this.shake = 0; else this.shake = Math.max(0, this.shake - dt * 12);

    // Tip
    if (this.player.dead || this.enemy.dead) this.tip = '按 R 重开';
    else this.tip = '';
  }

  render() {
    const r = this.renderer;
    r.clear();
    r.withShake(this.shake, () => {
      r.drawSceneBackground(this);
      r.drawPlatforms(this);
      this.entities.forEach(e => r.drawStick(e));
      r.drawProjectiles(this);
      r.drawHitboxes(this);
    });
  }

  // Actions & skills
  spawnAttack(owner, { range, width, height, damage, duration, element }) {
    const x = owner.facing > 0 ? owner.x + owner.w : owner.x - width;
    const y = owner.y + owner.h - height - 12;
    this.combat.spawnHitbox(new Hitbox({ x: x + owner.facing * Math.max(0, range - width), y, w: width, h: height, life: duration, owner, damage, element }));
  }

  skillWind(owner) {
    // Quick AoE around owner, knocks back
    const size = 96; const x = owner.x + owner.w / 2 - size / 2; const y = owner.y + owner.h / 2 - size / 2;
    this.combat.spawnHitbox(new Hitbox({ x, y, w: size, h: size, life: 0.08, owner, damage: 14, element: null }));
  }
  skillEarth(owner) {
    // Armor up (stone skin)
    owner.armorTime = Math.max(owner.armorTime, CONFIG.combat.armorTime);
    // optional: spike hitbox in front
    const w = 20, h = 60;
    const x = owner.facing > 0 ? owner.x + owner.w + 6 : owner.x - w - 6;
    const y = owner.y + owner.h - h;
    this.combat.spawnHitbox(new Hitbox({ x, y, w, h, life: 0.12, owner, damage: 10, element: null }));
  }
  skillWater(owner) {
    // Water orb projectile applies slow and minor heal to owner
    owner.health = Math.min(owner.maxHealth, owner.health + 10);
    const vx = owner.facing * 320;
    this.projectiles.push(new Projectile({ x: owner.x + owner.w / 2, y: owner.y + owner.h / 2, vx, vy: 0, w: 14, h: 14, life: 1.2, owner, damage: 4, element: 'water', knockback: 120 }));
  }
  skillFire(owner) {
    // Fireball projectile applies burn
    const vx = owner.facing * 420;
    this.projectiles.push(new Projectile({ x: owner.x + owner.w / 2, y: owner.y + owner.h / 2, vx, vy: 0, w: 18, h: 12, life: 1.6, owner, damage: 12, element: 'fire', knockback: 200 }));
  }
  skillLightning(owner) {
    // Instant short bolt: spawn thin long hitbox
    const w = 140, h = 12;
    const x = owner.facing > 0 ? owner.x + owner.w : owner.x - w;
    const y = owner.y + owner.h / 2 - h / 2;
    this.combat.spawnHitbox(new Hitbox({ x, y, w, h, life: 0.05, owner, damage: 8, element: 'lightning' }));
  }

  getTip() { return this.tip; }
}
