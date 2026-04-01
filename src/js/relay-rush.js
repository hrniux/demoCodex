const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  name: 'relay-rush',
  shortTitle: '中继冲刺',
  mode: 'items',
  target: 6,
  maxHull: 3,
  pushBoxes: false,
  slidePlayer: true,
  spreadHazards: false,
  scoreItem: 60,
  scoreHazard: 20,
  scoreClear: 240,
  hitPenalty: 30,
  labels: {
    progress: '中继',
    wait: '缓冲',
  },
  storage: {
    score: 'demoCodexRelayRushBestScore',
    floor: 'demoCodexRelayRushBestStage',
  },
  special: {
    label: '稳频',
    button: '稳频波',
    effect: 'freeze',
    duration: 2,
    cooldown: 4,
  },
  objective: {
    ready: '收集 6 个中继节点，再滑回终端塔。',
    exit: '终端塔已经联通，沿信道冲回出口。',
  },
  overlay: {
    kicker: '信道简报',
    title: '按开始或 Enter 进入中继冲刺',
    body: '方向键会一路滑到停点，空格缓冲一拍，Q 发出稳频波冻结干扰两拍。',
    gameOverTitle: '信号断线',
    hitTitle: '漂移擦碰',
    hitBody: '你的滑行被干扰波打断了。',
  },
  copy: {
    boot: '收集 6 个中继节点，再滑回终端塔。',
    live: '滑到节点就收束，别冲过头。',
    unlocked: '终端塔已经联通。',
    progress: '中继节点已接上。',
    special: '稳频波让干扰静止了一拍。',
    hit: '漂移干扰擦到了你。',
    clear: '信号链路已经闭合。',
    gameOver: '链路断开，按 Enter 或按钮重新冲刺。',
  },
  palette: {
    bg: '#03111f',
    gridA: '#0d1f3b',
    gridB: '#091730',
    wall: '#2563eb',
    goal: '#a78bfa',
    exitOn: '#22d3ee',
    exitOff: '#475569',
    item: '#f59e0b',
    box: '#38bdf8',
    boxLocked: '#67e8f9',
    hazard: '#fb7185',
    special: '#bfdbfe',
    player: '#ffffff',
  },
  extraHazards: [
    { x: 2, y: 1 },
    { x: 6, y: 1 },
    { x: 1, y: 6 },
    { x: 7, y: 5 },
  ],
  maxExtraHazards: 2,
  templates: [
    {
      rows: [
        '.........',
        '.c..h..c.',
        '.###.###.',
        '.c..S..c.',
        '.###.###.',
        '.c..h..c.',
        '.###.###.',
        '..c...c..',
        '...#...X.',
      ],
    },
    {
      rows: [
        '.........',
        '.c..h..c.',
        '.##...##.',
        '.c.S...c.',
        '.##...##.',
        '.c..h..c.',
        '.###.###.',
        '..c...c..',
        '...#...X.',
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
    const game = runtime.bootstrap(CONFIG, 'relayRushGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window.relayRushGameSelfCheck = runSelfCheck(4);
    }
  });
}
