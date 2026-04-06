const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'aurora-breach',
  shortTitle: '极光突围',
  mode: 'items',
  target: 5,
  maxHull: 3,
  spreadHazards: true,
  scoreItem: 55,
  scoreClear: 250,
  hitPenalty: 35,
  labels: {
    progress: '极核',
    wait: '稳住',
  },
  storage: {
    score: 'demoCodexAuroraBreachBestScore',
    floor: 'demoCodexAuroraBreachBestStage',
  },
  special: {
    label: '静场',
    button: '静场',
    effect: 'freeze',
    cooldown: 3,
  },
  objective: {
    ready: '收回 5 枚极核样本，再回到观测门。',
    exit: '极核已经齐了，立刻撤回观测门。',
  },
  overlay: {
    kicker: '雪原简报',
    title: '按开始或 Enter 进入雪原',
    body: '方向键移动，空格原地稳住，Q 展开极光静场，把风暴影冻结一回合。',
    gameOverTitle: '雪原失守',
    hitTitle: '风暴逼退',
    hitBody: '你被风暴影逼回了观测门。',
  },
  copy: {
    boot: '收回 5 枚极核样本，再回到观测门。',
    live: '先压短路线，再决定何时冻结风暴影。',
    unlocked: '极核样本已经齐了，观测门打开。',
    progress: '一枚极核样本已经回收。',
    special: '极光静场压住了整片风暴影。',
    hit: '你被风暴影刮退了一步。',
    clear: '本轮极光突围完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新突围。',
  },
  palette: {
    bg: '#07131d',
    gridA: '#102536',
    gridB: '#0b1c29',
    wall: '#475569',
    goal: '#38bdf8',
    exitOn: '#34d399',
    exitOff: '#334155',
    item: '#a5f3fc',
    box: '#7dd3fc',
    boxLocked: '#38bdf8',
    hazard: '#8b5cf6',
    special: '#e0f2fe',
    player: '#fde68a',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 7, y: 1 },
    { x: 1, y: 7 },
    { x: 7, y: 7 },
  ],
  maxExtraHazards: 1,
  templates: [
    {
      rows: [
        '.........',
        '.c...h..c',
        '..#......',
        '.h..c....',
        '....S.#..',
        '.c......h',
        '...#.....',
        '.h....c..',
        '......c.X',
      ],
    },
    {
      rows: [
        '.........',
        '.h..c...c',
        '....#....',
        '.c...h...',
        '..#S.....',
        '.....c..h',
        '.c....#..',
        '.h.......',
        '....c...X',
      ],
    },
    {
      rows: [
        '.........',
        '.c..h....',
        '..#...c..',
        '.h.......',
        '...S.#.c.',
        '.c......h',
        '....#....',
        '.h...c...',
        '......c.X',
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
    const game = runtime.bootstrap(CONFIG, 'auroraBreachGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.auroraBreachGameSelfCheck = runSelfCheck(4);
    }
  });
}
