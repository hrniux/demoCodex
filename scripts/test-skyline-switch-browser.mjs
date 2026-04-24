import assert from 'node:assert/strict';
import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

function itemExtractionSetup({ score, progress, exit = { x: 6, y: 6 } }) {
  return {
    layout: {
      start: { x: 0, y: 0 },
      exit,
      walls: [],
      goals: [],
    },
    state: {
      mode: 'active',
      floor: 1,
      player: { x: 5, y: 6 },
      boxes: [],
      hazards: [],
      items: Array.from({ length: progress }, (_, index) => ({
        id: index,
        x: index,
        y: 0,
        active: false,
      })),
      progress,
      turns: 5,
      score,
      hull: 2,
      specialCooldown: 0,
      freezeTurns: 0,
      exitUnlocked: true,
      gatesOpen: false,
      lastAbility: [],
    },
  };
}

const result = await runGridArcadeBrowserTest({
  envName: 'SKYLINE_SWITCH_TEST_URL',
  pathname: '/skyline-switch.html',
  globalName: 'skylineSwitchGame',
  captureEnv: 'SKYLINE_SWITCH_CAPTURE',
  screenshotDir: 'output/skyline-switch-browser',
  scenarios: [
    {
      name: 'switch-slide-teleport',
      screenshot: 'switch-slide-teleport.png',
      setup: {
        layout: {
          start: { x: 0, y: 0 },
          exit: { x: 7, y: 7 },
          walls: [],
          goals: [],
          switches: [{ x: 2, y: 1 }],
          gates: [{ x: 3, y: 1 }],
          teleporters: [
            { id: '1', x: 4, y: 1 },
            { id: '1', x: 6, y: 3 },
          ],
        },
        state: {
          mode: 'active',
          floor: 1,
          player: { x: 1, y: 1 },
          boxes: [],
          hazards: [],
          items: [{ id: 0, x: 6, y: 3, active: true }],
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
        status: '测试换轨',
      },
      actions: ['ArrowRight', 'ArrowRight'],
      expect: {
        player: { x: 6, y: 3 },
        progress: 1,
        score: 95,
        itemsLength: 0,
        hazardsLength: 0,
        gatesOpen: true,
        exitUnlocked: false,
      },
    },
    {
      name: 'wind-cut',
      screenshot: 'wind-cut.png',
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
          hazards: [{ id: 0, x: 2, y: 1 }],
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
        status: '测试风剪',
      },
      actions: ['KeyQ'],
      expect: { specialCooldown: 4, hazardsLength: 0, score: 35 },
      internalExpect: { hazards: 0 },
    },
    {
      name: 'extraction',
      screenshot: 'extract.png',
      setup: itemExtractionSetup({ score: 220, progress: 5 }),
      actions: ['ArrowRight'],
      expect: { floor: 2, score: 520, hull: 2, progress: 0, exitUnlocked: false },
    },
  ],
});

assert.equal(result.ok, true);
console.log(JSON.stringify(result, null, 2));
