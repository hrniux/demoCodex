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

const BOARD_SIZE = 11;
const CRYSTAL_TARGET = 3;
const MAX_HULL = 3;
const BASE_CHARGE_CAPACITY = 1;
const STORAGE_SCORE_KEY = 'demoCodexCavernBlastBestScore';
const STORAGE_FLOOR_KEY = 'demoCodexCavernBlastBestFloor';

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
const BOMB_KEYS = new Set(['KeyQ']);

const STEP_DELTAS = [
  { name: 'up', x: 0, y: -1 },
  { name: 'left', x: -1, y: 0 },
  { name: 'right', x: 1, y: 0 },
  { name: 'down', x: 0, y: 1 },
];

const copy = {
  boot: '先凑齐 3 枚晶体，再冲向右上角升降台。',
  live: '虫群正在逼近，留出撤离步数，再决定哪里埋雷。',
  unlocked: '升降台已经亮起，立刻转向撤离。',
  planted: '雷芯已埋下，再过一拍就会炸开。',
  charge: '雷芯补给入袋，可布更多爆点。',
  blast: '爆风掀开碎岩，通路出现了。',
  hit: '护盾破裂，你被震回入口。',
  floorClear: '本层晶洞清空，升降台继续向下钻进。',
  gameOver: '护盾耗尽，勘探中止。按 Enter 或按钮重新进入。',
};

const FLOOR_TEMPLATES = [
  {
    rows: [
      '...........',
      '.e.r#..c.X.',
      '.###r..r##.',
      '.p..r......',
      '..r..#..e..',
      '.#..r#r..#.',
      '.c..r...r..',
      '..##r.r##..',
      '.e....p..c.',
      '.S.r..r....',
      '...........',
    ],
  },
  {
    rows: [
      '...........',
      '.X..r#..e..',
      '.##r..r##..',
      '..c....r.p.',
      '.r..#e..r..',
      '...r###....',
      '.p.r..c..r.',
      '..##r..##..',
      '.e..r....c.',
      '.S....r..e.',
      '...........',
    ],
  },
  {
    rows: [
      '...........',
      '.e..c#r..X.',
      '..##r..##..',
      '.p..r...e..',
      '..r.#.r....',
      '.###...###.',
      '.c..r#..p..',
      '..e...r##..',
      '.r..##..c..',
      '.S.r....r..',
      '...........',
    ],
  },
  {
    rows: [
      '...........',
      '.X.r..c..e.',
      '.##..r##r..',
      '..p....r...',
      '.e.r#..r.c.',
      '..###.###..',
      '.r..c#r..p.',
      '...r....##.',
      '....r.e....',
      '.S..r...r..',
      '...........',
    ],
  },
];

const BONUS_CRAWLER_CELLS = [
  { x: 4, y: 1 },
  { x: 8, y: 5 },
  { x: 2, y: 4 },
  { x: 6, y: 9 },
  { x: 9, y: 7 },
  { x: 3, y: 8 },
];

const BONUS_RUBBLE_CELLS = [
  { x: 2, y: 1 },
  { x: 5, y: 3 },
  { x: 7, y: 4 },
  { x: 3, y: 6 },
  { x: 8, y: 8 },
  { x: 6, y: 2 },
  { x: 4, y: 9 },
];

function assertTemplateRows() {
  FLOOR_TEMPLATES.forEach((template, index) => {
    if (template.rows.length !== BOARD_SIZE) {
      throw new Error(`Template ${index} row count mismatch: expected ${BOARD_SIZE}`);
    }

    template.rows.forEach((row, rowIndex) => {
      if (row.length !== BOARD_SIZE) {
        throw new Error(
          `Template ${index} row ${rowIndex} width mismatch: expected ${BOARD_SIZE}, got ${row.length}`,
        );
      }
    });
  });
}

assertTemplateRows();

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
    crawlers: cloneActors(state.crawlers),
    rubble: state.rubble.map((item) => ({ ...item })),
    crystals: state.crystals.map((item) => ({ ...item })),
    chargePacks: state.chargePacks.map((item) => ({ ...item })),
    bombs: state.bombs.map((item) => ({ ...item })),
    lastBlast: state.lastBlast.map((cell) => ({ ...cell })),
  };
}

function addActor(items, actor, occupied, nextId) {
  const key = cellKey(actor);
  if (occupied.has(key)) {
    return nextId;
  }
  occupied.add(key);
  items.push({ id: nextId, ...actor });
  return nextId + 1;
}

function addBonusActors(items, candidates, count, occupied, nextId, offset) {
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates[(offset + index) % candidates.length];
    nextId = addActor(items, candidate, occupied, nextId);
  }
  return nextId;
}

function createFloorLayout(floor, seed) {
  const template = FLOOR_TEMPLATES[(floor - 1) % FLOOR_TEMPLATES.length];
  const walls = new Set();
  const rubble = [];
  const crystals = [];
  const chargePacks = [];
  const crawlers = [];
  let start = null;
  let exit = null;
  let nextRubbleId = 0;
  let nextCrystalId = 0;
  let nextPackId = 0;
  let nextCrawlerId = 0;

  template.rows.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      const point = { x, y };
      switch (cell) {
        case '#':
          walls.add(cellKey(point));
          break;
        case 'r':
          rubble.push({ id: nextRubbleId, x, y, active: true });
          nextRubbleId += 1;
          break;
        case 'c':
          crystals.push({ id: nextCrystalId, x, y, active: true });
          nextCrystalId += 1;
          break;
        case 'p':
          chargePacks.push({ id: nextPackId, x, y, active: true });
          nextPackId += 1;
          break;
        case 'e':
          crawlers.push({ id: nextCrawlerId, x, y });
          nextCrawlerId += 1;
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
    ...rubble.map(cellKey),
    ...crystals.map(cellKey),
    ...chargePacks.map(cellKey),
    ...crawlers.map(cellKey),
  ]);

  const extraCrawlerCount = Math.min(2, Math.max(0, floor - 1));
  const extraRubbleCount = Math.min(3, Math.max(0, floor - 2));
  const crawlerOffset = (seed + floor * 3) % BONUS_CRAWLER_CELLS.length;
  const rubbleOffset = (seed + floor * 5) % BONUS_RUBBLE_CELLS.length;

  nextCrawlerId = addBonusActors(
    crawlers,
    BONUS_CRAWLER_CELLS,
    extraCrawlerCount,
    occupied,
    nextCrawlerId,
    crawlerOffset,
  );

  nextRubbleId = addBonusActors(
    rubble,
    BONUS_RUBBLE_CELLS,
    extraRubbleCount,
    occupied,
    nextRubbleId,
    rubbleOffset,
  );

  return {
    floor,
    seed,
    start,
    exit,
    walls,
    rubble,
    crystals,
    chargePacks,
    crawlers,
  };
}

function validateLayout(layout) {
  if (!layout.start || !layout.exit) {
    return false;
  }

  if (layout.crystals.length !== CRYSTAL_TARGET) {
    return false;
  }

  const seen = new Set([...layout.walls, cellKey(layout.start), cellKey(layout.exit)]);
  const items = [...layout.rubble, ...layout.crystals, ...layout.chargePacks, ...layout.crawlers];

  for (const item of items) {
    if (!inBounds(item)) {
      return false;
    }
    const key = cellKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  return !layout.walls.has(cellKey(layout.start)) && !layout.walls.has(cellKey(layout.exit));
}

function createRunState(layout, hull = MAX_HULL, score = 0) {
  return {
    mode: 'idle',
    floor: layout.floor,
    hull,
    score,
    player: cloneCell(layout.start),
    crawlers: cloneActors(layout.crawlers),
    rubble: layout.rubble.map((item) => ({ ...item, active: true })),
    crystals: layout.crystals.map((item) => ({ ...item, active: true })),
    chargePacks: layout.chargePacks.map((item) => ({ ...item, active: true })),
    bombs: [],
    lastBlast: [],
    collected: 0,
    charges: BASE_CHARGE_CAPACITY,
    maxCharges: BASE_CHARGE_CAPACITY,
    turns: 0,
    exitUnlocked: false,
    nextBombId: 0,
  };
}

function findActive(state, itemsName, cell) {
  return state[itemsName].find((item) => item.active && sameCell(item, cell));
}

function hasWall(layout, cell) {
  return layout.walls.has(cellKey(cell));
}

function hasActiveRubble(state, cell) {
  return state.rubble.some((item) => item.active && sameCell(item, cell));
}

function hasBombAt(state, cell) {
  return state.bombs.some((item) => sameCell(item, cell));
}

function canOccupy(layout, state, cell, options = {}) {
  if (!inBounds(cell)) {
    return false;
  }

  if (hasWall(layout, cell)) {
    return false;
  }

  if (!options.ignoreRubble && hasActiveRubble(state, cell)) {
    return false;
  }

  if (!options.ignoreBombs && hasBombAt(state, cell)) {
    return false;
  }

  return true;
}

function movePlayer(player, action) {
  switch (action) {
    case 'up':
      return { x: player.x, y: player.y - 1 };
    case 'down':
      return { x: player.x, y: player.y + 1 };
    case 'left':
      return { x: player.x - 1, y: player.y };
    case 'right':
      return { x: player.x + 1, y: player.y };
    case 'wait':
      return cloneCell(player);
    default:
      return null;
  }
}

function hasCrawlerCollision(state) {
  return state.crawlers.some((item) => sameCell(item, state.player));
}

function buildBlockedSet(layout, state, occupied = new Set()) {
  const blocked = new Set([...layout.walls, ...occupied]);
  state.rubble.forEach((item) => {
    if (item.active) {
      blocked.add(cellKey(item));
    }
  });
  state.bombs.forEach((item) => blocked.add(cellKey(item)));
  return blocked;
}

function pickCrawlerStep(layout, state, crawler, target, occupied) {
  const blocked = buildBlockedSet(layout, state, occupied);
  blocked.delete(cellKey(crawler));
  blocked.delete(cellKey(target));
  const distanceMap = new Map([[cellKey(target), 0]]);
  const queue = [cloneCell(target)];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distanceMap.get(cellKey(current));

    STEP_DELTAS.forEach((delta) => {
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      const key = cellKey(next);
      if (!inBounds(next) || blocked.has(key) || distanceMap.has(key)) {
        return;
      }
      distanceMap.set(key, currentDistance + 1);
      queue.push(next);
    });
  }

  let bestCell = cloneCell(crawler);
  let bestDistance = Number.POSITIVE_INFINITY;

  STEP_DELTAS.forEach((delta) => {
    const next = { x: crawler.x + delta.x, y: crawler.y + delta.y };
    if (!inBounds(next)) {
      return;
    }

    const key = cellKey(next);
    if (blocked.has(key) && !sameCell(next, target)) {
      return;
    }

    const distance = distanceMap.get(key);
    if (distance === undefined) {
      return;
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      bestCell = next;
    }
  });

  return bestCell;
}

function collectPickups(state, outcome) {
  const crystal = findActive(state, 'crystals', state.player);
  if (crystal) {
    crystal.active = false;
    state.collected += 1;
    state.score += 120 + state.floor * 20;
    outcome.collectedCrystal = true;
  }

  const chargePack = findActive(state, 'chargePacks', state.player);
  if (chargePack) {
    chargePack.active = false;
    state.maxCharges = Math.min(3, state.maxCharges + 1);
    state.charges = Math.min(state.maxCharges, state.charges + 1);
    state.score += 35;
    outcome.collectedCharge = true;
  }

  if (state.collected >= CRYSTAL_TARGET) {
    state.exitUnlocked = true;
  }
}

function createBlastCells(layout, state, origin) {
  const cells = [cloneCell(origin)];

  STEP_DELTAS.forEach((delta) => {
    for (let step = 1; step <= 2; step += 1) {
      const next = { x: origin.x + delta.x * step, y: origin.y + delta.y * step };
      if (!inBounds(next) || hasWall(layout, next)) {
        break;
      }
      cells.push(next);
      if (hasActiveRubble(state, next)) {
        break;
      }
    }
  });

  return cells;
}

function dedupeCells(cells) {
  const seen = new Set();
  return cells.filter((cell) => {
    const key = cellKey(cell);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function applyHit(layout, state, outcome) {
  state.hull -= 1;
  state.score = Math.max(0, state.score - 55);
  outcome.hit = true;

  if (state.hull <= 0) {
    state.mode = 'gameover';
    outcome.gameOver = true;
    return;
  }

  state.player = cloneCell(layout.start);
  state.bombs = [];
  state.lastBlast = [];
  state.charges = state.maxCharges;
}

function resolveBombs(layout, state, outcome) {
  state.lastBlast = [];
  if (state.bombs.length === 0) {
    return;
  }

  state.bombs = state.bombs.map((bomb) => ({ ...bomb, fuse: bomb.fuse - 1 }));
  const queue = state.bombs.filter((bomb) => bomb.fuse <= 0).map((bomb) => bomb.id);
  const destroyedCrawlerIds = new Set();
  let playerHit = false;

  while (queue.length > 0) {
    const bombId = queue.shift();
    const bombIndex = state.bombs.findIndex((bomb) => bomb.id === bombId);
    if (bombIndex === -1) {
      continue;
    }

    const [bomb] = state.bombs.splice(bombIndex, 1);
    state.charges = Math.min(state.maxCharges, state.charges + 1);
    const blastCells = createBlastCells(layout, state, bomb);
    state.lastBlast.push(...blastCells);

    blastCells.forEach((cell) => {
      state.rubble.forEach((item) => {
        if (item.active && sameCell(item, cell)) {
          item.active = false;
          outcome.clearedRubble += 1;
        }
      });

      state.crawlers.forEach((crawler) => {
        if (!destroyedCrawlerIds.has(crawler.id) && sameCell(crawler, cell)) {
          destroyedCrawlerIds.add(crawler.id);
          outcome.destroyedCrawlers += 1;
          state.score += 70;
        }
      });

      if (sameCell(state.player, cell)) {
        playerHit = true;
      }

      state.bombs.forEach((chainBomb) => {
        if (sameCell(chainBomb, cell) && chainBomb.fuse > 0) {
          chainBomb.fuse = 0;
          queue.push(chainBomb.id);
        }
      });
    });
  }

  state.lastBlast = dedupeCells(state.lastBlast);
  if (destroyedCrawlerIds.size > 0) {
    state.crawlers = state.crawlers.filter((crawler) => !destroyedCrawlerIds.has(crawler.id));
  }

  if (playerHit) {
    applyHit(layout, state, outcome);
  }
}

function advanceCrawlers(layout, state) {
  const nextPositions = [];
  state.crawlers.forEach((crawler, index) => {
    const occupied = new Set(nextPositions.map(cellKey));
    for (let rest = index + 1; rest < state.crawlers.length; rest += 1) {
      occupied.add(cellKey(state.crawlers[rest]));
    }
    const step = pickCrawlerStep(layout, state, crawler, state.player, occupied);
    nextPositions.push(step);
  });

  state.crawlers = nextPositions.map((cell, index) => ({ id: index, x: cell.x, y: cell.y }));
}

function applyAction(layout, currentState, action) {
  const state = cloneState(currentState);
  const outcome = {
    state,
    action,
    changed: false,
    invalid: false,
    planted: false,
    collectedCrystal: false,
    collectedCharge: false,
    clearedRubble: 0,
    destroyedCrawlers: 0,
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

  if (action === 'bomb') {
    if (state.charges <= 0) {
      outcome.invalid = true;
      outcome.message = '当前没有可用雷芯。';
      return outcome;
    }

    if (hasBombAt(state, state.player)) {
      outcome.invalid = true;
      outcome.message = '脚下已经埋着一枚雷芯。';
      return outcome;
    }

    state.bombs.push({
      id: state.nextBombId,
      x: state.player.x,
      y: state.player.y,
      fuse: 3,
    });
    state.nextBombId += 1;
    state.charges -= 1;
    outcome.planted = true;
  } else {
    const moved = movePlayer(state.player, action);
    if (!moved || !canOccupy(layout, state, moved)) {
      outcome.invalid = true;
      outcome.message = '前方被岩壁、碎岩或雷芯挡住了。';
      return outcome;
    }
    state.player = moved;
  }

  state.turns += 1;
  outcome.changed = true;
  collectPickups(state, outcome);

  resolveBombs(layout, state, outcome);
  if (outcome.hit) {
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  if (state.exitUnlocked && sameCell(state.player, layout.exit)) {
    state.score += 200 + state.floor * 50;
    outcome.extracted = true;
    outcome.message = copy.floorClear;
    return outcome;
  }

  advanceCrawlers(layout, state);
  if (hasCrawlerCollision(state)) {
    applyHit(layout, state, outcome);
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  if (state.exitUnlocked) {
    outcome.message = copy.unlocked;
  } else if (outcome.destroyedCrawlers > 0 || outcome.clearedRubble > 0) {
    outcome.message = copy.blast;
  } else if (outcome.collectedCrystal) {
    outcome.message = '晶体入袋，继续压缩撤离路径。';
  } else if (outcome.collectedCharge) {
    outcome.message = copy.charge;
  } else if (outcome.planted) {
    outcome.message = copy.planted;
  } else {
    outcome.message = copy.live;
  }

  return outcome;
}

function runSelfCheck(rounds = 6) {
  const layouts = [];

  for (let floor = 1; floor <= rounds; floor += 1) {
    const layout = createFloorLayout(floor, (4242 + floor * 13) >>> 0);
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
      crawlers: step.state.crawlers.length,
      rubble: step.state.rubble.filter((item) => item.active).length,
    });
  }

  const blastLayout = createFloorLayout(1, 4242);
  const blastState = createRunState(blastLayout);
  blastState.mode = 'active';
  blastState.player = { x: 5, y: 5 };
  blastState.crawlers = [{ id: 0, x: 5, y: 3 }];
  blastState.rubble = [{ id: 0, x: 6, y: 5, active: true }];
  blastState.crystals = [];
  blastState.chargePacks = [];
  blastState.bombs = [];
  blastState.charges = 1;
  blastState.maxCharges = 1;
  blastState.nextBombId = 0;
  blastState.lastBlast = [];
  blastLayout.walls = new Set(['4:4', '6:4']);
  blastLayout.start = { x: 0, y: 10 };
  blastLayout.exit = { x: 10, y: 0 };

  const planted = applyAction(blastLayout, blastState, 'bomb');
  const sidestep = applyAction(blastLayout, planted.state, 'left');
  const blasted = applyAction(blastLayout, sidestep.state, 'down');
  if (
    blasted.state.crawlers.length !== 0 ||
    blasted.state.rubble.some((item) => item.active) ||
    blasted.state.charges !== 1 ||
    blasted.state.player.x !== 4 ||
    blasted.state.player.y !== 6
  ) {
    return { ok: false, reason: 'blast-check-failed', details: blasted };
  }

  const chargeLayout = createFloorLayout(1, 4242);
  const chargeState = createRunState(chargeLayout);
  chargeState.mode = 'active';
  chargeState.player = { x: 2, y: 5 };
  chargeState.crawlers = [];
  chargeState.rubble = [];
  chargeState.crystals = [];
  chargeState.chargePacks = [{ id: 0, x: 3, y: 5, active: true }];
  chargeLayout.walls = new Set();
  chargeLayout.start = { x: 0, y: 10 };
  chargeLayout.exit = { x: 10, y: 0 };

  const charged = applyAction(chargeLayout, chargeState, 'right');
  if (charged.state.maxCharges !== 2 || charged.state.charges !== 2) {
    return { ok: false, reason: 'charge-pack-failed', details: charged };
  }

  const exitLayout = createFloorLayout(1, 5001);
  const exitState = createRunState(exitLayout, 2, 220);
  exitState.mode = 'active';
  exitState.player = { x: 8, y: 1 };
  exitState.crawlers = [];
  exitState.rubble = [];
  exitState.crystals = [];
  exitState.chargePacks = [];
  exitLayout.walls = new Set();
  exitLayout.start = { x: 0, y: 10 };
  exitLayout.exit = { x: 9, y: 1 };
  exitState.collected = 3;
  exitState.exitUnlocked = true;

  const extracted = applyAction(exitLayout, exitState, 'right');
  if (!extracted.extracted || extracted.state.score !== 470) {
    return { ok: false, reason: 'extract-failed', details: extracted };
  }

  return {
    ok: true,
    layouts,
    blast: {
      charges: blasted.state.charges,
      crawlers: blasted.state.crawlers.length,
      rubbleCleared: blasted.state.rubble.filter((item) => item.active).length,
    },
    charge: {
      maxCharges: charged.state.maxCharges,
      charges: charged.state.charges,
    },
    extractionScore: extracted.state.score,
  };
}

class CavernBlastGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.autotest = Boolean(options.autotest);
    this.seedBase = options.seedBase ?? ((Date.now() ^ Math.random() * 0xffffffff) >>> 0);
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
    this.resetExpedition();
  }

  canUseStorage() {
    try {
      const key = '__cavern_blast__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    this.refs.start.addEventListener('click', () => this.startExpedition());
    this.refs.reset.addEventListener('click', () => this.resetExpedition());
    this.refs.wait.addEventListener('click', () => this.handleAction('wait'));
    this.refs.bombAction.addEventListener('click', () => this.handleAction('bomb'));
    this.refs.restart.addEventListener('click', () => this.resetExpedition());
    this.refs.pad.addEventListener('click', this.boundPadClick);
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    this.refs.pad.removeEventListener('click', this.boundPadClick);
  }

  seedForFloor(floor) {
    return (this.seedBase + floor * 1103515245) >>> 0;
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
      this.refs.objective.textContent = '护盾耗尽。按 Enter 或重新钻进按钮开始新一轮勘探。';
      return;
    }

    if (this.state.exitUnlocked) {
      this.refs.objective.textContent = '升降台已经亮起，立刻冲向右上角撤离。';
      return;
    }

    if (this.state.charges > 0) {
      this.refs.objective.textContent = `当前还能放 ${this.state.charges} 枚雷芯；用爆风打开通路并顺手清怪。`;
      return;
    }

    this.refs.objective.textContent = '雷芯还在冷却回收，先拉扯虫群位置，等爆风返还容量。';
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

  resetExpedition() {
    this.logs = [];
    this.loadFloor(1, { hull: MAX_HULL, score: 0, mode: 'idle' });
    this.pushLog('钻机重新对准第 1 层晶洞。');
    this.setStatus(copy.boot);
    this.setObjective();
    this.setOverlay(
      '按开始或 Enter 进入晶洞',
      '方向键移动，空格等待，Q 在脚下埋雷。雷芯会在两拍后自动爆炸。',
    );
    this.render();
  }

  startExpedition() {
    if (this.state.mode === 'active') {
      return;
    }

    if (this.state.mode === 'gameover') {
      this.resetExpedition();
    }

    this.state.mode = 'active';
    this.setStatus(copy.live);
    this.setObjective();
    this.clearOverlay();
    this.pushLog(`第 ${this.state.floor} 层晶洞开启。`);
    this.updateHud();
    this.render();
  }

  onKeydown(event) {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      this.startExpedition();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.resetExpedition();
      return;
    }

    if (WAIT_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('wait');
      return;
    }

    if (BOMB_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('bomb');
      return;
    }

    const mapped = MOVE_KEYS.get(event.code);
    if (mapped) {
      event.preventDefault();
      this.handleAction(mapped);
    }
  }

  onPadClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }
    this.handleAction(button.dataset.action);
  }

  handleAction(action) {
    if (this.state.mode !== 'active') {
      return;
    }

    const labels = {
      up: '向北推进。',
      down: '向南拉扯。',
      left: '向西转位。',
      right: '向东切线。',
      wait: '原地压住节奏。',
      bomb: '雷芯已埋下。',
    };

    const outcome = applyAction(this.layout, this.state, action);
    this.state = outcome.state;

    if (outcome.invalid) {
      this.setStatus(outcome.message);
      this.setObjective();
      this.render();
      return;
    }

    this.pushLog(labels[action]);

    if (outcome.collectedCrystal) {
      this.pushLog(`拿到第 ${this.state.collected} 枚晶体。`);
    }

    if (outcome.collectedCharge) {
      this.pushLog('雷芯补给到手，爆点上限提高。');
    }

    if (outcome.clearedRubble > 0) {
      this.pushLog(`爆风掀开了 ${outcome.clearedRubble} 块碎岩。`);
    }

    if (outcome.destroyedCrawlers > 0) {
      this.pushLog(`爆掉了 ${outcome.destroyedCrawlers} 只追击虫。`);
    }

    if (outcome.hit) {
      this.pushLog(copy.hit);
    }

    this.setStatus(outcome.message);
    this.setObjective();
    this.commitBestScore();

    if (outcome.extracted) {
      const clearedFloor = this.state.floor;
      const score = this.state.score;
      const hull = this.state.hull;
      const nextFloor = clearedFloor + 1;
      this.commitBestFloor(clearedFloor);
      this.pushLog(`第 ${clearedFloor} 层晶洞已经清空。`);
      this.loadFloor(nextFloor, { hull, score, mode: 'active' });
      this.setStatus(copy.floorClear);
      this.setObjective();
      this.pushLog(`第 ${nextFloor} 层晶洞开启。`);
    } else if (this.state.mode === 'gameover') {
      this.setOverlay('勘探中止', '护盾已经全部耗尽。按 Enter 或重新钻进按钮开始新局。');
    }

    this.updateHud();
    this.render();
  }

  updateHud() {
    this.refs.floor.textContent = String(this.state.floor);
    this.refs.score.textContent = String(this.state.score);
    this.refs.hull.textContent = String(this.state.hull);
    this.refs.crystals.textContent = `${this.state.collected} / ${CRYSTAL_TARGET}`;
    this.refs.charges.textContent = `${this.state.charges} / ${this.state.maxCharges}`;
    this.refs.best.textContent = String(this.bestScore);
    this.refs.turns.textContent = String(this.state.turns);
    this.refs.crawlers.textContent = String(this.state.crawlers.length);
    this.refs.bestFloor.textContent = String(this.bestFloor);
  }

  drawGrid(ctx, cellSize) {
    ctx.fillStyle = '#0f0c16';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const offsetX = x * cellSize;
        const offsetY = y * cellSize;
        ctx.fillStyle = (x + y) % 2 === 0 ? '#15111f' : '#181423';
        ctx.fillRect(offsetX, offsetY, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= BOARD_SIZE; i += 1) {
      const offset = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(this.width, offset);
      ctx.stroke();
    }
  }

  drawWalls(ctx, cellSize) {
    this.layout.walls.forEach((key) => {
      const [x, y] = key.split(':').map(Number);
      const offsetX = x * cellSize;
      const offsetY = y * cellSize;
      ctx.fillStyle = '#4c4a57';
      ctx.fillRect(offsetX, offsetY, cellSize, cellSize);
      ctx.fillStyle = '#7b778c';
      ctx.fillRect(offsetX + 6, offsetY + 6, cellSize - 12, 12);
      ctx.fillStyle = '#262430';
      ctx.fillRect(offsetX + 12, offsetY + cellSize - 18, cellSize - 24, 10);
    });
  }

  drawRubble(ctx, cellSize) {
    this.state.rubble.forEach((item) => {
      if (!item.active) {
        return;
      }
      const x = item.x * cellSize;
      const y = item.y * cellSize;
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(x + 12, y + 12, cellSize - 24, cellSize - 24);
      ctx.fillStyle = '#c85d1c';
      ctx.fillRect(x + 20, y + 18, cellSize - 40, 10);
      ctx.fillRect(x + 26, y + 36, cellSize - 52, 10);
      ctx.fillStyle = '#ffd2a9';
      ctx.fillRect(x + 16, y + 22, 10, 10);
      ctx.fillRect(x + cellSize - 28, y + 42, 10, 10);
    });
  }

  drawExit(ctx, cellSize) {
    const x = this.layout.exit.x * cellSize;
    const y = this.layout.exit.y * cellSize;
    ctx.fillStyle = this.state.exitUnlocked ? '#2ee6c6' : '#2a2434';
    ctx.fillRect(x + 10, y + 10, cellSize - 20, cellSize - 20);
    ctx.fillStyle = this.state.exitUnlocked ? '#c4fff5' : '#635978';
    ctx.fillRect(x + 22, y + 16, cellSize - 44, cellSize - 32);
    ctx.fillStyle = '#0b0910';
    ctx.fillRect(x + 30, y + 26, cellSize - 60, cellSize - 52);
  }

  drawCrystals(ctx, cellSize) {
    this.state.crystals.forEach((item) => {
      if (!item.active) {
        return;
      }
      const centerX = item.x * cellSize + cellSize / 2;
      const centerY = item.y * cellSize + cellSize / 2;
      ctx.fillStyle = '#2ee6c6';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 22);
      ctx.lineTo(centerX + 18, centerY);
      ctx.lineTo(centerX, centerY + 22);
      ctx.lineTo(centerX - 18, centerY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c4fff5';
      ctx.fillRect(centerX - 6, centerY - 12, 12, 12);
    });
  }

  drawChargePacks(ctx, cellSize) {
    this.state.chargePacks.forEach((item) => {
      if (!item.active) {
        return;
      }
      const x = item.x * cellSize;
      const y = item.y * cellSize;
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(x + 18, y + 16, cellSize - 36, cellSize - 32);
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(x + 30, y + 10, cellSize - 60, 12);
      ctx.fillStyle = '#8a4c11';
      ctx.fillRect(x + 24, y + 26, cellSize - 48, 10);
      ctx.fillRect(x + 24, y + 42, cellSize - 48, 10);
    });
  }

  drawBombs(ctx, cellSize) {
    this.state.bombs.forEach((bomb) => {
      const centerX = bomb.x * cellSize + cellSize / 2;
      const centerY = bomb.y * cellSize + cellSize / 2;
      ctx.fillStyle = '#17131f';
      ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(centerX + 10, centerY - 28, 10, 12);
      ctx.fillStyle = '#ffe082';
      ctx.font = `${Math.round(cellSize * 0.26)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.max(0, bomb.fuse)), centerX, centerY + 2);
    });
  }

  drawCrawlers(ctx, cellSize) {
    this.state.crawlers.forEach((item) => {
      const x = item.x * cellSize;
      const y = item.y * cellSize;
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(x + 18, y + 22, cellSize - 36, cellSize - 34);
      ctx.fillStyle = '#c4b5fd';
      ctx.fillRect(x + 24, y + 14, cellSize - 48, 16);
      ctx.fillStyle = '#ff5c7c';
      ctx.fillRect(x + 14, y + 46, 10, 10);
      ctx.fillRect(x + cellSize - 24, y + 46, 10, 10);
    });
  }

  drawPlayer(ctx, cellSize) {
    const x = this.state.player.x * cellSize;
    const y = this.state.player.y * cellSize;
    ctx.fillStyle = '#ffe082';
    ctx.fillRect(x + 18, y + 14, cellSize - 36, 18);
    ctx.fillStyle = '#2ee6c6';
    ctx.fillRect(x + 20, y + 30, cellSize - 40, cellSize - 34);
    ctx.fillStyle = '#0b0910';
    ctx.fillRect(x + 28, y + 22, 8, 8);
    ctx.fillRect(x + cellSize - 36, y + 22, 8, 8);
  }

  drawBlast(ctx, cellSize) {
    if (this.state.lastBlast.length === 0) {
      return;
    }

    this.state.lastBlast.forEach((cell) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      ctx.fillStyle = 'rgba(255, 138, 61, 0.62)';
      ctx.fillRect(x + 6, y + 6, cellSize - 12, cellSize - 12);
      ctx.fillStyle = 'rgba(255, 224, 130, 0.88)';
      ctx.fillRect(x + 20, y + 20, cellSize - 40, cellSize - 40);
    });
  }

  drawStartMarker(ctx, cellSize) {
    const x = this.layout.start.x * cellSize;
    const y = this.layout.start.y * cellSize;
    ctx.fillStyle = '#332944';
    ctx.fillRect(x + 10, y + 10, cellSize - 20, cellSize - 20);
    ctx.fillStyle = '#d6ccff';
    ctx.font = `${Math.round(cellSize * 0.23)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', x + cellSize / 2, y + cellSize / 2);
  }

  render() {
    const cellSize = this.width / BOARD_SIZE;
    this.drawGrid(this.ctx, cellSize);
    this.drawStartMarker(this.ctx, cellSize);
    this.drawExit(this.ctx, cellSize);
    this.drawWalls(this.ctx, cellSize);
    this.drawRubble(this.ctx, cellSize);
    this.drawCrystals(this.ctx, cellSize);
    this.drawChargePacks(this.ctx, cellSize);
    this.drawBlast(this.ctx, cellSize);
    this.drawBombs(this.ctx, cellSize);
    this.drawCrawlers(this.ctx, cellSize);
    this.drawPlayer(this.ctx, cellSize);

    if (this.autotest) {
      this.refs.autotest.textContent = this.renderGameToText();
    }
  }

  renderGameToText() {
    return JSON.stringify({
      mode: this.state.mode,
      floor: this.state.floor,
      score: this.state.score,
      hull: this.state.hull,
      collected: this.state.collected,
      charges: this.state.charges,
      maxCharges: this.state.maxCharges,
      exitUnlocked: this.state.exitUnlocked,
      turns: this.state.turns,
      coordinateSystem: 'origin top-left; x grows right; y grows downward',
      player: cloneCell(this.state.player),
      exit: cloneCell(this.layout.exit),
      crawlers: cloneActors(this.state.crawlers).sort((a, b) => a.y - b.y || a.x - b.x),
      rubble: this.state.rubble
        .filter((item) => item.active)
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      crystals: this.state.crystals
        .filter((item) => item.active)
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      chargePacks: this.state.chargePacks
        .filter((item) => item.active)
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      bombs: this.state.bombs
        .map((item) => ({ x: item.x, y: item.y, fuse: item.fuse }))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      lastBlast: this.state.lastBlast
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
    });
  }

  advanceTime() {
    this.render();
    return this.renderGameToText();
  }
}

const CavernBlastInternals = {
  BOARD_SIZE,
  CRYSTAL_TARGET,
  createFloorLayout,
  validateLayout,
  createRunState,
  applyAction,
  runSelfCheck,
  pickCrawlerStep,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CavernBlastInternals;
}

function initCavernBlast() {
  if (typeof document === 'undefined') {
    return null;
  }

  const refs = {
    canvas: document.getElementById('cavern-canvas'),
    start: document.getElementById('cavern-start'),
    reset: document.getElementById('cavern-reset'),
    wait: document.getElementById('cavern-wait'),
    bombAction: document.getElementById('cavern-bomb-action'),
    restart: document.getElementById('cavern-restart'),
    pad: document.querySelector('.cavern-pad'),
    overlay: document.getElementById('cavern-overlay'),
    overlayTitle: document.getElementById('cavern-overlay-title'),
    overlayBody: document.getElementById('cavern-overlay-body'),
    status: document.getElementById('cavern-status'),
    objective: document.getElementById('cavern-objective'),
    floor: document.getElementById('cavern-floor'),
    score: document.getElementById('cavern-score'),
    hull: document.getElementById('cavern-hull'),
    crystals: document.getElementById('cavern-crystals'),
    charges: document.getElementById('cavern-charges'),
    best: document.getElementById('cavern-best'),
    turns: document.getElementById('cavern-turns'),
    crawlers: document.getElementById('cavern-crawlers'),
    bestFloor: document.getElementById('cavern-best-floor'),
    feed: document.getElementById('cavern-feed'),
    autotest: document.getElementById('cavern-autotest'),
  };

  if (!refs.canvas) {
    return null;
  }

  const game = new CavernBlastGame(refs, {
    autotest: AUTOTEST,
    seedBase: FIXED_SEED ?? undefined,
  });

  if (AUTOTEST) {
    const result = runSelfCheck(5);
    window.cavernBlastSelfCheck = result;
    refs.autotest.textContent = JSON.stringify(result);
  }

  window.render_game_to_text = () => game.renderGameToText();
  window.advanceTime = async () => game.advanceTime();
  window.cavernBlastGame = game;
  return game;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCavernBlast, { once: true });
  } else {
    initCavernBlast();
  }
}
