const runtime =
  typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core =
  typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'ember-gate',
  shortTitle: '余烬闸门',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 55,
  scoreHazard: 35,
  scoreClear: 260,
  scoreSwitch: 40,
  hitPenalty: 40,
  labels: {
    progress: '回收量',
    wait: '屏息',
  },
  storage: {
    score: 'demoCodexEmberGateBestScore',
    floor: 'demoCodexEmberGateBestFloor',
  },
  special: {
    label: '清除',
    button: '清灰脉冲',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '先打开熔门，再收回 5 枚余烬芯。',
    exit: '余烬芯已经回收完毕，抢在火浪封门前撤离。',
  },
  overlay: {
    kicker: '火线回收',
    title: '按开始或 Enter 冲入余烬闸门',
    body: '先踩开关抬门，再抢收余烬芯。Q 能吹散近身火点，但冷却很短也很要命。',
    gameOverTitle: '火线封死',
    hitTitle: '熔浪扑面',
    hitBody: '你被火点逼回外环，闸门内侧还在继续升温。',
  },
  copy: {
    boot: '先踩开开关，闸门后面才是回收区。',
    live: '火点会一边追你一边增殖，撤离窗口在不断缩小。',
    switch: '熔门抬起，内仓和撤离线同时暴露了。',
    unlocked: '余烬芯已全部回收，立刻撤离。',
    progress: '又有一枚余烬芯被收回。',
    special: '清灰脉冲吹散了近身火点。',
    hit: '你被熔浪边缘灼到了。',
    clear: '这一层的余烬已经全部回收入库。',
    gameOver: '护甲耗尽，按 Enter 或按钮重新冲入火线。',
  },
  palette: {
    bg: '#160705',
    gridA: '#2b0f0a',
    gridB: '#210c08',
    wall: '#6b2f1f',
    goal: '#fb923c',
    exitOn: '#facc15',
    exitOff: '#7c3b24',
    item: '#fde68a',
    box: '#f59e0b',
    boxLocked: '#f97316',
    hazard: '#fb7185',
    special: '#fff7ed',
    player: '#fff1dd',
    switch: '#fdba74',
    gateClosed: '#7f1d1d',
    gateOpen: '#fb923c',
    teleport: '#fbbf24',
  },
  extraHazards: [
    { x: 1, y: 5 },
    { x: 6, y: 2 },
    { x: 5, y: 6 },
    { x: 2, y: 1 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '########',
        '#S..s.X#',
        '#.##d###',
        '#c..d.c#',
        '#.#.##.#',
        '#h.c..c#',
        '#..#..c#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S.s..X#',
        '#.##d###',
        '#c..d.c#',
        '#..#.###',
        '#h.c..c#',
        '#..#..c#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S..s.X#',
        '#.##d###',
        '#c..d.c#',
        '#.#..#.#',
        '#h.c..c#',
        '#..#..c#',
        '########',
      ],
    },
  ],
};

function runPressureCheck() {
  const gateConfig = {
    ...CONFIG,
    target: 2,
    templates: [
      {
        rows: [
          '........',
          '.s.d.c..',
          '....X...',
          '.S..h...',
          '....c...',
          '........',
          '........',
          '........',
        ],
      },
    ],
  };
  const layout = core.parseTemplate(gateConfig, 1, 4242);

  const blockedState = core.createState(gateConfig, layout, { floor: 1, mode: 'active' });
  blockedState.player = { x: 2, y: 1 };
  const blocked = core.applyAction(gateConfig, layout, blockedState, 'right');
  if (!blocked.invalid) {
    return { ok: false, reason: 'gate-should-block', details: blocked };
  }

  let state = core.createState(gateConfig, layout, { floor: 1, mode: 'active' });
  state = core.applyAction(gateConfig, layout, state, 'up').state;
  const switched = core.applyAction(gateConfig, layout, state, 'up');
  if (!switched.state.gatesOpen) {
    return { ok: false, reason: 'switch-did-not-open-gate', details: switched };
  }

  const afterSwitch = switched.state;
  const beforeHazards = afterSwitch.hazards.length;
  const waited = core.applyAction(gateConfig, layout, afterSwitch, 'wait');
  if (waited.state.hazards.length <= beforeHazards) {
    return { ok: false, reason: 'pressure-did-not-grow', details: waited };
  }

  const pressureState = waited.state;
  pressureState.player = { x: 4, y: 3 };
  pressureState.hazards = [
    { id: 0, x: 4, y: 2 },
    { id: 1, x: 3, y: 3 },
  ];
  pressureState.specialCooldown = 0;
  const cleared = core.applyAction(gateConfig, layout, pressureState, 'ability');
  if (cleared.invalid || cleared.state.hazards.length !== 0) {
    return { ok: false, reason: 'clear-did-not-relieve-pressure', details: cleared };
  }

  return {
    ok: true,
    opened: switched.state.gatesOpen,
    hazardsBefore: beforeHazards,
    hazardsAfter: waited.state.hazards.length,
    hazardsCleared: 2,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const pressure = runPressureCheck();
  if (!pressure.ok) {
    return pressure;
  }

  return {
    ok: true,
    base,
    pressure,
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
    const game = runtime.bootstrap(CONFIG, 'emberGateGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.emberGateGameSelfCheck = runSelfCheck(4);
    }
  });
}
