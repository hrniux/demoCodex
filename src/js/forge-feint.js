const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'forge-feint',
  shortTitle: '炉心虚晃',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreGoal: 90,
  scoreHazard: 35,
  scoreClear: 240,
  hitPenalty: 40,
  labels: {
    progress: '锻点',
    wait: '待机',
  },
  storage: {
    score: 'demoCodexForgeFeintBestScore',
    floor: 'demoCodexForgeFeintBestStage',
  },
  special: {
    label: '冷锤',
    button: '冷锤',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '先把 3 块钢胚压进锻点，再踩到侧门撤离。',
    exit: '侧门已经打开，立刻撤离。',
  },
  overlay: {
    kicker: '炉台简报',
    title: '按开始或 Enter 进入锻炉',
    body: '方向键或 WASD 推动钢胚，空格原地等待，Q 释放冷锤冻结附近火星。',
    gameOverTitle: '护具烧穿',
    hitTitle: '火星灼伤',
    hitBody: '火星逼得你退回了起点。',
  },
  copy: {
    boot: '先把 3 块钢胚压进锻点，再踩到侧门撤离。',
    live: '火星在逼近，先骗开它们再推箱。',
    unlocked: '侧门已经点亮。',
    progress: '一处锻点已经压稳。',
    special: '冷锤压住了周围火星。',
    hit: '火星灼伤了你。',
    clear: '这一层炉台已经锻造完毕。',
    gameOver: '护具烧穿了，按 Enter 或按钮重新锻造。',
  },
  palette: {
    bg: '#150a07',
    gridA: '#2b150d',
    gridB: '#22100a',
    wall: '#583124',
    goal: '#f97316',
    exitOn: '#34d399',
    exitOff: '#5b5560',
    item: '#fef3c7',
    box: '#d97706',
    boxLocked: '#fbbf24',
    hazard: '#fb7185',
    special: '#f59e0b',
    player: '#fff1d6',
  },
  templates: [
    {
      rows: [
        '.......',
        '.b.h.b.',
        '..#.#..',
        '.g.S.g.',
        '..g....',
        '..#.#..',
        '......X',
      ],
    },
    {
      rows: [
        '.......',
        '.b..h.b',
        '..#.#..',
        '.g.S.g.',
        '..g....',
        '..#.#..',
        '......X',
      ],
    },
    {
      rows: [
        '.......',
        '.b.h.b.',
        '..#.#..',
        '.g.S.g.',
        '.#...#.',
        '.b.h...',
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
    const game = runtime.bootstrap(CONFIG, 'forgeFeintGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.forgeFeintGameSelfCheck = runSelfCheck(4);
    }
  });
}
