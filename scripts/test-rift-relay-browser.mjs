import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'RIFT_RELAY_TEST_URL',
  pathname: '/rift-relay.html',
  globalName: 'riftRelayGame',
  captureEnv: 'RIFT_RELAY_CAPTURE',
  screenshotDir: 'output/rift-relay-browser',
  scenarios: [
    {
      name: 'slide-collect',
      screenshot: 'slide-collect.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [{ x: 5, y: 1 }],
          goals: [],
          switches: [],
          gates: [],
          teleporters: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 1 },
          boxes: [],
          hazards: [],
          items: [{ x: 4, y: 1, active: true }],
          progress: 0,
          turns: 0,
          score: 0,
          hull: 3,
          specialCooldown: 0,
          freezeTurns: 0,
          exitUnlocked: false,
          lastAbility: [],
        },
        status: '测试滑行回收',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 4, y: 1 },
        progress: 1,
        score: 60,
        itemsLength: 0,
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'teleport-swap',
      screenshot: 'teleport-swap.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [{ x: 3, y: 4 }],
          goals: [],
          switches: [],
          gates: [],
          teleporters: [
            { id: '1', x: 4, y: 1 },
            { id: '1', x: 2, y: 4 },
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
          lastAbility: [],
        },
        status: '测试裂口换位',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 4 },
        progress: 0,
        score: 0,
        hazardsLength: 0,
      },
    },
    {
      name: 'ability-clear',
      screenshot: 'ability-clear.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          switches: [],
          gates: [],
          teleporters: [],
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
        status: '测试相位清场',
      },
      actions: ['KeyQ'],
      expect: {
        specialCooldown: 3,
        hazardsLength: 0,
        score: 30,
      },
      internalExpect: {
        hazards: 0,
      },
    },
    {
      name: 'gameover-restart',
      screenshot: 'gameover-restart.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          switches: [],
          gates: [],
          teleporters: [],
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
        status: '测试失败重开',
      },
      actions: ['Space'],
      expect: {
        mode: 'gameover',
        player: { x: 0, y: 0 },
        hull: 0,
        score: 0,
      },
      internalExpect: {
        overlayVisible: true,
        overlayTitle: '裂隙吞没',
      },
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
