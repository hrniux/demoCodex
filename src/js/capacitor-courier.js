const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'capacitor-courier',
  shortTitle: '电容信使',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 90,
  scoreSwitch: 28,
  scoreHazard: 36,
  scoreClear: 310,
  hitPenalty: 38,
  labels: {
    progress: '导流座',
    wait: '稳压',
  },
  storage: {
    score: 'demoCodexCapacitorCourierBestScore',
    floor: 'demoCodexCapacitorCourierBestFloor',
  },
  special: {
    label: '绝缘',
    button: '绝缘脉冲',
    effect: 'clear',
    radius: 1,
    cooldown: 4,
  },
  objective: {
    ready: '先踩断路闸，再把 3 个电容箱推上导流座。',
    exit: '导流座已经接通，从右上检修口撤离。',
  },
  overlay: {
    kicker: '电站简报',
    title: '按开始或 Enter 接管电站',
    body: '移动、开闸、推箱都按回合结算。电弧会追近，绝缘脉冲只能清掉贴身威胁。',
    gameOverTitle: '电站过载',
    hitTitle: '电弧击中护盾',
    hitBody: '浪涌把你弹回了入口。',
  },
  copy: {
    boot: '开闸、推电容箱、接通 3 个导流座后撤离。',
    live: '优先判断箱子的背面角度，别让电弧堵住检修口。',
    unlocked: '导流座已接通，可以撤离。',
    progress: '一个导流座已经接通。',
    special: '绝缘脉冲清掉了贴身电弧。',
    switch: '断路闸已经打开，深层电缆通道连通。',
    hit: '电弧撞上了护盾。',
    clear: '这一层电站已经稳定。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管电站。',
  },
  palette: {
    bg: '#0b1210',
    gridA: '#10231f',
    gridB: '#0c1917',
    wall: '#2f4f46',
    goal: '#22d3ee',
    exitOn: '#bef264',
    exitOff: '#475569',
    item: '#fef08a',
    box: '#facc15',
    boxLocked: '#5eead4',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ecfeff',
    switch: '#a3e635',
    gateClosed: '#0ea5e9',
    gateOpen: '#34d399',
    teleport: '#c084fc',
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

function createCourierRouteLayout() {
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

function runCourierRouteCheck() {
  const layout = createCourierRouteLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'capacitor-courier-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'capacitor-courier-gate-step-failed', details: throughGate };
  }

  const powered = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    powered.invalid ||
    powered.state.progress !== 1 ||
    !powered.state.boxes[0].locked ||
    powered.state.score !== 118
  ) {
    return { ok: false, reason: 'capacitor-courier-push-failed', details: powered };
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

function runInsulationPulseCheck() {
  const layout = createCourierRouteLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });
  state.player = { x: 2, y: 2 };
  state.boxes = [];
  state.hazards = [
    { id: 0, x: 2, y: 1 },
    { id: 1, x: 3, y: 2 },
    { id: 2, x: 6, y: 6 },
  ];

  const pulse = core.applyAction(CONFIG, layout, state, 'ability');
  if (
    pulse.invalid ||
    pulse.clearedHazards !== 2 ||
    pulse.state.specialCooldown !== 4 ||
    pulse.state.score !== 72
  ) {
    return { ok: false, reason: 'capacitor-courier-pulse-failed', details: pulse };
  }

  return {
    ok: true,
    clearedHazards: pulse.clearedHazards,
    cooldown: pulse.state.specialCooldown,
    score: pulse.state.score,
    remainingHazards: pulse.state.hazards.length,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const courierRoute = runCourierRouteCheck();
  if (!courierRoute.ok) {
    return courierRoute;
  }

  const insulationPulse = runInsulationPulseCheck();
  if (!insulationPulse.ok) {
    return insulationPulse;
  }

  return {
    ...base,
    courierRoute,
    insulationPulse,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runCourierRouteCheck,
  runInsulationPulseCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'capacitorCourierGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.capacitorCourierGameSelfCheck = runSelfCheck(4);
    }
  });
}
