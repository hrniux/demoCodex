const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "pixel-orchard",
  "shortTitle": "像素果园",
  "mode": "items",
  "target": 8,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 45,
  "scoreHazard": 25,
  "scoreClear": 230,
  "hitPenalty": 35,
  "labels": {
    "progress": "果筐",
    "wait": "等待"
  },
  "storage": {
    "score": "demoCodexPixelOrchardBestScore",
    "floor": "demoCodexPixelOrchardBestStage"
  },
  "special": {
    "label": "哨声",
    "button": "哨声",
    "effect": "clear",
    "radius": 1,
    "cooldown": 3
  },
  "objective": {
    "ready": "摘满 8 个果子，再回到仓棚交付。",
    "exit": "仓棚已经亮起，带着果筐回去。"
  },
  "overlay": {
    "kicker": "果园简报",
    "title": "按开始或 Enter 进入果园",
    "body": "方向键移动，空格原地等果，Q 使用惊鸟哨，把附近乌鸦推远一格。",
    "gameOverTitle": "果园失守",
    "hitTitle": "乌鸦撞散",
    "hitBody": "乌鸦撞散了你的采收路线。"
  },
  "copy": {
    "boot": "摘满 8 个果子，再回到仓棚交付。",
    "live": "多绕一步也比被乌鸦堵住强。",
    "unlocked": "仓棚已经亮起。",
    "progress": "果筐又多了一颗。",
    "special": "惊鸟哨把乌鸦震散了。",
    "hit": "乌鸦撞到了你。",
    "clear": "这一日的果子收齐了。",
    "gameOver": "护盾清空，按 Enter 或按钮重新采收。"
  },
  "palette": {
    "bg": "#08140b",
    "gridA": "#16351a",
    "gridB": "#102915",
    "wall": "#4d7c0f",
    "goal": "#d9f99d",
    "exitOn": "#facc15",
    "exitOff": "#52525b",
    "item": "#f97316",
    "box": "#86efac",
    "boxLocked": "#4ade80",
    "hazard": "#1f2937",
    "special": "#fef08a",
    "player": "#f8fafc"
  },
  "extraHazards": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 6,
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
        "....c....",
        "..#...#..",
        "...#...X."
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
        "..#...#..",
        "...#...X."
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
    const game = runtime.bootstrap(CONFIG, 'pixelOrchardGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['pixelOrchardGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
