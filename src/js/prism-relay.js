const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'prism-relay',
  shortTitle: '棱镜中继',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 92,
  scoreSwitch: 34,
  scoreHazard: 38,
  scoreClear: 315,
  hitPenalty: 40,
  labels: {
    progress: '中继座',
    wait: '校准',
  },
  storage: {
    score: 'demoCodexPrismRelayBestScore',
    floor: 'demoCodexPrismRelayBestFloor',
  },
  special: {
    label: '折光',
    button: '折光脉冲',
    effect: 'clear',
    radius: 1,
    cooldown: 4,
  },
  objective: {
    ready: '踩开光闸，再把 3 个棱镜块推上中继座。',
    exit: '中继座已经连通，从右上维护口撤离。',
  },
  overlay: {
    kicker: '中继简报',
    title: '按开始或 Enter 校准棱镜',
    body: '移动、开闸、推棱镜都按回合结算。光痕会逼近，折光脉冲只能清掉贴身威胁。',
    gameOverTitle: '光路过载',
    hitTitle: '光痕击中护盾',
    hitBody: '偏折失败，你被弹回了入口。',
  },
  copy: {
    boot: '开闸、推棱镜、点亮 3 个中继座后撤离。',
    live: '先找棱镜背面角度，再计算光痕下一步会封住哪条路。',
    unlocked: '中继座已连通，可以撤离。',
    progress: '一个中继座已经点亮。',
    special: '折光脉冲清掉了贴身光痕。',
    switch: '光闸已经打开，棱镜通道连通。',
    hit: '光痕撞上了护盾。',
    clear: '这一层光路已经恢复。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新校准。',
  },
  palette: {
    bg: '#10111a',
    gridA: '#172033',
    gridB: '#121927',
    wall: '#334155',
    goal: '#f0abfc',
    exitOn: '#fde68a',
    exitOff: '#475569',
    item: '#a5f3fc',
    box: '#67e8f9',
    boxLocked: '#f9a8d4',
    hazard: '#fb7185',
    special: '#fef3c7',
    player: '#f8fafc',
    switch: '#a7f3d0',
    gateClosed: '#818cf8',
    gateOpen: '#22d3ee',
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

function createPrismRelayRouteLayout() {
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

function runPrismRelayRouteCheck() {
  const layout = createPrismRelayRouteLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'prism-relay-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'prism-relay-gate-step-failed', details: throughGate };
  }

  const powered = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    powered.invalid ||
    powered.state.progress !== 1 ||
    !powered.state.boxes[0].locked ||
    powered.state.score !== 126
  ) {
    return { ok: false, reason: 'prism-relay-push-failed', details: powered };
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

function runRefractionPulseCheck() {
  const layout = createPrismRelayRouteLayout();
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
    pulse.state.score !== 76
  ) {
    return { ok: false, reason: 'prism-relay-pulse-failed', details: pulse };
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

  const relayRoute = runPrismRelayRouteCheck();
  if (!relayRoute.ok) {
    return relayRoute;
  }

  const refractionPulse = runRefractionPulseCheck();
  if (!refractionPulse.ok) {
    return refractionPulse;
  }

  return {
    ...base,
    relayRoute,
    refractionPulse,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runPrismRelayRouteCheck,
  runRefractionPulseCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'prismRelayGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.prismRelayGameSelfCheck = runSelfCheck(4);
    }
  });
}
