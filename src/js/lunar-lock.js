const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'lunar-lock',
  shortTitle: '月锁回廊',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: true,
  scoreItem: 70,
  scoreHazard: 40,
  scoreSwitch: 35,
  scoreClear: 300,
  hitPenalty: 35,
  labels: {
    progress: '月钥',
    wait: '定轨',
  },
  storage: {
    score: 'demoCodexLunarLockBestScore',
    floor: 'demoCodexLunarLockBestFloor',
  },
  special: {
    label: '月辉',
    button: '月辉脉冲',
    effect: 'clear',
    radius: 2,
    cooldown: 4,
  },
  objective: {
    ready: '沿月轨滑到停点，踩开月锁门后收回 5 枚月钥。',
    exit: '月钥已经归位，从回廊出口撤离。',
  },
  overlay: {
    kicker: '回廊简报',
    title: '按开始或 Enter 接管回廊',
    body: '方向键会让你沿月轨滑到停点，必须把开门、跃迁和收钥压进同一条路线。',
    gameOverTitle: '回廊失锁',
    hitTitle: '暗潮贴近',
    hitBody: '暗潮把你推回了回廊起点。',
  },
  copy: {
    boot: '先滑到月锁开关，再借跃迁门回收 5 枚月钥。',
    live: '每次滑行都要先看停点，别撞进暗潮。',
    unlocked: '月钥已归位，可以撤离。',
    progress: '一枚月钥已经回收。',
    special: '月辉脉冲清掉了近处暗潮。',
    switch: '月锁门已经打开，跃迁路线连通。',
    teleport: '跃迁门把你送到了另一侧回廊。',
    hit: '暗潮撞上了护盾。',
    clear: '这一层月锁回廊已经解开。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管回廊。',
  },
  palette: {
    bg: '#0b1020',
    gridA: '#172033',
    gridB: '#101827',
    wall: '#334155',
    goal: '#facc15',
    exitOn: '#a7f3d0',
    exitOff: '#475569',
    item: '#fde68a',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#f472b6',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#facc15',
    gateClosed: '#6366f1',
    gateOpen: '#38bdf8',
    teleport: '#a78bfa',
  },
  extraHazards: [
    { x: 6, y: 2 },
    { x: 2, y: 6 },
    { x: 7, y: 5 },
    { x: 4, y: 7 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '#########',
        '#S..sd1X#',
        '#.##.#..#',
        '#..c..#.#',
        '#.#h#.#.#',
        '#1...c..#',
        '#..#.c..#',
        '#c.h..c.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S..sd.X#',
        '#.##.#1.#',
        '#..c..#.#',
        '#.#h#.#.#',
        '#1..c...#',
        '#..#.c..#',
        '#c.h..c.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S..sd1X#',
        '#.##.#..#',
        '#c....#.#',
        '#.#h#.#.#',
        '#1..c...#',
        '#..#.c..#',
        '#c.h..c.#',
        '#########',
      ],
    },
  ],
};

function createSlideLockLayout() {
  return {
    size: 8,
    walls: new Set(),
    items: [{ id: 0, x: 6, y: 3, active: true }],
    hazards: [],
    goals: [],
    goalKeys: new Set(),
    boxes: [],
    switches: [{ id: 0, x: 2, y: 1 }],
    switchKeys: new Set(['2:1']),
    gates: [{ id: 0, x: 3, y: 1 }],
    gateKeys: new Set(['3:1']),
    teleporters: [
      { id: '1', x: 4, y: 1 },
      { id: '1', x: 6, y: 3 },
    ],
    teleportMap: new Map([
      ['4:1', { x: 6, y: 3 }],
      ['6:3', { x: 4, y: 1 }],
    ]),
    start: { x: 1, y: 1 },
    exit: { x: 7, y: 7 },
  };
}

function runSlideLockCheck() {
  const layout = createSlideLockLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'lunar-slide-did-not-open-gate', details: opened };
  }

  const shifted = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (
    shifted.invalid ||
    !shifted.teleported ||
    shifted.state.player.x !== 6 ||
    shifted.state.player.y !== 3 ||
    shifted.state.progress !== 1 ||
    shifted.state.score !== 105
  ) {
    return { ok: false, reason: 'lunar-slide-teleport-failed', details: shifted };
  }

  return {
    ok: true,
    gatesOpen: shifted.state.gatesOpen,
    player: shifted.state.player,
    progress: shifted.state.progress,
    score: shifted.state.score,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const slideLock = runSlideLockCheck();
  if (!slideLock.ok) {
    return slideLock;
  }

  return {
    ...base,
    slideLock,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runSlideLockCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'lunarLockGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.lunarLockGameSelfCheck = runSelfCheck(4);
    }
  });
}
