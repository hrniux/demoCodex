const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "solar-sentry",
  "shortTitle": "太阳哨站",
  "mode": "items",
  "target": 4,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 60,
  "scoreHazard": 40,
  "scoreClear": 260,
  "hitPenalty": 35,
  "labels": {
    "progress": "光核",
    "wait": "巡航"
  },
  "storage": {
    "score": "demoCodexSolarSentryBestScore",
    "floor": "demoCodexSolarSentryBestStage"
  },
  "special": {
    "label": "日冕脉冲",
    "button": "脉冲",
    "effect": "clear",
    "radius": 1,
    "cooldown": 3
  },
  "objective": {
    "ready": "回收 4 颗光核并守住太阳阵列出口。",
    "exit": "阵列已充能，沿着光束撤离。"
  },
  "overlay": {
    "kicker": "哨站简报",
    "title": "按开始或 Enter 接管阵列",
    "body": "方向键巡逻收集光核，空格等待，Q 释放日冕脉冲，清掉身边的漂流碎片。",
    "gameOverTitle": "哨站失守",
    "hitTitle": "热浪逼近",
    "hitBody": "你被热浪卷回了初始岗位。"
  },
  "copy": {
    "boot": "先回收 4 颗光核，再把阵列出口清出来。",
    "live": "先收光核，再给自己留出回航通道。",
    "unlocked": "出口已经可以撤离。",
    "progress": "一颗光核被稳定回收。",
    "special": "日冕脉冲清开了附近的碎片。",
    "hit": "漂流碎片擦到了你的护盾。",
    "clear": "太阳阵列稳定下来了。",
    "gameOver": "护盾被热浪打穿，按 Enter 或按钮重新巡航。"
  },
  "palette": {
    "bg": "#07111f",
    "gridA": "#10253c",
    "gridB": "#0c1c31",
    "wall": "#6b4f1d",
    "goal": "#fbbf24",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#fde047",
    "box": "#cbd5e1",
    "boxLocked": "#67e8f9",
    "hazard": "#fb7185",
    "special": "#fef08a",
    "player": "#fff7c2"
  },
  "extraHazards": [
    { "x": 1, "y": 1 },
    { "x": 5, "y": 1 },
    { "x": 1, "y": 5 },
    { "x": 5, "y": 5 }
  ],
  "maxExtraHazards": 2,
  "templates": [
    {
      "rows": [
        ".......",
        ".c..h..",
        "..#..c.",
        ".h.S...",
        "..c.#..",
        ".h..c..",
        "......X"
      ]
    },
    {
      "rows": [
        ".......",
        ".c.h..c",
        "..#....",
        ".h.S.h.",
        "..c.#..",
        "..h.c..",
        "......X"
      ]
    },
    {
      "rows": [
        ".......",
        ".c..h..",
        "..#c...",
        ".h.S..h",
        "..c.#..",
        ".c..h..",
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
    const game = runtime.bootstrap(CONFIG, 'solarSentryGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['solarSentryGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
