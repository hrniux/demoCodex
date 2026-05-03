const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'cinder-canal',
  shortTitle: '烬渠渡工',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: true,
  scoreItem: 65,
  scoreHazard: 35,
  scoreSwitch: 30,
  scoreClear: 280,
  hitPenalty: 35,
  labels: {
    progress: '火芯',
    wait: '稳舵',
  },
  storage: {
    score: 'demoCodexCinderCanalBestScore',
    floor: 'demoCodexCinderCanalBestFloor',
  },
  special: {
    label: '冷雾',
    button: '冷雾喷射',
    effect: 'clear',
    radius: 2,
    cooldown: 4,
  },
  objective: {
    ready: '沿烬渠滑到停点，踩开水闸后回收 5 枚火芯。',
    exit: '火芯已经装箱，从冷却闸口撤离。',
  },
  overlay: {
    kicker: '烬渠简报',
    title: '按开始或 Enter 接管烬渠',
    body: '方向键会让渡工沿烬渠滑到停点。先踩开水闸，再借回声涵洞换边，收完火芯后撤离。',
    gameOverTitle: '烬渠失控',
    hitTitle: '余烬贴近',
    hitBody: '余烬浪把你冲回了维修口。',
  },
  copy: {
    boot: '先滑到水闸开关，再穿过涵洞回收 5 枚火芯。',
    live: '每次滑行前都要先看停点和余烬浪位置。',
    unlocked: '火芯已装箱，可以撤离。',
    progress: '一枚火芯已经回收。',
    special: '冷雾喷射熄掉了近处余烬。',
    switch: '水闸已经升起，涵洞路线打开。',
    teleport: '回声涵洞把你送到了另一段烬渠。',
    hit: '余烬浪撞上了护盾。',
    clear: '这一段烬渠已经安全通过。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管烬渠。',
  },
  palette: {
    bg: '#10100b',
    gridA: '#22180f',
    gridB: '#18202a',
    wall: '#4b5563',
    goal: '#facc15',
    exitOn: '#5eead4',
    exitOff: '#57534e',
    item: '#fed7aa',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#ef4444',
    special: '#e0f2fe',
    player: '#fff7ed',
    switch: '#facc15',
    gateClosed: '#b45309',
    gateOpen: '#38bdf8',
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

function createCanalSwitchLayout() {
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

function runCanalSwitchCheck() {
  const layout = createCanalSwitchLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'cinder-canal-gate-did-not-open', details: opened };
  }

  const shifted = core.applyAction(CONFIG, layout, opened.state, 'right');
  if (
    shifted.invalid ||
    !shifted.teleported ||
    shifted.state.player.x !== 6 ||
    shifted.state.player.y !== 3 ||
    shifted.state.progress !== 1 ||
    shifted.state.score !== 95
  ) {
    return { ok: false, reason: 'cinder-canal-slide-teleport-failed', details: shifted };
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

  const canalSwitch = runCanalSwitchCheck();
  if (!canalSwitch.ok) {
    return canalSwitch;
  }

  return {
    ...base,
    canalSwitch,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runCanalSwitchCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'cinderCanalGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.cinderCanalGameSelfCheck = runSelfCheck(4);
    }
  });
}
