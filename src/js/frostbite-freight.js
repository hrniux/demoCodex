const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "frostbite-freight",
  "shortTitle": "霜轨货运",
  "mode": "goals",
  "target": 3,
  "maxHull": 3,
  "pushBoxes": true,
  "slidePlayer": true,
  "spreadHazards": true,
  "scoreGoal": 100,
  "scoreHazard": 35,
  "scoreClear": 250,
  "hitPenalty": 40,
  "labels": {
    "progress": "停靠位",
    "wait": "稳住"
  },
  "storage": {
    "score": "demoCodexFrostbiteFreightBestScore",
    "floor": "demoCodexFrostbiteFreightBestStage"
  },
  "special": {
    "label": "制动",
    "button": "制动",
    "effect": "clear",
    "radius": 1,
    "cooldown": 3
  },
  "objective": {
    "ready": "把 3 个货箱滑进停靠位，再回到雪橇边。",
    "exit": "停靠位全亮了，赶紧回雪橇。"
  },
  "overlay": {
    "kicker": "月台简报",
    "title": "按开始或 Enter 进入月台",
    "body": "方向键会一直滑到下个障碍，空格原地稳住，Q 放下一枚临时制动器。",
    "gameOverTitle": "月台失守",
    "hitTitle": "冰裂逼退",
    "hitBody": "你被裂缝逼回了起点。"
  },
  "copy": {
    "boot": "把 3 个货箱滑进停靠位，再回到雪橇边。",
    "live": "先把滑行角度切对，再推货箱。",
    "unlocked": "停靠位已全部点亮。",
    "progress": "一处停靠位锁定成功。",
    "special": "制动器暂时稳住了冰裂。",
    "hit": "你踩进了冰裂边缘。",
    "clear": "本月台发运完成。",
    "gameOver": "护盾碎裂，按 Enter 或按钮重新发运。"
  },
  "palette": {
    "bg": "#06111a",
    "gridA": "#102436",
    "gridB": "#0c1c2a",
    "wall": "#64748b",
    "goal": "#60a5fa",
    "exitOn": "#34d399",
    "exitOff": "#475569",
    "item": "#bae6fd",
    "box": "#e0f2fe",
    "boxLocked": "#93c5fd",
    "hazard": "#38bdf8",
    "special": "#f8fafc",
    "player": "#fde68a"
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
    const game = runtime.bootstrap(CONFIG, 'frostbiteFreightGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['frostbiteFreightGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
