const runtime = typeof window !== 'undefined' ? window.PixelPageRuntime : require('./pixel-page-runtime.js');
const core = typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

const CONFIG = {
  "name": "glyph-keeper",
  "shortTitle": "符文守卫",
  "mode": "items",
  "target": 4,
  "maxHull": 3,
  "pushBoxes": false,
  "slidePlayer": false,
  "spreadHazards": true,
  "scoreItem": 55,
  "scoreHazard": 30,
  "scoreClear": 240,
  "hitPenalty": 35,
  "labels": {
    "progress": "符文",
    "wait": "重播"
  },
  "storage": {
    "score": "demoCodexGlyphKeeperBestScore",
    "floor": "demoCodexGlyphKeeperBestStage"
  },
  "special": {
    "label": "专注",
    "button": "专注",
    "effect": "freeze",
    "duration": 2,
    "cooldown": 3
  },
  "objective": {
    "ready": "先记住序列，再按顺序击中符文。",
    "exit": "石门已经稳住，马上完成撤离。"
  },
  "overlay": {
    "kicker": "记忆简报",
    "title": "按开始或 Enter 进入试炼",
    "body": "观察符文顺序后复现，空格可重播一次当前节拍，Q 触发专注延时。",
    "gameOverTitle": "试炼中断",
    "hitTitle": "节拍断裂",
    "hitBody": "黑影打断了你的记忆节奏。"
  },
  "copy": {
    "boot": "先记住序列，再按顺序击中符文。",
    "live": "先稳住节拍，再去碰下一枚符文。",
    "unlocked": "石门已经稳定。",
    "progress": "一枚符文被成功击中。",
    "special": "专注让黑影慢了一拍。",
    "hit": "你被黑影打断了节拍。",
    "clear": "这一轮试炼完成。",
    "gameOver": "护盾耗尽，按 Enter 或按钮重新守门。"
  },
  "palette": {
    "bg": "#100918",
    "gridA": "#261633",
    "gridB": "#1c1027",
    "wall": "#4c1d95",
    "goal": "#a855f7",
    "exitOn": "#34d399",
    "exitOff": "#52525b",
    "item": "#f472b6",
    "box": "#c084fc",
    "boxLocked": "#e879f9",
    "hazard": "#1f2937",
    "special": "#fde68a",
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
  "maxExtraHazards": 1,
  "templates": [
    {
      "rows": [
        ".......",
        ".c..h..",
        "..c.c..",
        ".h.S.h.",
        "..c....",
        ".......",
        "......X"
      ]
    },
    {
      "rows": [
        ".......",
        ".c.h.c.",
        "..c....",
        ".h.S.h.",
        "..c....",
        ".......",
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
    const game = runtime.bootstrap(CONFIG, 'glyphKeeperGame');
    if (game && new URLSearchParams(window.location.search).has('autotest')) {
      window['glyphKeeperGameSelfCheck'] = runSelfCheck(4);
    }
  });
}
