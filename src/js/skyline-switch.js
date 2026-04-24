const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'skyline-switch',
  shortTitle: '云塔换轨',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: true,
  scoreItem: 65,
  scoreHazard: 35,
  scoreSwitch: 30,
  scoreClear: 300,
  hitPenalty: 35,
  labels: {
    progress: '信标',
    wait: '悬停',
  },
  storage: {
    score: 'demoCodexSkylineSwitchBestScore',
    floor: 'demoCodexSkylineSwitchBestFloor',
  },
  special: {
    label: '风剪',
    button: '风剪脉冲',
    effect: 'clear',
    radius: 2,
    cooldown: 4,
  },
  objective: {
    ready: '先收回 5 枚云标，开闸后用换轨门补路线。',
    exit: '信标已经回收完毕，从塔台出口撤离。',
  },
  overlay: {
    kicker: '云塔简报',
    title: '按开始或 Enter 接管塔台',
    body: '移动会沿云轨滑到停点，先踩开云闸，再借换轨门折返收回深处信标。',
    gameOverTitle: '云塔失守',
    hitTitle: '气旋冲撞',
    hitBody: '你被气旋吹回了塔台起点。',
  },
  copy: {
    boot: '先开闸，再沿滑轨和换轨门回收 5 枚信标。',
    live: '观察下一次滑行停点，别把自己送进气旋线。',
    unlocked: '信标已归位，可以沿塔台出口撤离。',
    progress: '一枚云标已经回收。',
    special: '风剪脉冲清掉了近处气旋。',
    switch: '云闸已经抬起，换轨路线打开。',
    teleport: '换轨门把你送到了另一侧塔层。',
    hit: '气旋撞上了护盾。',
    clear: '这一层云塔已经完成回收。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管塔台。',
  },
  palette: {
    bg: '#071422',
    gridA: '#0f2535',
    gridB: '#0a1a29',
    wall: '#24445f',
    goal: '#facc15',
    exitOn: '#a7f3d0',
    exitOff: '#475569',
    item: '#fef08a',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ecfeff',
    switch: '#facc15',
    gateClosed: '#7c3aed',
    gateOpen: '#38bdf8',
    teleport: '#a78bfa',
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
        '#S..c..X#',
        '#.###.#.#',
        '#s.c.d1.#',
        '#.#h#.#.#',
        '#..c..#.#',
        '#1.#.c..#',
        '#..h..c.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S.c..1X#',
        '#.###.#.#',
        '#s..d.c.#',
        '#.#h#.#.#',
        '#1.c..#.#',
        '#..#.c..#',
        '#c.h....#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S..c..X#',
        '#.##d#..#',
        '#s.1..c.#',
        '#.#h#.#.#',
        '#..c..#.#',
        '#..#.c..#',
        '#c..h1..#',
        '#########',
      ],
    },
  ],
};

function createSwitchSlideLayout() {
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

function runSwitchSlideCheck() {
  const layout = createSwitchSlideLayout();
  const state = core.createState(CONFIG, layout, { floor: 1, mode: 'active', score: 0 });

  const opened = core.applyAction(CONFIG, layout, state, 'right');
  if (opened.invalid || !opened.triggeredSwitch || !opened.state.gatesOpen) {
    return { ok: false, reason: 'skyline-switch-did-not-open-gate', details: opened };
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
    return { ok: false, reason: 'skyline-slide-teleport-failed', details: shifted };
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

  const switchSlide = runSwitchSlideCheck();
  if (!switchSlide.ok) {
    return switchSlide;
  }

  return {
    ...base,
    switchSlide,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runSwitchSlideCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'skylineSwitchGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.skylineSwitchGameSelfCheck = runSelfCheck(4);
    }
  });
}
