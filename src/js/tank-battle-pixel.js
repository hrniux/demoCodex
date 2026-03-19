const TILE_SIZE = 16;
const GRID_SIZE = 16;
const PLAYER_SPEED = 72;
const ENEMY_SPEED = 44;
const BULLET_SPEED = 176;
const PLAYER_LIVES = 3;
const TOTAL_ENEMIES = 12;
const MAX_ACTIVE_ENEMIES = 4;
const PLAYER_FIRE_COOLDOWN = 0.32;
const ENEMY_FIRE_COOLDOWN = 0.95;
const ENEMY_SPAWN_INTERVAL = 1.8;
const HIGH_SCORE_KEY = "demoCodexTankPixelHighScore";

const MAP_TEMPLATE = [
  ".E.....E.....E..",
  "................",
  "..##..@@@@..##..",
  "..##........##..",
  "....##....##....",
  "..@@..####..@@..",
  "................",
  ".####......####.",
  ".#....@@@@....#.",
  ".#............#.",
  ".####..##..####.",
  "................",
  "..##..####..##..",
  "......####......",
  "..P...#BB#...P..",
  "..P...####...P..",
];

const TILE = Object.freeze({
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  BASE: 3,
});

const DIRECTION = Object.freeze({
  up: { x: 0, y: -1, angle: 0 },
  right: { x: 1, y: 0, angle: Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI },
  left: { x: -1, y: 0, angle: Math.PI * 1.5 },
});

const COLORS = Object.freeze({
  backdrop: "#08121b",
  floorA: "#12283c",
  floorB: "#102234",
  grid: "rgba(255, 255, 255, 0.05)",
  brick: "#c97c5d",
  brickShade: "#8f4e37",
  steel: "#7b8ea8",
  steelShade: "#53687d",
  base: "#f4a261",
  baseShade: "#aa5b28",
  player: "#42d392",
  playerShade: "#1f8e60",
  enemy: "#ff6b6b",
  enemyShade: "#b23d46",
  shellPlayer: "#f8f9fa",
  shellEnemy: "#ffd166",
  smoke: "#f6bd60",
  text: "#edf6f9",
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function aabbIntersects(a, b) {
  return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
}

class TankBattleGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.overlay = document.getElementById("overlay");
    this.overlayKicker = document.getElementById("overlayKicker");
    this.overlayTitle = document.getElementById("overlayTitle");
    this.overlayMessage = document.getElementById("overlayMessage");
    this.statusText = document.getElementById("statusText");
    this.liveRegion = document.getElementById("liveRegion");
    this.pauseButton = document.getElementById("pauseButton");

    this.hud = {
      score: document.getElementById("scoreValue"),
      lives: document.getElementById("livesValue"),
      enemies: document.getElementById("enemyValue"),
      highScore: document.getElementById("highScoreValue"),
    };

    this.keys = new Set();
    this.rafId = 0;
    this.lastTime = 0;
    this.state = "idle";
    this.highScore = this.loadHighScore();

    this.bindEvents();
    this.resetGame();
    this.render();
  }

  bindEvents() {
    const start = document.getElementById("startButton");
    const restart = document.getElementById("restartButton");

    start.addEventListener("click", () => {
      if (this.state === "running") {
        this.restart();
        return;
      }
      this.start();
    });

    restart.addEventListener("click", () => this.restart());
    this.pauseButton.addEventListener("click", () => this.togglePause());

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("keyup", (event) => this.onKeyUp(event));
  }

  onKeyDown(event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }

    if (event.repeat && event.code !== "Space") {
      return;
    }

    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      this.togglePause();
      return;
    }

    if (event.code === "KeyR") {
      event.preventDefault();
      this.restart();
      return;
    }

    if (event.code === "Enter" && this.state !== "running") {
      event.preventDefault();
      this.start();
      return;
    }

    this.keys.add(event.code);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  resetGame() {
    this.keys.clear();
    this.map = this.createMap();
    this.playerSpawns = this.collectSpawns("P");
    this.enemySpawns = this.collectSpawns("E");
    this.baseTiles = this.collectBaseTiles();

    this.player = this.createTank(this.playerSpawns[0], "player");
    this.enemies = [];
    this.bullets = [];
    this.particles = [];

    this.score = 0;
    this.lives = PLAYER_LIVES;
    this.spawnedEnemies = 0;
    this.destroyedEnemies = 0;
    this.spawnTimer = 0.5;
    this.respawnTimer = 0;
    this.statusText.textContent = "守住鹰巢，等待出击。";
    this.announce("任务待命。");
    this.updateHud();
  }

  restart() {
    this.stopLoop();
    this.state = "idle";
    this.pauseButton.setAttribute("aria-pressed", "false");
    this.pauseButton.textContent = "暂停";
    this.resetGame();
    this.showOverlay("重新部署", "准备好了就继续推进。", "任务简报");
    this.render();
  }

  start() {
    if (this.state === "paused") {
      this.resume();
      return;
    }

    this.stopLoop();
    this.resetGame();
    this.state = "running";
    this.hideOverlay();
    this.statusText.textContent = "敌军进入战场，优先保护基地。";
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  resume() {
    this.state = "running";
    this.hideOverlay();
    this.pauseButton.setAttribute("aria-pressed", "false");
    this.pauseButton.textContent = "暂停";
    this.statusText.textContent = "战斗继续。";
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  togglePause() {
    if (this.state === "idle" || this.state === "ended") {
      return;
    }

    if (this.state === "paused") {
      this.resume();
      return;
    }

    this.state = "paused";
    this.stopLoop();
    this.showOverlay("已暂停", "按 P、ESC 或点击按钮回到战场。", "战斗中止");
    this.pauseButton.setAttribute("aria-pressed", "true");
    this.pauseButton.textContent = "继续";
    this.statusText.textContent = "战斗已暂停。";
    this.render();
  }

  loop(timestamp) {
    if (this.state !== "running") {
      return;
    }

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(delta);
    this.render();

    if (this.state === "running") {
      this.rafId = requestAnimationFrame((time) => this.loop(time));
    }
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  update(delta) {
    this.updatePlayer(delta);
    this.updateEnemySpawns(delta);
    this.updateEnemies(delta);
    this.updateBullets(delta);
    this.updateParticles(delta);
    this.checkEndState();
    this.updateHud();
  }

  updatePlayer(delta) {
    if (!this.player.alive) {
      if (this.lives > 0) {
        this.respawnTimer -= delta;
        if (this.respawnTimer <= 0) {
          this.respawnPlayer();
        }
      }
      return;
    }

    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    const direction = this.getInputDirection();

    if (direction) {
      this.player.direction = direction;
      this.moveTank(this.player, direction, PLAYER_SPEED * delta);
    }

    if ((this.keys.has("Space") || this.keys.has("Enter")) && this.player.cooldown === 0) {
      this.fireBullet(this.player, true);
    }
  }

  updateEnemySpawns(delta) {
    if (this.spawnedEnemies >= TOTAL_ENEMIES) {
      return;
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer > 0 || this.enemies.length >= MAX_ACTIVE_ENEMIES) {
      return;
    }

    const spawn = this.enemySpawns[this.spawnedEnemies % this.enemySpawns.length];
    const enemy = this.createTank(spawn, "enemy");

    if (this.isTankBlocked(enemy, enemy.x, enemy.y)) {
      this.spawnTimer = 0.6;
      return;
    }

    enemy.direction = DIRECTION.down;
    enemy.fireCooldown = ENEMY_FIRE_COOLDOWN;
    enemy.ai = {
      moveTimer: 0.1,
      fireTimer: 0.7 + Math.random() * 0.8,
      direction: DIRECTION.down,
    };

    this.enemies.push(enemy);
    this.spawnedEnemies += 1;
    this.spawnTimer = ENEMY_SPAWN_INTERVAL;
  }

  updateEnemies(delta) {
    for (const enemy of this.enemies) {
      enemy.cooldown = Math.max(0, enemy.cooldown - delta);
      enemy.ai.moveTimer -= delta;
      enemy.ai.fireTimer -= delta;

      if (enemy.ai.moveTimer <= 0) {
        enemy.ai.direction = this.chooseEnemyDirection(enemy);
        enemy.ai.moveTimer = 0.5 + Math.random() * 0.8;
      }

      enemy.direction = enemy.ai.direction;
      const moved = this.moveTank(enemy, enemy.direction, ENEMY_SPEED * delta);
      if (!moved) {
        enemy.ai.moveTimer = 0;
      }

      const shouldFire = enemy.ai.fireTimer <= 0 && (this.hasLineOfSight(enemy, this.player) || Math.random() < 0.28);
      if (shouldFire && enemy.cooldown === 0) {
        this.fireBullet(enemy, false);
        enemy.ai.fireTimer = 0.65 + Math.random() * 1.2;
      }
    }
  }

  updateBullets(delta) {
    for (const bullet of this.bullets) {
      if (!bullet.active) {
        continue;
      }

      bullet.x += bullet.direction.x * BULLET_SPEED * delta;
      bullet.y += bullet.direction.y * BULLET_SPEED * delta;

      if (bullet.x < 0 || bullet.y < 0 || bullet.x > GRID_SIZE * TILE_SIZE || bullet.y > GRID_SIZE * TILE_SIZE) {
        bullet.active = false;
        continue;
      }

      const tileX = Math.floor(bullet.x / TILE_SIZE);
      const tileY = Math.floor(bullet.y / TILE_SIZE);
      const tile = this.map[tileY]?.[tileX];

      if (tile === TILE.BRICK) {
        this.map[tileY][tileX] = TILE.EMPTY;
        bullet.active = false;
        this.spawnParticles(tileX * TILE_SIZE + 8, tileY * TILE_SIZE + 8, COLORS.brick, 8);
        continue;
      }

      if (tile === TILE.STEEL) {
        bullet.active = false;
        this.spawnParticles(tileX * TILE_SIZE + 8, tileY * TILE_SIZE + 8, COLORS.steel, 4);
        continue;
      }

      if (tile === TILE.BASE) {
        bullet.active = false;
        this.spawnParticles(tileX * TILE_SIZE + 8, tileY * TILE_SIZE + 8, COLORS.base, 12);
        this.endGame(false, "基地被炮火击穿。");
        continue;
      }

      if (bullet.fromPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.alive && this.bulletHitsTank(bullet, enemy)) {
            enemy.alive = false;
            bullet.active = false;
            this.score += 100;
            this.destroyedEnemies += 1;
            this.spawnParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, COLORS.enemy, 14);
            break;
          }
        }
      } else if (this.player.alive && this.bulletHitsTank(bullet, this.player)) {
        bullet.active = false;
        this.handlePlayerHit();
      }
    }

    this.bullets = this.bullets.filter((bullet) => bullet.active);
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  updateParticles(delta) {
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
    }

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  checkEndState() {
    if (this.state !== "running") {
      return;
    }

    if (this.destroyedEnemies >= TOTAL_ENEMIES && this.enemies.length === 0) {
      this.endGame(true, "敌军已被完全清空。");
    }
  }

  endGame(won, message) {
    if (this.state === "ended") {
      return;
    }

    this.state = "ended";
    this.stopLoop();
    this.saveHighScore();
    this.showOverlay(won ? "战役胜利" : "防线失守", `${message} 按开始键可重打一局。`, won ? "任务完成" : "战报");
    this.statusText.textContent = won ? "胜利，战场已肃清。" : "任务失败，等待重整。";
    this.pauseButton.setAttribute("aria-pressed", "false");
    this.pauseButton.textContent = "暂停";
    this.announce(won ? "任务完成。" : "任务失败。");
    this.render();
  }

  handlePlayerHit() {
    if (!this.player.alive) {
      return;
    }

    this.player.alive = false;
    this.lives -= 1;
    this.spawnParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2, COLORS.smoke, 16);

    if (this.lives <= 0) {
      this.endGame(false, "你的坦克中队已耗尽。");
      return;
    }

    this.respawnTimer = 1.3;
    this.statusText.textContent = "坦克被击毁，准备重新部署。";
    this.announce(`剩余 ${this.lives} 条命。`);
  }

  respawnPlayer() {
    const spawn = this.playerSpawns[0];
    const freshPlayer = this.createTank(spawn, "player");
    this.player = freshPlayer;
    this.statusText.textContent = "重返战场。";
  }

  getInputDirection() {
    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) {
      return DIRECTION.up;
    }
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) {
      return DIRECTION.down;
    }
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) {
      return DIRECTION.left;
    }
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) {
      return DIRECTION.right;
    }
    return null;
  }

  chooseEnemyDirection(enemy) {
    if (this.player.alive && this.hasLineOfSight(enemy, this.player)) {
      return this.directionToward(enemy, this.player);
    }

    const baseTarget = { x: this.baseTiles[0].x * TILE_SIZE, y: this.baseTiles[0].y * TILE_SIZE, size: TILE_SIZE };
    if (this.hasLineOfSight(enemy, baseTarget)) {
      return this.directionToward(enemy, baseTarget);
    }

    const options = [DIRECTION.down, DIRECTION.left, DIRECTION.right, DIRECTION.up];
    return options[Math.floor(Math.random() * options.length)];
  }

  directionToward(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx < 0 ? DIRECTION.left : DIRECTION.right;
    }
    return dy < 0 ? DIRECTION.up : DIRECTION.down;
  }

  hasLineOfSight(source, target) {
    if (!target || !this.player.alive && target === this.player) {
      return false;
    }

    const sourceCenterX = source.x + source.size / 2;
    const sourceCenterY = source.y + source.size / 2;
    const targetCenterX = target.x + target.size / 2;
    const targetCenterY = target.y + target.size / 2;

    if (Math.abs(sourceCenterX - targetCenterX) < TILE_SIZE * 0.45) {
      const step = sourceCenterY < targetCenterY ? 1 : -1;
      for (let y = Math.floor(sourceCenterY / TILE_SIZE) + step; y !== Math.floor(targetCenterY / TILE_SIZE); y += step) {
        const tile = this.map[y]?.[Math.floor(sourceCenterX / TILE_SIZE)];
        if (tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.BASE) {
          return false;
        }
      }
      return true;
    }

    if (Math.abs(sourceCenterY - targetCenterY) < TILE_SIZE * 0.45) {
      const step = sourceCenterX < targetCenterX ? 1 : -1;
      for (let x = Math.floor(sourceCenterX / TILE_SIZE) + step; x !== Math.floor(targetCenterX / TILE_SIZE); x += step) {
        const tile = this.map[Math.floor(sourceCenterY / TILE_SIZE)]?.[x];
        if (tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.BASE) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  moveTank(tank, direction, amount) {
    const nextX = clamp(tank.x + direction.x * amount, 0, GRID_SIZE * TILE_SIZE - tank.size);
    const nextY = clamp(tank.y + direction.y * amount, 0, GRID_SIZE * TILE_SIZE - tank.size);

    let moved = false;

    if (!this.isTankBlocked(tank, nextX, tank.y)) {
      tank.x = nextX;
      moved = true;
    }

    if (!this.isTankBlocked(tank, tank.x, nextY)) {
      tank.y = nextY;
      moved = true;
    }

    return moved;
  }

  isTankBlocked(tank, nextX, nextY) {
    const corners = [
      [nextX + 1, nextY + 1],
      [nextX + tank.size - 1, nextY + 1],
      [nextX + 1, nextY + tank.size - 1],
      [nextX + tank.size - 1, nextY + tank.size - 1],
    ];

    for (const [x, y] of corners) {
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);
      const tile = this.map[tileY]?.[tileX] ?? TILE.STEEL;
      if (tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.BASE) {
        return true;
      }
    }

    const ghost = { x: nextX, y: nextY, size: tank.size };
    const others = tank.kind === "player" ? this.enemies : [this.player, ...this.enemies.filter((enemy) => enemy !== tank)];

    return others.some((other) => other && other.alive && aabbIntersects(ghost, other));
  }

  fireBullet(tank, fromPlayer) {
    tank.cooldown = tank.fireCooldown;
    const centerX = tank.x + tank.size / 2;
    const centerY = tank.y + tank.size / 2;
    const offset = tank.size / 2 + 3;

    this.bullets.push({
      x: centerX + tank.direction.x * offset,
      y: centerY + tank.direction.y * offset,
      direction: tank.direction,
      active: true,
      fromPlayer,
      color: fromPlayer ? COLORS.shellPlayer : COLORS.shellEnemy,
    });
  }

  bulletHitsTank(bullet, tank) {
    return (
      bullet.x >= tank.x &&
      bullet.x <= tank.x + tank.size &&
      bullet.y >= tank.y &&
      bullet.y <= tank.y + tank.size
    );
  }

  spawnParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 84,
        vy: (Math.random() - 0.5) * 84,
        life: 0.25 + Math.random() * 0.35,
        color,
      });
    }
  }

  createMap() {
    return MAP_TEMPLATE.map((row) =>
      Array.from(row, (symbol) => {
        if (symbol === "#") return TILE.BRICK;
        if (symbol === "@") return TILE.STEEL;
        if (symbol === "B") return TILE.BASE;
        return TILE.EMPTY;
      }),
    );
  }

  collectSpawns(symbol) {
    const spawns = [];
    MAP_TEMPLATE.forEach((row, y) => {
      Array.from(row).forEach((cell, x) => {
        if (cell === symbol) {
          spawns.push({ x, y });
        }
      });
    });
    return spawns;
  }

  collectBaseTiles() {
    const baseTiles = [];
    MAP_TEMPLATE.forEach((row, y) => {
      Array.from(row).forEach((cell, x) => {
        if (cell === "B") {
          baseTiles.push({ x, y });
        }
      });
    });
    return baseTiles;
  }

  createTank(spawn, kind) {
    return {
      x: spawn.x * TILE_SIZE + 1,
      y: spawn.y * TILE_SIZE + 1,
      size: 14,
      direction: kind === "player" ? DIRECTION.up : DIRECTION.down,
      cooldown: 0,
      fireCooldown: kind === "player" ? PLAYER_FIRE_COOLDOWN : ENEMY_FIRE_COOLDOWN,
      alive: true,
      kind,
    };
  }

  updateHud() {
    const remaining = TOTAL_ENEMIES - this.destroyedEnemies;
    this.hud.score.textContent = String(this.score).padStart(4, "0");
    this.hud.lives.textContent = String(Math.max(this.lives, 0));
    this.hud.enemies.textContent = String(Math.max(remaining, 0)).padStart(2, "0");
    this.hud.highScore.textContent = String(this.highScore).padStart(4, "0");
  }

  loadHighScore() {
    try {
      return Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10) || 0;
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    this.highScore = Math.max(this.highScore, this.score);
    this.updateHud();
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    } catch {
      return;
    }
  }

  showOverlay(title, message, kicker) {
    this.overlayKicker.textContent = kicker;
    this.overlayTitle.textContent = title;
    this.overlayMessage.textContent = message;
    this.overlay.classList.add("is-visible");
  }

  hideOverlay() {
    this.overlay.classList.remove("is-visible");
  }

  announce(message) {
    this.liveRegion.textContent = message;
  }

  render() {
    this.drawBackdrop();
    this.drawMap();
    this.drawBaseBanner();
    this.drawBullets();
    this.drawParticles();
    this.drawTank(this.player, COLORS.player, COLORS.playerShade);
    for (const enemy of this.enemies) {
      this.drawTank(enemy, COLORS.enemy, COLORS.enemyShade);
    }
  }

  drawBackdrop() {
    this.ctx.fillStyle = COLORS.backdrop;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        this.ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 1;
    for (let line = 0; line <= GRID_SIZE; line += 1) {
      const pos = line * TILE_SIZE + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
  }

  drawMap() {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const tile = this.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TILE.BRICK) {
          this.ctx.fillStyle = COLORS.brick;
          this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = COLORS.brickShade;
          this.ctx.fillRect(px, py + 10, TILE_SIZE, 4);
          this.ctx.fillRect(px + 6, py, 4, TILE_SIZE);
        }

        if (tile === TILE.STEEL) {
          this.ctx.fillStyle = COLORS.steel;
          this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = COLORS.steelShade;
          this.ctx.fillRect(px + 2, py + 2, 12, 3);
          this.ctx.fillRect(px + 2, py + 11, 12, 3);
          this.ctx.fillRect(px + 2, py + 2, 3, 12);
          this.ctx.fillRect(px + 11, py + 2, 3, 12);
        }

        if (tile === TILE.BASE) {
          this.ctx.fillStyle = COLORS.base;
          this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = COLORS.baseShade;
          this.ctx.fillRect(px + 4, py + 4, 8, 8);
          this.ctx.fillStyle = COLORS.text;
          this.ctx.fillRect(px + 7, py + 3, 2, 10);
          this.ctx.fillRect(px + 9, py + 3, 3, 3);
        }
      }
    }
  }

  drawBaseBanner() {
    this.ctx.fillStyle = "rgba(255, 209, 102, 0.18)";
    this.ctx.fillRect(0, this.canvas.height - TILE_SIZE * 3, this.canvas.width, TILE_SIZE * 3);
  }

  drawBullets() {
    for (const bullet of this.bullets) {
      this.ctx.fillStyle = bullet.color;
      this.ctx.fillRect(Math.round(bullet.x) - 1, Math.round(bullet.y) - 1, 3, 3);
    }
  }

  drawParticles() {
    for (const particle of this.particles) {
      this.ctx.globalAlpha = clamp(particle.life / 0.6, 0, 1);
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(Math.round(particle.x), Math.round(particle.y), 2, 2);
      this.ctx.globalAlpha = 1;
    }
  }

  drawTank(tank, bodyColor, shadeColor) {
    if (!tank || !tank.alive) {
      return;
    }

    const { x, y, size, direction } = tank;
    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2);
    this.ctx.rotate(direction.angle);

    this.ctx.fillStyle = shadeColor;
    this.ctx.fillRect(-size / 2, -size / 2, size, size);
    this.ctx.fillRect(-size / 2 - 1, -size / 2, 3, size);
    this.ctx.fillRect(size / 2 - 2, -size / 2, 3, size);

    this.ctx.fillStyle = bodyColor;
    this.ctx.fillRect(-5, -5, 10, 10);
    this.ctx.fillRect(-3, -7, 6, 3);
    this.ctx.fillStyle = COLORS.text;
    this.ctx.fillRect(-1, -3, 2, 2);
    this.ctx.fillRect(-2, -size / 2 - 6, 4, 7);

    this.ctx.restore();
  }
}

new TankBattleGame();
