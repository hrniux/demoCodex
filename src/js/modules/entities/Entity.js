import { clamp } from '../core/MathUtil.js';
import { CONFIG } from '../Config.js';

export class Entity {
  constructor(opts) {
    const { x, y, w, h } = opts;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.facing = 1; // 1 right, -1 left
    this.grounded = false;
    this.health = opts.maxHealth || 100;
    this.maxHealth = opts.maxHealth || 100;
    this.stamina = opts.maxStamina || 100;
    this.maxStamina = opts.maxStamina || 100;
    this.energy = opts.maxEnergy || 100;
    this.maxEnergy = opts.maxEnergy || 100;
    this.dead = false;
    this.state = 'idle';
    this.hitstunTime = 0;
    this.invulnTime = 0;
    this.armorTime = 0; // from earth skill
    this.slowTime = 0;  // from water debuff
    this.burnTime = 0;  // from fire burn
    this.burnTick = 0;
    this.stunTime = 0;  // from lightning
    this.color = '#e6edf3';
  }

  bbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  isInvulnerable() { return this.invulnTime > 0; }
  isStunned() { return this.hitstunTime > 0 || this.stunTime > 0; }
  hasArmor() { return this.armorTime > 0; }
  isSlowed() { return this.slowTime > 0; }
  isBurning() { return this.burnTime > 0; }

  applyDamage(dmg, { element = null, fromFacing = 0, knockback = CONFIG.combat.knockback } = {}) {
    if (this.isInvulnerable()) return { applied: 0 };
    let final = dmg;
    if (this.hasArmor()) final *= (1 - CONFIG.combat.armorPct);
    this.health = clamp(this.health - final, 0, this.maxHealth);
    if (fromFacing) this.vx = fromFacing * knockback;
    this.hitstunTime = CONFIG.combat.hitstun;
    if (element === 'fire') this.burnTime = Math.max(this.burnTime, CONFIG.combat.burnTime);
    if (element === 'water') this.slowTime = Math.max(this.slowTime, CONFIG.combat.slowTime);
    if (element === 'lightning') this.stunTime = Math.max(this.stunTime, CONFIG.combat.stunTime);
    if (this.health <= 0) this.dead = true;
    return { applied: final };
  }

  tickEffects(dt) {
    if (this.hitstunTime > 0) this.hitstunTime -= dt;
    if (this.invulnTime > 0) this.invulnTime -= dt;
    if (this.armorTime > 0) this.armorTime -= dt;
    if (this.slowTime > 0) this.slowTime -= dt;
    if (this.stunTime > 0) this.stunTime -= dt;
    if (this.burnTime > 0) {
      this.burnTime -= dt;
      this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 1;
        this.health = clamp(this.health - CONFIG.combat.burnDPS, 0, this.maxHealth);
        if (this.health <= 0) this.dead = true;
      }
    }
  }
}

