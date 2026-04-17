import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'STORM_LOCK_TEST_URL',
  pathname: '/storm-lock.html',
  globalName: 'stormLockGame',
  captureEnv: 'STORM_LOCK_CAPTURE',
  screenshotDir: 'output/storm-lock-browser',
  scenarios: [
    {
      name: 'open-gate',
      screenshot: 'open-gate.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          switches: [{ x: 2, y: 1 }],
          gates: [{ x: 3, y: 1 }],
          teleporters: [],
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
          gatesOpen: false,
          lastAbility: [],
        },
        status: '测试开门',
      },
      actions: ['ArrowRight', 'ArrowRight'],
      expect: {
        player: { x: 3, y: 1 },
        gatesOpen: true,
        score: 35,
      },
    },
    {
      name: 'teleport-swap',
      screenshot: 'teleport-swap.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [],
          switches: [],
          gates: [],
          teleporters: [
            { id: '1', x: 2, y: 1 },
            { id: '1', x: 5, y: 3 },
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
          gatesOpen: false,
          lastAbility: [],
        },
        status: '测试换边',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 5, y: 3 },
        score: 0,
        progress: 0,
      },
    },
    {
      name: 'goal-push',
      screenshot: 'goal-push.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [{ x: 3, y: 1 }],
          switches: [],
          gates: [],
          teleporters: [],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 1 },
          boxes: [{ x: 2, y: 1, locked: false }],
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
        status: '测试推进闸位',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 1 },
        progress: 1,
        score: 110,
        boxes: [{ x: 3, y: 1, locked: true }],
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
          gatesOpen: false,
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
        overlayTitle: '锁港失守',
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
