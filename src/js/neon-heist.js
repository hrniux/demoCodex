function parseSeedValue(value) {
  if (value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed >>> 0 : null;
}

const QUERY_PARAMS =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const AUTOTEST = Boolean(QUERY_PARAMS && QUERY_PARAMS.has('autotest'));
const FIXED_SEED = parseSeedValue(QUERY_PARAMS ? QUERY_PARAMS.get('seed') : null);

const BOARD_SIZE = 10;
const CORE_TARGET = 3;
const MAX_LIVES = 3;
const STORAGE_SCORE_KEY = 'demoCodexNeonHeistBestScore';
const STORAGE_FLOOR_KEY = 'demoCodexNeonHeistBestFloor';

const MOVE_KEYS = new Map([
  ['ArrowUp', 'up'],
  ['KeyW', 'up'],
  ['ArrowDown', 'down'],
  ['KeyS', 'down'],
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
]);

const WAIT_KEYS = new Set(['Space', 'KeyX', 'Period']);
const DECOY_KEYS = new Set(['KeyQ']);

const DIRECTIONS = {
  up: { x: 0, y: -1, label: '上移' },
  down: { x: 0, y: 1, label: '下移' },
  left: { x: -1, y: 0, label: '左移' },
  right: { x: 1, y: 0, label: '右移' },
};

const copy = {
  boot: '先拿到 3 枚数据核心，再去亮起的出口脱身。',
  live: '每走一步，巡逻无人机也会同步推进一步。',
  exit: '出口已解锁，立刻撤离。',
  frozen: 'EMP 生效，本回合巡逻停滞。',
  decoy: '诱饵已部署，巡逻会优先扑向旧位置。',
  hit: '警报拉响，本层已重置。',
  gameOver: '警报拉满，整局潜入失败。按 Enter 或按钮重新部署。',
};

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function cloneCell(cell) {
  return { x: cell.x, y: cell.y };
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function inBounds(cell, size = BOARD_SIZE) {
  return cell.x >= 0 && cell.x < size && cell.y >= 0 && cell.y < size;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createRng(seed) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, rng) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function buildInteriorCells(size) {
  const cells = [];
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

function neighbors(cell, size) {
  const result = [];
  for (const direction of Object.values(DIRECTIONS)) {
    const next = { x: cell.x + direction.x, y: cell.y + direction.y };
    if (inBounds(next, size)) {
      result.push(next);
    }
  }
  return result;
}

function cloneAgents(items) {
  return items.map((item) => ({ id: item.id, x: item.x, y: item.y, active: item.active }));
}

function cloneTimedMarker(marker) {
  if (!marker) {
    return null;
  }

  return { x: marker.x, y: marker.y, turns: marker.turns };
}

function cloneState(state) {
  return {
    player: cloneCell(state.player),
    drones: state.drones.map((drone) => ({ id: drone.id, x: drone.x, y: drone.y })),
    cores: cloneAgents(state.cores),
    emps: cloneAgents(state.emps),
    decoys: cloneAgents(state.decoys),
    collected: state.collected,
    freezeTurns: state.freezeTurns,
    decoyCharges: state.decoyCharges,
    activeDecoy: cloneTimedMarker(state.activeDecoy),
    turns: state.turns,
    exitUnlocked: state.exitUnlocked,
  };
}

function rebuildPath(cameFrom, start, goal) {
  const path = [cloneCell(goal)];
  let cursor = cellKey(goal);
  const startKey = cellKey(start);

  while (cursor !== startKey) {
    const previous = cameFrom.get(cursor);
    if (!previous) {
      return null;
    }
    path.push(cloneCell(previous));
    cursor = cellKey(previous);
  }

  return path.reverse();
}

function findRoute(levelData, start, goal, blockedKeys = new Set()) {
  if (sameCell(start, goal)) {
    return [cloneCell(start)];
  }

  const queue = [cloneCell(start)];
  const seen = new Set([cellKey(start)]);
  const cameFrom = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    for (const next of neighbors(current, levelData.size)) {
      const nextKey = cellKey(next);
      if (levelData.walls.has(nextKey) || seen.has(nextKey)) {
        continue;
      }
      if (blockedKeys.has(nextKey) && nextKey !== cellKey(goal)) {
        continue;
      }
      seen.add(nextKey);
      cameFrom.set(nextKey, current);
      if (sameCell(next, goal)) {
        return rebuildPath(cameFrom, start, goal);
      }
      queue.push(next);
    }
  }

  return null;
}

function validateLevel(levelData) {
  const objectives = [levelData.exit, ...levelData.cores, ...levelData.emps];
  return objectives.every((target) => Boolean(findRoute(levelData, levelData.start, target)));
}

function pickDroneStep(levelData, drone, player, occupiedKeys = new Set()) {
  // 无人机始终走向玩家的最短路，但会避开已被其他无人机占用的格子。
  const route = findRoute(levelData, drone, player, occupiedKeys);
  if (!route || route.length < 2) {
    return cloneCell(drone);
  }
  return route[1];
}

function buildFallbackLevel(level, seed) {
  const walls = new Set([
    '2,2',
    '3,2',
    '6,2',
    '7,2',
    '4,3',
    '4,4',
    '5,4',
    '2,5',
    '3,5',
    '6,6',
    '7,6',
    '5,7',
  ]);

  const drones = [
    { id: 0, x: 7, y: 7 },
    { id: 1, x: 6, y: 3 },
    { id: 2, x: 3, y: 1 },
    { id: 3, x: 8, y: 5 },
    { id: 4, x: 1, y: 3 },
  ].slice(0, Math.min(2 + Math.floor((level - 1) / 2), 5));

  return {
    size: BOARD_SIZE,
    level,
    seed,
    start: { x: 1, y: 8 },
    exit: { x: 8, y: 1 },
    walls,
    cores: [
      { x: 6, y: 1 },
      { x: 2, y: 7 },
      { x: 8, y: 6 },
    ],
    emps: level >= 4 ? [{ x: 1, y: 4 }, { x: 5, y: 8 }] : [{ x: 1, y: 4 }],
    decoys: level >= 2 ? [{ x: 2, y: 1 }] : [],
    drones,
  };
}

function generateLevel(level, seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0) {
  const size = BOARD_SIZE;
  const start = { x: 1, y: size - 2 };
  const exit = { x: size - 2, y: 1 };
  const wallTarget = clamp(9 + level * 2, 10, 22);
  const droneTarget = Math.min(2 + Math.floor((level - 1) / 2), 5);
  const empTarget = level >= 4 ? 2 : 1;
  const decoyTarget = level >= 2 ? 1 : 0;
  const interiorCells = buildInteriorCells(size);

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const attemptSeed = (seed + level * 2654435761 + attempt * 2246822519) >>> 0;
    const rng = createRng(attemptSeed);

    const specialPool = shuffle(
      interiorCells.filter(
        (cell) =>
          manhattan(cell, start) >= 3 &&
          manhattan(cell, exit) >= 3 &&
          !(cell.x === start.x && cell.y === start.y) &&
          !(cell.x === exit.x && cell.y === exit.y),
      ),
      rng,
    );

    const cores = specialPool.slice(0, CORE_TARGET).map(cloneCell);
    const utilityPool = specialPool
      .slice(CORE_TARGET)
      .filter((cell) => cores.every((core) => manhattan(core, cell) >= 2));
    const emps = utilityPool.slice(0, empTarget).map(cloneCell);
    const decoys = utilityPool
      .slice(empTarget)
      .filter((cell) => emps.every((emp) => manhattan(emp, cell) >= 2))
      .slice(0, decoyTarget)
      .map(cloneCell);

    if (
      cores.length !== CORE_TARGET ||
      emps.length !== empTarget ||
      decoys.length !== decoyTarget
    ) {
      continue;
    }

    const reservedKeys = new Set([
      cellKey(start),
      cellKey(exit),
      ...cores.map(cellKey),
      ...emps.map(cellKey),
      ...decoys.map(cellKey),
    ]);

    const walls = new Set();
    const wallCandidates = shuffle(
      interiorCells.filter(
        (cell) =>
          !reservedKeys.has(cellKey(cell)) &&
          manhattan(cell, start) >= 2 &&
          manhattan(cell, exit) >= 2,
      ),
      rng,
    );

    const draftLevel = { size, start, exit, cores, emps, walls };

    for (const cell of wallCandidates) {
      if (walls.size >= wallTarget) {
        break;
      }
      const key = cellKey(cell);
      walls.add(key);
      if (!validateLevel(draftLevel)) {
        walls.delete(key);
      }
    }

    if (walls.size < wallTarget - 2) {
      continue;
    }

    const droneCandidates = shuffle(
      interiorCells.filter((cell) => {
        const key = cellKey(cell);
        return (
          !walls.has(key) &&
          !reservedKeys.has(key) &&
          manhattan(cell, start) >= 5 &&
          cores.every((core) => manhattan(cell, core) >= 2)
        );
      }),
      rng,
    );

    const drones = [];
    for (const cell of droneCandidates) {
      if (drones.length >= droneTarget) {
        break;
      }
      drones.push({ id: drones.length, x: cell.x, y: cell.y });
    }

    if (drones.length !== droneTarget) {
      continue;
    }

    return {
      size,
      level,
      seed: attemptSeed,
      start: cloneCell(start),
      exit: cloneCell(exit),
      walls,
      cores,
      emps,
      decoys,
      drones,
    };
  }

  return buildFallbackLevel(level, seed >>> 0);
}

function createLevelState(levelData) {
  return {
    player: cloneCell(levelData.start),
    drones: levelData.drones.map((drone) => ({ id: drone.id, x: drone.x, y: drone.y })),
    cores: levelData.cores.map((core, index) => ({ id: index, x: core.x, y: core.y, active: true })),
    emps: levelData.emps.map((emp, index) => ({ id: index, x: emp.x, y: emp.y, active: true })),
    decoys: levelData.decoys.map((decoy, index) => ({
      id: index,
      x: decoy.x,
      y: decoy.y,
      active: true,
    })),
    collected: 0,
    freezeTurns: 0,
    decoyCharges: 0,
    activeDecoy: null,
    turns: 0,
    exitUnlocked: false,
  };
}

function runSelfCheck(rounds = 12) {
  for (let level = 1; level <= 6; level += 1) {
    for (let sample = 0; sample < rounds; sample += 1) {
      const seed = (level * 73856093 + sample * 19349663) >>> 0;
      const levelData = generateLevel(level, seed);
      if (!validateLevel(levelData)) {
        return { ok: false, stage: 'validate-level', level, seed };
      }

      const exitRoute = findRoute(levelData, levelData.start, levelData.exit);
      if (!exitRoute) {
        return { ok: false, stage: 'route-exit', level, seed };
      }

      if (levelData.drones.length > 0) {
        const blocked = new Set(levelData.drones.slice(1).map(cellKey));
        const step = pickDroneStep(levelData, levelData.drones[0], levelData.start, blocked);
        if (!inBounds(step, levelData.size)) {
          return { ok: false, stage: 'drone-step', level, seed };
        }
      }
    }
  }

  return { ok: true, checkedLevels: 6, samplesPerLevel: rounds };
}

class NeonHeistGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = refs.canvas.getContext('2d');
    this.autotest = Boolean(options.autotest);
    this.fixedSeedBase = Number.isInteger(options.seedBase) ? options.seedBase >>> 0 : null;
    this.cellSize = this.canvas.width / BOARD_SIZE;
    this.logs = [];
    this.storageAvailable = this.canUseStorage();
    this.bestScore = this.storageAvailable ? Number(localStorage.getItem(STORAGE_SCORE_KEY) || 0) : 0;
    this.bestFloor = this.storageAvailable ? Number(localStorage.getItem(STORAGE_FLOOR_KEY) || 0) : 0;
    this.boundKeydown = (event) => this.onKeydown(event);
    this.boundPadClick = (event) => this.onPadClick(event);
    this.bindEvents();
    this.resetRun();
  }

  canUseStorage() {
    try {
      const key = '__neon_heist__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    this.refs.start.addEventListener('click', () => this.startRun());
    this.refs.reset.addEventListener('click', () => this.resetRun());
    this.refs.restart.addEventListener('click', () => this.resetRun());
    this.refs.decoy.addEventListener('click', () => this.deployDecoy());
    this.refs.wait.addEventListener('click', () => {
      if (!this.running) {
        this.startRun();
      }
      this.takeTurn(cloneCell(this.levelState.player), true);
    });
    this.refs.pad.addEventListener('click', this.boundPadClick);
  }

  persistRecords() {
    if (!this.storageAvailable) {
      return;
    }
    localStorage.setItem(STORAGE_SCORE_KEY, String(this.bestScore));
    localStorage.setItem(STORAGE_FLOOR_KEY, String(this.bestFloor));
  }

  syncRecords() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    this.persistRecords();
  }

  seedForLevel(level) {
    return (this.seedBase + level * 0x9e3779b9) >>> 0;
  }

  resetRun() {
    this.seedBase =
      this.fixedSeedBase ?? ((Date.now() ^ ((Math.random() * 0xffffffff) >>> 0)) >>> 0);
    this.running = false;
    this.gameOver = false;
    this.level = 1;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.logs = [];
    this.loadLevel(this.level, this.seedForLevel(this.level));
    this.setStatus(copy.boot);
    this.setObjective('EMP 会冻结巡逻两回合，诱饵会把巡逻拖回旧位置。');
    this.showOverlay(
      '按开始潜入或 Enter 开局',
      '方向键或 WASD 移动，空格原地等待一拍，Q 可部署诱饵。每个回合敌方巡逻也会同步推进。',
    );
    this.pushLog('夜幕已落下，潜入窗口重新打开。');
    this.updateHud();
    this.render();
  }

  loadLevel(level, seed) {
    this.levelData = generateLevel(level, seed);
    this.levelState = createLevelState(this.levelData);
    this.levelStartState = cloneState(this.levelState);
    this.updateHud();
  }

  startRun() {
    if (this.gameOver) {
      this.resetRun();
    }

    if (this.running) {
      return;
    }

    this.running = true;
    this.hideOverlay();
    this.setStatus(copy.live);
    this.pushLog(`第 ${this.level} 层潜入开始。`);
    this.render();
  }

  onPadClick(event) {
    const button = event.target.closest('[data-move]');
    if (!button) {
      return;
    }
    const move = button.dataset.move;
    if (move === 'wait') {
      if (!this.running) {
        this.startRun();
      }
      this.takeTurn(cloneCell(this.levelState.player), true);
      return;
    }
    this.handleMove(move);
  }

  onKeydown(event) {
    if (MOVE_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleMove(MOVE_KEYS.get(event.code));
      return;
    }

    if (WAIT_KEYS.has(event.code)) {
      event.preventDefault();
      if (!this.running) {
        this.startRun();
      }
      this.takeTurn(cloneCell(this.levelState.player), true);
      return;
    }

    if (DECOY_KEYS.has(event.code)) {
      event.preventDefault();
      this.deployDecoy();
      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      this.startRun();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.resetRun();
    }
  }

  handleMove(moveKey) {
    if (!this.running) {
      this.startRun();
    }

    if (!this.running) {
      return;
    }

    const direction = DIRECTIONS[moveKey];
    const next = {
      x: this.levelState.player.x + direction.x,
      y: this.levelState.player.y + direction.y,
    };

    if (!inBounds(next, this.levelData.size) || this.levelData.walls.has(cellKey(next))) {
      this.setStatus('那条路被封死了，换个角度。');
      this.showOverlay('路线阻塞', '这一步撞上了墙体。换条线，或者先等待巡逻错位。');
      this.render();
      return;
    }

    this.takeTurn(next, false);
  }

  deployDecoy() {
    if (!this.running) {
      this.startRun();
    }

    if (!this.running || this.gameOver) {
      return;
    }

    if (this.levelState.decoyCharges <= 0) {
      this.setStatus('你还没有拿到诱饵芯片。');
      this.showOverlay('缺少诱饵', '先去拾取蓝紫色芯片，再用 Q 或按钮部署诱饵。');
      this.render();
      return;
    }

    this.takeTurn(cloneCell(this.levelState.player), false, { deployDecoy: true });
  }

  takeTurn(target, waited, options = {}) {
    if (!this.running || this.gameOver) {
      return;
    }

    const deployDecoy = Boolean(options.deployDecoy);
    this.hideOverlay();
    this.levelState.turns += 1;
    this.levelState.player = cloneCell(target);

    if (deployDecoy) {
      this.levelState.decoyCharges -= 1;
      this.levelState.activeDecoy = {
        x: this.levelState.player.x,
        y: this.levelState.player.y,
        turns: 2,
      };
      this.pushLog('诱饵信标已丢下，巡逻会扑向旧位置。');
      this.setObjective('趁诱饵吸走巡逻的两回合，快速切到核心或出口。');
    }

    if (this.playerCaught()) {
      this.resolveHit('你直接撞上了一架巡逻无人机。');
      return;
    }

    if (waited) {
      this.pushLog('你贴着霓虹阴影停了一拍。');
    }

    this.resolvePickups();

    if (this.levelState.exitUnlocked && sameCell(this.levelState.player, this.levelData.exit)) {
      this.completeLevel();
      return;
    }

    if (this.levelState.freezeTurns > 0) {
      this.levelState.freezeTurns -= 1;
      this.tickActiveDecoy([]);
      this.setStatus(copy.frozen);
    } else {
      const nextPositions = this.advanceDrones();
      this.tickActiveDecoy(nextPositions);
      if (this.playerCaught()) {
        this.resolveHit('巡逻无人机在转角处完成锁定。');
        return;
      }
      this.setStatus(
        deployDecoy ? copy.decoy : this.levelState.exitUnlocked ? copy.exit : copy.live,
      );
    }

    this.syncRecords();
    this.updateHud();
    this.render();
  }

  resolvePickups() {
    const core = this.levelState.cores.find(
      (item) => item.active && sameCell(item, this.levelState.player),
    );
    if (core) {
      core.active = false;
      this.levelState.collected += 1;
      this.score += 120 + this.level * 20;
      this.pushLog(`拿到第 ${this.levelState.collected} 枚数据核心。`);
      if (this.levelState.collected === CORE_TARGET) {
        this.levelState.exitUnlocked = true;
        this.score += 80;
        this.setStatus(copy.exit);
        this.setObjective('出口已经解锁，立刻向右上方的撤离点移动。');
        this.pushLog('出口已解锁，撤离窗口开启。');
      } else {
        this.setObjective(`还差 ${CORE_TARGET - this.levelState.collected} 枚核心才能解锁出口。`);
      }
    }

    const emp = this.levelState.emps.find(
      (item) => item.active && sameCell(item, this.levelState.player),
    );
    if (emp) {
      emp.active = false;
      this.levelState.freezeTurns = Math.max(this.levelState.freezeTurns, 2);
      this.score += 45;
      this.pushLog('EMP 脉冲触发，巡逻停滞两回合。');
      this.setObjective('趁巡逻停滞时抢核心，或者直接切向出口。');
    }

    const decoy = this.levelState.decoys.find(
      (item) => item.active && sameCell(item, this.levelState.player),
    );
    if (decoy) {
      decoy.active = false;
      this.levelState.decoyCharges += 1;
      this.score += 55;
      this.pushLog('收下一枚诱饵芯片，可丢下信标误导巡逻。');
      this.setObjective('需要错位时按 Q 部署诱饵，让巡逻先扑向旧位置。');
    }
  }

  advanceDrones() {
    const target = this.getPursuitTarget();
    const nextPositions = [];
    this.levelState.drones.forEach((drone, index) => {
      const occupied = new Set(nextPositions.map(cellKey));
      for (let rest = index + 1; rest < this.levelState.drones.length; rest += 1) {
        const other = this.levelState.drones[rest];
        const otherKey = cellKey(other);
        if (otherKey !== cellKey(target)) {
          occupied.add(otherKey);
        }
      }
      const step = pickDroneStep(this.levelData, drone, target, occupied);
      nextPositions.push(step);
    });

    this.levelState.drones = nextPositions.map((cell, index) => ({
      id: index,
      x: cell.x,
      y: cell.y,
    }));

    return nextPositions;
  }

  getPursuitTarget() {
    if (this.levelState.activeDecoy && this.levelState.activeDecoy.turns > 0) {
      return this.levelState.activeDecoy;
    }

    return this.levelState.player;
  }

  tickActiveDecoy(drones) {
    if (!this.levelState.activeDecoy) {
      return;
    }

    if (drones.some((drone) => sameCell(drone, this.levelState.activeDecoy))) {
      this.levelState.activeDecoy = null;
      this.pushLog('巡逻扑中了诱饵，干扰信号瞬间熄灭。');
      return;
    }

    this.levelState.activeDecoy.turns -= 1;
    if (this.levelState.activeDecoy.turns <= 0) {
      this.levelState.activeDecoy = null;
      this.pushLog('诱饵信号已经耗尽。');
    }
  }

  playerCaught() {
    return this.levelState.drones.some((drone) => sameCell(drone, this.levelState.player));
  }

  resolveHit(message) {
    this.lives -= 1;
    this.pushLog(message);
    if (this.lives <= 0) {
      this.gameOver = true;
      this.running = false;
      this.bestFloor = Math.max(this.bestFloor, this.level - 1);
      this.syncRecords();
      this.persistRecords();
      this.setStatus(copy.gameOver);
      this.setObjective('按 Enter 或顶部按钮重新部署，再来一轮新的潜入。');
      this.showOverlay('警报拉满', '你已经没有可用身份。按 Enter 或按钮重新部署。');
    } else {
      this.levelState = cloneState(this.levelStartState);
      this.setStatus(copy.hit);
      this.setObjective('本层布局未变，利用已经记住的路线再试一次。');
      this.showOverlay('已被发现', `本层重置，剩余 ${this.lives} 条命。`);
      this.pushLog(`本层重置，剩余 ${this.lives} 条命。`);
    }

    this.updateHud();
    this.render();
  }

  completeLevel() {
    const bonus = Math.max(140, 340 - this.levelState.turns * 8) + this.level * 60 + this.lives * 20;
    this.score += bonus;
    this.bestFloor = Math.max(this.bestFloor, this.level);
    this.syncRecords();
    this.pushLog(`第 ${this.level} 层完成，拿到 ${bonus} 分撤离奖励。`);
    this.level += 1;
    this.loadLevel(this.level, this.seedForLevel(this.level));
    this.running = true;
    this.setStatus(`已潜入第 ${this.level} 层。${copy.live}`);
    this.setObjective('新的一层已经刷新，核心和 EMP 位置都变了。');
    this.showOverlay(`第 ${this.level} 层`, '巡逻密度提高了，建议先观察两步路线再抢核心。');
    this.updateHud();
    this.render();
  }

  setStatus(message) {
    this.refs.status.textContent = message;
  }

  setObjective(message) {
    this.refs.objective.textContent = message;
  }

  showOverlay(title, body) {
    this.refs.overlayTitle.textContent = title;
    this.refs.overlayBody.textContent = body;
    this.refs.overlay.classList.add('is-visible');
  }

  hideOverlay() {
    this.refs.overlay.classList.remove('is-visible');
  }

  pushLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 6);
    this.refs.feed.innerHTML = this.logs.map((item) => `<li>${item}</li>`).join('');
  }

  updateHud() {
    this.refs.floor.textContent = String(this.level);
    this.refs.score.textContent = String(this.score);
    this.refs.lives.textContent = String(this.lives);
    this.refs.cores.textContent = `${this.levelState.collected} / ${CORE_TARGET}`;
    this.refs.pulse.textContent =
      this.levelState.freezeTurns > 0 ? `${this.levelState.freezeTurns} 回合` : '就绪';
    this.refs.decoys.textContent = this.levelState.activeDecoy
      ? `${this.levelState.decoyCharges} 库存 · ${this.levelState.activeDecoy.turns} 回合`
      : `${this.levelState.decoyCharges} 库存`;
    this.refs.best.textContent = String(this.bestScore);
    this.refs.turns.textContent = String(this.levelState.turns);
    this.refs.alert.textContent =
      this.levelState.freezeTurns > 0 ? '静滞中' : `${this.levelState.drones.length} 架`;
    this.refs.bestFloor.textContent = String(this.bestFloor);
  }

  drawCell(x, y, fillStyle) {
    const size = this.cellSize;
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
  }

  drawBoard() {
    const { ctx } = this;
    const size = this.canvas.width;
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#061117');
    gradient.addColorStop(1, '#0c1e25');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < this.levelData.size; y += 1) {
      for (let x = 0; x < this.levelData.size; x += 1) {
        const fill = (x + y) % 2 === 0 ? '#09171d' : '#0b1b22';
        this.drawCell(x, y, fill);
      }
    }

    for (let index = 0; index <= this.levelData.size; index += 1) {
      const offset = index * this.cellSize;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(this.canvas.width, offset);
      ctx.stroke();
    }
  }

  drawWalls() {
    const { ctx } = this;
    for (const wallKey of this.levelData.walls) {
      const [x, y] = wallKey.split(',').map(Number);
      const baseX = x * this.cellSize;
      const baseY = y * this.cellSize;
      ctx.fillStyle = '#13232b';
      ctx.fillRect(baseX + 6, baseY + 6, this.cellSize - 12, this.cellSize - 12);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(baseX + 7, baseY + 7, this.cellSize - 14, this.cellSize - 14);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.beginPath();
      ctx.moveTo(baseX + 12, baseY + this.cellSize - 14);
      ctx.lineTo(baseX + this.cellSize - 12, baseY + 14);
      ctx.stroke();
    }
  }

  drawExit() {
    const { ctx } = this;
    const exit = this.levelData.exit;
    const baseX = exit.x * this.cellSize;
    const baseY = exit.y * this.cellSize;
    const unlocked = this.levelState.exitUnlocked;
    ctx.fillStyle = unlocked ? 'rgba(94, 234, 212, 0.16)' : 'rgba(251, 113, 133, 0.12)';
    ctx.fillRect(baseX + 6, baseY + 6, this.cellSize - 12, this.cellSize - 12);
    ctx.strokeStyle = unlocked ? '#5eead4' : 'rgba(251, 113, 133, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(baseX + 10, baseY + 10, this.cellSize - 20, this.cellSize - 20);
    ctx.font = '700 16px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.fillStyle = unlocked ? '#d1fae5' : '#fca5a5';
    ctx.fillText('EXIT', baseX + this.cellSize / 2, baseY + this.cellSize / 2 + 6);
  }

  drawCores() {
    const { ctx } = this;
    this.levelState.cores.forEach((core) => {
      if (!core.active) {
        return;
      }
      const cx = core.x * this.cellSize + this.cellSize / 2;
      const cy = core.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-14, -14, 28, 28);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    });
  }

  drawEmps() {
    const { ctx } = this;
    this.levelState.emps.forEach((emp) => {
      if (!emp.active) {
        return;
      }
      const cx = emp.x * this.cellSize + this.cellSize / 2;
      const cy = emp.y * this.cellSize + this.cellSize / 2;
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    });
  }

  drawDecoyPickups() {
    const { ctx } = this;
    this.levelState.decoys.forEach((decoy) => {
      if (!decoy.active) {
        return;
      }
      const cx = decoy.x * this.cellSize + this.cellSize / 2;
      const cy = decoy.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-15, -15, 30, 30);
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = 'rgba(243, 232, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-19, -19, 38, 38);
      ctx.restore();
    });
  }

  drawActiveDecoy() {
    if (!this.levelState.activeDecoy) {
      return;
    }

    const { ctx } = this;
    const { activeDecoy } = this.levelState;
    const cx = activeDecoy.x * this.cellSize + this.cellSize / 2;
    const cy = activeDecoy.y * this.cellSize + this.cellSize / 2;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.82)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f5d0fe';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDrones() {
    const { ctx } = this;
    this.levelState.drones.forEach((drone) => {
      const cx = drone.x * this.cellSize + this.cellSize / 2;
      const cy = drone.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(-16, -16, 32, 32);
      ctx.restore();
      ctx.fillStyle = '#3b0b15';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawPlayer() {
    const { ctx } = this;
    const { player } = this.levelState;
    const cx = player.x * this.cellSize + this.cellSize / 2;
    const cy = player.y * this.cellSize + this.cellSize / 2;
    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx + 18, cy + 14);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 18, cy + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#042f2e';
    ctx.fillRect(cx - 7, cy + 12, 14, 12);
  }

  drawFrame() {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.24)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, this.canvas.width - 8, this.canvas.height - 8);
  }

  renderGameToText() {
    const payload = {
      mode: this.gameOver ? 'game_over' : this.running ? 'active' : 'ready',
      board: {
        size: this.levelData.size,
        coordinates: 'origin=(0,0) top-left; x increases right; y increases down',
      },
      level: this.level,
      score: this.score,
      lives: this.lives,
      turn: this.levelState.turns,
      collected: this.levelState.collected,
      freezeTurns: this.levelState.freezeTurns,
      decoyCharges: this.levelState.decoyCharges,
      player: cloneCell(this.levelState.player),
      exit: {
        x: this.levelData.exit.x,
        y: this.levelData.exit.y,
        unlocked: this.levelState.exitUnlocked,
      },
      activeDecoy: cloneTimedMarker(this.levelState.activeDecoy),
      drones: this.levelState.drones.map((drone) => ({ x: drone.x, y: drone.y })),
      walls: [...this.levelData.walls].sort(),
      cores: this.levelState.cores
        .filter((item) => item.active)
        .map((item) => ({ x: item.x, y: item.y })),
      emps: this.levelState.emps
        .filter((item) => item.active)
        .map((item) => ({ x: item.x, y: item.y })),
      decoyPickups: this.levelState.decoys
        .filter((item) => item.active)
        .map((item) => ({ x: item.x, y: item.y })),
      status: this.refs.status.textContent,
      objective: this.refs.objective.textContent,
      overlay: this.refs.overlay.classList.contains('is-visible')
        ? {
            title: this.refs.overlayTitle.textContent,
            body: this.refs.overlayBody.textContent,
          }
        : null,
    };

    return JSON.stringify(payload);
  }

  render() {
    this.drawBoard();
    this.drawExit();
    this.drawWalls();
    this.drawEmps();
    this.drawDecoyPickups();
    this.drawCores();
    this.drawActiveDecoy();
    this.drawDrones();
    this.drawPlayer();
    this.drawFrame();

    if (this.autotest) {
      this.refs.autotest.textContent = this.renderGameToText();
    }
  }
}

function getRefs() {
  return {
    canvas: document.querySelector('#heist-canvas'),
    overlay: document.querySelector('#heist-overlay'),
    overlayTitle: document.querySelector('#heist-overlay-title'),
    overlayBody: document.querySelector('#heist-overlay-body'),
    status: document.querySelector('#heist-status'),
    objective: document.querySelector('#heist-objective'),
    feed: document.querySelector('#heist-feed'),
    floor: document.querySelector('#heist-floor'),
    score: document.querySelector('#heist-score'),
    lives: document.querySelector('#heist-lives'),
    cores: document.querySelector('#heist-cores'),
    pulse: document.querySelector('#heist-pulse'),
    decoys: document.querySelector('#heist-decoys'),
    best: document.querySelector('#heist-best'),
    turns: document.querySelector('#heist-turns'),
    alert: document.querySelector('#heist-alert'),
    bestFloor: document.querySelector('#heist-best-floor'),
    start: document.querySelector('#heist-start'),
    reset: document.querySelector('#heist-reset'),
    wait: document.querySelector('#heist-wait'),
    decoy: document.querySelector('#heist-decoy'),
    restart: document.querySelector('#heist-restart'),
    pad: document.querySelector('.heist-pad'),
    autotest: document.querySelector('#heist-autotest'),
  };
}

const NeonHeistInternals = {
  BOARD_SIZE,
  CORE_TARGET,
  generateLevel,
  validateLevel,
  findRoute,
  pickDroneStep,
  runSelfCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NeonHeistInternals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const refs = getRefs();
    if (!refs.canvas) {
      return;
    }
    const game = new NeonHeistGame(refs, { autotest: AUTOTEST, seedBase: FIXED_SEED });
    if (AUTOTEST) {
      window.neonHeistSelfCheck = runSelfCheck(4);
      refs.autotest.textContent = game.renderGameToText();
    }
    window.render_game_to_text = () => game.renderGameToText();
    window.advanceTime = async () => game.renderGameToText();
    window.neonHeistGame = game;
  });
}
