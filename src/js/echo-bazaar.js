const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'echo-bazaar',
  shortTitle: '回声集市',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 110,
  scoreSwitch: 30,
  scoreHazard: 35,
  scoreClear: 330,
  hitPenalty: 40,
  labels: {
    progress: '摊位',
    wait: '听声',
  },
  storage: {
    score: 'demoCodexEchoBazaarBestScore',
    floor: 'demoCodexEchoBazaarBestFloor',
  },
  special: {
    label: '静音',
    button: '静音罩',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '踩开铜闸，借回声门绕位，把 3 个货箱推回摊位。',
    exit: '摊位已经归位，从集市北门撤离。',
  },
  overlay: {
    kicker: '集市简报',
    title: '按开始或 Enter 接管集市',
    body: '回声门只送人不送箱。先开铜闸，换边找推箱角度，再用静音罩拖住巡音影。',
    gameOverTitle: '集市失序',
    hitTitle: '巡音影逼近',
    hitBody: '巡音影把你逼回了入口。',
  },
  copy: {
    boot: '开门、换边、推货箱，把 3 个摊位重新摆好。',
    live: '先找箱子的背面，再决定是否用静音罩争取一拍。',
    unlocked: '摊位已归位，可以撤离。',
    progress: '一个摊位已经摆好。',
    special: '静音罩让巡音影停了一拍。',
    switch: '铜闸已经打开，回声门路线连通。',
    teleport: '回声门把你送到了另一侧集市。',
    hit: '巡音影撞上了护盾。',
    clear: '这一层回声集市已经复位。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管集市。',
  },
  palette: {
    bg: '#100f1f',
    gridA: '#211b35',
    gridB: '#171428',
    wall: '#475569',
    goal: '#f59e0b',
    exitOn: '#5eead4',
    exitOff: '#57534e',
    item: '#fef08a',
    box: '#c4b5fd',
    boxLocked: '#f59e0b',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#facc15',
    gateClosed: '#7c3aed',
    gateOpen: '#38bdf8',
    teleport: '#f472b6',
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

function createBazaarPushLayout() {
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

function runBazaarPushCheck() {
  const layout = createBazaarPushLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'echo-bazaar-gate-did-not-open', details: opened };
  }

  const throughGate = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (throughGate.invalid || throughGate.state.player.x !== 3 || throughGate.state.player.y !== 1) {
    return { ok: false, reason: 'echo-bazaar-gate-step-failed', details: throughGate };
  }

  const echoed = core.applyAction(CONFIG, layout, throughGate.state, 'right');
  if (echoed.invalid || !echoed.teleported || echoed.state.player.x !== 4 || echoed.state.player.y !== 3) {
    return { ok: false, reason: 'echo-bazaar-teleport-failed', details: echoed };
  }

  const pushed = core.applyAction(CONFIG, layout, echoed.state, 'right');
  if (
    pushed.invalid ||
    pushed.state.progress !== 1 ||
    !pushed.state.boxes[0].locked ||
    pushed.state.score !== 140
  ) {
    return { ok: false, reason: 'echo-bazaar-push-failed', details: pushed };
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

  const bazaarPush = runBazaarPushCheck();
  if (!bazaarPush.ok) {
    return bazaarPush;
  }

  return {
    ...base,
    bazaarPush,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runBazaarPushCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'echoBazaarGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.echoBazaarGameSelfCheck = runSelfCheck(4);
    }
  });
}
