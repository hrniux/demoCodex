const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'orchid-guard',
  shortTitle: '兰园守卫',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreGoal: 100,
  scoreHazard: 30,
  scoreClear: 240,
  hitPenalty: 35,
  labels: {
    progress: '花架',
    wait: '巡护',
  },
  storage: {
    score: 'demoCodexOrchidGuardBestScore',
    floor: 'demoCodexOrchidGuardBestFloor',
  },
  special: {
    label: '花雾',
    button: '喷雾',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 盆花架推入花床基座，再走到温室门口。',
    exit: '花床已经稳住，沿着温室通道撤离。',
  },
  overlay: {
    kicker: '温室简报',
    title: '按开始或 Enter 进入花圃',
    body: '方向键推动花架，空格等待，Q 释放花雾，把近身虫群冻结两拍。',
    gameOverTitle: '温室失守',
    hitTitle: '虫群扑击',
    hitBody: '你被花圃虫群撞回了起点。',
  },
  copy: {
    boot: '先把 3 盆花架推到花床基座。',
    live: '温室里还有冷雾和虫群，慢一点更稳。',
    unlocked: '温室门已经通电，可以撤离。',
    progress: '花床已经接上了一盆花架。',
    special: '花雾罩住了近身虫群。',
    hit: '虫群撞到了你的护盾。',
    clear: '兰园这一层已经稳住。',
    gameOver: '护盾被虫群耗尽，按 Enter 或按钮重新守园。',
  },
  palette: {
    bg: '#07120d',
    gridA: '#0f2419',
    gridB: '#0b1b14',
    wall: '#355a43',
    goal: '#f472b6',
    exitOn: '#34d399',
    exitOff: '#4c6055',
    item: '#c4b5fd',
    box: '#d9f99d',
    boxLocked: '#86efac',
    hazard: '#fb7185',
    special: '#fde68a',
    player: '#f8ffe7',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 6, y: 5 },
    { x: 2, y: 6 },
  ],
  maxExtraHazards: 1,
  templates: [
    {
      rows: [
        '........',
        '.b..h...',
        '..#..g..',
        '.g.S..b.',
        '..#..#..',
        '.h..g..b',
        '...#....',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.h..b...',
        '..#..g..',
        '.g.S.#b.',
        '..#..#..',
        '.b..g..h',
        '...#....',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.b...h..',
        '..#g....',
        '.g.S..b.',
        '..#..#..',
        '.h.g...b',
        '...#....',
        '....X...',
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
    const game = runtime.bootstrap(CONFIG, 'orchidGuardGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.orchidGuardGameSelfCheck = runSelfCheck(4);
    }
  });
}
