const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'canopy-scout',
  shortTitle: '冠林侦察',
  mode: 'items',
  target: 6,
  maxHull: 3,
  spreadHazards: true,
  scoreItem: 50,
  scoreHazard: 25,
  scoreClear: 245,
  hitPenalty: 35,
  labels: {
    progress: '风种',
    wait: '潜伏',
  },
  storage: {
    score: 'demoCodexCanopyScoutBestScore',
    floor: 'demoCodexCanopyScoutBestStage',
  },
  special: {
    label: '枝剪',
    button: '枝剪',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '收回 6 枚风种信标，再回到索桥口。',
    exit: '风种已经齐了，立刻折返索桥口。',
  },
  overlay: {
    kicker: '树冠简报',
    title: '按开始或 Enter 进入树冠',
    body: '方向键移动，空格潜伏一回合，Q 释放枝剪脉冲清掉身边一圈蔓刺。',
    gameOverTitle: '树冠失守',
    hitTitle: '蔓刺逼退',
    hitBody: '你被蔓刺堵回了索桥口。',
  },
  copy: {
    boot: '收回 6 枚风种信标，再回到索桥口。',
    live: '先把路线压短，再决定清障时机。',
    unlocked: '信标已经齐了，索桥口开放。',
    progress: '一枚风种信标已经入袋。',
    special: '枝剪脉冲清出了一圈空地。',
    hit: '你被蔓刺缠住了。',
    clear: '本区树冠侦察完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新侦察。',
  },
  palette: {
    bg: '#07110c',
    gridA: '#102118',
    gridB: '#0c1a12',
    wall: '#3f5a43',
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
        '..c..h.',
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
        '.h.c...',
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
        '.h..c..',
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
    const game = runtime.bootstrap(CONFIG, 'canopyScoutGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.canopyScoutGameSelfCheck = runSelfCheck(4);
    }
  });
}
