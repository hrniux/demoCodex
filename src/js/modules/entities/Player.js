import { Entity } from './Entity.js';
import { CONFIG } from '../Config.js';
import { clamp } from '../core/MathUtil.js';

export class Player extends Entity {
  constructor({ x, y, input, audio }) {
    super({ x, y, w: CONFIG.player.width, h: CONFIG.player.height, maxHealth: CONFIG.player.maxHealth, maxStamina: CONFIG.player.maxStamina, maxEnergy: CONFIG.player.maxEnergy });
    this.input = input;
    this.audio = audio;
    this.color = '#e6edf3';
    this.moveSpeed = CONFIG.player.runSpeed;
    this.jumpSpeed = CONFIG.player.jumpSpeed;
    this.attackTimer = 0;
    this.dashTimer = 0;
    this.dashIFrames = 0;
    this.attackPhase = 0;
    this.jumpsLeft = CONFIG.player.doubleJumpCount + 1; // including initial jump
    this.blocking = false;
    this.cooldowns = {
      wind: 0,
      earth: 0,
      water: 0,
      fire: 0,
      lightning: 0,
    };
  }

  getSkillCooldowns() {
    const res = {};
    for (const [k, v] of Object.entries(this.cooldowns)) {
      res[k] = v;
    }
    return res;
  }

  getSpeedModifier() {
    return this.isSlowed() ? CONFIG.combat.slowPct : 1;
  }

  tryJump() {
    if (this.jumpsLeft > 0) {
      this.vy = -this.jumpSpeed;
      this.grounded = false;
      this.jumpsLeft--;
    }
  }

  tryDash() {
    if (this.stamina < 20 || this.dashTimer > 0) return;
    this.stamina = clamp(this.stamina - 20, 0, this.maxStamina);
    this.dashTimer = CONFIG.player.dashTime;
    this.dashIFrames = CONFIG.player.dashIFrames;
    this.vx = this.facing * CONFIG.player.dashSpeed;
    this.invulnTime = Math.max(this.invulnTime, CONFIG.player.dashIFrames);
  }

  tryBlock(down) {
    this.blocking = down && this.stamina > 5 && !this.isStunned();
  }

  tryAttack() {
    if (this.attackTimer > 0 || this.isStunned()) return false;
    this.attackTimer = CONFIG.player.attackCooldown;
    this.attackPhase = (this.attackPhase + 1) % 3;
    return true;
  }

  skillReady(name) { return this.cooldowns[name] <= 0 && this.energy >= 15; }

  spendEnergy(amount) { this.energy = clamp(this.energy - amount, 0, this.maxEnergy); }

  update(dt, scene) {
    // Regen
    if (!this.blocking) this.stamina = clamp(this.stamina + CONFIG.player.staminaRegen * dt, 0, this.maxStamina);
    this.energy = clamp(this.energy + CONFIG.player.energyRegen * dt, 0, this.maxEnergy);

    // Cooldowns
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);

    this.tickEffects(dt);

    const left = this.input.isDown('KeyA') || this.input.isDown('ArrowLeft');
    const right = this.input.isDown('KeyD') || this.input.isDown('ArrowRight');
    const jumpPressed = this.input.wasPressed('Space') || this.input.wasPressed('KeyW');
    const dashPressed = this.input.wasPressed('ShiftLeft') || this.input.wasPressed('ShiftRight');
    const attackPressed = this.input.wasPressed('KeyJ');
    const blockDown = this.input.isDown('KeyK');

    this.tryBlock(blockDown);

    const spd = this.moveSpeed * this.getSpeedModifier();
    if (this.dashTimer > 0) {
      this.vx = this.facing * CONFIG.player.dashSpeed;
    } else if (!this.isStunned()) {
      if (left && !right) { this.vx = -spd; this.facing = -1; }
      else if (right && !left) { this.vx = spd; this.facing = 1; }
      else this.vx = 0;
    } else {
      this.vx *= 0.9;
    }

    if (jumpPressed) this.tryJump();
    if (dashPressed) this.tryDash();

    if (attackPressed) {
      if (this.tryAttack()) scene.spawnAttack(this, {
        range: 56,
        width: 58,
        height: 44,
        damage: CONFIG.player.attackDamage,
        duration: 0.1,
        element: null,
      });
    }

    // Skills
    if (this.input.wasPressed('Digit1') && this.skillReady('wind')) {
      this.cooldowns.wind = CONFIG.skills.wind.cd;
      this.spendEnergy(20);
      scene.skillWind(this);
    }
    if (this.input.wasPressed('Digit2') && this.skillReady('earth')) {
      this.cooldowns.earth = CONFIG.skills.earth.cd;
      this.spendEnergy(25);
      scene.skillEarth(this);
    }
    if (this.input.wasPressed('Digit3') && this.skillReady('water')) {
      this.cooldowns.water = CONFIG.skills.water.cd;
      this.spendEnergy(22);
      scene.skillWater(this);
    }
    if (this.input.wasPressed('Digit4') && this.skillReady('fire')) {
      this.cooldowns.fire = CONFIG.skills.fire.cd;
      this.spendEnergy(18);
      scene.skillFire(this);
    }
    if (this.input.wasPressed('Digit5') && this.skillReady('lightning')) {
      this.cooldowns.lightning = CONFIG.skills.lightning.cd;
      this.spendEnergy(20);
      scene.skillLightning(this);
    }

    // Timers
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashIFrames = Math.max(0, this.dashIFrames - dt);
  }
}
