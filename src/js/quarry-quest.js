const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'quarry-quest',
  shortTitle: '矿场追标',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: false,
  spreadHazards: false,
  scoreGoal: 96,
  scoreHazard: 36,
  scoreClear: 230,
  hitPenalty: 42,
  labels: {
    progress: '标记',
    wait: '稳石',
  },
  storage: {
    score: 'demoCodexQuarryQuestBestScore',
    floor: 'demoCodexQuarryQuestBestStage',
  },
  special: {
    label: '定锚',
    button: '定锚',
    effect: 'freeze',
    duration: 2,
    cooldown: 3,
  },
  objective: {
    ready: '把 3 块矿石推进标记槽，再从北侧井口撤离。',
    exit: '标记台已经封存，立刻把样本运走。',
  },
  overlay: {
    kicker: '矿区简报',
    title: '按开始或 Enter 进入矿坑',
    body: '方向键推动矿石，空格等待，Q 释放定锚粉，让巡检灯停摆一回合。',
    gameOverTitle: '矿道失守',
    hitTitle: '巡检灯扫到',
    hitBody: '你被巡检灯逼回了坑口。',
  },
  copy: {
    boot: '先把 3 块矿石推进标记槽，再去北侧井口。',
    live: '矿道里别硬冲，先把路和石块摆顺。',
    unlocked: '北侧井口已经解锁。',
    progress: '标记槽稳住了一块矿石。',
    special: '定锚粉让巡检灯停了一拍。',
    hit: '巡检灯扫到了你。',
    clear: '这一层矿道已经清点完毕。',
    gameOver: '护盾耗尽，按 Enter 或按钮重新部署。',
  },
  palette: {
    bg: '#130f09',
    gridA: '#201a10',
    gridB: '#17130c',
    wall: '#6b5b4b',
    goal: '#f59e0b',
    exitOn: '#84cc16',
    exitOff: '#52525b',
    item: '#fde68a',
    box: '#d6d3d1',
    boxLocked: '#f97316',
    hazard: '#fb7185',
    special: '#86efac',
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
    {
      rows: [
        '.......',
        '.b..g..',
        '..#....',
        '.g.S.g.',
        '....#..',
        '.h..b..',
        '..b...X',
      ],
    },
    {
      rows: [
        '.......',
        '.g..b.h',
        '..#....',
        '.b.S.g.',
        '.h..#..',
        '.g..b..',
        '...#..X',
      ],
    },
    {
      rows: [
        '.......',
        '.b.g..h',
        '.#.....',
        '.g.S.b.',
        '....#..',
        '.h..g.b',
        '..#...X',
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
    const game = runtime.bootstrap(CONFIG, 'quarryQuestGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.quarryQuestGameSelfCheck = runSelfCheck(4);
    }
  });
}
