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
  envName: 'NEON_HEIST_TEST_URL',
  pathname: '/neon-heist.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/neon-heist-browser');
const CAPTURE_SCREENSHOTS = process.env.NEON_HEIST_CAPTURE === '1';

async function runBasicRoute(page) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#heist-start' });

  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowUp', 'Space']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
  }

  const state = await readRenderState(page);
  assert.equal(state.mode, 'active');
  assert.equal(state.player.x, 1);
  assert.equal(state.player.y, 5);
  assert.equal(state.collected, 1);
  assert.equal(state.lives, 3);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'core-route.png', CAPTURE_SCREENSHOTS);
  return { shot, state };
}

async function runDecoyScenario(page) {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const game = window.neonHeistGame;
    game.level = 2;
    game.loadLevel(2, game.seedForLevel(2));
    game.running = true;
    game.gameOver = false;
    game.levelState.player = { x: 3, y: 2 };
    game.levelState.decoyCharges = 1;
    game.levelState.decoys.forEach((item) => {
      item.active = false;
    });
    game.levelState.cores.forEach((item) => {
      item.active = false;
    });
    game.levelState.emps.forEach((item) => {
      item.active = false;
    });
    game.levelData.walls = new Set();
    game.levelState.drones = [{ id: 0, x: 3, y: 0 }];
    game.setStatus('测试场景');
    game.setObjective('验证诱饵是否改变追踪目标。');
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  const afterDeploy = await readRenderState(page);
  assert.equal(afterDeploy.decoyCharges, 0);
  assert.deepEqual(afterDeploy.activeDecoy, { x: 3, y: 2, turns: 1 });
  assert.deepEqual(afterDeploy.drones, [{ x: 3, y: 1 }]);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const afterMove = await readRenderState(page);
  assert.equal(afterMove.player.x, 4);
  assert.equal(afterMove.player.y, 2);
  assert.equal(afterMove.activeDecoy, null);
  assert.deepEqual(afterMove.drones, [{ x: 3, y: 2 }]);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'decoy-route.png', CAPTURE_SCREENSHOTS);
  return { shot, afterDeploy, afterMove };
}

async function main() {
  const { browser, executablePath } = await launchLocalChrome(chromium);

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1280 },
  });
  const errors = trackPageErrors(page);

  try {
    const basic = await runBasicRoute(page);
    const decoy = await runDecoyScenario(page);

    assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

    console.log(
      JSON.stringify(
        {
          ok: true,
          url: TEST_URL,
          browser: executablePath,
          screenshots: CAPTURE_SCREENSHOTS
            ? {
                basic: basic.shot,
                decoy: decoy.shot,
              }
            : null,
          basic: {
            turn: basic.state.turn,
            collected: basic.state.collected,
            player: basic.state.player,
          },
          decoy: {
            afterDeploy: {
              activeDecoy: decoy.afterDeploy.activeDecoy,
              drones: decoy.afterDeploy.drones,
            },
            afterMove: {
              activeDecoy: decoy.afterMove.activeDecoy,
              drones: decoy.afterMove.drones,
              player: decoy.afterMove.player,
            },
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
