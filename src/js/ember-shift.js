const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "ember-shift",
  "shortTitle": "余烬搬运",
  "mode": "goals",
  "target": 3,
  "maxHull": 3,
  "pushBoxes": true,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreGoal": 95,
  "scoreHazard": 35,
  "scoreClear": 250,
  "hitPenalty": 45,
  "labels": {
    "progress": "火点",
    "wait": "等待"
  },
  "storage": {
    "score": "demoCodexEmberShiftBestScore",
    "floor": "demoCodexEmberShiftBestStage"
  },
  "special": {
    "label": "泡沫",
    "button": "泡沫",
    "effect": "freeze",
    "duration": 2,
    "cooldown": 3
  },
  "objective": {
    "ready": "把 3 处火点全部压住，再冲向右上出口。",
    "exit": "烟道已经清开，立刻撤离。"
  },
  "overlay": {
    "kicker": "现场简报",
    "title": "按开始或 Enter 进入火线",
    "body": "方向键推动水桶，空格等待，Q 释放冷却泡沫，让周围火苗停滞一回合。",
    "gameOverTitle": "现场失守",
    "hitTitle": "热浪逼退",
    "hitBody": "你被热浪逼回入口，重新找一条压火路线。"
  },
  "copy": {
    "boot": "先把 3 个火点全部压住，再走向右上出口。",
    "live": "火线在逼近，推稳水桶再往前。",
    "unlocked": "出口已经打通，立刻撤离。",
    "progress": "火点被压住了一处。",
    "special": "冷却泡沫压住了火势。",
    "hit": "热浪逼退了你。",
    "clear": "现场稳定，转往下一处火线。",
    "gameOver": "护盾烧穿了，按 Enter 或按钮重新调度。"
  },
  "palette": {
    "bg": "#12090a",
    "gridA": "#2b1616",
    "gridB": "#221112",
    "wall": "#59352d",
    "goal": "#ff6b35",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#fbbf24",
    "box": "#94a3b8",
    "boxLocked": "#22d3ee",
    "hazard": "#fb7185",
    "special": "#67e8f9",
    "player": "#fef08a"
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
        ".b..g..",
        "..#h#..",
        ".g.S.g.",
        "..#....",
        "..h..b.",
        "..b...X"
      ]
    },
    {
      "rows": [
        ".......",
        ".g..b..",
        "..#..h.",
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
        "..#....",
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
    const game = runtime.bootstrap(CONFIG, 'emberShiftGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['emberShiftGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
