const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'reef-raider',
  shortTitle: '海岭夺潮',
  mode: 'items',
  target: 6,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 50,
  scoreHazard: 35,
  scoreClear: 250,
  hitPenalty: 40,
  labels: {
    progress: '遗物',
    wait: '漂停',
  },
  storage: {
    score: 'demoCodexReefRaiderBestScore',
    floor: 'demoCodexReefRaiderBestStage',
  },
  special: {
    label: '声呐',
    button: '声呐',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '先打捞 6 枚遗物，再沿着右下出口上浮。',
    exit: '海面已经打通，立刻上浮。',
  },
  overlay: {
    kicker: '海床简报',
    title: '按开始或 Enter 进入海床',
    body: '方向键或 WASD 游动，空格保持漂停，Q 释放声呐脉冲冻结附近潮流。',
    gameOverTitle: '氧气耗尽',
    hitTitle: '潮流逼退',
    hitBody: '漩涡把你卷回了起点。',
  },
  copy: {
    boot: '先打捞 6 枚遗物，再沿着右下出口上浮。',
    live: '潮流正在合拢，先抢遗物再换路。',
    unlocked: '海面出口已经亮起。',
    progress: '一枚遗物已打捞上浮。',
    special: '声呐脉冲压住了附近潮流。',
    hit: '漩涡把你卷回了起点。',
    clear: '这一片海床已经打捞完毕。',
    gameOver: '氧气耗尽，按 Enter 或按钮重新下潜。',
  },
  palette: {
    bg: '#03101f',
    gridA: '#082233',
    gridB: '#06192a',
    wall: '#173649',
    goal: '#60a5fa',
    exitOn: '#34d399',
    exitOff: '#425466',
    item: '#7dd3fc',
    box: '#94a3b8',
    boxLocked: '#22d3ee',
    hazard: '#fb7185',
    special: '#4fd1c5',
    player: '#fef08a',
  },
  templates: [
    {
      rows: [
        '.......',
        '.c..h.c',
        '..#.#..',
        '.h.S.h.',
        '..#.#..',
        '.c...c.',
        '......X',
      ],
    },
    {
      rows: [
        '.......',
        '.c...c.',
        '..#.#..',
        '.h.S.c.',
        '..#.#..',
        '.c..h.c',
        '...c..X',
      ],
    },
    {
      rows: [
        '.......',
        '.c..c..',
        '..#.#..',
        '.h.S.c.',
        '.c...c.',
        '..#.#..',
        '...c..X',
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
    const game = runtime.bootstrap(CONFIG, 'reefRaiderGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.reefRaiderGameSelfCheck = runSelfCheck(4);
    }
  });
}
