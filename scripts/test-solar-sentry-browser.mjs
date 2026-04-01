import assert from 'node:assert/strict';
import { runGridArcadeBrowserTest } from './test-grid-arcade-browser.mjs';

function itemProgressSetup({ item, player, exit = { x: 6, y: 6 } }) {
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
      hazards: [],
      items: [{ id: 0, x: item.x, y: item.y, active: true }],
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
      lastAbility: [],
    },
  };
}

function clearSetup({ player = { x: 2, y: 2 }, exit = { x: 6, y: 6 } }) {
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
  envName: 'SOLAR_SENTRY_TEST_URL',
  pathname: '/solar-sentry.html',
  globalName: 'solarSentryGame',
  captureEnv: 'SOLAR_SENTRY_CAPTURE',
  screenshotDir: 'output/solar-sentry-browser',
  scenarios: [
    {
      name: 'progress',
      screenshot: 'progress.png',
      setup: itemProgressSetup({
        item: { x: 2, y: 1 },
        player: { x: 1, y: 1 },
      }),
      actions: ['ArrowRight'],
      expect: {
        player: { x: 2, y: 1 },
        progress: 1,
        score: 60,
        itemsLength: 0,
        hazardsLength: 0,
        exitUnlocked: false,
      },
    },
    {
      name: 'special',
      screenshot: 'special.png',
      setup: clearSetup({}),
      actions: ['KeyQ'],
      expect: { specialCooldown: 3, hazardsLength: 0, score: 40 },
      internalExpect: { hazards: 0 },
    },
    {
      name: 'extraction',
      screenshot: 'extract.png',
      setup: itemExtractionSetup({ score: 180, progress: 4 }),
      actions: ['ArrowRight'],
      expect: { floor: 2, score: 440, hull: 2, progress: 0, exitUnlocked: false },
    },
  ],
});

assert.equal(result.ok, true);
console.log(JSON.stringify(result, null, 2));
