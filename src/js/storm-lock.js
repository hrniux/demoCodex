const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'storm-lock',
  shortTitle: '风暴锁港',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 110,
  scoreSwitch: 35,
  scoreHazard: 35,
  scoreClear: 320,
  hitPenalty: 40,
  labels: {
    progress: '闸位',
    wait: '巡防',
  },
  storage: {
    score: 'demoCodexStormLockBestScore',
    floor: 'demoCodexStormLockBestFloor',
  },
  special: {
    label: '静电停摆',
    button: '静电停摆',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '先开门换边，再把 3 个重箱推进闸位。',
    exit: '闸位已全部接通，从出口撤离。',
  },
  overlay: {
    kicker: '锁港简报',
    title: '按开始或 Enter 接管港闸',
    body: '这不是单纯推箱页。开门、换边、推进与撤离必须连成一条战术链，拖延只会让浪涌扩散。',
    gameOverTitle: '锁港失守',
    hitTitle: '浪涌拍击',
    hitBody: '你被浪涌拍回了港口起点。',
  },
  copy: {
    boot: '先开门换边，再把 3 个重箱推进闸位。',
    live: '先铺撤离路线，再考虑推进顺序。',
    unlocked: '全部闸位已接通，可以撤离。',
    progress: '一个闸位已经压住重箱。',
    special: '静电停摆压住了浪涌。',
    hit: '浪涌突破了你的防线。',
    clear: '这一层锁港已经稳住。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新攻港。',
    switch: '闸控已经打开，内外港连通。',
    teleport: '已借跃迁航道换边，继续推进重箱。',
  },
  palette: {
    bg: '#06111c',
    gridA: '#0f2233',
    gridB: '#0a1927',
    wall: '#27465d',
    goal: '#fbbf24',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#bae6fd',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
    switch: '#67e8f9',
    gateClosed: '#f97316',
    gateOpen: '#0f766e',
    teleport: '#c084fc',
  },
  extraHazards: [
    { x: 6, y: 1 },
    { x: 5, y: 5 },
    { x: 2, y: 6 },
    { x: 1, y: 4 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '########',
        '#S.sdbX#',
        '#.##.#g#',
        '#1..h..#',
        '#.#.##.#',
        '#..b..1#',
        '#g..h.bg',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S.sddX#',
        '#.##.#g#',
        '#1..h.b#',
        '#.#.##.#',
        '#b..#21#',
        '#g.hb.2g',
        '########',
      ],
    },
    {
      rows: [
        '########',
        '#S.sdbX#',
        '#.##.#g#',
        '#2..h.1#',
        '#.#.##.#',
        '#b..#2.#',
        '#g.hb.1g',
        '########',
      ],
    },
  ],
};

function createGateTeleportConfig() {
  return {
    ...CONFIG,
    name: 'storm-lock-linkage-check',
    templates: [
      {
        rows: [
          '######',
          '#Ss1X#',
          '#.##.#',
          '#..1.#',
          '#..d.#',
          '######',
        ],
      },
    ],
  };
}

function runTeleportGateLinkCheck() {
  const config = createGateTeleportConfig();
  const layout = core.parseTemplate(config, 1, 4242);
  const state = core.createState(config, layout, { floor: 1, mode: 'active' });

  const switchStep = core.applyAction(config, layout, state, 'right');
  if (switchStep.invalid || !switchStep.state.gatesOpen) {
    return { ok: false, reason: 'switch-did-not-open-gates', details: switchStep };
  }

  const teleportStep = core.applyAction(config, layout, switchStep.state, 'right');
  if (teleportStep.invalid || !teleportStep.teleported) {
    return { ok: false, reason: 'teleport-after-switch-failed', details: teleportStep };
  }

  if (teleportStep.state.player.x !== 3 || teleportStep.state.player.y !== 3) {
    return {
      ok: false,
      reason: 'teleport-after-switch-wrong-destination',
      player: teleportStep.state.player,
    };
  }

  return {
    ok: true,
    gatesOpen: teleportStep.state.gatesOpen,
    teleported: teleportStep.teleported,
    player: teleportStep.state.player,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const linkage = runTeleportGateLinkCheck();
  if (!linkage.ok) {
    return linkage;
  }

  return {
    ...base,
    linkage,
  };
}

const internals = {
  CONFIG,
  runSelfCheck,
  runTeleportGateLinkCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'stormLockGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.stormLockGameSelfCheck = runSelfCheck(4);
    }
  });
}
