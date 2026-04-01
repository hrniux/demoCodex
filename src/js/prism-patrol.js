const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'prism-patrol',
  shortTitle: '棱镜巡路',
  mode: 'items',
  target: 5,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: false,
  spreadHazards: true,
  scoreItem: 50,
  scoreHazard: 30,
  scoreClear: 260,
  hitPenalty: 45,
  labels: {
    progress: '棱镜',
    wait: '等待',
  },
  storage: {
    score: 'demoCodexPrismPatrolBestScore',
    floor: 'demoCodexPrismPatrolBestStage',
  },
  special: {
    label: '锁光',
    button: '锁光',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '点亮 5 块棱镜，再冲向右上折跃门。',
    exit: '折跃门已经开启，立刻进入。',
  },
  overlay: {
    kicker: '回廊简报',
    title: '按开始或 Enter 进入折射区',
    body: '方向键移动，空格等待，Q 释放锁光脉冲，让暗影停一回合。',
    gameOverTitle: '光路崩塌',
    hitTitle: '暗影扑面',
    hitBody: '你被暗影逼回入口，必须重排点亮顺序。',
  },
  copy: {
    boot: '先点亮 5 块棱镜，再冲向右上折跃门。',
    live: '光路越亮越安全，先拿中线棱镜。',
    unlocked: '折跃门已经开启，立刻进入。',
    progress: '一块棱镜被重新点亮。',
    special: '锁光脉冲拖住了暗影。',
    hit: '暗影撕掉了一层护盾。',
    clear: '这一段回廊恢复折射，继续前进。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新点亮回廊。',
  },
  palette: {
    bg: '#0b0a16',
    gridA: '#1d1731',
    gridB: '#151126',
    wall: '#4c3f79',
    goal: '#f59e0b',
    exitOn: '#22c55e',
    exitOff: '#52525b',
    item: '#c4b5fd',
    box: '#67e8f9',
    boxLocked: '#fbbf24',
    hazard: '#7c3aed',
    special: '#93c5fd',
    player: '#f8fafc',
  },
  extraHazards: [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 1, y: 5 },
    { x: 5, y: 5 },
  ],
  maxExtraHazards: 1,
  templates: [
    { rows: [
      '.......',
      '.c..h..',
      '..#.#..',
      '.h.S.c.',
      '..#....',
      '.c..h.X',
      '...c...',
    ] },
    { rows: [
      '.......',
      '.h..c..',
      '..#..#.',
      '.c.S.h.',
      '.#.....',
      '.c..h.X',
      '...c...',
    ] },
    { rows: [
      '.......',
      '.c.h...',
      '..#..#.',
      '.h.S.c.',
      '.#..c..',
      '.c..h.X',
      '.......',
    ] },
  ],
};

function runSelfCheck(rounds = 4) {
  return core.runSelfCheck(CONFIG, rounds);
}

const internals = { CONFIG, runSelfCheck };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = internals;
}

if (typeof window !== 'undefined') {
  window.runSelfCheck = runSelfCheck;
  window.addEventListener('DOMContentLoaded', () => {
    const game = runtime.bootstrap(CONFIG, 'prismPatrolGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.prismPatrolGameSelfCheck = runSelfCheck(4);
    }
  });
}
