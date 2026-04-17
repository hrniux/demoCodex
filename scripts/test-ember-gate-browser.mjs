import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'EMBER_GATE_TEST_URL',
  pathname: '/ember-gate.html',
  globalName: 'emberGateGame',
  captureEnv: 'EMBER_GATE_CAPTURE',
  screenshotDir: 'output/ember-gate-browser',
  scenarios: [
    {
      name: 'switch',
      screenshot: 'switch.png',
      setup: {
        layout: {
          start: { x: 1, y: 2 },
          exit: { x: 6, y: 2 },
          walls: [],
          goals: [],
          switches: [{ x: 1, y: 1 }],
          gates: [{ x: 3, y: 1 }],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 2 },
          boxes: [],
          hazards: [],
          items: [],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          gatesOpen: false,
          lastAbility: [],
        },
        status: '测试踩开关抬闸',
      },
      actions: ['ArrowUp'],
      expect: {
        player: { x: 1, y: 1 },
        gatesOpen: true,
        score: 40,
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'progress',
      screenshot: 'progress.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          switches: [{ x: 1, y: 1 }],
          gates: [{ x: 3, y: 1 }],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 4, y: 1 },
          boxes: [],
          hazards: [],
          items: [{ x: 5, y: 1, active: true }],
          progress: 0,
          turns: 0,
          score: 40,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试余烬回收',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 5, y: 1 },
        progress: 1,
        score: 95,
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
          switches: [],
          gates: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 2, y: 2 },
          boxes: [],
          hazards: [
            { x: 2, y: 1 },
            { x: 1, y: 2 },
          ],
          items: [],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试清灰脉冲',
      },
      actions: ['KeyQ'],
      expect: { specialCooldown: 3, hazardsLength: 0, score: 70 },
      internalExpect: { hazards: 0 },
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
          switches: [],
          gates: [],
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
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试火线失败重开',
      },
      actions: ['Space'],
      expect: { mode: 'gameover', player: { x: 0, y: 0 }, hull: 0, score: 0 },
      internalExpect: { overlayVisible: true, overlayTitle: '火线封死' },
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
