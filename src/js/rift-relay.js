const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'rift-relay',
  shortTitle: '裂隙中继',
  mode: 'items',
  target: 4,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: false,
  scoreItem: 60,
  scoreHazard: 30,
  scoreClear: 280,
  hitPenalty: 35,
  labels: {
    progress: '芯片',
    wait: '稳位',
  },
  storage: {
    score: 'demoCodexRiftRelayBestScore',
    floor: 'demoCodexRiftRelayBestFloor',
  },
  special: {
    label: '相位清场',
    button: '相位清场',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '回收 4 枚裂隙芯片，再滑到出口撤离。',
    exit: '出口已稳定，抓住停点窗口撤离。',
  },
  overlay: {
    kicker: '中继简报',
    title: '按开始或 Enter 进入中继站',
    body: '裂隙滑道会把你一路送到停点。先想清楚停在哪里，再决定要不要借传送门换边。',
    gameOverTitle: '裂隙吞没',
    hitTitle: '故障体撞击',
    hitBody: '你被故障体撞回了中继起点。',
  },
  copy: {
    boot: '先回收 4 枚裂隙芯片。',
    live: '滑行之前先确认停点，传送门更像是第二段路线。',
    unlocked: '出口已经稳定，可以撤离。',
    progress: '一枚裂隙芯片已经回收。',
    special: '相位清场扫掉了近身故障体。',
    hit: '故障体撞到了你的护盾。',
    clear: '这一层中继回路已经重连。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接入。',
    teleport: '借裂口换位成功，继续回收下一枚芯片。',
  },
  palette: {
    bg: '#050914',
    gridA: '#0d1730',
    gridB: '#081122',
    wall: '#1d3b53',
    goal: '#fbbf24',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#fef08a',
    box: '#67e8f9',
    boxLocked: '#f59e0b',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#22d3ee',
    gateClosed: '#f97316',
    gateOpen: '#0f766e',
    teleport: '#a78bfa',
  },
  extraHazards: [
    { x: 1, y: 6 },
    { x: 6, y: 1 },
    { x: 3, y: 5 },
  ],
  maxExtraHazards: 1,
  templates: [
    {
      rows: [
        '########',
        '#S..1.c#',
        '#.#.##.#',
        '#c..#..#',
        '#.#..#.#',
        '#1#c.hX#',
        '#..h.c.#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S.c#1.#',
        '#.#..#.#',
        '#..h...#',
        '#.##.#c#',
        '#1..#..#',
        '#c.h..X#',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S..#c.#',
        '#.#.#1.#',
        '#c...#.#',
        '#.##...#',
        '#1#h#cX#',
        '#..h.c.#',
        '########',
      ],
    },
  ],
};

function createTeleportSlideConfig() {
  return {
    ...CONFIG,
    name: 'rift-relay-teleport-check',
    templates: [
      {
        rows: [
          '#######',
          '#S..1.#',
          '#.....#',
          '#1#...#',
          '#....X#',
          '#.....#',
          '#######',
        ],
      },
    ],
  };
}

function runPortalSlideCheck() {
  const config = createTeleportSlideConfig();
  const layout = core.parseTemplate(config, 1, 4242);
  const state = core.createState(config, layout, { floor: 1, mode: 'active' });
  const moved = core.applyAction(config, layout, state, 'right');

  if (moved.invalid || !moved.teleported) {
    return { ok: false, reason: 'slide-teleport-not-triggered', details: moved };
  }

  if (moved.state.player.x !== 1 || moved.state.player.y !== 3) {
    return {
      ok: false,
      reason: 'slide-teleport-wrong-destination',
      player: moved.state.player,
    };
  }

  return {
    ok: true,
    teleported: moved.teleported,
    player: moved.state.player,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const portalSlide = runPortalSlideCheck();
  if (!portalSlide.ok) {
    return portalSlide;
  }

  return {
    ...base,
    portalSlide,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runPortalSlideCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'riftRelayGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.riftRelayGameSelfCheck = runSelfCheck(4);
    }
  });
}
