import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'SIGNAL_DUNES_TEST_URL',
  pathname: '/signal-dunes.html',
  globalName: 'signalDunesGame',
  captureEnv: 'SIGNAL_DUNES_CAPTURE',
  screenshotDir: 'output/signal-dunes-browser',
  scenarios: [
    {
      name: 'progress',
      screenshot: 'progress.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 1 },
          boxes: [],
          hazards: [],
          items: [{ x: 2, y: 1, active: true }],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          lastAbility: [],
        },
        status: '测试信标回收',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 1 },
        progress: 1,
        score: 50,
        itemsLength: 0,
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'special',
      screenshot: 'special.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 2, y: 2 },
          boxes: [],
          hazards: [{ x: 2, y: 1 }],
          items: [],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          lastAbility: [],
        },
        status: '测试沙幕',
      },
      actions: ['KeyQ'],
      expect: { specialCooldown: 3, hazardsLength: 0, score: 25 },
      internalExpect: { hazards: 0 },
    },
    {
      name: 'extraction',
      screenshot: 'extract.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 5, y: 6 },
          boxes: [],
          hazards: [],
          items: Array.from({ length: 6 }, (_, index) => ({
            x: index,
            y: 0,
            active: false,
          })),
          progress: 6,
          turns: 5,
          score: 180,
          hull: 2,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: true,
          lastAbility: [],
        },
        status: '测试撤离',
      },
      actions: ['ArrowRight'],
      expect: { floor: 2, score: 420, hull: 2, progress: 0, exitUnlocked: false },
    },
    {
      name: 'gameover',
      screenshot: 'gameover.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 2, y: 2 },
          boxes: [],
          hazards: [{ x: 2, y: 1 }],
          items: [],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 1,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          lastAbility: [],
        },
        status: '测试搁浅',
      },
      actions: ['Space'],
      expect: { mode: 'gameover', player: { x: 0, y: 0 }, hull: 0, score: 0 },
      internalExpect: { overlayVisible: true, overlayTitle: '沙船搁浅' },
      postGameoverRestart: true,
    },
  ],
};

async function main() {
  const result = await runGridArcadeBrowserTest(CONFIG);
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        url: result.url,
        browser: result.browser,
        screenshots: result.screenshots,
        scenarios: result.scenarios,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
