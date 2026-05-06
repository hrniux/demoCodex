const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'mist-mender',
  shortTitle: '雾线修补',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: true,
  scoreItem: 70,
  scoreHazard: 35,
  scoreSwitch: 30,
  scoreClear: 290,
  hitPenalty: 35,
  labels: {
    progress: '雾芯',
    wait: '稳灯',
  },
  storage: {
    score: 'demoCodexMistMenderBestScore',
    floor: 'demoCodexMistMenderBestFloor',
  },
  special: {
    label: '净灯',
    button: '净灯脉冲',
    effect: 'clear',
    radius: 2,
    cooldown: 4,
  },
  objective: {
    ready: '沿雾轨滑到停点，踩开雾闸后回收 5 枚雾芯。',
    exit: '雾芯已经接回灯线，从灯塔口撤离。',
  },
  overlay: {
    kicker: '灯线简报',
    title: '按开始或 Enter 修补雾线',
    body: '方向键会让修补工沿雾轨滑到停点。先踩开雾闸，再借折光门换边，收完雾芯后撤离。',
    gameOverTitle: '灯线断开',
    hitTitle: '雾影贴近',
    hitBody: '雾影把你逼回了灯塔口。',
  },
  copy: {
    boot: '先滑到雾闸开关，再穿过折光门回收 5 枚雾芯。',
    live: '每次滑行前先看停点、折光门和雾影位置。',
    unlocked: '雾芯已接回灯线，可以撤离。',
    progress: '一枚雾芯已经回收。',
    special: '净灯脉冲吹散了近处雾影。',
    switch: '雾闸已经升起，折光门路线打开。',
    teleport: '折光门把你送到了另一段灯线。',
    hit: '雾影撞上了护盾。',
    clear: '这一段雾线已经修补完成。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新修补雾线。',
  },
  palette: {
    bg: '#081216',
    gridA: '#12232b',
    gridB: '#0f1d24',
    wall: '#475569',
    goal: '#fef08a',
    exitOn: '#a7f3d0',
    exitOff: '#475569',
    item: '#bae6fd',
    box: '#7dd3fc',
    boxLocked: '#fef08a',
    hazard: '#fb7185',
    special: '#e0f2fe',
    player: '#f8fafc',
    switch: '#fef08a',
    gateClosed: '#2563eb',
    gateOpen: '#5eead4',
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
        '#S.sd1.X#',
        '#.##.#..#',
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
        '#S..sd.X#',
        '#.##.#1.#',
        '#..c..#.#',
        '#.#h#.#.#',
        '#1.c....#',
        '#..#.c..#',
        '#c.h..c.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S.sd..X#',
        '#.##.#1.#',
        '#c....#.#',
        '#.#h#.#.#',
        '#1..c...#',
        '#..#.c..#',
        '#c.h.c..#',
        '#########',
      ],
    },
  ],
};

function createMistSwitchLayout() {
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

function runMistSwitchCheck() {
  const layout = createMistSwitchLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'mist-mender-gate-did-not-open', details: opened };
  }

  const shifted = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (
    shifted.invalid ||
    !shifted.teleported ||
    shifted.state.player.x !== 6 ||
    shifted.state.player.y !== 3 ||
    shifted.state.progress !== 1 ||
    shifted.state.score !== 100
  ) {
    return { ok: false, reason: 'mist-mender-slide-teleport-failed', details: shifted };
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

  const mistSwitch = runMistSwitchCheck();
  if (!mistSwitch.ok) {
    return mistSwitch;
  }

  return {
    ...base,
    mistSwitch,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runMistSwitchCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'mistMenderGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.mistMenderGameSelfCheck = runSelfCheck(4);
    }
  });
}
