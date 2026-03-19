/**
 * 坦克大战增强版游戏引擎
 * 包含粒子效果、道具系统、关卡系统、音效等完整功能
 */

import { AchievementManager, showAchievementNotification } from './achievements.js';

// ==================== 常量配置 ====================
const CONFIG = {
  // 世界设置
  WORLD: {
    WIDTH: 20,
    HEIGHT: 20,
    TILE_SIZE: 32,
    GRID_COLOR: 'rgba(255, 255, 255, 0.05)',
    BG_COLOR: '#0a0e1a'
  },
  
  // 玩家配置
  PLAYER: {
    SPEED: 120,
    SIZE: 28,
    FIRE_COOLDOWN: 0.3,
    COLOR: '#4ecdc4',
    BARREL_COLOR: '#2a9d8f',
    LIVES: 3
  },
  
  // 敌人配置
  ENEMY: {
    SPEED: 80,
    SIZE: 28,
    FIRE_COOLDOWN: 1.5,
    COLOR: '#ff3864',
    BARREL_COLOR: '#c9184a',
    MAX_ACTIVE: 4,
    TOTAL_PER_LEVEL: 20,
    SPAWN_INTERVAL: 3
  },
  
  // 子弹配置
  BULLET: {
    SPEED: 300,
    SIZE: 6,
    PLAYER_COLOR: '#ffffff',
    ENEMY_COLOR: '#ffba08'
  },
  
  // 道具配置
  POWERUP: {
    SPAWN_CHANCE: 0.15,
    DURATION: 10,
    SIZE: 24,
    BLINK_SPEED: 2
  },
  
  // 粒子效果
  PARTICLE: {
    COUNT: 15,
    LIFE: 0.8,
    SPEED: 150
  },
  
  // 分数
  SCORE: {
    ENEMY_KILL: 100,
    LEVEL_COMPLETE: 1000,
    BASE_DESTROY_PENALTY: -500
  }
};

// ==================== 工具函数 ====================
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  normalize() {
    const len = this.length();
    return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
  }
}

// 方向枚举
const DIRECTION = {
  UP: { x: 0, y: -1, angle: 0 },
  RIGHT: { x: 1, y: 0, angle: Math.PI / 2 },
  DOWN: { x: 0, y: 1, angle: Math.PI },
  LEFT: { x: -1, y: 0, angle: Math.PI * 1.5 }
};

// 瓦片类型
const TILE = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  WATER: 3,
  GRASS: 4,
  BASE: 5
};

// ==================== 地图系统 ====================
class GameMap {
  constructor(level = 1) {
    this.level = level;
    this.width = CONFIG.WORLD.WIDTH;
    this.height = CONFIG.WORLD.HEIGHT;
    this.tiles = [];
    this.basePosition = null;
    this.playerSpawns = [];
    this.enemySpawns = [];
    this.generateMap();
  }
  
  generateMap() {
    // 创建空地图
    this.tiles = Array(this.height).fill().map(() => Array(this.width).fill(TILE.EMPTY));
    
    // 根据关卡生成不同的地图布局
    const layouts = [
      this.generateLevel1,
      this.generateLevel2,
      this.generateLevel3,
      this.generateLevel4,
      this.generateLevel5
    ];
    
    const layoutIndex = (this.level - 1) % layouts.length;
    layouts[layoutIndex].call(this);
  }
  
  generateLevel1() {
    // 关卡1: 经典布局
    const mid = Math.floor(this.width / 2);
    
    // 基地在底部中央
    this.basePosition = { x: mid, y: this.height - 2 };
    this.tiles[this.basePosition.y][this.basePosition.x] = TILE.BASE;
    
    // 基地周围的砖墙保护
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = this.basePosition.x + dx;
        const y = this.basePosition.y + dy;
        if (this.isInBounds(x, y)) {
          this.tiles[y][x] = TILE.BRICK;
        }
      }
    }
    
    // 添加一些障碍物
    this.addRandomObstacles(0.15);
    
    // 玩家出生点（底部左右）
    this.playerSpawns = [
      { x: 2, y: this.height - 2 },
      { x: this.width - 3, y: this.height - 2 }
    ];
    
    // 敌人出生点（顶部）
    this.enemySpawns = [
      { x: 2, y: 1 },
      { x: mid, y: 1 },
      { x: this.width - 3, y: 1 }
    ];
  }
  
  generateLevel2() {
    // 关卡2: 迷宫式
    this.basePosition = { x: Math.floor(this.width / 2), y: this.height - 2 };
    this.tiles[this.basePosition.y][this.basePosition.x] = TILE.BASE;
    
    // 创建迷宫墙
    for (let y = 3; y < this.height - 3; y++) {
      for (let x = 3; x < this.width - 3; x++) {
        if ((x % 4 === 0 || y % 4 === 0) && Math.random() > 0.3) {
          this.tiles[y][x] = Math.random() > 0.7 ? TILE.STEEL : TILE.BRICK;
        }
      }
    }
    
    this.playerSpawns = [{ x: 1, y: this.height - 2 }];
    this.enemySpawns = [
      { x: 1, y: 1 },
      { x: this.width - 2, y: 1 },
      { x: Math.floor(this.width / 2), y: 1 }
    ];
  }
  
  generateLevel3() {
    // 关卡3: 堡垒式
    const mid = Math.floor(this.width / 2);
    this.basePosition = { x: mid, y: this.height - 2 };
    this.tiles[this.basePosition.y][this.basePosition.x] = TILE.BASE;
    
    // 创建钢铁堡垒
    for (let i = 0; i < 3; i++) {
      const radius = 4 + i * 2;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
        const x = Math.floor(mid + Math.cos(angle) * radius);
        const y = Math.floor(mid + Math.sin(angle) * radius);
        if (this.isInBounds(x, y) && Math.random() > 0.4) {
          this.tiles[y][x] = i === 0 ? TILE.STEEL : TILE.BRICK;
        }
      }
    }
    
    this.playerSpawns = [{ x: mid, y: this.height - 4 }];
    this.enemySpawns = [
      { x: 2, y: 2 },
      { x: this.width - 3, y: 2 },
      { x: mid, y: 2 }
    ];
  }
  
  generateLevel4() {
    // 关卡4: 河流与桥梁
    const mid = Math.floor(this.width / 2);
    this.basePosition = { x: mid, y: this.height - 2 };
    this.tiles[this.basePosition.y][this.basePosition.x] = TILE.BASE;
    
    // 创建水域
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) {
        if (Math.abs(x - mid) < 4 || Math.abs(y - 10) < 2) {
          if (Math.random() > 0.3) {
            this.tiles[y][x] = TILE.WATER;
          }
        }
      }
    }
    
    // 添加岛屿和桥梁
    this.addRandomObstacles(0.1);
    
    this.playerSpawns = [{ x: mid, y: this.height - 3 }];
    this.enemySpawns = [
      { x: 1, y: 1 },
      { x: this.width - 2, y: 1 },
      { x: mid, y: 1 }
    ];
  }
  
  generateLevel5() {
    // 关卡5: 混乱战场
    const mid = Math.floor(this.width / 2);
    this.basePosition = { x: mid, y: this.height - 2 };
    this.tiles[this.basePosition.y][this.basePosition.x] = TILE.BASE;
    
    // 随机生成各种障碍
    for (let y = 2; y < this.height - 3; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        const rand = Math.random();
        if (rand < 0.15) {
          this.tiles[y][x] = TILE.BRICK;
        } else if (rand < 0.20) {
          this.tiles[y][x] = TILE.STEEL;
        } else if (rand < 0.25) {
          this.tiles[y][x] = TILE.WATER;
        }
      }
    }
    
    // 确保基地周围有保护
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = this.basePosition.x + dx;
        const y = this.basePosition.y + dy;
        if (this.isInBounds(x, y) && Math.abs(dx) + Math.abs(dy) > 1) {
          this.tiles[y][x] = TILE.STEEL;
        }
      }
    }
    
    this.playerSpawns = [{ x: 2, y: this.height - 2 }];
    this.enemySpawns = [
      { x: 2, y: 1 },
      { x: mid, y: 1 },
      { x: this.width - 3, y: 1 }
    ];
  }
  
  addRandomObstacles(density) {
    for (let y = 2; y < this.height - 3; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (Math.random() < density && this.tiles[y][x] === TILE.EMPTY) {
          this.tiles[y][x] = Math.random() > 0.8 ? TILE.STEEL : TILE.BRICK;
        }
      }
    }
  }
  
  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  
  getTile(x, y) {
    if (!this.isInBounds(x, y)) return TILE.STEEL;
    return this.tiles[y][x];
  }
  
  setTile(x, y, tile) {
    if (this.isInBounds(x, y)) {
      this.tiles[y][x] = tile;
    }
  }
  
  canMoveTo(x, y) {
    const tileX = Math.floor(x / CONFIG.WORLD.TILE_SIZE);
    const tileY = Math.floor(y / CONFIG.WORLD.TILE_SIZE);
    const tile = this.getTile(tileX, tileY);
    return tile === TILE.EMPTY || tile === TILE.GRASS;
  }
  
  canShootThrough(x, y) {
    const tileX = Math.floor(x / CONFIG.WORLD.TILE_SIZE);
    const tileY = Math.floor(y / CONFIG.WORLD.TILE_SIZE);
    const tile = this.getTile(tileX, tileY);
    return tile === TILE.EMPTY || tile === TILE.GRASS || tile === TILE.WATER;
  }
  
  hitTile(x, y) {
    const tileX = Math.floor(x / CONFIG.WORLD.TILE_SIZE);
    const tileY = Math.floor(y / CONFIG.WORLD.TILE_SIZE);
    const tile = this.getTile(tileX, tileY);
    
    if (tile === TILE.BRICK) {
      this.setTile(tileX, tileY, TILE.EMPTY);
      return 'brick';
    } else if (tile === TILE.BASE) {
      this.setTile(tileX, tileY, TILE.EMPTY);
      return 'base';
    } else if (tile === TILE.STEEL || tile === TILE.WATER) {
      return 'steel';
    }
    return null;
  }
  
  draw(ctx) {
    const ts = CONFIG.WORLD.TILE_SIZE;
    
    // 绘制网格背景
    ctx.fillStyle = CONFIG.WORLD.BG_COLOR;
    ctx.fillRect(0, 0, this.width * ts, this.height * ts);
    
    // 绘制网格线
    ctx.strokeStyle = CONFIG.WORLD.GRID_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * ts, 0);
      ctx.lineTo(x * ts, this.height * ts);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * ts);
      ctx.lineTo(this.width * ts, y * ts);
      ctx.stroke();
    }
    
    // 绘制瓦片
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile === TILE.EMPTY) continue;
        
        const px = x * ts;
        const py = y * ts;
        
        switch (tile) {
          case TILE.BRICK:
            this.drawBrick(ctx, px, py, ts);
            break;
          case TILE.STEEL:
            this.drawSteel(ctx, px, py, ts);
            break;
          case TILE.WATER:
            this.drawWater(ctx, px, py, ts);
            break;
          case TILE.GRASS:
            this.drawGrass(ctx, px, py, ts);
            break;
          case TILE.BASE:
            this.drawBase(ctx, px, py, ts);
            break;
        }
      }
    }
  }
  
  drawBrick(ctx, x, y, size) {
    ctx.fillStyle = '#f7931e';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // 砖纹理
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    const half = size / 2;
    ctx.strokeRect(x + 4, y + 4, half - 6, half - 6);
    ctx.strokeRect(x + half + 2, y + 4, half - 6, half - 6);
    ctx.strokeRect(x + 4, y + half + 2, half - 6, half - 6);
    ctx.strokeRect(x + half + 2, y + half + 2, half - 6, half - 6);
  }
  
  drawSteel(ctx, x, y, size) {
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#718dff');
    gradient.addColorStop(1, '#4361ee');
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // 金属光泽
    ctx.strokeStyle = '#a8b9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + size - 4, y + 4);
    ctx.stroke();
  }
  
  drawWater(ctx, x, y, size) {
    const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
    gradient.addColorStop(0, '#4cc9f0');
    gradient.addColorStop(1, '#4895ef');
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // 水波纹
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  drawGrass(ctx, x, y, size) {
    ctx.fillStyle = '#52b788';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  }
  
  drawBase(ctx, x, y, size) {
    // 基地 - 鹰标志
    const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
    gradient.addColorStop(0, '#ffd60a');
    gradient.addColorStop(1, '#e85d04');
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    
    // 画鹰
    ctx.fillStyle = '#000';
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦅', x + size/2, y + size/2);
  }
}

// ==================== 粒子系统 ====================
class Particle {
  constructor(x, y, color) {
    this.position = new Vector2(x, y);
    const angle = Math.random() * Math.PI * 2;
    const speed = CONFIG.PARTICLE.SPEED * (0.5 + Math.random() * 0.5);
    this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.color = color;
    this.life = CONFIG.PARTICLE.LIFE;
    this.maxLife = CONFIG.PARTICLE.LIFE;
    this.size = 3 + Math.random() * 4;
  }
  
  update(dt) {
    this.position = this.position.add(this.velocity.multiply(dt));
    this.life -= dt;
    this.velocity = this.velocity.multiply(0.95); // 阻力
  }
  
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// ==================== 子弹类 ====================
class Bullet {
  constructor(x, y, direction, isPlayer) {
    this.position = new Vector2(x, y);
    this.direction = direction;
    this.speed = CONFIG.BULLET.SPEED;
    this.size = CONFIG.BULLET.SIZE;
    this.isPlayer = isPlayer;
    this.color = isPlayer ? CONFIG.BULLET.PLAYER_COLOR : CONFIG.BULLET.ENEMY_COLOR;
    this.active = true;
  }
  
  update(dt, map) {
    this.position.x += this.direction.x * this.speed * dt;
    this.position.y += this.direction.y * this.speed * dt;
    
    // 检查边界
    const worldSize = CONFIG.WORLD.WIDTH * CONFIG.WORLD.TILE_SIZE;
    if (this.position.x < 0 || this.position.x > worldSize ||
        this.position.y < 0 || this.position.y > worldSize) {
      this.active = false;
      return null;
    }
    
    // 检查地图碰撞
    if (!map.canShootThrough(this.position.x, this.position.y)) {
      const hitResult = map.hitTile(this.position.x, this.position.y);
      this.active = false;
      return hitResult;
    }
    
    return null;
  }
  
  draw(ctx) {
    // 发光效果
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.position.x - this.size / 2,
      this.position.y - this.size / 2,
      this.size,
      this.size
    );
    
    // 尾迹
    ctx.fillStyle = this.color + '80';
    ctx.fillRect(
      this.position.x - this.direction.x * 10 - this.size / 4,
      this.position.y - this.direction.y * 10 - this.size / 4,
      this.size / 2,
      this.size / 2
    );
    
    ctx.shadowBlur = 0;
  }
  
  getBounds() {
    return {
      left: this.position.x - this.size / 2,
      right: this.position.x + this.size / 2,
      top: this.position.y - this.size / 2,
      bottom: this.position.y + this.size / 2
    };
  }
}

// ==================== 道具类 ====================
class PowerUp {
  constructor(x, y, type) {
    this.position = new Vector2(x, y);
    this.type = type; // 'shield', 'speed', 'rapid', 'life'
    this.size = CONFIG.POWERUP.SIZE;
    this.active = true;
    this.blinkTimer = 0;
    this.lifetime = 15; // 15秒后消失
  }
  
  update(dt) {
    this.blinkTimer += dt * CONFIG.POWERUP.BLINK_SPEED;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }
  
  draw(ctx) {
    const alpha = Math.sin(this.blinkTimer * Math.PI) * 0.3 + 0.7;
    
    // 发光背景
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size
    );
    
    const colors = {
      shield: ['#4ecdc4', '#2a9d8f'],
      speed: ['#ffba08', '#f48c06'],
      rapid: ['#ff3864', '#c9184a'],
      life: ['#06ffa5', '#00b277']
    };
    
    const [color1, color2] = colors[this.type] || colors.shield;
    gradient.addColorStop(0, color1 + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, color2 + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 图标
    const icons = {
      shield: '🛡️',
      speed: '⚡',
      rapid: '🔥',
      life: '❤️'
    };
    
    ctx.font = `${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[this.type] || '?', this.position.x, this.position.y);
  }
  
  getBounds() {
    return {
      left: this.position.x - this.size,
      right: this.position.x + this.size,
      top: this.position.y - this.size,
      bottom: this.position.y + this.size
    };
  }
}

// ==================== 坦克类 ====================
class Tank {
  constructor(x, y, isPlayer) {
    this.position = new Vector2(x, y);
    this.direction = DIRECTION.UP;
    this.isPlayer = isPlayer;
    this.size = isPlayer ? CONFIG.PLAYER.SIZE : CONFIG.ENEMY.SIZE;
    this.speed = isPlayer ? CONFIG.PLAYER.SPEED : CONFIG.ENEMY.SPEED;
    this.baseFirCooldown = isPlayer ? CONFIG.PLAYER.FIRE_COOLDOWN : CONFIG.ENEMY.FIRE_COOLDOWN;
    this.fireCooldown = 0;
    this.color = isPlayer ? CONFIG.PLAYER.COLOR : CONFIG.ENEMY.COLOR;
    this.barrelColor = isPlayer ? CONFIG.PLAYER.BARREL_COLOR : CONFIG.ENEMY.BARREL_COLOR;
    this.alive = true;
    
    // 道具效果
    this.powerUps = {
      shield: 0,
      speed: 0,
      rapid: 0
    };
    
    // AI 相关
    if (!isPlayer) {
      this.aiTimer = 0;
      this.aiChangeInterval = 1 + Math.random() * 2;
    }
  }
  
  update(dt, input, map, playerPos) {
    if (!this.alive) return null;
    
    // 更新道具效果
    Object.keys(this.powerUps).forEach(key => {
      if (this.powerUps[key] > 0) {
        this.powerUps[key] -= dt;
      }
    });
    
    // 更新射击冷却
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }
    
    let moveDir = { x: 0, y: 0 };
    let shouldFire = false;
    
    if (this.isPlayer) {
      moveDir = input.movement;
      shouldFire = input.fire;
    } else {
      // AI 逻辑
      const ai = this.updateAI(dt, playerPos, map);
      moveDir = ai.movement;
      shouldFire = ai.fire;
    }
    
    // 移动
    if (moveDir.x !== 0 || moveDir.y !== 0) {
      // 更新方向
      if (Math.abs(moveDir.x) > Math.abs(moveDir.y)) {
        this.direction = moveDir.x > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
      } else {
        this.direction = moveDir.y > 0 ? DIRECTION.DOWN : DIRECTION.UP;
      }
      
      // 应用速度加成
      const speedMultiplier = this.powerUps.speed > 0 ? 1.5 : 1;
      const newX = this.position.x + moveDir.x * this.speed * speedMultiplier * dt;
      const newY = this.position.y + moveDir.y * this.speed * speedMultiplier * dt;
      
      // 碰撞检测
      if (this.canMoveTo(newX, this.position.y, map)) {
        this.position.x = newX;
      }
      if (this.canMoveTo(this.position.x, newY, map)) {
        this.position.y = newY;
      }
      
      // 边界限制
      const worldSize = CONFIG.WORLD.WIDTH * CONFIG.WORLD.TILE_SIZE;
      this.position.x = Math.max(this.size / 2, Math.min(worldSize - this.size / 2, this.position.x));
      this.position.y = Math.max(this.size / 2, Math.min(worldSize - this.size / 2, this.position.y));
    }
    
    // 射击
    if (shouldFire && this.fireCooldown <= 0) {
      const cooldownMultiplier = this.powerUps.rapid > 0 ? 0.5 : 1;
      this.fireCooldown = this.baseFireCooldown * cooldownMultiplier;
      
      // 从炮管位置发射
      const barrelLength = this.size * 0.6;
      const bulletX = this.position.x + this.direction.x * barrelLength;
      const bulletY = this.position.y + this.direction.y * barrelLength;
      
      return new Bullet(bulletX, bulletY, this.direction, this.isPlayer);
    }
    
    return null;
  }
  
  updateAI(dt, playerPos, map) {
    this.aiTimer += dt;
    
    // 定期改变方向
    if (this.aiTimer >= this.aiChangeInterval) {
      this.aiTimer = 0;
      this.aiChangeInterval = 1 + Math.random() * 2;
    }
    
    let movement = { x: 0, y: 0 };
    let fire = false;
    
    if (playerPos) {
      // 简单的追踪AI
      const dx = playerPos.x - this.position.x;
      const dy = playerPos.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果在同一直线上，尝试射击
      const alignedX = Math.abs(dy) < CONFIG.WORLD.TILE_SIZE;
      const alignedY = Math.abs(dx) < CONFIG.WORLD.TILE_SIZE;
      
      if ((alignedX || alignedY) && distance < 300) {
        fire = Math.random() > 0.7;
      }
      
      // 移动向玩家
      if (distance > 150) {
        if (Math.abs(dx) > Math.abs(dy)) {
          movement.x = dx > 0 ? 1 : -1;
        } else {
          movement.y = dy > 0 ? 1 : -1;
        }
      } else {
        // 太近了，随机移动
        if (this.aiTimer < dt) {
          const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
          ];
          movement = dirs[Math.floor(Math.random() * dirs.length)];
        }
      }
    } else {
      // 随机巡逻
      if (this.aiTimer < dt) {
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 0, y: 0 }
        ];
        movement = dirs[Math.floor(Math.random() * dirs.length)];
      }
      
      fire = Math.random() > 0.95;
    }
    
    return { movement, fire };
  }
  
  canMoveTo(x, y, map) {
    const half = this.size / 2;
    const corners = [
      { x: x - half, y: y - half },
      { x: x + half, y: y - half },
      { x: x - half, y: y + half },
      { x: x + half, y: y + half }
    ];
    
    return corners.every(corner => map.canMoveTo(corner.x, corner.y));
  }
  
  draw(ctx) {
    if (!this.alive) return;
    
    ctx.save();
    
    // 护盾效果
    if (this.powerUps.shield > 0) {
      const pulseSize = this.size + Math.sin(Date.now() * 0.01) * 4;
      const gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, this.size / 2,
        this.position.x, this.position.y, pulseSize
      );
      gradient.addColorStop(0, 'rgba(78, 205, 196, 0)');
      gradient.addColorStop(1, 'rgba(78, 205, 196, 0.5)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 坦克主体
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.direction.angle);
    
    // 身体
    const bodyGradient = ctx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
    bodyGradient.addColorStop(0, this.color);
    bodyGradient.addColorStop(1, this.color + 'cc');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    
    // 履带
    ctx.fillStyle = '#000';
    ctx.fillRect(-this.size / 2 - 2, -this.size / 2, 4, this.size);
    ctx.fillRect(this.size / 2 - 2, -this.size / 2, 4, this.size);
    
    // 炮塔
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 炮管
    ctx.fillStyle = this.barrelColor;
    ctx.fillRect(-3, -this.size * 0.6, 6, this.size * 0.4);
    
    // 炮口
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -this.size * 0.6 - 4, 4, 4);
    
    ctx.restore();
    
    // 加速效果
    if (this.powerUps.speed > 0) {
      ctx.fillStyle = 'rgba(255, 186, 8, 0.3)';
      ctx.fillRect(this.position.x - this.size/2 - 4, this.position.y - this.size/2 - 4, this.size + 8, this.size + 8);
    }
  }
  
  applyPowerUp(type) {
    this.powerUps[type] = CONFIG.POWERUP.DURATION;
  }
  
  hit() {
    if (this.powerUps.shield > 0) {
      this.powerUps.shield = 0;
      return false; // 护盾吸收伤害
    }
    this.alive = false;
    return true;
  }
  
  getBounds() {
    const half = this.size / 2;
    return {
      left: this.position.x - half,
      right: this.position.x + half,
      top: this.position.y - half,
      bottom: this.position.y + half
    };
  }
}

// ==================== 输入管理 ====================
class InputManager {
  constructor() {
    this.keys = new Set();
    this.firePressed = false;
    
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        this.firePressed = true;
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') {
        this.firePressed = false;
      }
    });
  }
  
  getInput() {
    const movement = { x: 0, y: 0 };
    
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) movement.y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) movement.y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) movement.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) movement.x += 1;
    
    // 归一化对角线移动
    if (movement.x !== 0 && movement.y !== 0) {
      const len = Math.sqrt(2);
      movement.x /= len;
      movement.y /= len;
    }
    
    const fire = this.firePressed;
    this.firePressed = false; // 单次触发
    
    return { movement, fire };
  }
}

// ==================== 音效管理器 ====================
class AudioManager {
  constructor() {
    this.muted = false;
    this.sounds = {};
    this.context = null;
    this.initAudio();
  }
  
  initAudio() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }
  
  playSound(type) {
    if (this.muted || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    switch (type) {
      case 'shoot':
        oscillator.frequency.value = 220;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.1);
        break;
        
      case 'explosion':
        oscillator.frequency.value = 100;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.3);
        break;
        
      case 'powerup':
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.2);
        break;
        
      case 'hit':
        oscillator.frequency.value = 150;
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.2);
        break;
    }
  }
  
  setMuted(muted) {
    this.muted = muted;
  }
}

// ==================== 主游戏类 ====================
export class TankGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    
    // 游戏状态
    this.running = false;
    this.paused = false;
    this.level = 1;
    this.score = 0;
    this.kills = 0;
    this.lives = CONFIG.PLAYER.LIVES;
    this.highScore = parseInt(localStorage.getItem('tankGameHighScore') || '0');
    
    // 游戏对象
    this.map = null;
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    
    // 管理器
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.achievements = new AchievementManager();
    
    // 计时器
    this.enemySpawnTimer = 0;
    this.enemiesSpawned = 0;
    this.powerUpTimer = 0;
    this.levelStartTime = 0;
    this.levelDeaths = 0;
    
    // 动画
    this.lastTime = 0;
    this.animationId = null;
    
    this.init();
  }
  
  init() {
    // 设置画布
    const size = CONFIG.WORLD.WIDTH * CONFIG.WORLD.TILE_SIZE;
    this.canvas.width = size;
    this.canvas.height = size;
    
    this.reset();
  }
  
  reset() {
    // 重置游戏状态
    this.level = 1;
    this.score = 0;
    this.kills = 0;
    this.lives = CONFIG.PLAYER.LIVES;
    
    this.loadLevel();
    this.updateStats();
  }
  
  loadLevel() {
    // 加载关卡
    this.map = new GameMap(this.level);
    
    // 创建玩家
    const playerSpawn = this.map.playerSpawns[0];
    this.player = new Tank(
      playerSpawn.x * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
      playerSpawn.y * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
      true
    );
    
    // 重置敌人
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.enemySpawnTimer = 0;
    this.enemiesSpawned = 0;
    this.powerUpTimer = 5;
  }
  
  start() {
    if (this.running) this.stop();
    
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.levelStartTime = performance.now();
    this.levelDeaths = 0;
    this.achievements.recordGameStart();
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  pause() {
    this.paused = true;
  }
  
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
  }
  
  gameLoop(timestamp) {
    if (!this.running) return;
    
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    
    if (!this.paused) {
      this.update(dt);
    }
    
    this.draw();
  }
  
  update(dt) {
    // 更新玩家
    const playerInput = this.input.getInput();
    const playerBullet = this.player.update(dt, playerInput, this.map, null);
    if (playerBullet) {
      this.bullets.push(playerBullet);
      this.achievements.recordShot();
      this.audio.playSound('shoot');
    }
    
    // 更新敌人生成
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0 && 
        this.enemies.length < CONFIG.ENEMY.MAX_ACTIVE &&
        this.enemiesSpawned < CONFIG.ENEMY.TOTAL_PER_LEVEL) {
      this.spawnEnemy();
      this.enemySpawnTimer = CONFIG.ENEMY.SPAWN_INTERVAL;
    }
    
    // 更新敌人
    const playerPos = this.player.alive ? this.player.position : null;
    this.enemies.forEach(enemy => {
      const enemyBullet = enemy.update(dt, null, this.map, playerPos);
      if (enemyBullet) {
        this.bullets.push(enemyBullet);
        this.audio.playSound('shoot');
      }
    });
    
    // 更新子弹
    this.bullets.forEach(bullet => {
      const hitResult = bullet.update(dt, this.map);
      if (hitResult === 'base') {
        this.gameOver(false);
      } else if (hitResult === 'brick') {
        const unlocked = this.achievements.recordBlockDestroyed();
        this.showAchievements(unlocked);
      }
      if (!bullet.active) {
        this.createExplosion(bullet.position.x, bullet.position.y, '#ff6b35');
      }
    });
    
    // 子弹碰撞检测
    this.checkBulletCollisions();
    
    // 更新粒子
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => !p.isDead());
    
    // 更新道具
    this.powerUps.forEach(p => p.update(dt));
    this.powerUps = this.powerUps.filter(p => p.active);
    
    // 道具生成
    this.powerUpTimer -= dt;
    if (this.powerUpTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpTimer = 10 + Math.random() * 10;
    }
    
    // 检查道具拾取
    this.checkPowerUpCollection();
    
    // 清理死亡对象
    this.bullets = this.bullets.filter(b => b.active);
    this.enemies = this.enemies.filter(e => e.alive);
    
    // 检查关卡完成
    if (this.enemiesSpawned >= CONFIG.ENEMY.TOTAL_PER_LEVEL && this.enemies.length === 0) {
      this.nextLevel();
    }
    
    // 更新敌人计数器
    this.updateEnemyCounter();
  }
  
  spawnEnemy() {
    const spawn = this.map.enemySpawns[Math.floor(Math.random() * this.map.enemySpawns.length)];
    const enemy = new Tank(
      spawn.x * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
      spawn.y * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
      false
    );
    this.enemies.push(enemy);
    this.enemiesSpawned++;
  }
  
  spawnPowerUp() {
    const types = ['shield', 'speed', 'rapid', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // 在安全区域生成
    let x, y, attempts = 0;
    do {
      x = (2 + Math.random() * (CONFIG.WORLD.WIDTH - 4)) * CONFIG.WORLD.TILE_SIZE;
      y = (2 + Math.random() * (CONFIG.WORLD.HEIGHT - 4)) * CONFIG.WORLD.TILE_SIZE;
      attempts++;
    } while (!this.map.canMoveTo(x, y) && attempts < 10);
    
    if (attempts < 10) {
      this.powerUps.push(new PowerUp(x, y, type));
    }
  }
  
  checkBulletCollisions() {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      const bulletBounds = bullet.getBounds();
      
      // 检查与玩家碰撞
      if (!bullet.isPlayer && this.player.alive) {
        if (this.checkCollision(bulletBounds, this.player.getBounds())) {
          const shieldBlocked = !this.player.hit();
          if (shieldBlocked) {
            const unlocked = this.achievements.recordShieldBlock();
            this.showAchievements(unlocked);
          } else {
            this.lives--;
            this.levelDeaths++;
            this.achievements.recordDeath();
            this.updateStats();
            this.audio.playSound('explosion');
            this.createExplosion(this.player.position.x, this.player.position.y, CONFIG.PLAYER.COLOR);
            
            if (this.lives <= 0) {
              this.gameOver(false);
            } else {
              // 重生
              setTimeout(() => {
                const spawn = this.map.playerSpawns[0];
                this.player = new Tank(
                  spawn.x * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
                  spawn.y * CONFIG.WORLD.TILE_SIZE + CONFIG.WORLD.TILE_SIZE / 2,
                  true
                );
              }, 2000);
            }
          }
          bullet.active = false;
        }
      }
      
      // 检查与敌人碰撞
      if (bullet.isPlayer) {
        this.enemies.forEach(enemy => {
          if (enemy.alive && this.checkCollision(bulletBounds, enemy.getBounds())) {
            enemy.hit();
            this.kills++;
            this.score += CONFIG.SCORE.ENEMY_KILL;
            
            // 成就追踪
            this.achievements.recordHit();
            const unlocked = this.achievements.recordKill();
            this.showAchievements(unlocked);
            
            const scoreUnlocked = this.achievements.recordScore(this.score);
            this.showAchievements(scoreUnlocked);
            
            this.updateStats();
            this.audio.playSound('explosion');
            this.createExplosion(enemy.position.x, enemy.position.y, CONFIG.ENEMY.COLOR);
            
            // 概率掉落道具
            if (Math.random() < CONFIG.POWERUP.SPAWN_CHANCE) {
              this.spawnPowerUp();
            }
            
            bullet.active = false;
          }
        });
      }
    });
  }
  
  checkPowerUpCollection() {
    if (!this.player.alive) return;
    
    const playerBounds = this.player.getBounds();
    this.powerUps.forEach(powerUp => {
      if (powerUp.active && this.checkCollision(playerBounds, powerUp.getBounds())) {
        if (powerUp.type === 'life') {
          this.lives++;
        } else {
          this.player.applyPowerUp(powerUp.type);
        }
        
        const unlocked = this.achievements.recordPowerUpCollected();
        this.showAchievements(unlocked);
        
        this.audio.playSound('powerup');
        this.updateStats();
        this.updatePowerUpStatus();
        powerUp.active = false;
      }
    });
  }
  
  checkCollision(bounds1, bounds2) {
    return !(bounds1.right < bounds2.left ||
             bounds1.left > bounds2.right ||
             bounds1.bottom < bounds2.top ||
             bounds1.top > bounds2.bottom);
  }
  
  createExplosion(x, y, color) {
    for (let i = 0; i < CONFIG.PARTICLE.COUNT; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }
  
  nextLevel() {
    // 记录关卡完成
    const levelTime = (performance.now() - this.levelStartTime) / 1000;
    const result = this.achievements.recordLevelComplete(this.level, levelTime, this.levelDeaths);
    if (result && result.unlocked) {
      this.showAchievements(result.unlocked);
    }
    
    this.level++;
    this.score += CONFIG.SCORE.LEVEL_COMPLETE;
    
    const scoreUnlocked = this.achievements.recordScore(this.score);
    this.showAchievements(scoreUnlocked);
    
    this.updateStats();
    
    // 短暂延迟后加载下一关
    setTimeout(() => {
      this.loadLevel();
      this.levelStartTime = performance.now();
      this.levelDeaths = 0;
    }, 2000);
  }
  
  gameOver(won) {
    this.stop();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tankGameHighScore', this.highScore.toString());
      this.updateStats();
    }
    
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver(won, this.score);
    }
  }
  
  updateStats() {
    if (this.callbacks.onScoreUpdate) {
      const gameStats = this.achievements.getStats();
      this.callbacks.onScoreUpdate({
        level: this.level,
        score: this.score,
        lives: this.lives,
        kills: this.kills,
        highScore: this.highScore,
        totalKills: gameStats.totalKills,
        accuracy: gameStats.accuracy,
        achievementsUnlocked: this.achievements.getUnlockedCount(),
        achievementsTotal: this.achievements.getTotalCount()
      });
    }
  }
  
  showAchievements(unlocked) {
    if (unlocked && unlocked.length > 0) {
      unlocked.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementNotification(achievement);
        }, index * 300);
      });
    }
  }
  
  updatePowerUpStatus() {
    if (this.callbacks.onPowerUpChange && this.player) {
      this.callbacks.onPowerUpChange({
        shield: this.player.powerUps.shield > 0,
        speed: this.player.powerUps.speed > 0,
        rapid: this.player.powerUps.rapid > 0
      });
    }
  }
  
  updateEnemyCounter() {
    const counter = document.getElementById('enemyCounter');
    if (!counter) return;
    
    const remaining = CONFIG.ENEMY.TOTAL_PER_LEVEL;
    counter.innerHTML = '';
    
    for (let i = 0; i < remaining; i++) {
      const dot = document.createElement('div');
      dot.className = 'enemy-dot';
      if (i < this.enemiesSpawned - this.enemies.length) {
        dot.classList.add('destroyed');
      }
      counter.appendChild(dot);
    }
  }
  
  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制地图
    this.map.draw(this.ctx);
    
    // 绘制道具
    this.powerUps.forEach(p => p.draw(this.ctx));
    
    // 绘制粒子
    this.particles.forEach(p => p.draw(this.ctx));
    
    // 绘制子弹
    this.bullets.forEach(b => b.draw(this.ctx));
    
    // 绘制坦克
    if (this.player.alive) {
      this.player.draw(this.ctx);
    }
    this.enemies.forEach(e => e.draw(this.ctx));
    
    // 绘制暂停提示
    if (this.paused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  setMuted(muted) {
    this.audio.setMuted(muted);
  }
}

