import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'PHASE_GARDEN_TEST_URL',
  pathname: '/phase-garden.html',
  globalName: 'phaseGardenGame',
  captureEnv: 'PHASE_GARDEN_CAPTURE',
  screenshotDir: 'output/phase-garden-browser',
  scenarios: [
    {
      name: 'teleport_route',
      screenshot: 'teleport-route.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          teleporters: [
            { id: '1', x: 2, y: 1 },
            { id: '1', x: 5, y: 4 },
          ],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 1 },
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
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试相位门位移',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 5, y: 4 },
        score: 0,
        progress: 0,
        gatesOpen: true,
      },
    },
    {
      name: 'clear_ability',
      screenshot: 'clear-ability.png',
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
          player: { x: 3, y: 3 },
          boxes: [],
          hazards: [
            { x: 3, y: 2 },
            { x: 4, y: 3 },
            { x: 6, y: 6 },
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
        status: '测试净场脉冲',
      },
      actions: ['KeyQ'],
      expect: { specialCooldown: 4, hazardsLength: 2, score: 70 },
    },
    {
      name: 'successful_extraction',
      screenshot: 'successful-extraction.png',
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
          items: [
            { x: 1, y: 1, active: false },
            { x: 2, y: 1, active: false },
            { x: 3, y: 1, active: false },
            { x: 4, y: 1, active: false },
            { x: 5, y: 1, active: false },
          ],
          progress: 5,
          turns: 4,
          score: 220,
          hull: 2,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: true,
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试撤离',
      },
      actions: ['ArrowRight'],
      expect: { floor: 2, score: 500, hull: 2, progress: 0, exitUnlocked: false },
    },
    {
      name: 'failure_restart',
      screenshot: 'failure-restart.png',
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
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试失守后重开',
      },
      actions: ['Space'],
      expect: { mode: 'gameover', player: { x: 0, y: 0 }, hull: 0, score: 0 },
      internalExpect: { overlayVisible: true, overlayTitle: '花圃失守' },
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
