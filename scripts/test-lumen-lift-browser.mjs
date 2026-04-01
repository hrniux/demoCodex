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

const TEST_URL = buildTestUrl({
  envName: 'LUMEN_LIFT_TEST_URL',
  pathname: '/lumen-lift.html',
  query: '?autotest=1&seed=4242',
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/lumen-lift-browser');
const CAPTURE_SCREENSHOTS = process.env.LUMEN_LIFT_CAPTURE === '1';

async function runBasicRoute(page) {
  await openStartedPage(page, { url: TEST_URL, startSelector: '#game-start' });

  await page.evaluate((setup) => {
    const game = window.lumenLiftGame;
    game.layout.start = { ...setup.layout.start };
    game.layout.exit = { ...setup.layout.exit };
    game.layout.walls = new Set(setup.layout.walls.map((cell) => `${cell.x}:${cell.y}`));
    game.layout.goals = setup.layout.goals.map((goal, index) => ({ id: goal.id ?? index, ...goal }));
    game.layout.goalKeys = new Set(game.layout.goals.map((goal) => `${goal.x}:${goal.y}`));

    Object.assign(game.state, {
      mode: setup.state.mode,
      floor: setup.state.floor,
      hull: setup.state.hull,
      score: setup.state.score,
      progress: setup.state.progress,
      turns: setup.state.turns,
      specialCooldown: setup.state.specialCooldown,
      freezeTurns: setup.state.freezeTurns,
      exitUnlocked: setup.state.exitUnlocked,
      player: { ...setup.state.player },
      items: setup.state.items.map((item, index) => ({ id: item.id ?? index, ...item })),
      hazards: setup.state.hazards.map((hazard, index) => ({ id: hazard.id ?? index, ...hazard })),
      boxes: setup.state.boxes.map((box, index) => ({ id: box.id ?? index, ...box })),
      lastAbility: setup.state.lastAbility.map((cell) => ({ ...cell })),
    });
    game.updateHud();
    game.setObjective();
    game.clearOverlay();
    game.render();
  }, goalProgressSetup({
    goal: { x: 3, y: 1 },
    box: { x: 2, y: 1 },
    player: { x: 1, y: 1 },
  }));

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);

  const state = await readRenderState(page);
  assert.equal(state.mode, 'active');
  assert.equal(state.player.x, 2);
  assert.equal(state.player.y, 1);
  assert.equal(state.progress, 1);
  assert.equal(state.score, 88);
  assert.deepEqual(state.boxes, [{ x: 3, y: 1, locked: true }]);
  assert.equal(state.exit.unlocked, false);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'progress.png', CAPTURE_SCREENSHOTS);
  return { shot, state };
}

async function runSpecialScenario(page) {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const game = window.lumenLiftGame;
    game.layout.start = { x: 0, y: 0 };
    game.layout.exit = { x: 6, y: 6 };
    game.layout.walls = new Set();
    game.layout.goals = [];
    game.layout.goalKeys = new Set();
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 2, y: 2 };
    game.state.boxes = [];
    game.state.hazards = [{ id: 0, x: 2, y: 1 }];
    game.state.items = [];
    game.state.progress = 0;
    game.state.turns = 0;
    game.state.score = 0;
    game.state.hull = 3;
    game.state.specialCooldown = 0;
    game.state.freezeTurns = 0;
    game.state.exitUnlocked = false;
    game.state.lastAbility = [];
    game.setStatus('测试场景');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(60);
  const afterAbility = await readRenderState(page);
  assert.equal(afterAbility.specialCooldown, 3);
  assert.equal(afterAbility.score, 0);
  assert.equal(afterAbility.progress, 0);
  assert.equal(afterAbility.exit.unlocked, false);
  assert.equal(afterAbility.hazards.length, 1);
  assert.deepEqual(afterAbility.hazards, [{ x: 2, y: 1 }]);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'special.png', CAPTURE_SCREENSHOTS);
  return { shot, afterAbility };
}

async function runExtractionScenario(page) {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const game = window.lumenLiftGame;
    game.loadFloor(1, { hull: 2, score: 210, mode: 'active' });
    game.layout.walls = new Set();
    game.layout.goals = [
      { id: 0, x: 1, y: 1 },
      { id: 1, x: 2, y: 1 },
      { id: 2, x: 3, y: 1 },
    ];
    game.layout.goalKeys = new Set(['1:1', '2:1', '3:1']);
    game.state.mode = 'active';
    game.state.floor = 1;
    game.state.player = { x: 5, y: 6 };
    game.state.boxes = [
      { id: 0, x: 1, y: 1, locked: true },
      { id: 1, x: 2, y: 1, locked: true },
      { id: 2, x: 3, y: 1, locked: true },
    ];
    game.state.hazards = [];
    game.state.items = [];
    game.state.progress = 3;
    game.state.turns = 5;
    game.state.score = 210;
    game.state.hull = 2;
    game.state.specialCooldown = 0;
    game.state.freezeTurns = 0;
    game.state.exitUnlocked = true;
    game.state.lastAbility = [];
    game.setStatus('测试场景');
    game.setObjective();
    game.updateHud();
    game.render();
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  const afterExtraction = await readRenderState(page);
  assert.equal(afterExtraction.floor, 2);
  assert.equal(afterExtraction.score, 455);
  assert.equal(afterExtraction.hull, 2);
  assert.equal(afterExtraction.progress, 0);
  assert.equal(afterExtraction.exit.unlocked, false);

  const shot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'extract.png', CAPTURE_SCREENSHOTS);
  return { shot, afterExtraction };
}

async function main() {
  const { browser, executablePath } = await launchLocalChrome(chromium);
  const page = await browser.newPage({
    viewport: { width: 1460, height: 1300 },
  });
  const errors = trackPageErrors(page);

  try {
    const basic = await runBasicRoute(page);
    const special = await runSpecialScenario(page);
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
                basic: basic.shot,
                special: special.shot,
                extraction: extraction.shot,
              }
            : null,
          basic: {
            player: basic.state.player,
            progress: basic.state.progress,
            score: basic.state.score,
          },
          special: {
            hazards: special.afterAbility.hazards,
            specialCooldown: special.afterAbility.specialCooldown,
          },
          extraction: {
            floor: extraction.afterExtraction.floor,
            score: extraction.afterExtraction.score,
            player: extraction.afterExtraction.player,
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
