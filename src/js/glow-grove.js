const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'glow-grove',
  shortTitle: '辉苔林廊',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 90,
  scoreSwitch: 32,
  scoreHazard: 35,
  scoreClear: 300,
  hitPenalty: 36,
  labels: {
    progress: '辉苔座',
    wait: '稳光',
  },
  storage: {
    score: 'demoCodexGlowGroveBestScore',
    floor: 'demoCodexGlowGroveBestFloor',
  },
  special: {
    label: '苔灯',
    button: '苔灯脉冲',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '先踩林闸，再把 3 个辉苔箱推上辉苔座。',
    exit: '辉苔座已经连通，从右上巡护口撤离。',
  },
  overlay: {
    kicker: '林廊简报',
    title: '按开始或 Enter 点亮林廊',
    body: '移动、开闸、推箱都按回合结算。孢影会逼近，苔灯脉冲只清贴身威胁。',
    gameOverTitle: '林廊失守',
    hitTitle: '孢影击中护盾',
    hitBody: '林雾把你弹回了入口。',
  },
  copy: {
    boot: '开闸、推辉苔箱、接通 3 个辉苔座后撤离。',
    live: '先确认箱子背面角度，再给孢影留一格缓冲。',
    unlocked: '辉苔座已连通，可以撤离。',
    progress: '一个辉苔座已经点亮。',
    special: '苔灯脉冲清掉了贴身孢影。',
    switch: '林闸已经打开，巡护通道连通。',
    hit: '孢影撞上了护盾。',
    clear: '这一层林廊已经复明。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新点灯。',
  },
  palette: {
    bg: '#0d1510',
    gridA: '#13261d',
    gridB: '#0f1d17',
    wall: '#355246',
    goal: '#86efac',
    exitOn: '#fef08a',
    exitOff: '#475569',
    item: '#bbf7d0',
    box: '#84cc16',
    boxLocked: '#5eead4',
    hazard: '#fb7185',
    special: '#fde68a',
    player: '#f8fafc',
    switch: '#bef264',
    gateClosed: '#22c55e',
    gateOpen: '#34d399',
    teleport: '#a78bfa',
  },
  extraHazards: [
    { x: 6, y: 2 },
    { x: 2, y: 6 },
    { x: 7, y: 5 },
    { x: 4, y: 4 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '#########',
        '#Ss.d..X#',
        '#.##.#.g#',
        '#..b...##',
        '#.#h#...#',
        '#..bg...#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S.s.dX.#',
        '#.##.#.g#',
        '#..b..h##',
        '#.#.#...#',
        '#..bg...#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#Ss..d.X#',
        '#.##.#.g#',
        '#..b...##',
        '#.#h#...#',
        '#..bg...#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
  ],
};

function createGlowGroveRouteLayout() {
  return {
    size: 7,
    walls: new Set(),
    items: [],
    hazards: [],
    goals: [{ id: 0, x: 5, y: 1 }],
    goalKeys: new Set(['5:1']),
    boxes: [{ id: 0, x: 4, y: 1, locked: false }],
    switches: [{ id: 0, x: 2, y: 1 }],
    switchKeys: new Set(['2:1']),
    gates: [{ id: 0, x: 3, y: 1 }],
    gateKeys: new Set(['3:1']),
    teleporters: [],
    teleportMap: new Map(),
    start: { x: 1, y: 1 },
    exit: { x: 6, y: 6 },
  };
}

function runGlowGroveRouteCheck() {
  const layout = createGlowGroveRouteLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'glow-grove-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'glow-grove-gate-step-failed', details: throughGate };
  }

  const powered = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    powered.invalid ||
    powered.state.progress !== 1 ||
    !powered.state.boxes[0].locked ||
    powered.state.score !== 122
  ) {
    return { ok: false, reason: 'glow-grove-push-failed', details: powered };
  }

  return {
    ok: true,
    gatesOpen: powered.state.gatesOpen,
    player: powered.state.player,
    box: powered.state.boxes[0],
    progress: powered.state.progress,
    score: powered.state.score,
  };
}

function runLanternBurstCheck() {
  const layout = createGlowGroveRouteLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });
  state.player = { x: 2, y: 2 };
  state.boxes = [];
  state.hazards = [
    { id: 0, x: 2, y: 1 },
    { id: 1, x: 3, y: 2 },
    { id: 2, x: 6, y: 6 },
  ];

  const burst = core.applyAction(CONFIG, layout, state, 'ability');
  if (
    burst.invalid ||
    burst.clearedHazards !== 2 ||
    burst.state.specialCooldown !== 3 ||
    burst.state.score !== 70
  ) {
    return { ok: false, reason: 'glow-grove-burst-failed', details: burst };
  }

  return {
    ok: true,
    clearedHazards: burst.clearedHazards,
    cooldown: burst.state.specialCooldown,
    score: burst.state.score,
    remainingHazards: burst.state.hazards.length,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const groveRoute = runGlowGroveRouteCheck();
  if (!groveRoute.ok) {
    return groveRoute;
  }

  const lanternBurst = runLanternBurstCheck();
  if (!lanternBurst.ok) {
    return lanternBurst;
  }

  return {
    ...base,
    groveRoute,
    lanternBurst,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runGlowGroveRouteCheck,
  runLanternBurstCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'glowGroveGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.glowGroveGameSelfCheck = runSelfCheck(4);
    }
  });
}
