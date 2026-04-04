const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'dock-drift',
  shortTitle: '浮码漂移',
  mode: 'goals',
  target: 3,
  maxHull: 3,
  pushBoxes: true,
  slidePlayer: true,
  spreadHazards: true,
  scoreGoal: 100,
  scoreClear: 250,
  hitPenalty: 40,
  labels: {
    progress: '泊位',
    wait: '顺流',
  },
  storage: {
    score: 'demoCodexDockDriftBestScore',
    floor: 'demoCodexDockDriftBestStage',
  },
  special: {
    label: '抛锚',
    button: '抛锚',
    effect: 'freeze',
    cooldown: 3,
  },
  objective: {
    ready: '把 3 箱补给滑进泊位，再回到锚门旁。',
    exit: '泊位全亮了，立刻滑回锚门。',
  },
  overlay: {
    kicker: '码头简报',
    title: '按开始或 Enter 进入浮码',
    body: '方向键会持续滑到挡板，空格顺流等待，Q 抛锚能压住浪线一回合。',
    gameOverTitle: '浮码失守',
    hitTitle: '浪线逼退',
    hitBody: '你被浪线推回了锚门。',
  },
  copy: {
    boot: '把 3 箱补给滑进泊位，再回到锚门旁。',
    live: '先算滑行终点，再决定何时抛锚。',
    unlocked: '泊位全亮了，锚门已经打开。',
    progress: '一箱补给已经滑进泊位。',
    special: '抛锚稳住了整片浪线。',
    hit: '你被浪线卷住了。',
    clear: '本轮浮码漂移完成。',
    gameOver: '护盾碎裂，按 Enter 或按钮重新漂移。',
  },
  palette: {
    bg: '#06131a',
    gridA: '#0f2430',
    gridB: '#0b1d27',
    wall: '#475569',
    goal: '#38bdf8',
    exitOn: '#34d399',
    exitOff: '#334155',
    item: '#7dd3fc',
    box: '#bae6fd',
    boxLocked: '#38bdf8',
    hazard: '#0ea5e9',
    special: '#f8fafc',
    player: '#fef08a',
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
        '.g..b.h',
        '...#...',
        '.b.S...',
        '.h..#g.',
        '.g..b..',
        '...#..X',
      ],
    },
    {
      rows: [
        '.......',
        '.b..g.h',
        '.#.....',
        '.g.S.b.',
        '...h#..',
        '.b..g..',
        '..#...X',
      ],
    },
    {
      rows: [
        '.......',
        '.g.b..h',
        '..#....',
        '.b.S.g.',
        '.h..#..',
        '.g..b..',
        '...#..X',
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
    const game = runtime.bootstrap(CONFIG, 'dockDriftGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.dockDriftGameSelfCheck = runSelfCheck(4);
    }
  });
}
