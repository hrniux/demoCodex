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
  envName: 'TIDE_COURIER_TEST_URL',
  pathname: '/tide-courier.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/tide-courier-browser');
const CAPTURE_SCREENSHOTS = process.env.TIDE_COURIER_CAPTURE === '1';

async function prepareScenario(page, fn) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#tide-start' });
  await page.evaluate(fn);
  await page.waitForTimeout(30);
}

async function runCollectionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.tideCourierGame;
    game.state.mode = 'active';
    game.state.player = { x: 1, y: 1 };
    game.state.barges = [{ id: 0, x: 6, y: 1 }];
    game.state.cargos = [
      { id: 0, x: 2, y: 1, active: true },
      { id: 1, x: 5, y: 4, active: true },
      { id: 2, x: 7, y: 7, active: true },
    ];
    game.state.buoys = [];
    game.state.collected = 0;
    game.state.relayCharges = 0;
    game.state.currentPhase = 1;
    game.state.turns = 0;
    game.state.hull = 3;
    game.state.score = 0;
    game.state.dockUnlocked = false;
    game.setStatus('测试潮道采集');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.deepEqual(state.player, { x: 2, y: 1 });
  assert.equal(state.collected, 1);
  assert.equal(state.score, 140);
  assert.deepEqual(
    state.barges.map(({ x, y }) => ({ x, y })),
    [{ x: 7, y: 1 }],
  );

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'collection.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runReverseScenario(page) {
  await prepareScenario(page, () => {
    const game = window.tideCourierGame;
    game.state.mode = 'active';
    game.state.player = { x: 4, y: 1 };
    game.state.barges = [{ id: 0, x: 0, y: 1 }];
    game.state.cargos = [];
    game.state.buoys = [];
    game.state.collected = 0;
    game.state.relayCharges = 1;
    game.state.currentPhase = 1;
    game.state.turns = 0;
    game.state.hull = 3;
    game.state.score = 0;
    game.state.dockUnlocked = false;
    game.setStatus('测试反转潮流');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.equal(state.currentPhase, -1);
  assert.equal(state.relayCharges, 0);
  assert.deepEqual(state.player, { x: 3, y: 1 });
  assert.deepEqual(
    state.barges.map(({ x, y }) => ({ x, y })),
    [{ x: 8, y: 1 }],
  );

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'reverse.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runExtractionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.tideCourierGame;
    game.state.mode = 'active';
    game.state.player = { x: 1, y: 8 };
    game.state.barges = [{ id: 0, x: 6, y: 1 }];
    game.state.cargos = [];
    game.state.buoys = [];
    game.state.collected = 3;
    game.state.relayCharges = 0;
    game.state.currentPhase = 1;
    game.state.turns = 5;
    game.state.hull = 2;
    game.state.score = 220;
    game.state.dockUnlocked = true;
    game.setStatus('测试投递');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.equal(state.tide, 2);
  assert.equal(state.score, 450);
  assert.equal(state.hull, 2);
  assert.equal(state.collected, 0);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'extract.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function main() {
  const { browser, executablePath } = await launchLocalChrome(chromium);
  const page = await browser.newPage({
    viewport: { width: 1480, height: 1320 },
  });
  const errors = trackPageErrors(page);

  try {
    const collection = await runCollectionScenario(page);
    const reverse = await runReverseScenario(page);
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
                collection: collection.shot,
                reverse: reverse.shot,
                extraction: extraction.shot,
              }
            : null,
          collection: {
            player: collection.state.player,
            collected: collection.state.collected,
            score: collection.state.score,
          },
          reverse: {
            player: reverse.state.player,
            phase: reverse.state.currentPhase,
            barges: reverse.state.barges,
          },
          extraction: {
            tide: extraction.state.tide,
            score: extraction.state.score,
            hull: extraction.state.hull,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
