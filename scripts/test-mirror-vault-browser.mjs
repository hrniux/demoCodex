import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

const CONFIG = {
  envName: 'MIRROR_VAULT_TEST_URL',
  pathname: '/mirror-vault.html',
  globalName: 'mirrorVaultGame',
  captureEnv: 'MIRROR_VAULT_CAPTURE',
  screenshotDir: 'output/mirror-vault-browser',
  scenarios: [
    {
      name: 'goal_push',
      screenshot: 'goal-push.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 6, y: 6 },
          walls: [],
          goals: [{ x: 3, y: 1 }],
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
          gatesOpen: true,
          lastAbility: [],
        },
        status: '测试推进目标',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 1 },
        progress: 1,
        score: 110,
        boxes: [{ x: 3, y: 1, locked: true }],
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'teleport_swap',
      screenshot: 'teleport-swap.png',
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
        status: '测试镜门换位',
      },
      actions: ['ArrowRight'],
      expect: {
        player: { x: 5, y: 4 },
        progress: 0,
        score: 0,
      },
    },
    {
      name: 'freeze_ability',
      screenshot: 'freeze-ability.png',
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
          hazards: [{ x: 3, y: 2 }],
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
        status: '测试冻结能力',
      },
      actions: ['KeyQ'],
      expect: { specialCooldown: 4, hazardsLength: 1, score: 0 },
      internalExpect: { freezeTurns: 1 },
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
      internalExpect: { overlayVisible: true, overlayTitle: '镜库沦陷' },
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
