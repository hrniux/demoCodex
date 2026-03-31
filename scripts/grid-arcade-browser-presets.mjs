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
      boxes: [{ x: box.x, y: box.y, locked: false }],
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
      items: [{ x: item.x, y: item.y, active: true }],
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
      hazards: [{ x: player.x, y: player.y - 1 }],
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
      hazards: [{ x: player.x, y: player.y - 1 }],
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

function goalExtractionSetup({ score, progress = 3, exit = { x: 6, y: 6 } }) {
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
        { x: 1, y: 1, locked: true },
        { x: 2, y: 1, locked: true },
        { x: 3, y: 1, locked: true },
      ],
      hazards: [],
      items: [],
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

const PRESETS = {
  'ember-shift': {
    envName: 'EMBER_SHIFT_TEST_URL',
    pathname: '/ember-shift.html',
    globalName: 'emberShiftGame',
    captureEnv: 'EMBER_SHIFT_CAPTURE',
    screenshotDir: 'output/ember-shift-browser',
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
          score: 95,
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
        expect: { floor: 2, score: 460, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'rail-rift': {
    envName: 'RAIL_RIFT_TEST_URL',
    pathname: '/rail-rift.html',
    globalName: 'railRiftGame',
    captureEnv: 'RAIL_RIFT_CAPTURE',
    screenshotDir: 'output/rail-rift-browser',
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
          score: 50,
          itemsLength: 0,
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
        setup: itemExtractionSetup({ score: 200, progress: 6 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 450, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'glyph-keeper': {
    envName: 'GLYPH_KEEPER_TEST_URL',
    pathname: '/glyph-keeper.html',
    globalName: 'glyphKeeperGame',
    captureEnv: 'GLYPH_KEEPER_CAPTURE',
    screenshotDir: 'output/glyph-keeper-browser',
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
          score: 55,
          itemsLength: 0,
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
        setup: itemExtractionSetup({ score: 200, progress: 4 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 440, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'pixel-orchard': {
    envName: 'PIXEL_ORCHARD_TEST_URL',
    pathname: '/pixel-orchard.html',
    globalName: 'pixelOrchardGame',
    captureEnv: 'PIXEL_ORCHARD_CAPTURE',
    screenshotDir: 'output/pixel-orchard-browser',
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
          score: 45,
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
        expect: { specialCooldown: 3, hazardsLength: 0, score: 25 },
        internalExpect: { hazards: 0 },
      },
      {
        name: 'extraction',
        screenshot: 'extract.png',
        setup: itemExtractionSetup({ score: 180, progress: 8 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 410, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'signal-sprint': {
    envName: 'SIGNAL_SPRINT_TEST_URL',
    pathname: '/signal-sprint.html',
    globalName: 'signalSprintGame',
    captureEnv: 'SIGNAL_SPRINT_CAPTURE',
    screenshotDir: 'output/signal-sprint-browser',
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
          score: 45,
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
        expect: { specialCooldown: 3, hazardsLength: 0, score: 30 },
        internalExpect: { hazards: 0 },
      },
      {
        name: 'extraction',
        screenshot: 'extract.png',
        setup: itemExtractionSetup({ score: 180, progress: 10 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 430, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'vault-pusher': {
    envName: 'VAULT_PUSHER_TEST_URL',
    pathname: '/vault-pusher.html',
    globalName: 'vaultPusherGame',
    captureEnv: 'VAULT_PUSHER_CAPTURE',
    screenshotDir: 'output/vault-pusher-browser',
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
          score: 90,
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
  },
  'comet-lantern': {
    envName: 'COMET_LANTERN_TEST_URL',
    pathname: '/comet-lantern.html',
    globalName: 'cometLanternGame',
    captureEnv: 'COMET_LANTERN_CAPTURE',
    screenshotDir: 'output/comet-lantern-browser',
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
          score: 40,
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
        expect: { specialCooldown: 3, hazardsLength: 0, score: 30 },
        internalExpect: { hazards: 0 },
      },
      {
        name: 'extraction',
        screenshot: 'extract.png',
        setup: itemExtractionSetup({ score: 180, progress: 10 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 420, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
  'frostbite-freight': {
    envName: 'FROSTBITE_FREIGHT_TEST_URL',
    pathname: '/frostbite-freight.html',
    globalName: 'frostbiteFreightGame',
    captureEnv: 'FROSTBITE_FREIGHT_CAPTURE',
    screenshotDir: 'output/frostbite-freight-browser',
    scenarios: [
      {
        name: 'progress',
        screenshot: 'progress.png',
        setup: goalProgressSetup({
          goal: { x: 4, y: 3 },
          box: { x: 2, y: 3 },
          player: { x: 1, y: 3 },
          walls: [{ x: 5, y: 3 }],
        }),
        actions: ['ArrowRight'],
        expect: {
          player: { x: 2, y: 3 },
          progress: 1,
          score: 100,
          boxes: [{ x: 4, y: 3, locked: true }],
          hazardsLength: 0,
          exitUnlocked: false,
        },
      },
      {
        name: 'special',
        screenshot: 'special.png',
        setup: clearSetup({}),
        actions: ['KeyQ'],
        expect: { specialCooldown: 3, hazardsLength: 0, score: 35 },
        internalExpect: { hazards: 0 },
      },
      {
        name: 'extraction',
        screenshot: 'extract.png',
        setup: goalExtractionSetup({ score: 180 }),
        actions: ['ArrowRight'],
        expect: { floor: 2, score: 430, hull: 2, progress: 0, exitUnlocked: false },
      },
    ],
  },
};

export async function runNamedGridArcadeBrowserTest(name) {
  const config = PRESETS[name];
  if (!config) {
    throw new Error(`Unknown grid arcade preset: ${name}`);
  }

  const result = await runGridArcadeBrowserTest(config);
  return {
    ok: true,
    url: result.url,
    browser: result.browser,
    screenshots: result.screenshots,
    progress: result.scenarios.progress,
    special: result.scenarios.special,
    extraction: result.scenarios.extraction,
  };
}
