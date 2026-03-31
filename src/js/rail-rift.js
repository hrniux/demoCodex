const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "rail-rift",
  "shortTitle": "裂轨列调",
  "mode": "items",
  "target": 6,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 50,
  "scoreHazard": 35,
  "scoreClear": 250,
  "hitPenalty": 40,
  "labels": {
    "progress": "补给",
    "wait": "稳速"
  },
  "storage": {
    "score": "demoCodexRailRiftBestScore",
    "floor": "demoCodexRailRiftBestStage"
  },
  "special": {
    "label": "跃轨",
    "button": "跃轨",
    "effect": "freeze",
    "duration": 2,
    "cooldown": 3
  },
  "objective": {
    "ready": "切换轨道避开断口，顺手吃掉蓝色补给片。",
    "exit": "轨道已经接通，马上把列车送出去。"
  },
  "overlay": {
    "kicker": "轨控简报",
    "title": "按开始或 Enter 发车",
    "body": "左右切轨，上键短促提速，Q 可瞬时穿越一段断轨。",
    "gameOverTitle": "列调失控",
    "hitTitle": "断轨逼停",
    "hitBody": "断轨把列车逼回了入场轨。"
  },
  "copy": {
    "boot": "切换轨道避开断口，顺手吃掉蓝色补给片。",
    "live": "先把活路切出来，再追补给。",
    "unlocked": "出站轨道已经接通。",
    "progress": "补给片入列了一枚。",
    "special": "跃轨让断轨暂时失去威胁。",
    "hit": "列车被断轨逼停。",
    "clear": "这一段裂轨已经跨过去了。",
    "gameOver": "车体耗尽，按 Enter 或按钮重新发车。"
  },
  "palette": {
    "bg": "#0a0f1f",
    "gridA": "#17203b",
    "gridB": "#121931",
    "wall": "#475569",
    "goal": "#3b82f6",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#60a5fa",
    "box": "#f59e0b",
    "boxLocked": "#fbbf24",
    "hazard": "#ef4444",
    "special": "#93c5fd",
    "player": "#f8fafc"
  },
  "extraHazards": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "maxExtraHazards": 2,
  "templates": [
    {
      "rows": [
        ".......",
        ".c..h..",
        "..c.c..",
        ".h.S.h.",
        "..c.c..",
        ".c..h..",
        "......X"
      ]
    },
    {
      "rows": [
        ".......",
        ".c.h.c.",
        "..c.c..",
        ".h.S.c.",
        "..c.h..",
        ".c..c..",
        "......X"
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
    const game = runtime.bootstrap(CONFIG, 'railRiftGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['railRiftGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
