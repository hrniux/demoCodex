const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'mirror-vault',
  shortTitle: '镜库折返推箱',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreGoal: 110,
  scoreHazard: 30,
  scoreSwitch: 20,
  scoreClear: 300,
  hitPenalty: 45,
  labels: {
    progress: '镜匣',
    wait: '停驻',
  },
  storage: {
    score: 'demoCodexMirrorVaultBestScore',
    floor: 'demoCodexMirrorVaultBestFloor',
  },
  special: {
    label: '冻结',
    button: '镜封',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '把 3 个镜匣推入基座，借镜门换边后再从出口撤离。',
    exit: '基座已经锁定，沿回廊折返离开镜库。',
  },
  overlay: {
    kicker: '镜库存档',
    title: '按开始或 Enter 进入镜库',
    body: '镜门只传送人，不会替你搬箱。先换边，再从正确角度把镜匣推入锁位。',
    gameOverTitle: '镜库沦陷',
    hitTitle: '巡逻体拦截',
    hitBody: '你被镜库巡逻体逼回了入口。',
  },
  copy: {
    boot: '先换边，再把 3 个镜匣推入基座。',
    live: '镜匣的推进角度比速度更重要，别轻易把路堵死。',
    unlocked: '镜匣已经锁定，可以折返撤离。',
    progress: '一个镜匣已经锁进基座。',
    special: '镜封场冻结了巡逻体。',
    switch: '镜库闸锁已解除，新的推送角度打开了。',
    teleport: '你从镜门换到了另一侧回廊。',
    hit: '巡逻体撞到了你的护盾。',
    clear: '这一层镜库已经完成封存。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新接管镜库。',
  },
  palette: {
    bg: '#120b08',
    gridA: '#21130f',
    gridB: '#170e0b',
    wall: '#5b392b',
    goal: '#fde68a',
    exitOn: '#fb923c',
    exitOff: '#6b4a3b',
    item: '#e879f9',
    box: '#818cf8',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#fff7ed',
    teleport: '#a78bfa',
    switch: '#fdba74',
    gateClosed: '#7c2d12',
    gateOpen: '#f59e0b',
  },
  extraHazards: [
    { x: 5, y: 1 },
    { x: 2, y: 4 },
    { x: 6, y: 5 },
  ],
  maxExtraHazards: 1,
  templates: [
    {
      rows: [
        '#########',
        '#S..#1..#',
        '#.#d#.#g#',
        '#s#b.#..#',
        '#.#.#.#X#',
        '#1.h#b#g#',
        '#.#d#.#.#',
        '#..b..g.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S..#1g.#',
        '#.#d#.#.#',
        '#s#b.#h.#',
        '#.#.#.#X#',
        '#1..#b#g#',
        '#.#d#.#.#',
        '#..b..g.#',
        '#########',
      ],
    },
    {
      rows: [
        '#########',
        '#S.g#1..#',
        '#.#d#.#.#',
        '#s#b.#..#',
        '#.#.#.#X#',
        '#1.h#b#g#',
        '#.#d#.#.#',
        '#..b..g.#',
        '#########',
      ],
    },
  ],
};

function runMirrorTeleportPushCheck() {
  const layout = core.parseTemplate(CONFIG, 1, 4242);
  layout.walls = new Set();
  layout.gates = [];
  layout.gateKeys = new Set();
  layout.switches = [];
  layout.switchKeys = new Set();
  layout.teleporters = [
    { id: '1', x: 2, y: 1 },
    { id: '1', x: 4, y: 3 },
  ];
  layout.teleportMap = new Map([
    ['2:1', { x: 4, y: 3 }],
    ['4:3', { x: 2, y: 1 }],
  ]);
  layout.goals = [{ id: 0, x: 2, y: 3 }];
  layout.goalKeys = new Set(['2:3']);
  layout.start = { x: 1, y: 1 };
  layout.exit = { x: 6, y: 6 };

  const state = core.createState(CONFIG, layout, {
    floor: 1,
    mode: 'active',
    score: 0,
  });
  state.player = { x: 1, y: 1 };
  state.items = [];
  state.hazards = [];
  state.boxes = [{ id: 0, x: 3, y: 3, locked: false }];

  const teleported = core.applyAction(CONFIG, layout, state, 'right');
  if (
    teleported.invalid ||
    !teleported.teleported ||
    teleported.state.player.x !== 4 ||
    teleported.state.player.y !== 3
  ) {
    return { ok: false, reason: 'mirror-teleport-failed', details: teleported };
  }

  const pushed = core.applyAction(CONFIG, layout, teleported.state, 'left');
  if (
    pushed.invalid ||
    pushed.state.progress !== 1 ||
    !pushed.state.boxes[0].locked ||
    pushed.state.boxes[0].x !== 2 ||
    pushed.state.boxes[0].y !== 3
  ) {
    return { ok: false, reason: 'mirror-push-after-teleport-failed', details: pushed };
  }

  return {
    ok: true,
    playerAfterTeleport: teleported.state.player,
    lockedBox: pushed.state.boxes[0],
    scoreAfterLock: pushed.state.score,
  };
}

function runSelfCheck(rounds = 4) {
  const base = core.runSelfCheck(CONFIG, rounds);
  if (!base.ok) {
    return base;
  }

  const mirrorCheck = runMirrorTeleportPushCheck();
  if (!mirrorCheck.ok) {
    return mirrorCheck;
  }

  return {
    ...base,
    mirrorCheck,
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
    const game = runtime.bootstrap(CONFIG, 'mirrorVaultGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.mirrorVaultGameSelfCheck = runSelfCheck(4);
    }
  });
}
