const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'amber-aisle',
  shortTitle: '琥珀长廊',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  spreadHazards: true,
  scoreGoal: 90,
  scoreHazard: 30,
  scoreClear: 250,
  hitPenalty: 40,
  labels: {
    progress: '展台',
    wait: '稳住',
  },
  storage: {
    score: 'demoCodexAmberAisleBestScore',
    floor: 'demoCodexAmberAisleBestStage',
  },
  special: {
    label: '拍灯',
    button: '拍灯',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 个封样箱推上展台，再回到馆门旁。',
    exit: '展台全部点亮了，马上折返馆门。',
  },
  overlay: {
    kicker: '展馆简报',
    title: '按开始或 Enter 进入长廊',
    body: '方向键推动封样箱，空格原地稳住，Q 释放拍灯脉冲清掉周边甲虫。',
    gameOverTitle: '展馆失守',
    hitTitle: '甲虫逼退',
    hitBody: '你被甲虫群挤回了馆门。',
  },
  copy: {
    boot: '把 3 个封样箱推上展台，再回到馆门旁。',
    live: '先理顺展台顺序，再决定清场时机。',
    unlocked: '展台已经全部点亮。',
    progress: '一只封样箱压住了展台。',
    special: '拍灯脉冲清出了一圈空地。',
    hit: '你被甲虫群逼退了一步。',
    clear: '本轮长廊布展完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新布展。',
  },
  palette: {
    bg: '#160d06',
    gridA: '#2b180b',
    gridB: '#221208',
    wall: '#7c4a2d',
    goal: '#facc15',
    exitOn: '#22c55e',
    exitOff: '#5b3418',
    item: '#fde68a',
    box: '#fdba74',
    boxLocked: '#f59e0b',
    hazard: '#fb7185',
    special: '#ffedd5',
    player: '#fbbf24',
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
    const game = runtime.bootstrap(CONFIG, 'amberAisleGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.amberAisleGameSelfCheck = runSelfCheck(4);
    }
  });
}
