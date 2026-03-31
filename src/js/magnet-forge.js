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

const BOARD_SIZE = 9;
const REACTOR_TARGET = 3;
const MAX_HULL = 3;
const PULSE_COOLDOWN = 2;
const STORAGE_SCORE_KEY = 'demoCodexMagnetForgeBestScore';
const STORAGE_FLOOR_KEY = 'demoCodexMagnetForgeBestFloor';

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
const PULSE_KEYS = new Set(['KeyQ']);

const STEP_DELTAS = [
  { name: 'up', x: 0, y: -1 },
  { name: 'left', x: -1, y: 0 },
  { name: 'right', x: 1, y: 0 },
  { name: 'down', x: 0, y: 1 },
];

const copy = {
  boot: '把 3 枚磁芯电池送进反应座，再冲向升降梯。',
  live: '巡检火花正在巡场，善用推箱和磁脉冲留出走位。',
  unlocked: '升降梯已经通电，立刻撤离。',
  pulse: '磁脉冲展开，远处电池被拽了回来。',
  powered: '反应座通电一格，工坊亮起来了。',
  crush: '磁芯电池撞碎了一只巡检火花。',
  hit: '被巡检火花撞到，已扣除 1 格护盾。',
  floorClear: '本层工坊恢复供电，升降梯继续下探。',
  gameOver: '护盾耗尽，工坊停摆。按 Enter 或按钮重新启动。',
};

const FLOOR_TEMPLATES = [
  {
    rows: [
      '.........',
      '.#..g..#.',
      '.b..#..e.',
      '...#.....',
      '.g..S..g.',
      '.....#...',
      '.e..#..b.',
      '.#..b..X.',
      '.........',
    ],
  },
  {
    rows: [
      '.........',
      '.g...#..X',
      '.#b..e#..',
      '...#.....',
      '.e..S..g.',
      '.....#...',
      '..#..b#..',
      '.g..#..b.',
      '.........',
    ],
  },
  {
    rows: [
      '.........',
      '.#..g..#.',
      '.e..#..b.',
      '...#..e..',
      '.g.S...g.',
      '..b.#....',
      '.#..b.#..',
      '....#..X.',
      '.........',
    ],
  },
  {
    rows: [
      '.........',
      '.g..#..X.',
      '..b...e..',
      '.#..#....',
      '.g..S..g.',
      '....#..#.',
      '..e...b..',
      '.#..b....',
      '.........',
    ],
  },
];

const BONUS_ENEMY_CELLS = [
  { x: 1, y: 1 },
  { x: 7, y: 2 },
  { x: 2, y: 7 },
  { x: 6, y: 6 },
];

const BONUS_WALL_CELLS = [
  { x: 2, y: 3 },
  { x: 6, y: 3 },
  { x: 2, y: 5 },
  { x: 6, y: 5 },
];

function assertTemplateRows() {
  FLOOR_TEMPLATES.forEach((template, templateIndex) => {
    if (template.rows.length !== BOARD_SIZE) {
      throw new Error(
        `Template ${templateIndex} row count mismatch: expected ${BOARD_SIZE}, got ${template.rows.length}`,
      );
    }

    template.rows.forEach((row, rowIndex) => {
      if (row.length !== BOARD_SIZE) {
        throw new Error(
          `Template ${templateIndex} row ${rowIndex} width mismatch: expected ${BOARD_SIZE}, got ${row.length}`,
        );
      }
    });
  });
}

assertTemplateRows();

function createSeedBase() {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function inBounds(cell) {
  return cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE;
}

function cellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function cloneCell(cell) {
  return { x: cell.x, y: cell.y };
}

function cloneActors(items) {
  return items.map((item) => ({ ...item }));
}

function cloneState(state) {
  return {
    ...state,
    player: cloneCell(state.player),
    blocks: cloneActors(state.blocks),
    enemies: cloneActors(state.enemies),
    lastPulse: state.lastPulse.map((item) => ({ ...item })),
  };
}

function isReactor(layout, cell) {
  return layout.reactorKeys.has(cellKey(cell));
}

function getReactorCount(state) {
  return state.blocks.filter((block) => block.locked).length;
}

function findBlockIndex(state, cell, predicate = () => true) {
  return state.blocks.findIndex((block) => sameCell(block, cell) && predicate(block));
}

function findEnemyIndex(state, cell) {
  return state.enemies.findIndex((enemy) => sameCell(enemy, cell));
}

function hasWall(layout, cell) {
  return layout.walls.has(cellKey(cell));
}

function hasAnyBlock(state, cell) {
  return findBlockIndex(state, cell) !== -1;
}

function hasLooseBlock(state, cell) {
  return findBlockIndex(state, cell, (block) => !block.locked) !== -1;
}

function isOpenForPlayer(layout, state, cell) {
  return (
    inBounds(cell) &&
    !hasWall(layout, cell) &&
    findEnemyIndex(state, cell) === -1 &&
    !hasAnyBlock(state, cell)
  );
}

function canBlockEnter(layout, state, cell, movingBlockId) {
  if (!inBounds(cell) || hasWall(layout, cell) || sameCell(cell, layout.exit)) {
    return false;
  }

  return !state.blocks.some((block) => block.id !== movingBlockId && sameCell(block, cell));
}

function removeEnemyAt(state, cell) {
  const enemyIndex = findEnemyIndex(state, cell);
  if (enemyIndex === -1) {
    return false;
  }

  state.enemies.splice(enemyIndex, 1);
  return true;
}

function movePlayer(player, action) {
  const delta = STEP_DELTAS.find((item) => item.name === action);
  if (!delta) {
    return null;
  }
  return {
    x: player.x + delta.x,
    y: player.y + delta.y,
  };
}

function createFloorLayout(floor, seed) {
  const template = FLOOR_TEMPLATES[(floor - 1) % FLOOR_TEMPLATES.length];
  const walls = new Set();
  const reactors = [];
  const initialBlocks = [];
  const enemySpawns = [];
  let start = null;
  let exit = null;
  let nextBlockId = 0;
  let nextEnemyId = 0;

  template.rows.forEach((row, y) => {
    row.split('').forEach((token, x) => {
      const point = { x, y };
      switch (token) {
        case '#':
          walls.add(cellKey(point));
          break;
        case 'g':
          reactors.push({ id: reactors.length, x, y });
          break;
        case 'b':
          initialBlocks.push({ id: nextBlockId, x, y, locked: false });
          nextBlockId += 1;
          break;
        case 'e':
          enemySpawns.push({ id: nextEnemyId, x, y });
          nextEnemyId += 1;
          break;
        case 'S':
          start = point;
          break;
        case 'X':
          exit = point;
          break;
        default:
          break;
      }
    });
  });

  const occupied = new Set([
    ...walls,
    cellKey(start),
    cellKey(exit),
    ...reactors.map(cellKey),
    ...initialBlocks.map(cellKey),
    ...enemySpawns.map(cellKey),
  ]);

  const extraEnemyCount = Math.min(2, Math.max(0, floor - 2));
  for (let index = 0; index < extraEnemyCount; index += 1) {
    const candidate = BONUS_ENEMY_CELLS[(index + floor + (seed % BONUS_ENEMY_CELLS.length)) % BONUS_ENEMY_CELLS.length];
    const key = cellKey(candidate);
    if (!occupied.has(key)) {
      occupied.add(key);
      enemySpawns.push({ id: nextEnemyId, x: candidate.x, y: candidate.y });
      nextEnemyId += 1;
    }
  }

  const extraWallCount = Math.min(2, Math.max(0, floor - 3));
  for (let index = 0; index < extraWallCount; index += 1) {
    const candidate = BONUS_WALL_CELLS[(index + floor + (seed % BONUS_WALL_CELLS.length)) % BONUS_WALL_CELLS.length];
    const key = cellKey(candidate);
    if (!occupied.has(key)) {
      occupied.add(key);
      walls.add(key);
    }
  }

  return {
    floor,
    seed,
    walls,
    reactors,
    reactorKeys: new Set(reactors.map(cellKey)),
    start,
    exit,
    initialBlocks,
    enemySpawns,
  };
}

function validateLayout(layout) {
  if (!layout.start || !layout.exit || layout.reactors.length !== REACTOR_TARGET) {
    return false;
  }

  if (layout.initialBlocks.length < REACTOR_TARGET) {
    return false;
  }

  const seen = new Set([cellKey(layout.start), cellKey(layout.exit)]);
  const actors = [...layout.reactors, ...layout.initialBlocks, ...layout.enemySpawns];
  for (const actor of actors) {
    const key = cellKey(actor);
    if (seen.has(key) || layout.walls.has(key)) {
      return false;
    }
    seen.add(key);
  }

  return true;
}

function createRunState(layout, hull = MAX_HULL, score = 0) {
  return {
    mode: 'idle',
    floor: layout.floor,
    hull,
    score,
    player: cloneCell(layout.start),
    blocks: layout.initialBlocks.map((block) => ({ ...block })),
    enemies: layout.enemySpawns.map((enemy) => ({ ...enemy })),
    powered: 0,
    pulseCooldown: 0,
    turns: 0,
    exitUnlocked: false,
    lastPulse: [],
  };
}

function syncReactors(layout, state, outcome) {
  state.blocks.forEach((block) => {
    if (!block.locked && isReactor(layout, block)) {
      block.locked = true;
      state.score += 90;
      outcome.powered += 1;
    }
  });

  state.powered = getReactorCount(state);
  state.exitUnlocked = state.powered >= REACTOR_TARGET;
}

function tryMoveBlock(layout, state, blockIndex, destination, outcome) {
  const block = state.blocks[blockIndex];
  if (!canBlockEnter(layout, state, destination, block.id)) {
    return false;
  }

  const crushed = removeEnemyAt(state, destination);
  block.x = destination.x;
  block.y = destination.y;
  if (crushed) {
    outcome.crushed += 1;
    state.score += 60;
  }
  return true;
}

function applyPulse(layout, state, outcome) {
  const movedTargets = [];

  for (const direction of STEP_DELTAS) {
    let cursor = {
      x: state.player.x + direction.x,
      y: state.player.y + direction.y,
    };
    let candidateIndex = -1;

    while (inBounds(cursor) && !hasWall(layout, cursor)) {
      const index = findBlockIndex(state, cursor, (block) => !block.locked);
      if (index !== -1) {
        candidateIndex = index;
        break;
      }

      if (hasAnyBlock(state, cursor)) {
        break;
      }

      cursor = {
        x: cursor.x + direction.x,
        y: cursor.y + direction.y,
      };
    }

    if (candidateIndex === -1) {
      continue;
    }

    const block = state.blocks[candidateIndex];
    const destination = {
      x: block.x - direction.x,
      y: block.y - direction.y,
    };

    if (sameCell(destination, state.player)) {
      continue;
    }

    if (tryMoveBlock(layout, state, candidateIndex, destination, outcome)) {
      movedTargets.push({ x: destination.x, y: destination.y });
    }
  }

  state.lastPulse = movedTargets;
  return movedTargets.length;
}

function pickEnemyStep(layout, state, enemy, target, occupiedKeys) {
  const currentDistance = Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y);
  let best = { x: enemy.x, y: enemy.y };
  let bestDistance = currentDistance;

  for (const delta of STEP_DELTAS) {
    const candidate = {
      x: enemy.x + delta.x,
      y: enemy.y + delta.y,
    };
    const key = cellKey(candidate);

    if (
      !inBounds(candidate) ||
      hasWall(layout, candidate) ||
      hasAnyBlock(state, candidate) ||
      occupiedKeys.has(key)
    ) {
      continue;
    }

    const distance = Math.abs(candidate.x - target.x) + Math.abs(candidate.y - target.y);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

function advanceEnemies(layout, state) {
  const nextPositions = [];

  state.enemies.forEach((enemy, index) => {
    const occupiedKeys = new Set(nextPositions.map(cellKey));
    for (let rest = index + 1; rest < state.enemies.length; rest += 1) {
      occupiedKeys.add(cellKey(state.enemies[rest]));
    }
    nextPositions.push(pickEnemyStep(layout, state, enemy, state.player, occupiedKeys));
  });

  state.enemies = nextPositions.map((enemy, index) => ({ id: index, x: enemy.x, y: enemy.y }));
}

function applyHit(layout, state, outcome) {
  state.hull -= 1;
  state.score = Math.max(0, state.score - 45);
  state.lastPulse = [];
  state.pulseCooldown = 0;
  outcome.hit = true;

  if (state.hull <= 0) {
    state.mode = 'gameover';
    outcome.gameOver = true;
    return;
  }

  state.player = cloneCell(layout.start);
}

function applyAction(layout, currentState, action) {
  const state = cloneState(currentState);
  const outcome = {
    state,
    action,
    changed: false,
    invalid: false,
    powered: 0,
    crushed: 0,
    extracted: false,
    hit: false,
    gameOver: false,
    message: '',
  };

  if (state.mode !== 'active') {
    outcome.invalid = true;
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.boot;
    return outcome;
  }

  state.lastPulse = [];

  if (action === 'pulse') {
    if (state.pulseCooldown > 0) {
      outcome.invalid = true;
      outcome.message = `磁脉冲还需冷却 ${state.pulseCooldown} 回合。`;
      return outcome;
    }

    const movedCount = applyPulse(layout, state, outcome);
    if (movedCount === 0) {
      outcome.invalid = true;
      outcome.message = '当前没有能被磁脉冲牵引的磁芯电池。';
      return outcome;
    }

    state.pulseCooldown = PULSE_COOLDOWN;
  } else if (action !== 'wait') {
    const delta = STEP_DELTAS.find((item) => item.name === action);
    const destination = movePlayer(state.player, action);
    if (!delta || !destination || !inBounds(destination) || hasWall(layout, destination)) {
      outcome.invalid = true;
      outcome.message = '前方被钢梁挡住了。';
      return outcome;
    }

    const blockIndex = findBlockIndex(state, destination);
    if (blockIndex !== -1) {
      if (state.blocks[blockIndex].locked) {
        outcome.invalid = true;
        outcome.message = '这枚磁芯已经锁进反应座，推不动了。';
        return outcome;
      }

      const pushedTo = {
        x: destination.x + delta.x,
        y: destination.y + delta.y,
      };
      if (!tryMoveBlock(layout, state, blockIndex, pushedTo, outcome)) {
        outcome.invalid = true;
        outcome.message = '磁芯前方没有空位，推不进去。';
        return outcome;
      }
    } else if (findEnemyIndex(state, destination) !== -1) {
      outcome.invalid = true;
      outcome.message = '巡检火花堵在前面，先用磁芯或绕路处理它。';
      return outcome;
    }

    state.player = destination;
  }

  state.turns += 1;
  outcome.changed = true;

  syncReactors(layout, state, outcome);
  if (state.exitUnlocked && sameCell(state.player, layout.exit)) {
    state.score += 240 + state.floor * 40;
    outcome.extracted = true;
    outcome.message = copy.floorClear;
    return outcome;
  }

  advanceEnemies(layout, state);
  if (state.enemies.some((enemy) => sameCell(enemy, state.player))) {
    applyHit(layout, state, outcome);
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  if (action !== 'pulse' && state.pulseCooldown > 0) {
    state.pulseCooldown -= 1;
  }

  if (state.exitUnlocked) {
    outcome.message = copy.unlocked;
  } else if (outcome.powered > 0) {
    outcome.message = copy.powered;
  } else if (outcome.crushed > 0) {
    outcome.message = copy.crush;
  } else if (action === 'pulse') {
    outcome.message = copy.pulse;
  } else {
    outcome.message = copy.live;
  }

  return outcome;
}

function runSelfCheck(rounds = 6) {
  const layouts = [];

  for (let floor = 1; floor <= rounds; floor += 1) {
    const layout = createFloorLayout(floor, (4242 + floor * 97) >>> 0);
    if (!validateLayout(layout)) {
      return { ok: false, reason: 'invalid-layout', floor };
    }

    const state = createRunState(layout);
    state.mode = 'active';
    const step = applyAction(layout, state, 'wait');
    if (!step.changed || step.invalid || step.state.turns !== 1) {
      return { ok: false, reason: 'wait-step-failed', floor };
    }

    layouts.push({
      floor,
      blocks: step.state.blocks.length,
      enemies: step.state.enemies.length,
    });
  }

  const pulseLayout = createFloorLayout(1, 4242);
  const pulseState = createRunState(pulseLayout);
  pulseState.mode = 'active';
  pulseLayout.walls = new Set();
  pulseLayout.reactors = [];
  pulseLayout.reactorKeys = new Set();
  pulseLayout.start = { x: 4, y: 4 };
  pulseLayout.exit = { x: 8, y: 8 };
  pulseState.player = { x: 4, y: 4 };
  pulseState.blocks = [{ id: 0, x: 7, y: 4, locked: false }];
  pulseState.enemies = [{ id: 0, x: 6, y: 4 }];
  const pulsed = applyAction(pulseLayout, pulseState, 'pulse');
  if (
    pulsed.invalid ||
    pulsed.state.blocks[0].x !== 6 ||
    pulsed.state.blocks[0].y !== 4 ||
    pulsed.state.enemies.length !== 0 ||
    pulsed.state.pulseCooldown !== 2
  ) {
    return { ok: false, reason: 'pulse-check-failed', details: pulsed };
  }

  const reactorLayout = createFloorLayout(1, 4242);
  const reactorState = createRunState(reactorLayout);
  reactorState.mode = 'active';
  reactorLayout.walls = new Set();
  reactorLayout.reactors = [{ id: 0, x: 3, y: 4 }];
  reactorLayout.reactorKeys = new Set(['3:4']);
  reactorLayout.start = { x: 0, y: 0 };
  reactorLayout.exit = { x: 8, y: 8 };
  reactorState.player = { x: 1, y: 4 };
  reactorState.blocks = [{ id: 0, x: 2, y: 4, locked: false }];
  reactorState.enemies = [];
  const powered = applyAction(reactorLayout, reactorState, 'right');
  if (
    powered.invalid ||
    !powered.state.blocks[0].locked ||
    powered.state.powered !== 1 ||
    powered.state.score !== 90
  ) {
    return { ok: false, reason: 'reactor-check-failed', details: powered };
  }

  const exitLayout = createFloorLayout(1, 5001);
  const exitState = createRunState(exitLayout, 2, 180);
  exitState.mode = 'active';
  exitLayout.walls = new Set();
  exitLayout.reactors = [
    { id: 0, x: 1, y: 1 },
    { id: 1, x: 2, y: 1 },
    { id: 2, x: 3, y: 1 },
  ];
  exitLayout.reactorKeys = new Set(['1:1', '2:1', '3:1']);
  exitLayout.start = { x: 0, y: 0 };
  exitLayout.exit = { x: 8, y: 7 };
  exitState.player = { x: 7, y: 7 };
  exitState.blocks = [
    { id: 0, x: 1, y: 1, locked: true },
    { id: 1, x: 2, y: 1, locked: true },
    { id: 2, x: 3, y: 1, locked: true },
  ];
  exitState.enemies = [];
  exitState.powered = 3;
  exitState.exitUnlocked = true;
  const extracted = applyAction(exitLayout, exitState, 'right');
  if (!extracted.extracted || extracted.state.score !== 460 || extracted.state.floor !== 1) {
    return { ok: false, reason: 'extract-check-failed', details: extracted };
  }

  const hitLayout = createFloorLayout(1, 7007);
  const hitState = createRunState(hitLayout, 3, 120);
  hitState.mode = 'active';
  hitLayout.walls = new Set();
  hitLayout.reactors = [];
  hitLayout.reactorKeys = new Set();
  hitLayout.start = { x: 0, y: 0 };
  hitLayout.exit = { x: 8, y: 8 };
  hitState.player = { x: 4, y: 4 };
  hitState.blocks = [];
  hitState.enemies = [{ id: 0, x: 4, y: 3 }];
  const hit = applyAction(hitLayout, hitState, 'wait');
  if (!hit.hit || hit.state.hull !== 2 || hit.state.player.x !== 0 || hit.state.player.y !== 0) {
    return { ok: false, reason: 'hit-check-failed', details: hit };
  }

  return {
    ok: true,
    layouts,
    pulse: {
      block: pulsed.state.blocks[0],
      enemies: pulsed.state.enemies.length,
      cooldown: pulsed.state.pulseCooldown,
    },
    powered: {
      locked: powered.state.blocks[0].locked,
      count: powered.state.powered,
      score: powered.state.score,
    },
    extractionScore: extracted.state.score,
    hit: {
      hull: hit.state.hull,
      player: hit.state.player,
    },
  };
}

class MagnetForgeGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.boardInset = 54;
    this.cellSize = (this.width - this.boardInset * 2) / BOARD_SIZE;
    this.autotest = Boolean(options.autotest);
    this.seedBase = options.seedBase ?? createSeedBase();
    this.storageAvailable = this.canUseStorage();
    this.bestScore = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_SCORE_KEY) || 0)
      : 0;
    this.bestFloor = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_FLOOR_KEY) || 0)
      : 0;
    this.logs = [];
    this.layout = null;
    this.state = null;
    this.boundKeydown = (event) => this.onKeydown(event);
    this.boundPadClick = (event) => this.onPadClick(event);
    this.bindEvents();
    this.resetRun();
  }

  canUseStorage() {
    try {
      const key = '__magnet_forge__';
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
    this.refs.wait.addEventListener('click', () => this.handleAction('wait'));
    this.refs.pulse.addEventListener('click', () => this.handleAction('pulse'));
    this.refs.restart.addEventListener('click', () => this.resetRun());
    this.refs.pad.addEventListener('click', this.boundPadClick);
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    this.refs.pad.removeEventListener('click', this.boundPadClick);
  }

  seedForFloor(floor) {
    return (this.seedBase + floor * 2654435761) >>> 0;
  }

  pushLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 6);
    this.refs.feed.innerHTML = this.logs.map((item) => `<li>${item}</li>`).join('');
  }

  setStatus(message) {
    this.refs.status.textContent = message;
  }

  setObjective() {
    if (this.state.mode === 'gameover') {
      this.refs.objective.textContent = '护盾耗尽。按 Enter 或“重新装配”立即重开。';
      return;
    }

    if (this.state.exitUnlocked) {
      this.refs.objective.textContent = '三座反应座都已通电，直奔升降梯撤离。';
      return;
    }

    if (this.state.pulseCooldown === 0) {
      this.refs.objective.textContent = '磁脉冲已就绪，可把同排或同列的磁芯拖近一格。';
      return;
    }

    this.refs.objective.textContent = `磁脉冲还需冷却 ${this.state.pulseCooldown} 回合，先靠推箱顶住巡检火花。`;
  }

  setOverlay(title, body) {
    this.refs.overlayTitle.textContent = title;
    this.refs.overlayBody.textContent = body;
    this.refs.overlay.classList.toggle('is-visible', Boolean(title));
  }

  clearOverlay() {
    this.refs.overlay.classList.remove('is-visible');
  }

  saveRecord(key, value) {
    if (!this.storageAvailable) {
      return;
    }
    localStorage.setItem(key, String(value));
  }

  commitBestScore() {
    if (this.state.score > this.bestScore) {
      this.bestScore = this.state.score;
      this.saveRecord(STORAGE_SCORE_KEY, this.bestScore);
    }
  }

  commitBestFloor(floor) {
    if (floor > this.bestFloor) {
      this.bestFloor = floor;
      this.saveRecord(STORAGE_FLOOR_KEY, this.bestFloor);
    }
  }

  loadFloor(floor, options = {}) {
    const layout = createFloorLayout(floor, this.seedForFloor(floor));
    const state = createRunState(layout, options.hull ?? MAX_HULL, options.score ?? 0);
    state.mode = options.mode ?? 'idle';
    this.layout = layout;
    this.state = state;
    this.setStatus(this.state.mode === 'active' ? copy.live : copy.boot);
    this.setObjective();
    this.updateHud();
    this.render();
  }

  resetRun() {
    this.logs = [];
    this.loadFloor(1, { hull: MAX_HULL, score: 0, mode: 'idle' });
    this.pushLog('工坊主机回到第 1 层待机状态。');
    this.setStatus(copy.boot);
    this.setObjective();
    this.setOverlay(
      '按开始或 Enter 启动工坊',
      '方向键推动磁芯，空格等待一拍，Q 释放磁脉冲，把远处的磁芯拖近一格。',
    );
    this.render();
  }

  startRun() {
    if (this.state.mode === 'active') {
      return;
    }

    if (this.state.mode === 'gameover') {
      this.resetRun();
    }

    this.state.mode = 'active';
    this.setStatus(copy.live);
    this.setObjective();
    this.clearOverlay();
    this.pushLog(`第 ${this.state.floor} 层工坊通电。`);
    this.updateHud();
    this.render();
  }

  onKeydown(event) {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      if (this.state.mode === 'active') {
        return;
      }
      this.startRun();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.resetRun();
      return;
    }

    if (this.state.mode !== 'active') {
      return;
    }

    if (MOVE_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction(MOVE_KEYS.get(event.code));
      return;
    }

    if (WAIT_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('wait');
      return;
    }

    if (PULSE_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('pulse');
    }
  }

  onPadClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || this.state.mode !== 'active') {
      return;
    }

    this.handleAction(button.dataset.action);
  }

  handleAction(action) {
    const outcome = applyAction(this.layout, this.state, action);
    if (outcome.invalid) {
      this.setStatus(outcome.message);
      this.pushLog(outcome.message);
      this.setObjective();
      this.updateHud();
      this.render();
      return;
    }

    this.state = outcome.state;
    this.commitBestScore();

    if (outcome.hit && this.state.mode === 'gameover') {
      this.setOverlay('工坊停摆', copy.gameOver);
    } else if (outcome.hit) {
      this.setOverlay('护盾受损', '你被撞回起始工位，已清空磁脉冲冷却。');
    } else {
      this.clearOverlay();
    }

    if (outcome.extracted) {
      const clearedFloor = this.state.floor;
      const carriedHull = this.state.hull;
      const carriedScore = this.state.score;
      this.commitBestFloor(clearedFloor);
      this.pushLog(`第 ${clearedFloor} 层恢复供电，升降梯继续下探。`);
      this.loadFloor(clearedFloor + 1, {
        hull: carriedHull,
        score: carriedScore,
        mode: 'active',
      });
      this.setStatus(copy.floorClear);
      this.setObjective();
      this.pushLog(`第 ${this.state.floor} 层工坊通电。`);
      this.clearOverlay();
      this.updateHud();
      this.render();
      return;
    }

    if (outcome.powered > 0) {
      this.pushLog(`反应座通电 +${outcome.powered}，当前 ${this.state.powered} / ${REACTOR_TARGET}。`);
    } else if (outcome.crushed > 0) {
      this.pushLog(`磁芯碾碎 ${outcome.crushed} 只巡检火花。`);
    } else if (action === 'pulse') {
      this.pushLog(`磁脉冲牵引 ${this.state.lastPulse.length} 枚磁芯。`);
    } else if (outcome.hit) {
      this.pushLog(`护盾剩余 ${this.state.hull}。`);
    }

    this.setStatus(outcome.message);
    this.setObjective();
    this.updateHud();
    this.render();
  }

  updateHud() {
    this.refs.floor.textContent = String(this.state.floor);
    this.refs.score.textContent = String(this.state.score);
    this.refs.hull.textContent = String(this.state.hull);
    this.refs.powered.textContent = `${this.state.powered} / ${REACTOR_TARGET}`;
    this.refs.pulseState.textContent =
      this.state.pulseCooldown === 0 ? '就绪' : `${this.state.pulseCooldown} 回合`;
    this.refs.best.textContent = String(this.bestScore);
    this.refs.turns.textContent = String(this.state.turns);
    this.refs.enemies.textContent = String(this.state.enemies.length);
    this.refs.bestFloor.textContent = String(this.bestFloor);
  }

  cellToPixel(cell) {
    return {
      x: this.boardInset + cell.x * this.cellSize,
      y: this.boardInset + cell.y * this.cellSize,
    };
  }

  drawBoard() {
    const ctx = this.ctx;
    ctx.fillStyle = '#081018';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#0f1b28';
    ctx.fillRect(
      this.boardInset - 18,
      this.boardInset - 18,
      this.cellSize * BOARD_SIZE + 36,
      this.cellSize * BOARD_SIZE + 36,
    );

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const px = this.boardInset + x * this.cellSize;
        const py = this.boardInset + y * this.cellSize;
        ctx.fillStyle = (x + y) % 2 === 0 ? '#132232' : '#102030';
        ctx.fillRect(px, py, this.cellSize - 2, this.cellSize - 2);
      }
    }
  }

  drawWalls() {
    const ctx = this.ctx;
    this.layout.walls.forEach((key) => {
      const [x, y] = key.split(':').map(Number);
      const px = this.boardInset + x * this.cellSize;
      const py = this.boardInset + y * this.cellSize;
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 6, py + 6, this.cellSize - 14, this.cellSize - 14);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px + 6, py + 6, this.cellSize - 20, 12);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(px + 10, py + 22, this.cellSize - 22, this.cellSize - 30);
    });
  }

  drawReactors() {
    const ctx = this.ctx;
    this.layout.reactors.forEach((reactor) => {
      const { x, y } = this.cellToPixel(reactor);
      const powered = this.state.blocks.some((block) => block.locked && sameCell(block, reactor));
      ctx.fillStyle = powered ? '#22d3ee' : '#fb923c';
      ctx.fillRect(x + 14, y + 14, this.cellSize - 30, this.cellSize - 30);
      ctx.fillStyle = powered ? '#ecfeff' : '#fff7ed';
      ctx.fillRect(x + 24, y + 24, this.cellSize - 50, this.cellSize - 50);
      ctx.strokeStyle = powered ? '#67e8f9' : '#f97316';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 10, y + 10, this.cellSize - 22, this.cellSize - 22);
    });
  }

  drawExit() {
    const { x, y } = this.cellToPixel(this.layout.exit);
    const ctx = this.ctx;
    ctx.fillStyle = this.state.exitUnlocked ? '#34d399' : '#475569';
    ctx.fillRect(x + 12, y + 12, this.cellSize - 26, this.cellSize - 26);
    ctx.fillStyle = this.state.exitUnlocked ? '#dcfce7' : '#cbd5e1';
    ctx.fillRect(x + 26, y + 16, this.cellSize - 54, this.cellSize - 34);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 30, y + 26, this.cellSize - 62, this.cellSize - 56);
  }

  drawPulseTrails() {
    if (this.state.lastPulse.length === 0) {
      return;
    }

    const ctx = this.ctx;
    const playerCenter = this.cellToPixel(this.state.player);
    const originX = playerCenter.x + this.cellSize / 2 - 2;
    const originY = playerCenter.y + this.cellSize / 2 - 2;

    ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
    this.state.lastPulse.forEach((cell) => {
      const target = this.cellToPixel(cell);
      const targetX = target.x + this.cellSize / 2;
      const targetY = target.y + this.cellSize / 2;
      const width = Math.abs(targetX - originX) + 4;
      const height = Math.abs(targetY - originY) + 4;
      ctx.fillRect(Math.min(originX, targetX), Math.min(originY, targetY), width, height);
    });
  }

  drawBlocks() {
    const ctx = this.ctx;
    this.state.blocks.forEach((block) => {
      const { x, y } = this.cellToPixel(block);
      ctx.fillStyle = block.locked ? '#22d3ee' : '#fbbf24';
      ctx.fillRect(x + 16, y + 14, this.cellSize - 34, this.cellSize - 30);
      ctx.fillStyle = block.locked ? '#cffafe' : '#fef3c7';
      ctx.fillRect(x + 26, y + 20, this.cellSize - 54, this.cellSize - 48);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 30, y + 32, this.cellSize - 62, 10);
      ctx.fillRect(x + 34, y + 18, 10, this.cellSize - 46);
    });
  }

  drawEnemies() {
    const ctx = this.ctx;
    this.state.enemies.forEach((enemy) => {
      const { x, y } = this.cellToPixel(enemy);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x + 20, y + 18, this.cellSize - 42, this.cellSize - 42);
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(x + 24, y + 22, this.cellSize - 50, 10);
      ctx.fillRect(x + 24, y + this.cellSize - 32, this.cellSize - 50, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 24, y + 38, 8, 8);
      ctx.fillRect(x + this.cellSize - 32, y + 38, 8, 8);
    });
  }

  drawPlayer() {
    const { x, y } = this.cellToPixel(this.state.player);
    const ctx = this.ctx;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 18, y + 16, this.cellSize - 38, this.cellSize - 34);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x + 24, y + 22, this.cellSize - 50, this.cellSize - 52);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 22, y + this.cellSize - 30, 12, 12);
    ctx.fillRect(x + this.cellSize - 34, y + this.cellSize - 30, 12, 12);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(x + 10, y + 32, 10, this.cellSize - 50);
    ctx.fillRect(x + this.cellSize - 20, y + 32, 10, this.cellSize - 50);
  }

  drawStartMarker() {
    const { x, y } = this.cellToPixel(this.layout.start);
    const ctx = this.ctx;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 10, y + 10, this.cellSize - 22, this.cellSize - 22);
  }

  render() {
    this.drawBoard();
    this.drawStartMarker();
    this.drawExit();
    this.drawReactors();
    this.drawWalls();
    this.drawPulseTrails();
    this.drawBlocks();
    this.drawEnemies();
    this.drawPlayer();
  }

  renderGameToText() {
    return JSON.stringify({
      mode: this.state.mode,
      floor: this.state.floor,
      note: 'origin at top-left; x increases right, y increases downward',
      player: this.state.player,
      blocks: this.state.blocks.map((block) => ({
        x: block.x,
        y: block.y,
        locked: block.locked,
      })),
      enemies: this.state.enemies.map((enemy) => ({ x: enemy.x, y: enemy.y })),
      reactors: this.layout.reactors.map((reactor) => ({
        x: reactor.x,
        y: reactor.y,
        powered: this.state.blocks.some((block) => block.locked && sameCell(block, reactor)),
      })),
      exit: {
        x: this.layout.exit.x,
        y: this.layout.exit.y,
        unlocked: this.state.exitUnlocked,
      },
      hull: this.state.hull,
      score: this.state.score,
      turns: this.state.turns,
      pulseCooldown: this.state.pulseCooldown,
    });
  }

  advanceTime() {
    this.render();
    return this.renderGameToText();
  }
}

const MagnetForgeInternals = {
  BOARD_SIZE,
  REACTOR_TARGET,
  MAX_HULL,
  PULSE_COOLDOWN,
  FLOOR_TEMPLATES,
  createFloorLayout,
  validateLayout,
  createRunState,
  applyAction,
  runSelfCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagnetForgeInternals;
}

function setupMagnetForge() {
  if (typeof document === 'undefined') {
    return;
  }

  const refs = {
    canvas: document.getElementById('forge-canvas'),
    start: document.getElementById('forge-start'),
    reset: document.getElementById('forge-reset'),
    wait: document.getElementById('forge-wait'),
    pulse: document.getElementById('forge-pulse-action'),
    restart: document.getElementById('forge-restart'),
    pad: document.querySelector('.forge-pad'),
    overlay: document.getElementById('forge-overlay'),
    overlayTitle: document.getElementById('forge-overlay-title'),
    overlayBody: document.getElementById('forge-overlay-body'),
    floor: document.getElementById('forge-floor'),
    score: document.getElementById('forge-score'),
    hull: document.getElementById('forge-hull'),
    powered: document.getElementById('forge-powered'),
    pulseState: document.getElementById('forge-pulse'),
    best: document.getElementById('forge-best'),
    status: document.getElementById('forge-status'),
    objective: document.getElementById('forge-objective'),
    turns: document.getElementById('forge-turns'),
    enemies: document.getElementById('forge-enemies'),
    bestFloor: document.getElementById('forge-best-floor'),
    feed: document.getElementById('forge-feed'),
    autotest: document.getElementById('forge-autotest'),
  };

  if (!refs.canvas) {
    return;
  }

  const game = new MagnetForgeGame(refs, {
    autotest: AUTOTEST,
    seedBase: FIXED_SEED ?? createSeedBase(),
  });

  if (AUTOTEST && refs.autotest) {
    const result = runSelfCheck(5);
    refs.autotest.textContent = JSON.stringify(result);
  }

  window.render_game_to_text = () => game.renderGameToText();
  window.advanceTime = async () => game.advanceTime();
  window.magnetForgeGame = game;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setupMagnetForge);
}
