const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'copper-crossing',
  shortTitle: '铜轨换桥',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 115,
  scoreSwitch: 25,
  scoreHazard: 35,
  scoreClear: 340,
  hitPenalty: 40,
  labels: {
    progress: '桥座',
    wait: '等待',
  },
  storage: {
    score: 'demoCodexCopperCrossingBestScore',
    floor: 'demoCodexCopperCrossingBestFloor',
  },
  special: {
    label: '停机',
    button: '停机波',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '踩开桥闸，借换桥门绕位，把 3 个铜箱推上桥座。',
    exit: '桥座已经压稳，从北侧桥口撤离。',
  },
  overlay: {
    kicker: '桥面简报',
    title: '按开始或 Enter 接管铜轨',
    body: '换桥门只送人不送箱。先开桥闸，换边找推箱角度，再用停机波拖住巡轨影。',
    gameOverTitle: '铜轨断桥',
    hitTitle: '巡轨影逼近',
    hitBody: '巡轨影把你逼回了入口。',
  },
  copy: {
    boot: '开门、换边、推铜箱，把 3 个桥座重新压稳。',
    live: '先找箱子的背面，再决定是否用停机波争取窗口。',
    unlocked: '桥座已压稳，可以撤离。',
    progress: '一个桥座已经压稳。',
    special: '停机波让巡轨影停了两拍。',
    switch: '桥闸已经打开，换桥门路线连通。',
    teleport: '换桥门把你送到了另一侧铜轨。',
    hit: '巡轨影撞上了护盾。',
    clear: '这一层铜轨已经接通。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管铜轨。',
  },
  palette: {
    bg: '#160f0a',
    gridA: '#24170d',
    gridB: '#1a120c',
    wall: '#57534e',
    goal: '#f59e0b',
    exitOn: '#5eead4',
    exitOff: '#57534e',
    item: '#fef3c7',
    box: '#fbbf24',
    boxLocked: '#5eead4',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#facc15',
    gateClosed: '#b45309',
    gateOpen: '#38bdf8',
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
        '#Ss.d.1X#',
        '#.##.#.g#',
        '#..b...##',
        '#.#h#...#',
        '#1..bg..#',
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
        '#..bg.2.#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#Ss..d1X#',
        '#.##.#.g#',
        '#..b...##',
        '#.#h#...#',
        '#1..bg..#',
        '#g.##.#.#',
        '#..h..bg#',
        '#########',
      ],
    },
  ],
};

function createCopperPushLayout() {
  return {
    size: 7,
    walls: new Set(),
    items: [],
    hazards: [],
    goals: [{ id: 0, x: 6, y: 3 }],
    goalKeys: new Set(['6:3']),
    boxes: [{ id: 0, x: 5, y: 3, locked: false }],
    switches: [{ id: 0, x: 2, y: 1 }],
    switchKeys: new Set(['2:1']),
    gates: [{ id: 0, x: 3, y: 1 }],
    gateKeys: new Set(['3:1']),
    teleporters: [
      { id: '1', x: 4, y: 1 },
      { id: '1', x: 4, y: 3 },
    ],
    teleportMap: new Map([
      ['4:1', { x: 4, y: 3 }],
      ['4:3', { x: 4, y: 1 }],
    ]),
    start: { x: 1, y: 1 },
    exit: { x: 6, y: 6 },
  };
}

function runCopperPushCheck() {
  const layout = createCopperPushLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'copper-crossing-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'copper-crossing-gate-step-failed', details: throughGate };
  }

  const bridged = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (bridged.invalid || !bridged.teleported || bridged.state.player.x !== 4 || bridged.state.player.y !== 3) {
    return { ok: false, reason: 'copper-crossing-teleport-failed', details: bridged };
  }

  const pushed = core.applyAction(CONFIG, layout, bridged.state, 'right');
  if (
    pushed.invalid ||
    pushed.state.progress !== 1 ||
    !pushed.state.boxes[0].locked ||
    pushed.state.score !== 140
  ) {
    return { ok: false, reason: 'copper-crossing-push-failed', details: pushed };
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

  const copperPush = runCopperPushCheck();
  if (!copperPush.ok) {
    return copperPush;
  }

  return {
    ...base,
    copperPush,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runCopperPushCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'copperCrossingGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.copperCrossingGameSelfCheck = runSelfCheck(4);
    }
  });
}
