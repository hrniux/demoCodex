const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'thorn-trail',
  shortTitle: '荆棘小径',
  mode: 'items',
  target: 7,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 48,
  scoreHazard: 32,
  scoreClear: 260,
  hitPenalty: 40,
  labels: {
    progress: '露芽',
    wait: '停步',
  },
  storage: {
    score: 'demoCodexThornTrailBestScore',
    floor: 'demoCodexThornTrailBestStage',
  },
  special: {
    label: '修枝',
    button: '修枝刀',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '摘下 7 颗露芽，再沿着修出的路回到林门。',
    exit: '林门已经松开，沿着修出的路返回。',
  },
  overlay: {
    kicker: '荆棘简报',
    title: '按开始或 Enter 进入荆棘小径',
    body: '方向键逐格前进，空格停步，Q 挥出修枝刀，清掉身旁一圈藤刺。',
    gameOverTitle: '荆棘封路',
    hitTitle: '藤刺反扑',
    hitBody: '藤刺缠住了你的脚步。',
  },
  copy: {
    boot: '摘下 7 颗露芽，再沿着修出的路回到林门。',
    live: '多绕一步，也别直接撞进藤刺堆里。',
    unlocked: '林门已经松开。',
    progress: '露芽已经采下。',
    special: '修枝刀清出了一圈空地。',
    hit: '藤刺擦到了你。',
    clear: '这一轮的露芽已经收齐。',
    gameOver: '护盾清空，按 Enter 或按钮重新穿行。',
  },
  palette: {
    bg: '#07130d',
    gridA: '#13261a',
    gridB: '#0e1d14',
    wall: '#3f6212',
    goal: '#bef264',
    exitOn: '#facc15',
    exitOff: '#334155',
    item: '#f97316',
    box: '#86efac',
    boxLocked: '#4ade80',
    hazard: '#1f2937',
    special: '#fef3c7',
    player: '#f8fafc',
  },
  extraHazards: [
    { x: 2, y: 1 },
    { x: 6, y: 1 },
    { x: 1, y: 6 },
    { x: 7, y: 5 },
    { x: 5, y: 2 },
  ],
  maxExtraHazards: 3,
  templates: [
    {
      rows: [
        '.........',
        '.c.h..c..',
        '..#.#.#..',
        '.h..S..h.',
        '..#...#..',
        '.c..h..c.',
        '...c.c...',
        '..##.##..',
        '...#...X.',
      ],
    },
    {
      rows: [
        '.........',
        '.c..h.c..',
        '..#...#..',
        '.h.#S#..h',
        '..#...#..',
        '.c..h..c.',
        '...c...c.',
        '..##.##..',
        '...#...X.',
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
    const game = runtime.bootstrap(CONFIG, 'thornTrailGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.thornTrailGameSelfCheck = runSelfCheck(4);
    }
  });
}
