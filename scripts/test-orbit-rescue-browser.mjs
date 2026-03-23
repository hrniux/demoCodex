import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { launchLocalChrome } from './local-chrome.mjs';

const TEST_URL =
  process.env.ORBIT_RESCUE_TEST_URL ||
  'http://127.0.0.1:4173/orbit-rescue.html?autotest=1&seed=4242';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/orbit-rescue-browser');
const CAPTURE_SCREENSHOTS = process.env.ORBIT_RESCUE_CAPTURE === '1';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function trackErrors(page) {
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console', text: msg.text() });
    }
  });

  page.on('pageerror', (error) => {
    errors.push({ type: 'pageerror', text: String(error) });
  });

  return errors;
}

async function screenshot(page, name) {
  if (!CAPTURE_SCREENSHOTS) {
    return null;
  }
  const target = path.join(SCREENSHOT_DIR, name);
  await page.screenshot({ path: target, fullPage: true });
  return target;
}

async function readState(page) {
  return page.evaluate(() => {
    if (typeof window.render_game_to_text !== 'function') {
      throw new Error('window.render_game_to_text is not available');
    }
    return JSON.parse(window.render_game_to_text());
  });
}

async function prepareScenario(page, fn) {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await page.click('#orbit-start');
  await page.evaluate(fn);
  await page.waitForTimeout(30);
}

async function runCollectionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.orbitRescueGame;
    game.state.mode = 'active';
    game.state.player = { ring: 4, sector: 0 };
    game.state.debris = [
      { id: 0, ring: 2, sector: 3 },
      { id: 1, ring: 1, sector: 9 },
    ];
    game.state.pods = [
      { id: 0, ring: 4, sector: 1, active: true },
      { id: 1, ring: 2, sector: 8, active: true },
      { id: 2, ring: 1, sector: 5, active: true },
    ];
    game.state.pulseNodes = [];
    game.state.collected = 0;
    game.state.pulseCharges = 0;
    game.state.freezeTurns = 0;
    game.state.turns = 0;
    game.state.hull = 3;
    game.state.score = 0;
    game.state.dockUnlocked = false;
    game.setStatus('测试采集');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readState(page);
  assert.equal(state.player.ring, 4);
  assert.equal(state.player.sector, 1);
  assert.equal(state.collected, 1);
  assert.equal(state.score, 140);
  assert.deepEqual(state.debris, [
    { ring: 2, sector: 4 },
    { ring: 1, sector: 8 },
  ]);

  const shot = await screenshot(page, 'collection.png');
  return { state, shot };
}

async function runPulseScenario(page) {
  await prepareScenario(page, () => {
    const game = window.orbitRescueGame;
    game.state.mode = 'active';
    game.state.player = { ring: 4, sector: 0 };
    game.state.debris = [{ id: 0, ring: 4, sector: 2 }];
    game.state.pods = [];
    game.state.pulseNodes = [];
    game.state.collected = 0;
    game.state.pulseCharges = 1;
    game.state.freezeTurns = 0;
    game.state.turns = 0;
    game.state.hull = 3;
    game.state.score = 0;
    game.state.dockUnlocked = false;
    game.setStatus('测试脉冲');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(50);
  const afterPulse = await readState(page);
  assert.equal(afterPulse.pulseCharges, 0);
  assert.equal(afterPulse.freezeTurns, 1);
  assert.deepEqual(afterPulse.debris, [{ ring: 4, sector: 2 }]);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const afterMove = await readState(page);
  assert.equal(afterMove.player.sector, 1);
  assert.equal(afterMove.freezeTurns, 0);
  assert.deepEqual(afterMove.debris, [{ ring: 4, sector: 2 }]);

  const shot = await screenshot(page, 'pulse.png');
  return { afterPulse, afterMove, shot };
}

async function runExtractionScenario(page) {
  await prepareScenario(page, () => {
    const game = window.orbitRescueGame;
    game.state.mode = 'active';
    game.state.player = { ring: 4, sector: 11 };
    game.state.debris = [{ id: 0, ring: 2, sector: 6 }];
    game.state.pods = [];
    game.state.pulseNodes = [];
    game.state.collected = 3;
    game.state.pulseCharges = 0;
    game.state.freezeTurns = 0;
    game.state.turns = 5;
    game.state.hull = 2;
    game.state.score = 200;
    game.state.dockUnlocked = true;
    game.setStatus('测试撤离');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const state = await readState(page);
  assert.equal(state.orbit, 2);
  assert.equal(state.score, 420);
  assert.equal(state.hull, 2);
  assert.equal(state.collected, 0);

  const shot = await screenshot(page, 'extract.png');
  return { state, shot };
}

async function main() {
  if (CAPTURE_SCREENSHOTS) {
    await ensureDir(SCREENSHOT_DIR);
  }

  const { browser, executablePath } = await launchLocalChrome(chromium);

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1280 },
  });
  const errors = trackErrors(page);

  try {
    const collection = await runCollectionScenario(page);
    const pulse = await runPulseScenario(page);
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
                pulse: pulse.shot,
                extraction: extraction.shot,
              }
            : null,
          collection: {
            player: collection.state.player,
            collected: collection.state.collected,
            score: collection.state.score,
          },
          pulse: {
            afterPulse: {
              freezeTurns: pulse.afterPulse.freezeTurns,
              debris: pulse.afterPulse.debris,
            },
            afterMove: {
              player: pulse.afterMove.player,
              freezeTurns: pulse.afterMove.freezeTurns,
            },
          },
          extraction: {
            orbit: extraction.state.orbit,
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
