const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "crate-circuit",
  "shortTitle": "箱线回路",
  "mode": "goals",
  "target": 3,
  "maxHull": 3,
  "pushBoxes": true,
  "slidePlayer": false,
  "spreadHazards": false,
  "scoreGoal": 105,
  "scoreHazard": 35,
  "scoreClear": 240,
  "hitPenalty": 40,
  "labels": {
    "progress": "节点",
    "wait": "稳线"
  },
  "storage": {
    "score": "demoCodexCrateCircuitBestScore",
    "floor": "demoCodexCrateCircuitBestStage"
  },
  "special": {
    "label": "断流",
    "button": "断流",
    "effect": "freeze",
    "duration": 2,
    "cooldown": 3
  },
  "objective": {
    "ready": "把 3 个电路箱推上节点，再穿过右下闸门。",
    "exit": "回路已经接通，沿着闸门撤离。"
  },
  "overlay": {
    "kicker": "机房简报",
    "title": "按开始或 Enter 进入机房",
    "body": "推动电路箱点亮节点，空格稳线，Q 释放断流，把周围的火花暂时冻结。",
    "gameOverTitle": "回路断开",
    "hitTitle": "火花过载",
    "hitBody": "火花逼近，线路被迫重启。"
  },
  "copy": {
    "boot": "先把 3 个电路箱推上节点，再走向右下闸门。",
    "live": "先腾出通道，再慢慢把箱体推到节点。",
    "unlocked": "闸门已经可以通过了。",
    "progress": "一处节点已经点亮。",
    "special": "断流让附近火花安静了。",
    "hit": "火花擦过了你的护盾。",
    "clear": "整段回路已经恢复。",
    "gameOver": "护盾烧空，按 Enter 或按钮重新接线。"
  },
  "palette": {
    "bg": "#0d1517",
    "gridA": "#113036",
    "gridB": "#0e262b",
    "wall": "#6b4f1d",
    "goal": "#f97316",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#fde047",
    "box": "#cbd5e1",
    "boxLocked": "#22d3ee",
    "hazard": "#fb7185",
    "special": "#a7f3d0",
    "player": "#fef3c7"
  },
  "extraHazards": [
    { "x": 1, "y": 1 },
    { "x": 5, "y": 2 },
    { "x": 4, "y": 5 }
  ],
  "maxExtraHazards": 1,
  "templates": [
    {
      "rows": [
        ".......",
        ".b..g.h",
        "..#....",
        ".g.S.g.",
        "..#..b.",
        ".h..b..",
        "..#...X"
      ]
    },
    {
      "rows": [
        ".......",
        ".b.g..h",
        "..#....",
        ".g.S.g.",
        ".h..#..",
        ".b...b.",
        "...#..X"
      ]
    },
    {
      "rows": [
        ".......",
        ".b..g..",
        "..#..h.",
        ".g.S.g.",
        ".h..#..",
        ".b..b..",
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
    const game = runtime.bootstrap(CONFIG, 'crateCircuitGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['crateCircuitGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
