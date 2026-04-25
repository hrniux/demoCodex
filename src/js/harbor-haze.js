const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'harbor-haze',
  shortTitle: '雾港航标',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 60,
  scoreHazard: 30,
  scoreSwitch: 25,
  scoreClear: 260,
  hitPenalty: 35,
  labels: {
    progress: '航标',
    wait: '抛锚',
  },
  storage: {
    score: 'demoCodexHarborHazeBestScore',
    floor: 'demoCodexHarborHazeBestFloor',
  },
  special: {
    label: '雾灯',
    button: '雾灯脉冲',
    effect: 'clear',
    radius: 2,
    cooldown: 3,
  },
  objective: {
    ready: '踩开雾闸，穿过回声门，收回 5 枚航标。',
    exit: '航标已经归位，从灯塔出口撤离。',
  },
  overlay: {
    kicker: '雾港简报',
    title: '按开始或 Enter 接管雾港',
    body: '每步都会牵动巡航影，先踩开雾闸，再借回声门绕到深处收回航标。',
    gameOverTitle: '雾港迷航',
    hitTitle: '巡航影贴近',
    hitBody: '你被巡航影逼回了码头起点。',
  },
  copy: {
    boot: '先开闸，再穿过回声门收回 5 枚航标。',
    live: '观察巡航影的下一步，别在窄码头被堵死。',
    unlocked: '航标已归位，可以撤离。',
    progress: '一枚航标已经回收。',
    special: '雾灯脉冲扫开了近处巡航影。',
    switch: '雾闸已经升起，回声门路线打开。',
    teleport: '回声门把你送到了另一段码头。',
    hit: '巡航影撞上了护盾。',
    clear: '这一层雾港已经完成回收。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管雾港。',
  },
  palette: {
    bg: '#07151c',
    gridA: '#102735',
    gridB: '#0b1d29',
    wall: '#2f4f5f',
    goal: '#facc15',
    exitOn: '#a7f3d0',
    exitOff: '#475569',
    item: '#fef08a',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#e0f2fe',
    player: '#f8fafc',
    switch: '#facc15',
    gateClosed: '#0f766e',
    gateOpen: '#67e8f9',
    teleport: '#c084fc',
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
        '#Ss.d..X#',
        '#.##.#..#',
        '#..c.1..#',
        '#.#h#.#.#',
        '#1.c..#.#',
        '#..#.c..#',
        '#c.h..c.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S.s.d.X#',
        '#.##.#..#',
        '#1..c..##',
        '#.#h#...#',
        '#..c..1.#',
        '#c.##.#.#',
        '#..h.c.c#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#Ss..d.X#',
        '#.##.#..#',
        '#..c..1.#',
        '#.#h#.#.#',
        '#1..c.#.#',
        '#..#.c..#',
        '#c.h.c..#',
        '#########',
      ],
    },
  ],
};

function createGateEchoLayout() {
  return {
    size: 7,
    walls: new Set(),
    items: [{ id: 0, x: 5, y: 3, active: true }],
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
      { id: '1', x: 5, y: 3 },
    ],
    teleportMap: new Map([
      ['4:1', { x: 5, y: 3 }],
      ['5:3', { x: 4, y: 1 }],
    ]),
    start: { x: 1, y: 1 },
    exit: { x: 6, y: 6 },
  };
}

function runGateEchoCheck() {
  const layout = createGateEchoLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'harbor-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'harbor-gate-step-failed', details: throughGate };
  }

  const echoed = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    echoed.invalid ||
    !echoed.teleported ||
    echoed.state.player.x !== 5 ||
    echoed.state.player.y !== 3 ||
    echoed.state.progress !== 1 ||
    echoed.state.score !== 85
  ) {
    return { ok: false, reason: 'harbor-echo-collection-failed', details: echoed };
  }

  return {
    ok: true,
    gatesOpen: echoed.state.gatesOpen,
    player: echoed.state.player,
    progress: echoed.state.progress,
    score: echoed.state.score,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const gateEcho = runGateEchoCheck();
  if (!gateEcho.ok) {
    return gateEcho;
  }

  return {
    ...base,
    gateEcho,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runGateEchoCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'harborHazeGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.harborHazeGameSelfCheck = runSelfCheck(4);
    }
  });
}
