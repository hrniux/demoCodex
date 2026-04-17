const runtime =
  typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core =
  typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'breaker-yard',
  shortTitle: '断路车场',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 110,
  scoreHazard: 35,
  scoreClear: 270,
  scoreSwitch: 45,
  hitPenalty: 45,
  labels: {
    progress: '检修位',
    wait: '待命',
  },
  storage: {
    score: 'demoCodexBreakerYardBestScore',
    floor: 'demoCodexBreakerYardBestFloor',
  },
  special: {
    label: '压制',
    button: '压制脉冲',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '先踩开总闸，再把 3 个断路箱推上检修位。',
    exit: '检修位已经锁定，沿维修通道撤离。',
  },
  overlay: {
    kicker: '车场调度',
    title: '按开始或 Enter 进入断路车场',
    body: '先踩开关抬门，再推箱占位。Q 可短暂冻结扩散中的电弧。',
    gameOverTitle: '车场失守',
    hitTitle: '电弧灼伤',
    hitBody: '你被跳弧逼回了起点，车场还在继续失控。',
  },
  copy: {
    boot: '先去踩开关，把闸门抬起来。',
    live: '电弧会继续扩散，别在窄道里停太久。',
    switch: '闸门已经抬起，车场路线彻底改写。',
    unlocked: '检修位全部到位，沿维修线撤离。',
    progress: '又有一个断路箱压进了检修位。',
    special: '压制脉冲短暂冻住了电弧。',
    hit: '你被扩散电弧刮到了。',
    clear: '这片车场的断路箱已经全部归位。',
    gameOver: '护甲耗尽，按 Enter 或按钮重新接管车场。',
  },
  palette: {
    bg: '#091018',
    gridA: '#121b26',
    gridB: '#0d151d',
    wall: '#3f4e5c',
    goal: '#f59e0b',
    exitOn: '#34d399',
    exitOff: '#556070',
    item: '#cbd5e1',
    box: '#fb923c',
    boxLocked: '#facc15',
    hazard: '#fb7185',
    special: '#e0f2fe',
    player: '#ffffff',
    switch: '#38bdf8',
    gateClosed: '#64748b',
    gateOpen: '#22d3ee',
    teleport: '#a78bfa',
  },
  extraHazards: [
    { x: 1, y: 5 },
    { x: 6, y: 1 },
    { x: 5, y: 6 },
    { x: 2, y: 2 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '########',
        '#S.s..X#',
        '#.##d###',
        '#b..d.g#',
        '#..##..#',
        '#h.b..g#',
        '#..#b.g#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S..s.X#',
        '#.###d##',
        '#b..d.g#',
        '#.#.##.#',
        '#h.b..g#',
        '#..#b.g#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S.s..X#',
        '#.##d###',
        '#b..d.g#',
        '#..#..##',
        '#h.b..g#',
        '#..#b.g#',
        '########',
      ],
    },
  ],
};

function runGateCheck() {
  const gateConfig = {
    ...CONFIG,
    target: 1,
    templates: [
      {
        rows: [
          '........',
          '.s.dbg..',
          '.....X..',
          '.S......',
          '........',
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
  let blocked = core.applyAction(gateConfig, layout, blockedState, 'right');
  if (!blocked.invalid) {
    return { ok: false, reason: 'gate-should-block', details: blocked };
  }

  let state = core.createState(gateConfig, layout, { floor: 1, mode: 'active' });
  state = core.applyAction(gateConfig, layout, state, 'up').state;
  const switched = core.applyAction(gateConfig, layout, state, 'up');
  if (!switched.state.gatesOpen || !switched.changed) {
    return { ok: false, reason: 'switch-did-not-open-gate', details: switched };
  }

  let openedState = switched.state;
  openedState = core.applyAction(gateConfig, layout, openedState, 'right').state;
  const throughGate = core.applyAction(gateConfig, layout, openedState, 'right');
  if (throughGate.invalid || !throughGate.state.gatesOpen) {
    return { ok: false, reason: 'gate-did-not-stay-open', details: throughGate };
  }

  let progressedState = throughGate.state;
  const pushed = core.applyAction(gateConfig, layout, progressedState, 'right');
  if (pushed.state.progress !== 1 || !pushed.state.boxes[0].locked) {
    return { ok: false, reason: 'post-switch-goal-failed', details: pushed };
  }

  const spreadState = core.createState(gateConfig, layout, { floor: 1, mode: 'active' });
  spreadState.player = { x: 2, y: 3 };
  spreadState.gatesOpen = true;
  spreadState.hazards = [{ id: 0, x: 5, y: 5 }];
  const beforeHazards = spreadState.hazards.length;
  const waited = core.applyAction(gateConfig, layout, spreadState, 'wait');
  if (waited.state.hazards.length <= beforeHazards) {
    return { ok: false, reason: 'hazard-did-not-spread-after-gate', details: waited };
  }

  return {
    ok: true,
    opened: switched.state.gatesOpen,
    progress: pushed.state.progress,
    hazardsBefore: beforeHazards,
    hazardsAfter: waited.state.hazards.length,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const gate = runGateCheck();
  if (!gate.ok) {
    return gate;
  }

  return {
    ok: true,
    base,
    gate,
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
    const game = runtime.bootstrap(CONFIG, 'breakerYardGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.breakerYardGameSelfCheck = runSelfCheck(4);
    }
  });
}
