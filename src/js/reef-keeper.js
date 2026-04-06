const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'reef-keeper',
  shortTitle: '礁环守卫',
  mode: 'goals',
  target: 4,
  maxHull: 4,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreItem: 0,
  scoreHazard: 35,
  scoreGoal: 90,
  scoreClear: 260,
  hitPenalty: 45,
  labels: {
    progress: '礁环',
    wait: '待命',
  },
  storage: {
    score: 'demoCodexReefKeeperBestScore',
    floor: 'demoCodexReefKeeperBestStage',
  },
  special: {
    label: '潮钟',
    button: '潮钟',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '先把 4 个珊瑚环推到潮锚上，再从右下海门撤离。',
    exit: '护礁屏障已经稳定，沿右下海门撤离。',
  },
  overlay: {
    kicker: '潮汐简报',
    title: '按开始或 Enter 进入礁图',
    body: '方向键或 WASD 推动珊瑚环，空格原地待命，Q 敲响潮钟冻结近处海流。',
    gameOverTitle: '护礁失守',
    hitTitle: '潮影逼近',
    hitBody: '暗流把你推回了起点。',
  },
  copy: {
    boot: '先把 4 个珊瑚环推到潮锚上，再从右下海门撤离。',
    live: '先稳住礁道，再把最后一个珊瑚环推上潮锚。',
    unlocked: '护礁屏障已经稳定。',
    progress: '一个珊瑚环已经锁在潮锚上。',
    special: '潮钟让近处海流停顿了两回合。',
    hit: '潮影把你推回了起点。',
    clear: '这一层礁图已经守住了。',
    gameOver: '珊瑚护盾耗尽，按 Enter 或按钮重新守礁。',
  },
  palette: {
    bg: '#04131f',
    gridA: '#0a2433',
    gridB: '#071a27',
    wall: '#1f6b6a',
    goal: '#f59e0b',
    exitOn: '#34d399',
    exitOff: '#15424c',
    item: '#7dd3fc',
    box: '#7ee0d9',
    boxLocked: '#facc15',
    hazard: '#fb7185',
    special: '#60a5fa',
    player: '#fef08a',
  },
  templates: [
    {
      rows: [
        '...h...',
        '.gb.bg.',
        '..#.#..',
        '.b.S.b.',
        '..#.#..',
        '.gb.bg.',
        '......X',
      ],
    },
    {
      rows: [
        '..h....',
        '.gb.bg.',
        '.#...#.',
        '.b.S.b.',
        '.#...#.',
        '.gb.bg.',
        '......X',
      ],
    },
    {
      rows: [
        '.......',
        '.gb.bg.',
        '..#.#h.',
        '.b.S.b.',
        '.h#.#..',
        '.gb.bg.',
        '......X',
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
  window.runSelfCheck = runSelfCheck;
  window.addEventListener('DOMContentLoaded', () => {
    const game = runtime.bootstrap(CONFIG, 'reefKeeperGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.reefKeeperGameSelfCheck = runSelfCheck(4);
    }
  });
}
