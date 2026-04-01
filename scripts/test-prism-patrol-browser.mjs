import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import prismPatrolModule from '../src/js/prism-patrol.js';
import {
  buildTestUrl,
  maybeCaptureScreenshot,
  openStartedPage,
  readRenderState,
  trackPageErrors,
} from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

const { CONFIG } = prismPatrolModule;

async function applyScenario(page, setup) {
  await page.evaluate((scenario) => {
    function normalizeActors(items, defaults = {}) {
      return (items || []).map((item, index) => ({
        id: item.id ?? index,
        ...defaults,
        ...item,
      }));
    }

    const game = window.prismPatrolGame;
    if (!game) {
      throw new Error('Game global not found: prismPatrolGame');
    }

    const layout = game.layout;
    const state = game.state;

    if (scenario.layout) {
      if (scenario.layout.start) {
        layout.start = { ...scenario.layout.start };
      }
      if (scenario.layout.exit) {
        layout.exit = { ...scenario.layout.exit };
      }
      if (scenario.layout.walls) {
        layout.walls = new Set(scenario.layout.walls.map((cell) => `${cell.x}:${cell.y}`));
      }
      if (scenario.layout.goals) {
        layout.goals = scenario.layout.goals.map((goal, index) => ({ id: goal.id ?? index, ...goal }));
        layout.goalKeys = new Set(layout.goals.map((goal) => `${goal.x}:${goal.y}`));
      }
    }

    if (scenario.state) {
      Object.assign(state, {
        mode: scenario.state.mode ?? state.mode,
        floor: scenario.state.floor ?? state.floor,
        hull: scenario.state.hull ?? state.hull,
        score: scenario.state.score ?? state.score,
        progress: scenario.state.progress ?? state.progress,
        turns: scenario.state.turns ?? state.turns,
        specialCooldown: scenario.state.specialCooldown ?? state.specialCooldown,
        freezeTurns: scenario.state.freezeTurns ?? state.freezeTurns,
        exitUnlocked: scenario.state.exitUnlocked ?? state.exitUnlocked,
        player: scenario.state.player ? { ...scenario.state.player } : state.player,
        items: normalizeActors(scenario.state.items, { active: true }),
        hazards: normalizeActors(scenario.state.hazards),
        boxes: normalizeActors(scenario.state.boxes, { locked: false }),
        lastAbility: (scenario.state.lastAbility || []).map((cell) => ({ ...cell })),
      });
    }

    game.clearOverlay();
    if (scenario.status) {
      game.setStatus(scenario.status);
    }
    game.setObjective();
    game.updateHud();
    game.render();
  }, setup);
}

function assertState(state, expected) {
  if (expected.player) {
    assert.deepEqual(state.player, expected.player);
  }
  if (expected.progress !== undefined) {
    assert.equal(state.progress, expected.progress);
  }
  if (expected.score !== undefined) {
    assert.equal(state.score, expected.score);
  }
  if (expected.hull !== undefined) {
    assert.equal(state.hull, expected.hull);
  }
  if (expected.specialCooldown !== undefined) {
    assert.equal(state.specialCooldown, expected.specialCooldown);
  }
  if (expected.floor !== undefined) {
    assert.equal(state.floor, expected.floor);
  }
  if (expected.exitUnlocked !== undefined) {
    assert.equal(state.exit.unlocked, expected.exitUnlocked);
  }
  if (expected.hazardsLength !== undefined) {
    assert.equal(state.hazards.length, expected.hazardsLength);
  }
  if (expected.itemsLength !== undefined) {
    assert.equal(state.items.length, expected.itemsLength);
  }
  if (expected.boxes) {
    assert.deepEqual(state.boxes, expected.boxes);
  }
}

async function assertInternal(page, expected) {
  if (!expected) {
    return;
  }

  const payload = await page.evaluate(() => ({
    freezeTurns: window.prismPatrolGame.state.freezeTurns,
    hazards: window.prismPatrolGame.state.hazards.length,
  }));

  if (expected.freezeTurns !== undefined) {
    assert.equal(payload.freezeTurns, expected.freezeTurns);
  }
  if (expected.hazards !== undefined) {
    assert.equal(payload.hazards, expected.hazards);
  }
}

async function runScenario(page, scenario, testUrl, captureEnabled, screenshotDir) {
  await openStartedPage(page, {
    url: testUrl,
    startSelector: '#game-start',
    delayMs: 320,
  });

  await applyScenario(page, scenario.setup);

  for (const key of scenario.actions || []) {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }

  await page.waitForTimeout(220);

  const state = await readRenderState(page);
  assertState(state, scenario.expect);
  await assertInternal(page, scenario.internalExpect);

  const screenshot = await maybeCaptureScreenshot(
    page,
    screenshotDir,
    scenario.screenshot,
    captureEnabled,
  );

  return { state, screenshot };
}

const testUrl = buildTestUrl({
  envName: 'PRISM_PATROL_TEST_URL',
  pathname: '/prism-patrol.html',
  query: '?autotest=1&seed=4242',
});
const captureEnabled = process.env.PRISM_PATROL_CAPTURE === '1';
const screenshotDir = path.resolve(process.cwd(), 'output/prism-patrol-browser');
const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1460, height: 1300 },
});
const errors = trackPageErrors(page);

const scenarios = [
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
        items: [{ x: 2, y: 1, active: true }],
        hazards: [],
        boxes: [],
        progress: 0,
        turns: 0,
        score: 0,
        hull: 3,
        specialCooldown: 0,
        freezeTurns: 0,
        exitUnlocked: false,
        lastAbility: [],
      },
    },
    actions: ['ArrowRight'],
    expect: {
      player: { x: 2, y: 1 },
      progress: 1,
      score: CONFIG.scoreItem,
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
        items: [],
        hazards: [{ x: 2, y: 1 }],
        boxes: [],
        progress: 0,
        turns: 0,
        score: 0,
        hull: 3,
        specialCooldown: 0,
        freezeTurns: 0,
        exitUnlocked: false,
        lastAbility: [],
      },
    },
    actions: ['KeyQ'],
    expect: {
      specialCooldown: 3,
      hazardsLength: 1,
      score: 0,
    },
    internalExpect: {
      freezeTurns: 1,
      hazards: 1,
    },
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
        items: [
          { x: 0, y: 0, active: false },
          { x: 1, y: 0, active: false },
          { x: 2, y: 0, active: false },
          { x: 3, y: 0, active: false },
          { x: 4, y: 0, active: false },
        ],
        hazards: [],
        boxes: [],
        progress: CONFIG.target,
        turns: 5,
        score: 180,
        hull: 2,
        specialCooldown: 0,
        freezeTurns: 0,
        exitUnlocked: true,
        lastAbility: [],
      },
    },
    actions: ['ArrowRight'],
    expect: {
      floor: 2,
      score: 180 + CONFIG.scoreClear,
      hull: 2,
      progress: 0,
      exitUnlocked: false,
    },
  },
];

const results = {};
let exitCode = 0;
try {
  for (const scenario of scenarios) {
    results[scenario.name] = await runScenario(page, scenario, testUrl, captureEnabled, screenshotDir);
  }

  assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

  const result = {
    ok: true,
    url: testUrl,
    browser: executablePath,
    screenshots: captureEnabled
      ? Object.fromEntries(Object.entries(results).map(([name, payload]) => [name, payload.screenshot]))
      : null,
    scenarios: Object.fromEntries(Object.entries(results).map(([name, payload]) => [name, payload.state])),
  };

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  exitCode = 1;
  throw error;
} finally {
  // We intentionally do not await browser.close() here. The test data and screenshots
  // are already captured, and forcing process exit avoids the Chrome shutdown hang.
  process.exit(exitCode);
}
