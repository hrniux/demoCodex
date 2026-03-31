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
  envName: 'MAGNET_FORGE_TEST_URL',
  pathname: '/magnet-forge.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/magnet-forge-browser');
const CAPTURE_SCREENSHOTS = process.env.MAGNET_FORGE_CAPTURE === '1';

async function prepareScenario(page, fn) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#forge-start' });
  await page.evaluate(fn);
  await page.waitForTimeout(260);
}

async function runPulseScenario(page) {
  await prepareScenario(page, () => {
    const game = window.magnetForgeGame;
    game.layout.walls = new Set();
    game.layout.reactors = [];
    game.layout.reactorKeys = new Set();
    game.layout.start = { x: 0, y: 0 };
    game.layout.exit = { x: 8, y: 8 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 4, y: 4 };
    game.state.blocks = [{ id: 0, x: 7, y: 4, locked: false }];
    game.state.enemies = [{ id: 0, x: 6, y: 4 }];
    game.state.powered = 0;
    game.state.pulseCooldown = 0;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.exitUnlocked = false;
    game.state.lastPulse = [];
    game.clearOverlay();
    game.setStatus('测试脉冲');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.deepEqual(state.blocks, [{ x: 6, y: 4, locked: false }]);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.pulseCooldown, 2);
  assert.equal(state.score, 60);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'pulse.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runPowerScenario(page) {
  await prepareScenario(page, () => {
    const game = window.magnetForgeGame;
    game.layout.walls = new Set();
    game.layout.reactors = [{ id: 0, x: 3, y: 4 }];
    game.layout.reactorKeys = new Set(['3:4']);
    game.layout.start = { x: 0, y: 0 };
    game.layout.exit = { x: 8, y: 8 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 1, y: 4 };
    game.state.blocks = [{ id: 0, x: 2, y: 4, locked: false }];
    game.state.enemies = [];
    game.state.powered = 0;
    game.state.pulseCooldown = 0;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.exitUnlocked = false;
    game.state.lastPulse = [];
    game.clearOverlay();
    game.setStatus('测试供电');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.equal(state.player.x, 2);
  assert.equal(state.player.y, 4);
  assert.deepEqual(state.blocks, [{ x: 3, y: 4, locked: true }]);
  assert.equal(state.reactors[0].powered, true);
  assert.equal(state.score, 90);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'power.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runExtractionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.magnetForgeGame;
    game.layout.walls = new Set();
    game.layout.reactors = [
      { id: 0, x: 1, y: 1 },
      { id: 1, x: 2, y: 1 },
      { id: 2, x: 3, y: 1 },
    ];
    game.layout.reactorKeys = new Set(['1:1', '2:1', '3:1']);
    game.layout.start = { x: 0, y: 0 };
    game.layout.exit = { x: 8, y: 7 };
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 7, y: 7 };
    game.state.blocks = [
      { id: 0, x: 1, y: 1, locked: true },
      { id: 1, x: 2, y: 1, locked: true },
      { id: 2, x: 3, y: 1, locked: true },
    ];
    game.state.enemies = [];
    game.state.powered = 3;
    game.state.pulseCooldown = 0;
    game.state.turns = 5;
    game.state.score = 180;
    game.state.hull = 2;
    game.state.exitUnlocked = true;
    game.state.lastPulse = [];
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
  assert.equal(state.exit.unlocked, false);
  assert.equal(state.blocks.filter((block) => block.locked).length, 0);

  const shot = await maybeCaptureScreenshot(
    page,
    SCREENSHOT_DIR,
    'extract.png',
    CAPTURE_SCREENSHOTS,
  );
  return { state, shot };
}

async function main() {
  const { browser, executablePath } = await launchLocalChrome(chromium);
  const page = await browser.newPage({
    viewport: { width: 1460, height: 1300 },
  });
  const errors = trackPageErrors(page);

  try {
    const pulse = await runPulseScenario(page);
    const power = await runPowerScenario(page);
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
                pulse: pulse.shot,
                power: power.shot,
                extraction: extraction.shot,
              }
            : null,
          pulse: {
            block: pulse.state.blocks[0],
            enemies: pulse.state.enemies.length,
            cooldown: pulse.state.pulseCooldown,
          },
          power: {
            player: power.state.player,
            block: power.state.blocks[0],
            score: power.state.score,
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
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
