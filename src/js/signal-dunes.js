const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'signal-dunes',
  shortTitle: '沙讯回收',
  mode: 'items',
  target: 6,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: false,
  scoreItem: 50,
  scoreHazard: 25,
  scoreClear: 240,
  hitPenalty: 30,
  labels: {
    progress: '信标',
    wait: '稳舵',
  },
  storage: {
    score: 'demoCodexSignalDunesBestScore',
    floor: 'demoCodexSignalDunesBestFloor',
  },
  special: {
    label: '沙幕',
    button: '沙幕',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '收回 6 处信标，再滑回信号塔撤离。',
    exit: '信号塔已经恢复，沿沙脊撤离。',
  },
  overlay: {
    kicker: '沙海简报',
    title: '按开始或 Enter 出航',
    body: '左右切线会一路滑到底，空格稳舵，Q 放沙幕吹散近身幻影。',
    gameOverTitle: '沙船搁浅',
    hitTitle: '幻影撞击',
    hitBody: '你被热浪幻影推回了起点。',
  },
  copy: {
    boot: '先收回 6 处信标。',
    live: '沙脊会把你一路送到停点，慢一点更容易收全。',
    unlocked: '信号塔已经点亮，可以撤离。',
    progress: '沙海里又找回一处信标。',
    special: '沙幕吹散了近身幻影。',
    hit: '幻影撞到了你的护盾。',
    clear: '这片沙海已经重新接通。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新回收。',
  },
  palette: {
    bg: '#24160b',
    gridA: '#332013',
    gridB: '#2a1a0e',
    wall: '#6d4a25',
    goal: '#fbbf24',
    exitOn: '#34d399',
    exitOff: '#7c5b2e',
    item: '#fde68a',
    box: '#fcd34d',
    boxLocked: '#67e8f9',
    hazard: '#fb7185',
    special: '#f8fafc',
    player: '#fff8d6',
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
        '.c..h..c',
        '..#.....',
        '.c.S.c..',
        '..#..#..',
        '.h.c..c.',
        '...#....',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.c..h..c',
        '..#..#..',
        '.c.S.c..',
        '..#.....',
        '.h..c.c.',
        '...#....',
        '....X...',
      ],
    },
    {
      rows: [
        '........',
        '.c..h..c',
        '.#.....#',
        '.c.S.c..',
        '..#.....',
        '.h.c.c..',
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
    const game = runtime.bootstrap(CONFIG, 'signalDunesGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.signalDunesGameSelfCheck = runSelfCheck(4);
    }
  });
}
