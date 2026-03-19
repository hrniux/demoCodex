import { CONFIG } from '../Config.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  clear() {
    const { ctx } = this;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // backdrop
    const grd = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grd.addColorStop(0, '#0f1016');
    grd.addColorStop(1, '#0a0b10');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  withShake(amount, fn) {
    const { ctx } = this;
    ctx.save();
    if (amount > 0) {
      const sx = (Math.random() - 0.5) * amount;
      const sy = (Math.random() - 0.5) * amount;
      ctx.translate(sx, sy);
    }
    try { fn(); } finally { ctx.restore(); }
  }

  drawSceneBackground(scene) {
    const { ctx } = this;
    // simple parallax layers
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#223';
    for (let i = 0; i < 6; i++) {
      const x = (i * 180 + (Date.now() / 100) % 180) % ctx.canvas.width;
      ctx.fillRect(x, 260, 140, 6);
    }
    ctx.restore();
  }

  drawPlatforms(scene) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#1d2230';
    for (const p of scene.platforms) ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
  }

  drawStick(entity) {
    const { ctx } = this;
    const x = entity.x + entity.w / 2;
    const y = entity.y + entity.h;
    const facing = entity.facing;
    const scale = entity.h / 84;
    const headR = 12 * scale;
    const body = 36 * scale;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 6 * scale;
    ctx.strokeStyle = entity.color;
    if (entity.isInvulnerable()) ctx.globalAlpha = 0.6;
    if (entity.hasArmor()) ctx.shadowColor = '#9c815a', ctx.shadowBlur = 12;
    if (entity.isBurning()) ctx.shadowColor = '#ff6a00', ctx.shadowBlur = 16;
    if (entity.isSlowed()) ctx.shadowColor = '#5cb6ff', ctx.shadowBlur = 14;

    // head
    ctx.beginPath();
    ctx.arc(x, y - entity.h + headR + 4, headR, 0, Math.PI * 2);
    ctx.stroke();
    // body
    ctx.beginPath();
    ctx.moveTo(x, y - entity.h + headR * 2 + 4);
    ctx.lineTo(x, y - entity.h + headR * 2 + 4 + body);
    ctx.stroke();
    // arms
    ctx.beginPath();
    ctx.moveTo(x, y - entity.h + headR * 2 + 12);
    ctx.lineTo(x + facing * 22 * scale, y - entity.h + headR * 2 + 22);
    ctx.moveTo(x, y - entity.h + headR * 2 + 20);
    ctx.lineTo(x - facing * 26 * scale, y - entity.h + headR * 2 + 36);
    ctx.stroke();
    // legs
    ctx.beginPath();
    ctx.moveTo(x, y - 12 * scale);
    ctx.lineTo(x + facing * 12 * scale, y);
    ctx.moveTo(x, y - 12 * scale);
    ctx.lineTo(x - facing * 12 * scale, y);
    ctx.stroke();

    ctx.restore();
  }

  drawProjectiles(scene) {
    const { ctx } = this;
    for (const pr of scene.projectiles) {
      ctx.save();
      ctx.fillStyle = pr.element === 'fire' ? '#ff7a3d' : pr.element === 'lightning' ? '#b6f' : '#9cf';
      ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
      ctx.restore();
    }
  }

  drawHitboxes(scene) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ff3b3b';
    for (const hb of scene.combat.hitboxes) ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
    ctx.restore();
  }
}
