const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'lumen-lift',
  shortTitle: '琉光升塔',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreGoal: 88,
  scoreHazard: 32,
  scoreClear: 245,
  hitPenalty: 38,
  labels: {
    progress: '光台',
    wait: '稳光',
  },
  storage: {
    score: 'demoCodexLumenLiftBestScore',
    floor: 'demoCodexLumenLiftBestStage',
  },
  special: {
    label: '聚光',
    button: '聚光',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 个棱镜箱推上补光台，再穿过顶层闸门。',
    exit: '光塔已经点亮，沿升降井立即撤离。',
  },
  overlay: {
    kicker: '塔心简报',
    title: '按开始或 Enter 点亮塔心',
    body: '方向键推动棱镜箱，空格等待，Q 释放聚光脉冲，让暗影暂停一回合。',
    gameOverTitle: '灯阵失衡',
    hitTitle: '暗影擦碰',
    hitBody: '你被暗影逼回了起点。',
  },
  copy: {
    boot: '先把 3 个棱镜箱推上补光台，再去顶层闸门。',
    live: '补光塔在闪烁，稳住箱位再前进。',
    unlocked: '顶层闸门已经打开。',
    progress: '补光台亮起了一座。',
    special: '聚光脉冲暂时压住了暗影。',
    hit: '暗影扫到了你。',
    clear: '这一层光阵已经稳定。',
    gameOver: '电量耗尽，按 Enter 或按钮重新点亮。',
  },
  palette: {
    bg: '#08111f',
    gridA: '#14213a',
    gridB: '#101a2e',
    wall: '#52627c',
    goal: '#7dd3fc',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#e0f2fe',
    box: '#fbbf24',
    boxLocked: '#8b5cf6',
    hazard: '#fb7185',
    special: '#c084fc',
    player: '#f8fafc',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 5, y: 2 },
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
        '.g.S.g.',
        '...#...',
        '.h..b..',
        '..b...X',
      ],
    },
    {
      rows: [
        '.......',
        '.g..b.h',
        '..#.#..',
        '.b.S.g.',
        '..#.#..',
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
        '....#..',
        '.h..g.b',
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
    window.runSelfCheck = runSelfCheck;
    const game = runtime.bootstrap(CONFIG, 'lumenLiftGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.lumenLiftGameSelfCheck = runSelfCheck(4);
    }
  });
}
