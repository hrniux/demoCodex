const AUTOTEST = new URLSearchParams(window.location.search).has('autotest');

const copy = {
  boot: '导航同步完成，等待起飞指令。',
  live: '保持移动，晶体能补盾，冲刺能破紧急封锁。',
  paused: '任务已暂停，再次点击继续。',
  gameOver: '机体失去响应，点击重开再次突围。',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function circleHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.r + b.r;
  return dx * dx + dy * dy <= radius * radius;
}

class StellarEscapeGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.autotest = Boolean(options.autotest);
    this.prefersReducedMotion =
      this.autotest || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.storageAvailable = this.canUseStorage();
    this.best = this.storageAvailable ? Number(localStorage.getItem('stellarBest') || 0) : 0;
    this.keys = new Set();
    this.pointer = { active: false, x: this.width / 2, y: this.height * 0.8 };
    this.stars = this.buildStars();
    this.rafId = 0;
    this.lastFrame = 0;
    this.boundKeydown = (event) => this.onKeydown(event);
    this.boundKeyup = (event) => this.onKeyup(event);
    this.boundPointerDown = (event) => this.onPointer(event, true);
    this.boundPointerMove = (event) => this.onPointer(event, this.pointer.active);
    this.boundPointerUp = () => {
      this.pointer.active = false;
    };
    this.bindEvents();
    this.reset();
    this.updateHud();
    this.render();
  }

  canUseStorage() {
    try {
      const key = '__stellar_escape__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  buildStars() {
    return Array.from({ length: 90 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 2.4 + 0.6,
      speed: Math.random() * 26 + 12,
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('keyup', this.boundKeyup);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.boundKeydown);
    window.removeEventListener('keyup', this.boundKeyup);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
  }

  reset() {
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.elapsed = 0;
    this.score = 0;
    this.combo = 1;
    this.spawnTimer = 0.4;
    this.shardTimer = 1.8;
    this.pulse = 0;
    this.meteors = [];
    this.shards = [];
    this.particles = [];
    this.logs = [];
    this.player = {
      x: this.width / 2,
      y: this.height * 0.8,
      r: 18,
      health: 3,
      energy: 100,
      invulnerable: 0,
      dashCooldown: 0,
      dashTime: 0,
      dashVector: { x: 0, y: -1 },
      shieldActive: false,
    };
    this.setOverlay('按“开始任务”或 Enter 起飞');
    this.setStatus(copy.boot);
    this.pushLog('轨道风暴正在形成。');
    this.updateHud();
  }

  onKeydown(event) {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Enter') {
      this.start();
      return;
    }

    if (event.code === 'KeyP') {
      this.togglePause();
      return;
    }

    if (event.code === 'KeyR') {
      this.restart();
      return;
    }

    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.tryDash();
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.keys.add(event.code);
      return;
    }

    this.keys.add(event.code);
  }

  onKeyup(event) {
    this.keys.delete(event.code);
  }

  onPointer(event, activate) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    this.pointer.x = (event.clientX - rect.left) * scaleX;
    this.pointer.y = (event.clientY - rect.top) * scaleY;
    this.pointer.active = activate;
  }

  start() {
    if (this.running && !this.paused) {
      return;
    }

    if (this.gameOver) {
      this.reset();
    }

    this.running = true;
    this.paused = false;
    this.gameOver = false;
    this.lastFrame = performance.now();
    this.setOverlay('');
    this.setStatus(copy.live);
    this.pushLog('拦截机起飞。');

    if (!this.autotest && !this.rafId) {
      this.rafId = requestAnimationFrame((time) => this.loop(time));
    }
  }

  restart() {
    this.reset();
    this.start();
    this.render();
  }

  togglePause() {
    if (!this.running || this.gameOver) {
      return;
    }

    this.paused = !this.paused;
    this.refs.pause.textContent = this.paused ? '继续' : '暂停';
    this.setStatus(this.paused ? copy.paused : copy.live);
    this.setOverlay(this.paused ? '任务暂停中' : '');

    if (!this.paused && !this.autotest && !this.rafId) {
      this.lastFrame = performance.now();
      this.rafId = requestAnimationFrame((time) => this.loop(time));
    }
  }

  loop(now) {
    if (!this.running) {
      this.rafId = 0;
      return;
    }

    const dt = Math.min(0.033, (now - this.lastFrame) / 1000 || 0.016);
    this.lastFrame = now;

    if (!this.paused && !this.gameOver) {
      this.update(dt);
    }

    this.render();
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    this.elapsed += dt;
    this.pulse += dt * 2.4;
    this.score += dt * (18 + this.combo * 7);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);

    if (this.player.dashTime > 0) {
      this.player.dashTime -= dt;
      this.player.x += this.player.dashVector.x * 720 * dt;
      this.player.y += this.player.dashVector.y * 720 * dt;
    } else {
      this.updateMovement(dt);
    }

    this.player.x = clamp(this.player.x, this.player.r + 12, this.width - this.player.r - 12);
    this.player.y = clamp(this.player.y, this.player.r + 16, this.height - this.player.r - 16);

    const shieldHeld = this.keys.has('Space');
    this.player.shieldActive = shieldHeld && this.player.energy > 0;
    if (this.player.shieldActive) {
      this.player.energy = Math.max(0, this.player.energy - dt * 24);
    } else {
      this.player.energy = Math.min(100, this.player.energy + dt * 7);
    }

    if (!this.autotest) {
      this.spawnTimer -= dt;
      this.shardTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnMeteor();
      }
      if (this.shardTimer <= 0) {
        this.spawnShard();
      }
    }

    this.updateStars(dt);
    this.updateMeteors(dt);
    this.updateShards(dt);
    this.updateParticles(dt);
    this.updateHud();
  }

  updateMovement(dt) {
    const axis = { x: 0, y: 0 };
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) axis.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) axis.x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) axis.y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) axis.y += 1;

    if (axis.x !== 0 || axis.y !== 0) {
      const magnitude = Math.hypot(axis.x, axis.y) || 1;
      this.player.x += (axis.x / magnitude) * 340 * dt;
      this.player.y += (axis.y / magnitude) * 340 * dt;
      this.player.dashVector = { x: axis.x / magnitude, y: axis.y / magnitude };
      return;
    }

    if (this.pointer.active) {
      const dx = this.pointer.x - this.player.x;
      const dy = this.pointer.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 6) {
        this.player.x += (dx / distance) * Math.min(distance, 290 * dt);
        this.player.y += (dy / distance) * Math.min(distance, 290 * dt);
        this.player.dashVector = { x: dx / distance, y: dy / distance };
      }
    }
  }

  updateStars(dt) {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > this.height + 6) {
        star.y = -6;
        star.x = Math.random() * this.width;
      }
    }
  }

  spawnMeteor() {
    const intensity = 1 + this.elapsed / 18;
    const edge = Math.random();
    let x = Math.random() * this.width;
    let y = -40;
    if (edge > 0.66) {
      x = -40;
      y = Math.random() * this.height * 0.65;
    } else if (edge > 0.33) {
      x = this.width + 40;
      y = Math.random() * this.height * 0.65;
    }

    const speed = 120 + intensity * 26 + Math.random() * 80;
    const aimX = this.player.x + (Math.random() * 240 - 120);
    const aimY = this.height + 40;
    const angle = Math.atan2(aimY - y, aimX - x);
    const r = 12 + Math.random() * 16 + intensity * 1.5;
    this.meteors.push({
      x,
      y,
      r,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() * 2 - 1) * 2.8,
      nearMissScored: false,
    });
    this.spawnTimer = Math.max(0.18, 0.7 - intensity * 0.05);
  }

  spawnShard() {
    this.shards.push({
      x: 70 + Math.random() * (this.width - 140),
      y: 70 + Math.random() * (this.height - 220),
      r: 12,
      life: 8,
      phase: Math.random() * Math.PI * 2,
    });
    this.shardTimer = Math.max(1.2, 3.6 - this.elapsed * 0.03);
  }

  spawnMeteorAt(x, y, vx = 0, vy = 0, r = 20) {
    this.meteors.push({
      x,
      y,
      r,
      vx,
      vy,
      rotation: 0,
      spin: 0,
      nearMissScored: false,
    });
  }

  spawnShardAt(x, y) {
    this.shards.push({ x, y, r: 12, life: 5, phase: 0 });
  }

  updateMeteors(dt) {
    const survivors = [];
    for (const meteor of this.meteors) {
      meteor.x += meteor.vx * dt;
      meteor.y += meteor.vy * dt;
      meteor.rotation += meteor.spin * dt;

      if (!meteor.nearMissScored) {
        const distance = Math.hypot(meteor.x - this.player.x, meteor.y - this.player.y);
        if (distance < meteor.r + this.player.r + 18 && !circleHit(meteor, this.player)) {
          meteor.nearMissScored = true;
          this.score += 28 * this.combo;
          this.combo = Math.min(5.5, this.combo + 0.22);
        }
      }

      if (circleHit(meteor, this.player)) {
        this.resolveMeteorCollision(meteor);
        continue;
      }

      if (
        meteor.x < -80 ||
        meteor.x > this.width + 80 ||
        meteor.y < -80 ||
        meteor.y > this.height + 80
      ) {
        continue;
      }

      survivors.push(meteor);
    }
    this.meteors = survivors;
  }

  updateShards(dt) {
    const survivors = [];
    for (const shard of this.shards) {
      shard.life -= dt;
      shard.phase += dt * 5;
      if (circleHit(shard, this.player)) {
        this.player.energy = Math.min(100, this.player.energy + 28);
        this.score += 85 + this.combo * 14;
        this.combo = Math.min(6.2, this.combo + 0.35);
        this.pushLog('拾取能量晶体，护盾回充。');
        this.emitBurst(shard.x, shard.y, '#7dd3fc', 16);
        continue;
      }
      if (shard.life > 0) {
        survivors.push(shard);
      }
    }
    this.shards = survivors;
  }

  updateParticles(dt) {
    if (this.prefersReducedMotion) {
      this.particles.length = 0;
      return;
    }

    this.particles = this.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      return particle.life > 0;
    });
  }

  resolveMeteorCollision(meteor) {
    if (this.player.invulnerable > 0) {
      return;
    }

    if (this.player.shieldActive || this.player.dashTime > 0) {
      this.player.energy = Math.max(0, this.player.energy - 7);
      this.score += 60 * this.combo;
      this.combo = Math.min(6.5, this.combo + 0.18);
      this.pushLog('护盾弹开陨石。');
      this.emitBurst(meteor.x, meteor.y, '#fbbf24', 14);
      return;
    }

    this.player.health -= 1;
    this.player.invulnerable = 1.1;
    this.combo = 1;
    this.emitBurst(meteor.x, meteor.y, '#fb7185', 22);
    this.pushLog(`机体受损，剩余 ${this.player.health} 点生命。`);

    if (this.player.health <= 0) {
      this.finishGame();
    }
  }

  finishGame() {
    this.running = false;
    this.gameOver = true;
    this.refs.pause.textContent = '暂停';
    this.setStatus(copy.gameOver);
    this.setOverlay('任务失败，点击重开再试一次');
    const finalScore = Math.round(this.score);
    if (finalScore > this.best) {
      this.best = finalScore;
      if (this.storageAvailable) {
        localStorage.setItem('stellarBest', String(finalScore));
      }
      this.pushLog('刷新最高分。');
    }
    this.updateHud();
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  tryDash() {
    if (!this.running || this.paused || this.player.dashCooldown > 0) {
      return;
    }

    if (this.player.energy < 22) {
      this.pushLog('护盾电量不足，无法冲刺。');
      return;
    }

    this.player.energy -= 22;
    this.player.dashCooldown = 1.4;
    this.player.dashTime = 0.16;
    this.player.invulnerable = 0.2;
    this.pushLog('执行短距冲刺。');
  }

  emitBurst(x, y, color, amount) {
    if (this.prefersReducedMotion) {
      return;
    }

    for (let index = 0; index < amount; index += 1) {
      const angle = (Math.PI * 2 * index) / amount;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.45 + Math.random() * 0.35,
      });
    }
  }

  setOverlay(message) {
    this.refs.overlay.textContent = message;
    this.refs.overlay.hidden = !message;
  }

  setStatus(message) {
    this.refs.status.textContent = message;
  }

  pushLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 5);
    this.refs.feed.innerHTML = this.logs.map((item) => `<li>${item}</li>`).join('');
  }

  updateHud() {
    this.refs.score.textContent = Math.round(this.score).toString();
    this.refs.health.textContent = String(this.player.health);
    this.refs.energy.textContent = `${Math.round(this.player.energy)}%`;
    this.refs.combo.textContent = `x${this.combo.toFixed(1)}`;
    this.refs.time.textContent = `${this.elapsed.toFixed(1)}s`;
    this.refs.dash.textContent =
      this.player.dashCooldown > 0 ? `${this.player.dashCooldown.toFixed(1)}s` : '就绪';
    this.refs.best.textContent = String(this.best);
  }

  render() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    this.renderBackground(ctx);
    this.renderShards(ctx);
    this.renderMeteors(ctx);
    this.renderParticles(ctx);
    this.renderPlayer(ctx);
  }

  renderBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#071121');
    gradient.addColorStop(1, '#02060c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(66, 111, 164, 0.16)';
    ctx.lineWidth = 1;
    for (let column = 0; column < this.width; column += 80) {
      ctx.beginPath();
      ctx.moveTo(column, 0);
      ctx.lineTo(column, this.height);
      ctx.stroke();
    }
    for (let row = 0; row < this.height; row += 60) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      ctx.lineTo(this.width, row);
      ctx.stroke();
    }
  }

  renderPlayer(ctx) {
    const { player } = this;
    ctx.save();
    ctx.translate(player.x, player.y);
    const direction = Math.atan2(player.dashVector.y, player.dashVector.x) + Math.PI / 2;
    ctx.rotate(direction);
    ctx.fillStyle = player.invulnerable > 0 ? '#fef08a' : '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(15, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(-15, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (player.shieldActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 28 + Math.sin(this.pulse * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderMeteors(ctx) {
    for (const meteor of this.meteors) {
      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rotation);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(meteor.r, 0);
      for (let point = 1; point <= 7; point += 1) {
        const angle = (Math.PI * 2 * point) / 7;
        const variance = point % 2 === 0 ? meteor.r * 0.7 : meteor.r;
        ctx.lineTo(Math.cos(angle) * variance, Math.sin(angle) * variance);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(251, 146, 60, 0.65)';
      ctx.beginPath();
      ctx.arc(meteor.r * 0.2, -meteor.r * 0.15, meteor.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderShards(ctx) {
    for (const shard of this.shards) {
      ctx.save();
      ctx.translate(shard.x, shard.y + Math.sin(shard.phase) * 5);
      ctx.rotate(shard.phase * 0.5);
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderParticles(ctx) {
    for (const particle of this.particles) {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  step(frames, dt = 1 / 60) {
    for (let frame = 0; frame < frames; frame += 1) {
      this.update(dt);
    }
    this.render();
  }

  async runAutotest() {
    this.reset();
    this.start();

    const healthBefore = this.player.health;
    this.player.energy = 72;
    this.spawnShardAt(this.player.x, this.player.y);
    this.step(2);
    const shardCollected = this.player.energy >= 90 && this.score > 0;

    this.keys.add('Space');
    const energyBeforeShield = this.player.energy;
    this.spawnMeteorAt(this.player.x, this.player.y);
    this.step(1);
    const shieldBlocked =
      this.player.health === healthBefore && this.player.energy < energyBeforeShield;

    this.keys.delete('Space');
    this.player.energy = 0;
    this.player.invulnerable = 0;
    this.spawnMeteorAt(this.player.x, this.player.y);
    this.step(1);
    const damageApplied = this.player.health === healthBefore - 1;

    const scoreBeforeSurvival = this.score;
    this.step(120);
    const survivalScored = this.score > scoreBeforeSurvival;

    const passed = shardCollected && shieldBlocked && damageApplied && survivalScored;
    const details = {
      shardCollected,
      shieldBlocked,
      damageApplied,
      survivalScored,
      score: Math.round(this.score),
      health: this.player.health,
      energy: Math.round(this.player.energy),
    };

    this.refs.autotest.hidden = false;
    this.refs.autotest.textContent = passed
      ? `AUTOTEST PASS ${JSON.stringify(details)}`
      : `AUTOTEST FAIL ${JSON.stringify(details)}`;
    document.body.dataset.autotest = passed ? 'pass' : 'fail';
  }
}

const refs = {
  canvas: document.getElementById('stellar-canvas'),
  overlay: document.getElementById('stellar-overlay'),
  score: document.getElementById('stellar-score'),
  health: document.getElementById('stellar-health'),
  energy: document.getElementById('stellar-energy'),
  best: document.getElementById('stellar-best'),
  combo: document.getElementById('stellar-combo'),
  time: document.getElementById('stellar-time'),
  dash: document.getElementById('stellar-dash'),
  status: document.getElementById('stellar-status'),
  feed: document.getElementById('stellar-feed'),
  start: document.getElementById('stellar-start'),
  pause: document.getElementById('stellar-pause'),
  restart: document.getElementById('stellar-restart'),
  autotest: document.getElementById('stellar-autotest'),
};

const game = new StellarEscapeGame(refs, { autotest: AUTOTEST });

refs.start.addEventListener('click', () => game.start());
refs.pause.addEventListener('click', () => game.togglePause());
refs.restart.addEventListener('click', () => game.restart());
window.addEventListener('beforeunload', () => game.dispose());
window.__stellarEscape = game;

if (AUTOTEST) {
  game.runAutotest();
}
