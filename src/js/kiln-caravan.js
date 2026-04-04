const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'kiln-caravan',
  shortTitle: '窑火押运',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  spreadHazards: true,
  scoreGoal: 95,
  scoreHazard: 30,
  scoreClear: 255,
  hitPenalty: 40,
  labels: {
    progress: '窑位',
    wait: '稳住',
  },
  storage: {
    score: 'demoCodexKilnCaravanBestScore',
    floor: 'demoCodexKilnCaravanBestStage',
  },
  special: {
    label: '冷扇',
    button: '冷扇',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 辆陶坯车推上窑位，再回到窑门旁。',
    exit: '窑位全亮了，马上撤回窑门。',
  },
  overlay: {
    kicker: '窑场简报',
    title: '按开始或 Enter 进入窑场',
    body: '方向键推动陶坯车，空格原地稳住，Q 扇出冷风清掉周边火星。',
    gameOverTitle: '窑火失控',
    hitTitle: '火星逼退',
    hitBody: '你被火星浪逼回了入口。',
  },
  copy: {
    boot: '把 3 辆陶坯车推上窑位，再回到窑门旁。',
    live: '先把窑位顺序理顺，再决定何时清火。',
    unlocked: '全部窑位点亮了。',
    progress: '一辆陶坯车已压住窑位。',
    special: '冷扇清掉了一圈火星。',
    hit: '你被火星烫退了一步。',
    clear: '本轮窑火押运完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新押运。',
  },
  palette: {
    bg: '#170c08',
    gridA: '#2b150d',
    gridB: '#231008',
    wall: '#7c4a2d',
    goal: '#facc15',
    exitOn: '#22c55e',
    exitOff: '#5b3418',
    item: '#fde68a',
    box: '#fdba74',
    boxLocked: '#f97316',
    hazard: '#fb7185',
    special: '#ffedd5',
    player: '#f59e0b',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 1, y: 5 },
    { x: 5, y: 5 },
  ],
  maxExtraHazards: 1,
  templates: [
    {
      rows: [
        '.......',
        '.b.g..h',
        '..#....',
        '.g.S.b.',
        '....#..',
        '.h..g.b',
        '......X',
      ],
    },
    {
      rows: [
        '.......',
        '.g..b.h',
        '...#...',
        '.b.S..g',
        '.h..#..',
        '.g..b..',
        '...#..X',
      ],
    },
    {
      rows: [
        '.......',
        '.b.g..h',
        '.#.....',
        '.g.S.b.',
        '...h#..',
        '.b..g..',
        '..#...X',
      ],
    },
  ],
};

function runSelfCheck(rounds = 4) {
  return core.runSelfCheck(CONFIG, rounds);
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
    const game = runtime.bootstrap(CONFIG, 'kilnCaravanGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.kilnCaravanGameSelfCheck = runSelfCheck(4);
    }
  });
}
