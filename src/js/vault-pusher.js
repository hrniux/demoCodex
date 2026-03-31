const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "vault-pusher",
  "shortTitle": "金库推箱",
  "mode": "goals",
  "target": 3,
  "maxHull": 3,
  "pushBoxes": true,
  "slidePlayer": false,
  "spreadHazards": false,
  "scoreGoal": 90,
  "scoreHazard": 30,
  "scoreClear": 240,
  "hitPenalty": 40,
  "labels": {
    "progress": "称重点",
    "wait": "等待"
  },
  "storage": {
    "score": "demoCodexVaultPusherBestScore",
    "floor": "demoCodexVaultPusherBestStage"
  },
  "special": {
    "label": "烟幕",
    "button": "烟幕",
    "effect": "freeze",
    "duration": 2,
    "cooldown": 3
  },
  "objective": {
    "ready": "推满 3 个称重点，再摸到出口门。",
    "exit": "门锁已经打开，立刻离场。"
  },
  "overlay": {
    "kicker": "行动简报",
    "title": "按开始或 Enter 进入金库",
    "body": "方向键推动金条箱，空格等待，Q 放烟幕让探灯短暂失明。",
    "gameOverTitle": "潜入失败",
    "hitTitle": "探灯扫到",
    "hitBody": "你被探灯逼退了一步。"
  },
  "copy": {
    "boot": "推满 3 个称重点，再摸到出口门。",
    "live": "先摆正箱位，再卡巡逻空当。",
    "unlocked": "出口门已经打开。",
    "progress": "称重点压稳了一座。",
    "special": "烟幕盖住了探灯。",
    "hit": "探灯扫到了你。",
    "clear": "这层金库处理完毕。",
    "gameOver": "护盾耗尽，按 Enter 或按钮重新潜入。"
  },
  "palette": {
    "bg": "#0c0b12",
    "gridA": "#181622",
    "gridB": "#13111c",
    "wall": "#3f3a4d",
    "goal": "#f59e0b",
    "exitOn": "#22c55e",
    "exitOff": "#4b5563",
    "item": "#fde68a",
    "box": "#eab308",
    "boxLocked": "#67e8f9",
    "hazard": "#fb7185",
    "special": "#c084fc",
    "player": "#f8fafc"
  },
  "extraHazards": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 4,
      "y": 5
    }
  ],
  "maxExtraHazards": 1,
  "templates": [
    {
      "rows": [
        ".......",
        ".b.g..h",
        "..#....",
        ".g.S.g.",
        "....#..",
        ".h..b..",
        "..b...X"
      ]
    },
    {
      "rows": [
        ".......",
        ".g..b.h",
        "..#....",
        ".b.S.g.",
        ".h..#..",
        ".g..b..",
        "...#..X"
      ]
    },
    {
      "rows": [
        ".......",
        ".b.g..h",
        ".#.....",
        ".g.S.b.",
        "....#..",
        ".h..g.b",
        "..#...X"
      ]
    }
  ]
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
    const game = runtime.bootstrap(CONFIG, 'vaultPusherGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['vaultPusherGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
