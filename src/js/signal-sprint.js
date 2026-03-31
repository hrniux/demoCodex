const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "signal-sprint",
  "shortTitle": "信号冲刺",
  "mode": "items",
  "target": 10,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 45,
  "scoreHazard": 30,
  "scoreClear": 250,
  "hitPenalty": 35,
  "labels": {
    "progress": "芯片",
    "wait": "稳速"
  },
  "storage": {
    "score": "demoCodexSignalSprintBestScore",
    "floor": "demoCodexSignalSprintBestStage"
  },
  "special": {
    "label": "冲刺",
    "button": "冲刺",
    "effect": "clear",
    "radius": 1,
    "cooldown": 3
  },
  "objective": {
    "ready": "吃满 10 个芯片并活到赛段结尾。",
    "exit": "终点已经打开，保持节奏冲过去。"
  },
  "overlay": {
    "kicker": "赛道简报",
    "title": "按开始或 Enter 起跑",
    "body": "左右切线，上键小跳，Q 释放短冲刺，穿过红色闸门空档。",
    "gameOverTitle": "冲刺失败",
    "hitTitle": "节奏被打断",
    "hitBody": "你撞上了封锁门，被逼回起跑点。"
  },
  "copy": {
    "boot": "吃满 10 个芯片并活到赛段结尾。",
    "live": "芯片和空档不在同一条线，就先保命。",
    "unlocked": "终点已经打开。",
    "progress": "芯片连击增加了一枚。",
    "special": "冲刺穿过了封锁门。",
    "hit": "你被封锁门撞退了。",
    "clear": "赛段冲刺完成。",
    "gameOver": "护盾清空，按 Enter 或按钮重新起跑。"
  },
  "palette": {
    "bg": "#071018",
    "gridA": "#11243a",
    "gridB": "#0d1c31",
    "wall": "#475569",
    "goal": "#0ea5e9",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#22d3ee",
    "box": "#f59e0b",
    "boxLocked": "#fbbf24",
    "hazard": "#ef4444",
    "special": "#fef08a",
    "player": "#e0f2fe"
  },
  "extraHazards": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 7,
      "y": 1
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 7,
      "y": 6
    }
  ],
  "maxExtraHazards": 2,
  "templates": [
    {
      "rows": [
        ".........",
        ".c..h..c.",
        "..c...c..",
        ".h..S..h.",
        "..c...c..",
        ".c..h..c.",
        "..c...c..",
        "...c...c.",
        ".......X."
      ]
    },
    {
      "rows": [
        ".........",
        ".c.h..c..",
        "..c...c..",
        ".h..S..c.",
        "..c...h..",
        ".c..h..c.",
        "...c...c.",
        "..c.h.c..",
        ".......X."
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
    const game = runtime.bootstrap(CONFIG, 'signalSprintGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['signalSprintGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
