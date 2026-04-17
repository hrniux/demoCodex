const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'phase-garden',
  shortTitle: '相位花园回收',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 60,
  scoreHazard: 35,
  scoreSwitch: 25,
  scoreClear: 280,
  hitPenalty: 40,
  labels: {
    progress: '样本',
    wait: '稳场',
  },
  storage: {
    score: 'demoCodexPhaseGardenBestScore',
    floor: 'demoCodexPhaseGardenBestFloor',
  },
  special: {
    label: '净场',
    button: '净场脉冲',
    effect: 'clear',
    radius: 2,
    cooldown: 4,
  },
  objective: {
    ready: '回收 5 份样本，借相位门穿过花廊并从撤离井离场。',
    exit: '样本已经装箱，沿撤离井折返离开花圃。',
  },
  overlay: {
    kicker: '花圃调度',
    title: '按开始或 Enter 进入回收区',
    body: '相位门会决定主路线，先开闸门再取深处样本，Q 释放净场脉冲清掉近身孢体。',
    gameOverTitle: '花圃失守',
    hitTitle: '孢体侵袭',
    hitBody: '你被失控孢体逼回了起点。',
  },
  copy: {
    boot: '先回收 5 份样本，开闸后再沿相位门深入花圃。',
    live: '别在门前停太久，孢体会沿花槽继续增殖。',
    unlocked: '回收箱已封存，可以撤离。',
    progress: '又回收了一份相位样本。',
    special: '净场脉冲清空了近身孢体。',
    switch: '闸门全部打开，深层花廊已经连通。',
    teleport: '相位门把你甩到了另一侧花廊。',
    hit: '孢体扑到了你的护盾。',
    clear: '这一层花圃已经完成回收。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管花圃。',
  },
  palette: {
    bg: '#050b12',
    gridA: '#0d1822',
    gridB: '#09111a',
    wall: '#20384c',
    goal: '#fde047',
    exitOn: '#bef264',
    exitOff: '#385064',
    item: '#a3e635',
    box: '#8b5cf6',
    boxLocked: '#f59e0b',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ecfeff',
    teleport: '#67e8f9',
    switch: '#f472b6',
    gateClosed: '#7c3aed',
    gateOpen: '#34d399',
  },
  extraHazards: [
    { x: 6, y: 1 },
    { x: 2, y: 6 },
    { x: 7, y: 5 },
    { x: 4, y: 7 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '#########',
        '#S.c#1.c#',
        '#.#.#d#.#',
        '#s#...#.#',
        '#.#h#.#X#',
        '#1.c.#..#',
        '#.#d#.#c#',
        '#c..h..5#',
        '#####5###',
      ],
    },
    {
      rows: [
        '#########',
        '#S..#1.c#',
        '#.#d#.#.#',
        '#s#c.#h.#',
        '#.#.#.#X#',
        '#1..#..c#',
        '#.#d#.#.#',
        '#c.h..5c#',
        '#####5###',
      ],
    },
    {
      rows: [
        '#########',
        '#S.c#1..#',
        '#.#d#.#c#',
        '#s#..h#.#',
        '#.#.#.#X#',
        '#1c.#..c#',
        '#.#d#.#.#',
        '#c..h.5.#',
        '#####5###',
      ],
    },
  ],
};

function runPhaseGateCheck() {
  const layout = core.parseTemplate(CONFIG, 1, 4242);
  layout.walls = new Set();
  layout.gates = [];
  layout.gateKeys = new Set();
  layout.switches = [];
  layout.switchKeys = new Set();
  layout.teleporters = [
    { id: '1', x: 2, y: 1 },
    { id: '1', x: 5, y: 4 },
  ];
  layout.teleportMap = new Map([
    ['2:1', { x: 5, y: 4 }],
    ['5:4', { x: 2, y: 1 }],
  ]);
  layout.start = { x: 1, y: 1 };
  layout.exit = { x: 6, y: 6 };

  const teleportState = core.createState(CONFIG, layout, {
    floor: 1,
    mode: 'active',
    score: 0,
  });
  teleportState.player = { x: 1, y: 1 };
  teleportState.items = [{ id: 0, x: 5, y: 4, active: true }];
  teleportState.hazards = [];
  teleportState.boxes = [];

  const teleported = core.applyAction(CONFIG, layout, teleportState, 'right');
  if (
    teleported.invalid ||
    !teleported.teleported ||
    teleported.state.player.x !== 5 ||
    teleported.state.player.y !== 4 ||
    teleported.state.progress !== 1
  ) {
    return { ok: false, reason: 'phase-teleport-route-failed', details: teleported };
  }

  const clearState = core.createState(CONFIG, layout, {
    floor: 1,
    mode: 'active',
    score: 0,
  });
  clearState.player = { x: 4, y: 4 };
  clearState.items = [];
  clearState.boxes = [];
  clearState.hazards = [
    { id: 0, x: 4, y: 3 },
    { id: 1, x: 5, y: 4 },
    { id: 2, x: 7, y: 7 },
  ];

  const cleared = core.applyAction(CONFIG, layout, clearState, 'ability');
  if (
    cleared.invalid ||
    cleared.clearedHazards !== 2 ||
    cleared.state.score !== 70 ||
    cleared.state.specialCooldown !== 4
  ) {
    return { ok: false, reason: 'phase-clear-failed', details: cleared };
  }

  return {
    ok: true,
    teleportTarget: teleported.state.player,
    clearedHazards: cleared.clearedHazards,
    scoreAfterClear: cleared.state.score,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const phaseGate = runPhaseGateCheck();
  if (!phaseGate.ok) {
    return phaseGate;
  }

  return {
    ...base,
    phaseGate,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'phaseGardenGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.phaseGardenGameSelfCheck = runSelfCheck(4);
    }
  });
}
