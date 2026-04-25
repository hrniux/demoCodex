const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'crystal-conduit',
  shortTitle: '晶流导管',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 105,
  scoreSwitch: 25,
  scoreHazard: 35,
  scoreClear: 320,
  hitPenalty: 40,
  labels: {
    progress: '导管',
    wait: '稳压',
  },
  storage: {
    score: 'demoCodexCrystalConduitBestScore',
    floor: 'demoCodexCrystalConduitBestFloor',
  },
  special: {
    label: '凝滞',
    button: '凝滞场',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '先踩稳压板开门，再把 3 个晶匣推上导管座。',
    exit: '导管已经接通，从右上出口撤离。',
  },
  overlay: {
    kicker: '导管简报',
    title: '按开始或 Enter 接管导管',
    body: '传导门只传送人不传送晶匣，必须先换边找角度，再把晶匣压进导管座。',
    gameOverTitle: '导管过载',
    hitTitle: '晶噪逼近',
    hitBody: '晶噪把你逼回了维护口。',
  },
  copy: {
    boot: '开门、换边、推晶匣，接通 3 段导管。',
    live: '先找推箱角度，再考虑是否用凝滞场换时间。',
    unlocked: '导管已接通，可以撤离。',
    progress: '一段晶流导管已经接通。',
    special: '凝滞场让晶噪停了一拍。',
    switch: '稳压门已经打开，内层导管连通。',
    teleport: '传导门把你送到了另一侧维护廊。',
    hit: '晶噪撞上了护盾。',
    clear: '这一层晶流导管已经接通。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管导管。',
  },
  palette: {
    bg: '#07111f',
    gridA: '#12213a',
    gridB: '#0d182b',
    wall: '#334155',
    goal: '#facc15',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#fef08a',
    box: '#93c5fd',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#facc15',
    gateClosed: '#7c3aed',
    gateOpen: '#38bdf8',
    teleport: '#5eead4',
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
        '#2..b..##',
        '#.#h#...#',
        '#..b..2.#',
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
        '#1..b..##',
        '#.#h#...#',
        '#..b..1.#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
  ],
};

function createConduitPushLayout() {
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

function runConduitPushCheck() {
  const layout = createConduitPushLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'crystal-switch-did-not-open-gate', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'crystal-open-gate-step-failed', details: throughGate };
  }

  const pushed = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (
    pushed.invalid ||
    pushed.state.progress !== 1 ||
    !pushed.state.boxes[0].locked ||
    pushed.state.score !== 130
  ) {
    return { ok: false, reason: 'crystal-gated-push-failed', details: pushed };
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

  const conduitPush = runConduitPushCheck();
  if (!conduitPush.ok) {
    return conduitPush;
  }

  return {
    ...base,
    conduitPush,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runConduitPushCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'crystalConduitGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.crystalConduitGameSelfCheck = runSelfCheck(4);
    }
  });
}
