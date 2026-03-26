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
  envName: 'CAVERN_BLAST_TEST_URL',
  pathname: '/cavern-blast.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/cavern-blast-browser');
const CAPTURE_SCREENSHOTS = process.env.CAVERN_BLAST_CAPTURE === '1';

async function prepareScenario(page, fn) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#cavern-start' });
  await page.evaluate(fn);
  await page.waitForTimeout(260);
}

async function runChargeScenario(page) {
  await prepareScenario(page, () => {
    const game = window.cavernBlastGame;
    game.layout.start = { x: 0, y: 10 };
    game.layout.exit = { x: 10, y: 0 };
    game.layout.walls = new Set();
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 2, y: 5 };
    game.state.crawlers = [];
    game.state.rubble = [];
    game.state.crystals = [];
    game.state.chargePacks = [{ id: 0, x: 3, y: 5, active: true }];
    game.state.bombs = [];
    game.state.lastBlast = [];
    game.state.collected = 0;
    game.state.charges = 1;
    game.state.maxCharges = 1;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.exitUnlocked = false;
    game.clearOverlay();
    game.setStatus('测试补给');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.deepEqual(state.player, { x: 3, y: 5 });
  assert.equal(state.maxCharges, 2);
  assert.equal(state.charges, 2);
  assert.equal(state.score, 35);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'charge.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runBlastScenario(page) {
  await prepareScenario(page, () => {
    const game = window.cavernBlastGame;
    game.layout.start = { x: 0, y: 10 };
    game.layout.exit = { x: 10, y: 0 };
    game.layout.walls = new Set(['4:4', '6:4']);
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 5, y: 5 };
    game.state.crawlers = [{ id: 0, x: 5, y: 3 }];
    game.state.rubble = [{ id: 0, x: 6, y: 5, active: true }];
    game.state.crystals = [];
    game.state.chargePacks = [];
    game.state.bombs = [];
    game.state.lastBlast = [];
    game.state.collected = 0;
    game.state.charges = 1;
    game.state.maxCharges = 1;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.exitUnlocked = false;
    game.state.nextBombId = 0;
    game.clearOverlay();
    game.setStatus('测试爆破');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
  const state = await readRenderState(page);
  assert.deepEqual(state.player, { x: 4, y: 6 });
  assert.equal(state.crawlers.length, 0);
  assert.equal(state.rubble.length, 0);
  assert.equal(state.charges, 1);
  assert.equal(state.score, 70);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'blast.png', CAPTURE_SCREENSHOTS);
  return { state, shot };
}

async function runExtractionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.cavernBlastGame;
    game.layout.start = { x: 0, y: 10 };
    game.layout.exit = { x: 9, y: 1 };
    game.layout.walls = new Set();
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 8, y: 1 };
    game.state.crawlers = [];
    game.state.rubble = [];
    game.state.crystals = [];
    game.state.chargePacks = [];
    game.state.bombs = [];
    game.state.lastBlast = [];
    game.state.collected = 3;
    game.state.charges = 1;
    game.state.maxCharges = 1;
    game.state.turns = 5;
    game.state.score = 220;
    game.state.hull = 2;
    game.state.exitUnlocked = true;
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
  assert.equal(state.score, 470);
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
    const charge = await runChargeScenario(page);
    const blast = await runBlastScenario(page);
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
                charge: charge.shot,
                blast: blast.shot,
                extraction: extraction.shot,
              }
            : null,
          charge: {
            player: charge.state.player,
            charges: charge.state.charges,
            maxCharges: charge.state.maxCharges,
          },
          blast: {
            player: blast.state.player,
            crawlers: blast.state.crawlers.length,
            rubble: blast.state.rubble.length,
            score: blast.state.score,
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
