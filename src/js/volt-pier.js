const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'volt-pier',
  shortTitle: '潮涌码头',
  mode: 'goals',
  target: 4,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: true,
  scoreGoal: 95,
  scoreHazard: 35,
  scoreClear: 240,
  hitPenalty: 40,
  labels: {
    progress: '电箱',
    wait: '巡检',
  },
  storage: {
    score: 'demoCodexVoltPierBestScore',
    floor: 'demoCodexVoltPierBestFloor',
  },
  special: {
    label: '断路',
    button: '断路器',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '把 4 个电容箱推入闸位，再回到灯塔门口。',
    exit: '潮汐闸位已经带电，沿码头撤离。',
  },
  overlay: {
    kicker: '码头简报',
    title: '按开始或 Enter 接管港栈',
    body: '方向键推动电容箱，空格巡检，Q 拉下断路器，先压住浪涌再收港口。',
    gameOverTitle: '港栈失守',
    hitTitle: '浪涌拍击',
    hitBody: '你被失控电流拍回了起点。',
  },
  copy: {
    boot: '先把 4 个电容箱推到闸位。',
    live: '浪涌会慢慢往前挤，别把自己堵死。',
    unlocked: '灯塔已经通电，可以撤离。',
    progress: '闸位已经接通一个电箱。',
    special: '断路器压住了近身浪涌。',
    hit: '浪涌拍到了你的护盾。',
    clear: '潮汐码头这一层已经稳住。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新防线。',
  },
  palette: {
    bg: '#06111c',
    gridA: '#0e2130',
    gridB: '#0a1825',
    wall: '#26455f',
    goal: '#fbbf24',
    exitOn: '#34d399',
    exitOff: '#475569',
    item: '#bae6fd',
    box: '#7dd3fc',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#ffffff',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 6, y: 5 },
    { x: 2, y: 6 },
    { x: 5, y: 2 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '........',
        '.b..h..g',
        '..#.....',
        '.g.S.b..',
        '..#..#..',
        '.h..g..b',
        '..g#..b.',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.b..h..g',
        '..#..#..',
        '.g.S.b..',
        '..#.....',
        '.h.g..b.',
        '..g#..b.',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.b...h.g',
        '..#.....',
        '.g.S.b..',
        '..#..#..',
        '.h..g.b.',
        '..g#..b.',
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
    const game = runtime.bootstrap(CONFIG, 'voltPierGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.voltPierGameSelfCheck = runSelfCheck(4);
    }
  });
}
