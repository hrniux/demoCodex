import assert from 'node:assert/strict';
import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

function goalProgressSetup({ goal, box, player, walls = [], exit = { x: 6, y: 6 } }) {
  return {
    layout: {
      start: { x: 0, y: 0 },
      exit,
      walls,
      goals: [goal],
    },
    state: {
      mode: 'active',
      floor: 1,
      player,
      boxes: [{ id: 0, x: box.x, y: box.y, locked: false }],
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
  };
}

function goalExtractionSetup({ score, exit = { x: 6, y: 6 } }) {
  return {
    layout: {
      start: { x: 0, y: 0 },
      exit,
      walls: [],
      goals: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ],
    },
    state: {
      mode: 'active',
      floor: 1,
      player: { x: 5, y: 6 },
      boxes: [
        { id: 0, x: 1, y: 1, locked: true },
        { id: 1, x: 2, y: 1, locked: true },
        { id: 2, x: 3, y: 1, locked: true },
      ],
      hazards: [],
      items: [],
      progress: 3,
      turns: 5,
      score,
      hull: 2,
      specialCooldown: 0,
      freezeTurns: 0,
      exitUnlocked: true,
      lastAbility: [],
    },
  };
}

function freezeSetup({ player = { x: 2, y: 2 }, exit = { x: 6, y: 6 } }) {
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
      player,
      boxes: [],
      hazards: [{ id: 0, x: player.x, y: player.y - 1 }],
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
  };
}

const result = await runGridArcadeBrowserTest({
  envName: 'CRATE_CIRCUIT_TEST_URL',
  pathname: '/crate-circuit.html',
  globalName: 'crateCircuitGame',
  captureEnv: 'CRATE_CIRCUIT_CAPTURE',
  screenshotDir: 'output/crate-circuit-browser',
  scenarios: [
    {
      name: 'progress',
      screenshot: 'progress.png',
      setup: goalProgressSetup({
        goal: { x: 3, y: 1 },
        box: { x: 2, y: 1 },
        player: { x: 1, y: 1 },
      }),
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 1 },
        progress: 1,
        score: 105,
        boxes: [{ x: 3, y: 1, locked: true }],
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'special',
      screenshot: 'special.png',
      setup: freezeSetup({}),
      actions: ['KeyQ'],
      expect: { specialCooldown: 3, hazardsLength: 1, score: 0 },
      internalExpect: { freezeTurns: 1 },
    },
    {
      name: 'extraction',
      screenshot: 'extract.png',
      setup: goalExtractionSetup({ score: 210 }),
      actions: ['ArrowRight'],
      expect: { floor: 2, score: 450, hull: 2, progress: 0, exitUnlocked: false },
    },
  ],
});

assert.equal(result.ok, true);
console.log(JSON.stringify(result, null, 2));
