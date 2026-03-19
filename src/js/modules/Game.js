import { Renderer } from './render/Renderer.js';
import { CONFIG } from './Config.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Scene } from './Scene.js';

export class Game {
  constructor({ canvas, ctx, input, audio }) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.audio = audio;
    this.renderer = new Renderer(ctx);
    this.scene = null;
    this.player = null;
    this.enemy = null;
    this.paused = false;
  }

  init() {
    this.reset();
  }

  reset() {
    const p = new Player({ x: 160, y: 280, input: this.input, audio: this.audio });
    const e = new Enemy({ x: 720, y: 280, target: p });
    this.player = p; this.enemy = e;
    this.scene = new Scene({ player: p, enemy: e, renderer: this.renderer, audio: this.audio });
    this.paused = false;
  }

  update(dt) {
    if (this.paused) return;
    if (!this.scene) return;
    this.scene.update(dt);
    this.input.endFrame();
  }

  render() {
    if (!this.scene) return;
    this.scene.render();
  }

  setPaused(v) { this.paused = !!v; }
  dispose() { /* reserved */ }

  getPlayerSkillCooldowns() {
    const cds = this.player.getSkillCooldowns();
    // Convert to fill ratio by remaining/cd
    const map = {
      Digit1: this.player.cooldowns.wind / CONFIG.skills.wind.cd,
      Digit2: this.player.cooldowns.earth / CONFIG.skills.earth.cd,
      Digit3: this.player.cooldowns.water / CONFIG.skills.water.cd,
      Digit4: this.player.cooldowns.fire / CONFIG.skills.fire.cd,
      Digit5: this.player.cooldowns.lightning / CONFIG.skills.lightning.cd,
    };
    return map;
  }

  getTip() { return this.scene?.getTip?.() ?? ''; }
}

