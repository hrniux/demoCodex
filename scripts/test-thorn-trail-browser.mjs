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

const TEST_URL = buildTestUrl({
  envName: 'THORN_TRAIL_TEST_URL',
  pathname: '/thorn-trail.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/thorn-trail-browser');
const CAPTURE_SCREENSHOTS = process.env.THORN_TRAIL_CAPTURE === '1';

async function prepareScenario(page, fn) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#game-start' });
  await page.evaluate(fn);
  await page.waitForTimeout(260);
}

async function closeBrowserSafely(browser) {
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}

async function runHarvestScenario(page) {
  await prepareScenario(page, () => {
    const game = window.thornTrailGame;
    game.layout.walls = new Set();
    game.layout.goals = [];
    game.layout.goalKeys = new Set();
    game.layout.exit = { x: 6, y: 6 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 1, y: 1 };
    game.state.items = [{ id: 0, x: 2, y: 1, active: true }];
    game.state.hazards = [];
    game.state.boxes = [];
    game.state.progress = 0;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.specialCooldown = 0;
    game.state.freezeTurns = 0;
    game.state.exitUnlocked = false;
    game.state.lastAbility = [];
    game.clearOverlay();
    game.setStatus('测试采收');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.deepEqual(state.player, { x: 2, y: 1 });
  assert.equal(state.progress, 1);
  assert.equal(state.score, 48);
  assert.equal(state.items.length, 0);
  assert.equal(state.hazards.length, 0);
  assert.equal(state.exit.unlocked, false);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'harvest.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runPruneScenario(page) {
  await prepareScenario(page, () => {
    const game = window.thornTrailGame;
    game.layout.walls = new Set();
    game.layout.goals = [];
    game.layout.goalKeys = new Set();
    game.layout.exit = { x: 6, y: 6 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 4, y: 4 };
    game.state.items = [];
    game.state.hazards = [{ id: 0, x: 4, y: 3 }];
    game.state.boxes = [];
    game.state.progress = 0;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.specialCooldown = 0;
    game.state.freezeTurns = 0;
    game.state.exitUnlocked = false;
    game.state.lastAbility = [];
    game.clearOverlay();
    game.setStatus('测试修枝');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  const internals = await page.evaluate(() => ({
    hazards: window.thornTrailGame.state.hazards.map((hazard) => ({ x: hazard.x, y: hazard.y })),
    freezeTurns: window.thornTrailGame.state.freezeTurns,
  }));
  assert.equal(state.specialCooldown, 3);
  assert.equal(state.score, 32);
  assert.equal(state.hazards.length, 0);
  assert.equal(internals.freezeTurns, 0);
  assert.equal(internals.hazards.length, 0);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'prune.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runExtractionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.thornTrailGame;
    game.layout.walls = new Set();
    game.layout.goals = [];
    game.layout.goalKeys = new Set();
    game.layout.exit = { x: 6, y: 6 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 5, y: 6 };
    game.state.items = Array.from({ length: 7 }, (_, index) => ({
      id: index,
      x: index,
      y: 0,
      active: false,
    }));
    game.state.hazards = [];
    game.state.boxes = [];
    game.state.progress = 7;
    game.state.turns = 5;
    game.state.score = 200;
    game.state.hull = 2;
    game.state.specialCooldown = 0;
    game.state.freezeTurns = 0;
    game.state.exitUnlocked = true;
    game.state.lastAbility = [];
    game.clearOverlay();
    game.setStatus('测试撤离');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.equal(state.floor, 2);
  assert.equal(state.score, 460);
  assert.equal(state.hull, 2);
  assert.equal(state.progress, 0);
  assert.equal(state.exit.unlocked, false);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'extract.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function main() {
  const { browser, executablePath } = await launchLocalChrome(chromium);
  const page = await browser.newPage({
    viewport: { width: 1460, height: 1300 },
  });
  const errors = trackPageErrors(page);

  try {
    const harvest = await runHarvestScenario(page);
    const prune = await runPruneScenario(page);
    const extraction = await runExtractionScenario(page);

    assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

    console.log(
      JSON.stringify(
        {
          ok: true,
          url: TEST_URL,
          browser: executablePath,
          screenshots: CAPTURE_SCREENSHOTS
            ? {
                harvest: harvest.shot,
                prune: prune.shot,
                extraction: extraction.shot,
              }
            : null,
          harvest: {
            player: harvest.state.player,
            progress: harvest.state.progress,
            score: harvest.state.score,
          },
          prune: {
            score: prune.state.score,
            specialCooldown: prune.state.specialCooldown,
            hazards: prune.state.hazards.length,
          },
          extraction: {
            floor: extraction.state.floor,
            score: extraction.state.score,
            hull: extraction.state.hull,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await closeBrowserSafely(browser);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
  console.error(error);
  process.exit(1);
  });
