const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'moss-mission',
  shortTitle: '苔径侦查',
  mode: 'items',
  target: 6,
  maxHull: 3,
  spreadHazards: true,
  scoreItem: 45,
  scoreHazard: 25,
  scoreClear: 240,
  hitPenalty: 35,
  labels: {
    progress: '露芽',
    wait: '潜伏',
  },
  storage: {
    score: 'demoCodexMossMissionBestScore',
    floor: 'demoCodexMossMissionBestStage',
  },
  special: {
    label: '灯苞',
    button: '灯苞',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '收回 6 枚露芽样本，再回到温室门口。',
    exit: '样本到手了，立刻折返温室门。',
  },
  overlay: {
    kicker: '温室简报',
    title: '按开始或 Enter 进入温室',
    body: '方向键移动，空格潜伏一回合，Q 释放灯苞脉冲清掉周边孢子藤。',
    gameOverTitle: '温室失守',
    hitTitle: '藤刺逼近',
    hitBody: '你被孢子藤逼回了入口。',
  },
  copy: {
    boot: '收回 6 枚露芽样本，再回到温室门口。',
    live: '先把路线压短，再考虑何时清场。',
    unlocked: '样本齐了，门口已经打开。',
    progress: '一枚露芽样本已经入袋。',
    special: '灯苞脉冲清出了一圈空地。',
    hit: '你被孢子藤缠住了。',
    clear: '本区温室侦查完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新侦查。',
  },
  palette: {
    bg: '#071410',
    gridA: '#10231b',
    gridB: '#0c1a14',
    wall: '#3f5b4b',
    goal: '#84cc16',
    exitOn: '#fde047',
    exitOff: '#365314',
    item: '#bef264',
    box: '#84cc16',
    boxLocked: '#65a30d',
    hazard: '#f97316',
    special: '#fef08a',
    player: '#4ade80',
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
        '.c..h..',
        '..#..c.',
        '.h.S...',
        '.c..#..',
        '...c..h',
        '.c...cX',
      ],
    },
    {
      rows: [
        '.......',
        '.h.c..c',
        '...#...',
        '.c.S.h.',
        '..#..c.',
        '.h...c.',
        '.c....X',
      ],
    },
    {
      rows: [
        '.......',
        '.c.h.c.',
        '.#.....',
        '.c.S..h',
        '...#...',
        '.h.c...',
        '.c...cX',
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
    const game = runtime.bootstrap(CONFIG, 'mossMissionGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.mossMissionGameSelfCheck = runSelfCheck(4);
    }
  });
}
