const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "comet-lantern",
  "shortTitle": "彗灯拾星",
  "mode": "items",
  "target": 10,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 40,
  "scoreHazard": 30,
  "scoreClear": 240,
  "hitPenalty": 35,
  "labels": {
    "progress": "彗尘",
    "wait": "稳灯"
  },
  "storage": {
    "score": "demoCodexCometLanternBestScore",
    "floor": "demoCodexCometLanternBestStage"
  },
  "special": {
    "label": "闪灯",
    "button": "闪灯",
    "effect": "clear",
    "radius": 1,
    "cooldown": 3
  },
  "objective": {
    "ready": "收满 10 个彗尘碎片，再找到出口风铃。",
    "exit": "风铃已经亮起，快冲过去。"
  },
  "overlay": {
    "kicker": "夜巡简报",
    "title": "按开始或 Enter 点亮提灯",
    "body": "方向键移动，空格稳灯，Q 释放闪灯脉冲，把近身黑影驱散。",
    "gameOverTitle": "夜巡失败",
    "hitTitle": "灯焰受创",
    "hitBody": "黑影扑灭了一格灯焰。"
  },
  "copy": {
    "boot": "收满 10 个彗尘碎片，再找到出口风铃。",
    "live": "先点亮最近的彗尘，再回身甩开黑影。",
    "unlocked": "风铃已经亮起。",
    "progress": "彗尘碎片又多了一颗。",
    "special": "闪灯驱散了黑影。",
    "hit": "黑影扑到了灯焰。",
    "clear": "这一夜的彗尘已收齐。",
    "gameOver": "灯焰耗尽，按 Enter 或按钮重新夜巡。"
  },
  "palette": {
    "bg": "#050917",
    "gridA": "#101a35",
    "gridB": "#0b1330",
    "wall": "#334155",
    "goal": "#a78bfa",
    "exitOn": "#facc15",
    "exitOff": "#475569",
    "item": "#f8fafc",
    "box": "#c4b5fd",
    "boxLocked": "#8b5cf6",
    "hazard": "#1d4ed8",
    "special": "#e9d5ff",
    "player": "#fde68a"
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
      "y": 7
    },
    {
      "x": 7,
      "y": 7
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
        ".c..h..c.",
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
        ".c..h..c.",
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
    const game = runtime.bootstrap(CONFIG, 'cometLanternGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['cometLanternGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
