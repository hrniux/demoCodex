import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  buildTestUrl,
  maybeCaptureScreenshot,
  openStartedPage,
  readRenderState,
  trackPageErrors,
} from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

function normalizeActors(items, defaults = {}) {
  return (items || []).map((item, index) => ({
    id: item.id ?? index,
    ...defaults,
    ...item,
  }));
}

async function applyScenario(page, { globalName, setup }) {
  await page.evaluate(
    ({ globalName: target, setup: scenario }) => {
      function normalizeActors(items, defaults = {}) {
        return (items || []).map((item, index) => ({
          id: item.id ?? index,
          ...defaults,
          ...item,
        }));
      }

      const game = window[target];
      if (!game) {
        throw new Error(`Game global not found: ${target}`);
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
    },
    { globalName, setup },
  );
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

async function assertInternal(page, globalName, expected) {
  if (!expected) {
    return;
  }

  const payload = await page.evaluate((target) => {
    const game = window[target];
    return {
      freezeTurns: game.state.freezeTurns,
      hazards: game.state.hazards.length,
    };
  }, globalName);

  if (expected.freezeTurns !== undefined) {
    assert.equal(payload.freezeTurns, expected.freezeTurns);
  }
  if (expected.hazards !== undefined) {
    assert.equal(payload.hazards, expected.hazards);
  }
}

export async function runGridArcadeBrowserTest(config) {
  const testUrl = buildTestUrl({
    envName: config.envName,
    pathname: config.pathname,
    query: config.query || '?autotest=1&seed=4242',
  });
  const captureEnabled = process.env[config.captureEnv] === '1';
  const screenshotDir = path.resolve(process.cwd(), config.screenshotDir);
  const { browser, executablePath } = await launchLocalChrome(chromium);
  const page = await browser.newPage({
    viewport: config.viewport || { width: 1460, height: 1300 },
  });
  const errors = trackPageErrors(page);

  try {
    const results = {};

    for (const scenario of config.scenarios) {
      await openStartedPage(page, {
        url: testUrl,
        startSelector: '#game-start',
        delayMs: 320,
      });
      await applyScenario(page, {
        globalName: config.globalName,
        setup: scenario.setup,
      });

      for (const key of scenario.actions || []) {
        await page.keyboard.press(key);
        await page.waitForTimeout(60);
      }

      const state = await readRenderState(page);
      assertState(state, scenario.expect);
      await assertInternal(page, config.globalName, scenario.internalExpect);

      const screenshot = await maybeCaptureScreenshot(
        page,
        screenshotDir,
        scenario.screenshot,
        captureEnabled,
      );

      results[scenario.name] = {
        state,
        screenshot,
      };
    }

    assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

    return {
      ok: true,
      url: testUrl,
      browser: executablePath,
      screenshots: captureEnabled
        ? Object.fromEntries(
            Object.entries(results).map(([name, payload]) => [name, payload.screenshot]),
          )
        : null,
      scenarios: Object.fromEntries(
        Object.entries(results).map(([name, payload]) => [name, payload.state]),
      ),
    };
  } finally {
    await browser.close();
  }
}
