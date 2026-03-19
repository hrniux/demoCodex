import { Entity } from './Entity.js';
import { CONFIG } from '../Config.js';
import { clamp } from '../core/MathUtil.js';

function rand(a, b) { return a + Math.random() * (b - a); }

export class Enemy extends Entity {
  constructor({ x, y, target }) {
    super({ x, y, w: CONFIG.enemy.width, h: CONFIG.enemy.height, maxHealth: CONFIG.enemy.maxHealth, maxStamina: 100, maxEnergy: 100 });
    this.target = target;
    this.moveSpeed = CONFIG.enemy.runSpeed;
    this.jumpSpeed = CONFIG.enemy.jumpSpeed;
    this.aiTimer = 0;
    this.intent = 'idle';
    this.cooldowns = { wind: 0, earth: 0, water: 0, fire: 0, lightning: 0 };
    this.attackTimer = 0;
    this.blocking = false;
  }

  update(dt, scene) {
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.tickEffects(dt);

    const t = this.target;
    if (!t || t.dead) return;
    const dx = t.x - this.x;
    const dist = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    // Simple AI state selection with randomness
    this.aiTimer -= dt;
    if (this.aiTimer <= 0) {
      this.aiTimer = rand(...CONFIG.enemy.ai.reactionTime);
      this.intent = 'idle';
      const near = dist < CONFIG.enemy.ai.attackDistance + 8;
      const engage = dist < CONFIG.enemy.ai.engageDistance;

      if (near && Math.random() < CONFIG.enemy.ai.blockChance && t.attackTimer > 0) {
        this.intent = 'block';
      } else if (near && Math.random() < CONFIG.enemy.ai.dodgeChance && t.attackTimer > 0) {
        this.intent = 'dodge';
      } else if (engage && Math.random() < CONFIG.enemy.ai.skillChance) {
        this.intent = 'skill';
      } else if (near) {
        this.intent = 'attack';
      } else if (engage) {
        this.intent = 'chase';
      }
    }

    // Behavior execution
    const spd = this.moveSpeed * (this.isSlowed() ? 0.5 : 1);
    this.blocking = false;
    switch (this.intent) {
      case 'chase':
        this.vx = this.facing * spd;
        // try to reach higher platforms when target is above
        const targetAbove = (t.y + t.h) < (this.y - 8);
        if (this.grounded && (targetAbove || Math.random() < 0.02)) this.vy = -this.jumpSpeed; // jump
        break;
      case 'attack':
        this.vx = 0;
        this.tryAttack(scene);
        break;
      case 'block':
        this.vx = 0;
        this.blocking = this.stamina > 5;
        break;
      case 'dodge':
        this.vx = -this.facing * CONFIG.player.dashSpeed; // reuse dash speed
        this.invulnTime = Math.max(this.invulnTime, CONFIG.combat.invulnOnDodge);
        break;
      case 'skill':
        this.vx = 0;
        this.useSkill(scene);
        break;
      default:
        this.vx = 0;
    }

    // Timers
    this.attackTimer = Math.max(0, this.attackTimer - dt);
  }

  tryAttack(scene) {
    if (this.attackTimer > 0 || this.isStunned()) return;
    this.attackTimer = 0.45;
    scene.spawnAttack(this, {
      range: 52,
      width: 56,
      height: 44,
      damage: 7,
      duration: 0.12,
      element: null,
    });
  }

  useSkill(scene) {
    // Simple rule: pick an available skill based on situation
    const avail = [];
    for (const k of ['fire','wind','water','lightning','earth']) if (this.cooldowns[k] <= 0) avail.push(k);
    const pick = avail[Math.floor(Math.random() * avail.length)];
    if (!pick) return;
    this.cooldowns[pick] = CONFIG.skills[pick].cd;
    switch (pick) {
      case 'fire': scene.skillFire(this); break;      // projectile
      case 'wind': scene.skillWind(this); break;      // AoE
      case 'water': scene.skillWater(this); break;    // slow + small heal self
      case 'lightning': scene.skillLightning(this); break; // stun bolt
      case 'earth': scene.skillEarth(this); break;    // armor up or spike
    }
  }
}
