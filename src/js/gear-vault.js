const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'gear-vault',
  shortTitle: '齿轮库房',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 115,
  scoreSwitch: 30,
  scoreHazard: 35,
  scoreClear: 330,
  hitPenalty: 40,
  labels: {
    progress: '锁位',
    wait: '校准',
  },
  storage: {
    score: 'demoCodexGearVaultBestScore',
    floor: 'demoCodexGearVaultBestFloor',
  },
  special: {
    label: '止轮',
    button: '止轮器',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '踩开齿轮门，把 3 个机芯箱推上锁位。',
    exit: '锁位全部压稳，从右上出口撤离。',
  },
  overlay: {
    kicker: '库房简报',
    title: '按开始或 Enter 接管库房',
    body: '换向舱只送人不送箱，先换边找角度，再把机芯箱推入锁位。',
    gameOverTitle: '库房失控',
    hitTitle: '齿轮逼近',
    hitBody: '追击齿轮把你逼回了入口。',
  },
  copy: {
    boot: '先踩开齿轮门，再推 3 个机芯箱压住锁位。',
    live: '别急着推箱，先确认换向舱后的返回路线。',
    unlocked: '锁位已经压稳，可以撤离。',
    progress: '一个机芯箱已经压住锁位。',
    special: '止轮器让追击齿轮停了一拍。',
    switch: '齿轮门已经打开，内层库房连通。',
    teleport: '换向舱把你送到了另一侧机房。',
    hit: '追击齿轮撞上了护盾。',
    clear: '这一层库房已经锁定完成。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管库房。',
  },
  palette: {
    bg: '#0b1020',
    gridA: '#172033',
    gridB: '#101827',
    wall: '#334155',
    goal: '#fbbf24',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#facc15',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#facc15',
    gateClosed: '#64748b',
    gateOpen: '#22c55e',
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
        '#S..s.dX#',
        '#.##.#.g#',
        '#1..b..##',
        '#.#h#...#',
        '#..b..1.#',
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
        '#1..b..##',
        '#.#h#...#',
        '#..b..1.#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S..s.dX#',
        '#.##.#.g#',
        '#2..b..##',
        '#.#h#...#',
        '#..b..2.#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
  ],
};

function createGatePushLayout() {
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

function runGatePushCheck() {
  const layout = createGatePushLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'gear-switch-did-not-open-gate', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'gear-open-gate-step-failed', details: throughGate };
  }

  const pushed = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    pushed.invalid ||
    pushed.state.progress !== 1 ||
    !pushed.state.boxes[0].locked ||
    pushed.state.score !== 145
  ) {
    return { ok: false, reason: 'gear-gated-push-failed', details: pushed };
  }

  return {
    ok: true,
    gatesOpen: pushed.state.gatesOpen,
    player: pushed.state.player,
    box: pushed.state.boxes[0],
    progress: pushed.state.progress,
    score: pushed.state.score,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const gatePush = runGatePushCheck();
  if (!gatePush.ok) {
    return gatePush;
  }

  return {
    ...base,
    gatePush,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runGatePushCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'gearVaultGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.gearVaultGameSelfCheck = runSelfCheck(4);
    }
  });
}
