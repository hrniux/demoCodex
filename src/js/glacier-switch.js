const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'glacier-switch',
  shortTitle: '冰川换轨',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: true,
  spreadHazards: true,
  scoreGoal: 100,
  scoreHazard: 35,
  scoreClear: 250,
  hitPenalty: 45,
  labels: {
    progress: '切换槽',
    wait: '等待',
  },
  storage: {
    score: 'demoCodexGlacierSwitchBestScore',
    floor: 'demoCodexGlacierSwitchBestStage',
  },
  special: {
    label: '雪楔',
    button: '雪楔',
    effect: 'clear',
    radius: 1,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 只冰芯箱送进切换槽，再滑向右上缆车口。',
    exit: '缆车口已经开启，立刻撤离。',
  },
  overlay: {
    kicker: '冰台简报',
    title: '按开始或 Enter 进入换轨区',
    body: '方向键滑行，空格等待，Q 释放雪楔，把近身裂缝清掉一格。',
    gameOverTitle: '冰台塌陷',
    hitTitle: '裂缝逼退',
    hitBody: '裂缝把你顶回了入口，得重新找停点。',
  },
  copy: {
    boot: '先把 3 只冰芯箱送进切换槽，再滑向右上缆车口。',
    live: '先想好停点，再把冰芯箱送上冰轨。',
    unlocked: '缆车口已经开启，立刻撤离。',
    progress: '一只冰芯箱已经滑进切换槽。',
    special: '雪楔刨开了近身裂缝。',
    hit: '裂缝吞掉了一层护盾。',
    clear: '冰台已经顺利换轨，转入下一层。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新切换轨道。',
  },
  palette: {
    bg: '#05111a',
    gridA: '#102434',
    gridB: '#0b1926',
    wall: '#4b6b7f',
    goal: '#93c5fd',
    exitOn: '#22c55e',
    exitOff: '#52525b',
    item: '#e0f2fe',
    box: '#67e8f9',
    boxLocked: '#bfdbfe',
    hazard: '#f97316',
    special: '#c4f1ff',
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
      '.b..g..',
      '..#h#..',
      '.g.S.g.',
      '..#....',
      '..h..b.',
      '..b...X',
    ] },
    { rows: [
      '.......',
      '.g..b..',
      '..#..h.',
      '.b.S.g.',
      '.h..#..',
      '.g..b..',
      '...#..X',
    ] },
    { rows: [
      '.......',
      '.b.g..h',
      '..#....',
      '.g.S.b.',
      '....#..',
      '.h..g.b',
      '..#...X',
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
    const game = runtime.bootstrap(CONFIG, 'glacierSwitchGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.glacierSwitchGameSelfCheck = runSelfCheck(4);
    }
  });
}
