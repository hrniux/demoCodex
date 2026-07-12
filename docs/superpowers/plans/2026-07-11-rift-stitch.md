# Rift Stitch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and feature a deterministic three-rail real-time arcade game, then make the repository manifest enforce the GitHub About count before the completed branch is pushed to `main`.

**Architecture:** Keep gameplay in a pure UMD simulation module driven by integer 60 Hz ticks, with a separate browser controller for DOM, Canvas, input, audio, persistence, and test hooks. Use authored wave templates with seeded mirroring rather than unconstrained procedural generation, and keep repository integration in existing manifest, menu, README, and npm-suite conventions.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Canvas 2D, Web Audio, CommonJS-compatible UMD modules, Node `assert`, Playwright driving the installed local Google Chrome, npm script auto-discovery.

---

## File Map

### New game-private files

- `rift-stitch.html` — semantic page shell and stable DOM contract.
- `src/css/rift-stitch.css` — complete visual theme, responsive layout, focus, reduced-motion, and contrast rules.
- `src/js/rift-stitch-engine.js` — pure fixed-tick model, schedules, collisions, scoring, state machine, snapshots, and self-check.
- `src/js/rift-stitch.js` — browser controller, rendering, audio, persistence, lifecycle, and autotest bridge.
- `scripts/test-rift-stitch-mechanics.mjs` — deterministic Node coverage for the pure engine.
- `scripts/test-rift-stitch-browser.mjs` — dedicated desktop/mobile Chrome regression and capture script.

### Shared integration files owned by the main thread

- `.github/project-about.md` — guarded playable count and updated positioning.
- `scripts/check-demo-manifest.mjs` — read and compare the GitHub About count.
- `scripts/test-check-demo-manifest.mjs` — parser/error tests for the new invariant.
- `package.json` — logic/browser entry points picked up by aggregate suites.
- `src/js/index-menu.js` — featured card and default spotlight.
- `index.html` — counts and static spotlight fallback.
- `README.md` — badges, manifest sentence, recommendations, facts, catalog, and validation description.

The pre-existing `.codex/config.toml` in the primary worktree is never staged. The implementation worktree must remain clean except for the files named by the active task.

### Task 1: Guard the GitHub About count

**Files:**
- Modify: `.github/project-about.md:5`
- Modify: `scripts/check-demo-manifest.mjs:1-180`
- Modify: `scripts/test-check-demo-manifest.mjs:1-31`

- [ ] **Step 1: Add failing parser and validation assertions**

Extend the import and assertions in `scripts/test-check-demo-manifest.mjs` with the following exact cases:

```js
import {
  findMissingTargets,
  parseMenuTargets,
  parseProjectAboutCount,
  parseSpotlightHref,
} from './check-demo-manifest.mjs';

assert.deepEqual(
  parseProjectAboutCount(
    '70 playable browser-native mini games and interactive experiments, built with vanilla JavaScript.',
  ),
  { count: 70, problem: null },
);
assert.deepEqual(parseProjectAboutCount('No numeric collection marker here.'), {
  count: null,
  problem: '.github/project-about.md does not contain the expected playable count.',
});
assert.deepEqual(
  parseProjectAboutCount(
    'many playable browser-native mini games and interactive experiments, built with vanilla JavaScript.',
  ),
  {
    count: null,
    problem: '.github/project-about.md playable count many is not numeric.',
  },
);

console.log(JSON.stringify({ ok: true, checks: 6 }));
```

- [ ] **Step 2: Run the focused test and verify the intended failure**

Run:

```bash
node scripts/test-check-demo-manifest.mjs
```

Expected: FAIL at module loading because `parseProjectAboutCount` is not exported.

- [ ] **Step 3: Implement the parser and report invariant**

Add this exported parser after `parseSpotlightHref`:

```js
export function parseProjectAboutCount(projectAboutText) {
  const match = projectAboutText.match(/([^\s]+)\s+playable browser-native/);
  if (!match) {
    return {
      count: null,
      problem: '.github/project-about.md does not contain the expected playable count.',
    };
  }

  if (!/^\d+$/.test(match[1])) {
    return {
      count: null,
      problem: `.github/project-about.md playable count ${match[1]} is not numeric.`,
    };
  }

  return { count: Number(match[1]), problem: null };
}
```

Make `readManifestSources()` return `projectAbout`, parse it in `buildManifestReport()`, and add the problem exactly once:

```js
const projectAboutResult = parseProjectAboutCount(projectAbout);

if (projectAboutResult.problem) {
  problems.push(projectAboutResult.problem);
} else if (projectAboutResult.count !== menuCardCount) {
  problems.push(
    `GitHub About playable count ${projectAboutResult.count} does not match index menu card count ${menuCardCount}.`,
  );
}
```

Return and print `projectAboutCount: projectAboutResult.count` in the manifest report. Update `.github/project-about.md` from `43 playable` to the current pre-game baseline `69 playable` so the repository remains green between commits.

- [ ] **Step 4: Verify the focused rule and live manifest**

Run:

```bash
npm run test:manifest:logic
npm run check:manifest
```

Expected: parser output reports `checks: 6`; manifest reports `projectAboutCount: 69` and `ok: true`.

- [ ] **Step 5: Commit the guarded invariant**

```bash
git add .github/project-about.md scripts/check-demo-manifest.mjs scripts/test-check-demo-manifest.mjs
git diff --cached --check
git commit -m "Guard GitHub About game count"
```

### Task 2: Establish the deterministic engine and schedule validator

**Files:**
- Create: `src/js/rift-stitch-engine.js`
- Create: `scripts/test-rift-stitch-mechanics.mjs`

- [ ] **Step 1: Write failing foundation tests**

Create `scripts/test-rift-stitch-mechanics.mjs` with imports and these first assertions:

```js
import assert from 'node:assert/strict';
import engine from '../src/js/rift-stitch-engine.js';

const {
  CONSTANTS,
  createGameState,
  getWaveSchedule,
  snapshotGame,
  validateSchedule,
} = engine;

const first = createGameState({ seed: 4242 });
const second = createGameState({ seed: 4242 });
assert.deepEqual(snapshotGame(first), snapshotGame(second));
assert.deepEqual(getWaveSchedule(4242, 1), getWaveSchedule(4242, 1));
assert.notDeepEqual(getWaveSchedule(4242, 1), getWaveSchedule(4243, 1));
assert.equal(CONSTANTS.TICK_RATE, 60);
assert.equal(first.mode, 'idle');
assert.equal(first.integrity, 3);
assert.equal(first.player.rail, 1);

assert.deepEqual(validateSchedule(getWaveSchedule(4242, 1)), { ok: true, problems: [] });
assert.equal(
  validateSchedule([
    { tick: 60, impactTick: 180, type: 'burn', rail: 0 },
    { tick: 60, impactTick: 180, type: 'burn', rail: 1 },
    { tick: 60, impactTick: 180, type: 'burn', rail: 2 },
  ]).ok,
  false,
);
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```bash
node scripts/test-rift-stitch-mechanics.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/js/rift-stitch-engine.js`.

- [ ] **Step 3: Add the pure UMD engine foundation**

Create `src/js/rift-stitch-engine.js` with this module boundary and constants:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.RiftStitchEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONSTANTS = Object.freeze({
    TICK_RATE: 60,
    WIDTH: 960,
    HEIGHT: 600,
    RAILS: Object.freeze([240, 480, 720]),
    PLAYER_Y: 510,
    STITCH_TOP: 390,
    STITCH_BOTTOM: 500,
    MOVE_TICKS: 8,
    STITCH_TICKS: 54,
    X_WINDOW_TICKS: 25,
    X_STITCH_TICKS: 39,
    COUNTDOWN_TICKS: 180,
    WAVE_TICKS: 1800,
    WAVE_RESULT_TICKS: 120,
  });

  function nextRandom(state) {
    let value = state >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return value >>> 0;
  }

  const BASE_WAVES = Object.freeze({
    1: Object.freeze([
      Object.freeze({ tick: 180, impactTick: 320, type: 'rift', rail: 0, speed: 180 }),
      Object.freeze({ tick: 420, impactTick: 560, type: 'rift', rail: 1, speed: 180 }),
      Object.freeze({ tick: 660, impactTick: 800, type: 'rift', rail: 2, speed: 180 }),
    ]),
  });

  function transformRail(rail, seed) {
    return seed % 2 === 0 ? rail : 2 - rail;
  }

  function getWaveSchedule(seed, wave) {
    const source = BASE_WAVES[wave] || BASE_WAVES[1];
    return source.map((event) => ({ ...event, rail: transformRail(event.rail, seed >>> 0) }));
  }

  function validateSchedule(schedule) {
    const problems = [];
    const burnRailsByImpact = new Map();
    for (const event of schedule) {
      if (!Number.isInteger(event.tick) || event.tick < 0 || event.tick >= CONSTANTS.WAVE_TICKS) {
        problems.push(`invalid tick ${event.tick}`);
      }
      if (!['rift', 'armor', 'burn', 'boss'].includes(event.type)) {
        problems.push(`invalid type ${event.type}`);
      }
      if (!Number.isInteger(event.rail) || event.rail < 0 || event.rail > 2) {
        problems.push(`invalid rail ${event.rail}`);
      }
      if (event.type === 'burn') {
        const rails = burnRailsByImpact.get(event.impactTick) || new Set();
        rails.add(event.rail);
        burnRailsByImpact.set(event.impactTick, rails);
      }
    }
    for (const [impactTick, rails] of burnRailsByImpact) {
      if (rails.size === 3) {
        problems.push(`burn pattern at ${impactTick} blocks every rail`);
      }
    }
    return { ok: problems.length === 0, problems };
  }

  function createGameState(options = {}) {
    const seed = (options.seed ?? 4242) >>> 0;
    const wave = options.wave ?? 1;
    return {
      seed,
      rngState: nextRandom(seed || 1),
      mode: options.mode || 'idle',
      resumeMode: null,
      tick: 0,
      wave,
      waveTick: 0,
      countdownTicks: 0,
      resultTicks: 0,
      integrity: 3,
      score: 0,
      comboQuarter: 4,
      comboIdleTicks: 0,
      player: { rail: 1, fromRail: 1, toRail: 1, moveTicks: 0 },
      stitch: null,
      objects: [],
      schedule: getWaveSchedule(seed, wave),
      scheduleIndex: 0,
      nextObjectId: 1,
      bossHits: 0,
      waveDamage: 0,
      events: [],
    };
  }

  function snapshotGame(state) {
    return {
      seed: state.seed,
      mode: state.mode,
      tick: state.tick,
      wave: state.wave,
      waveTick: state.waveTick,
      integrity: state.integrity,
      score: state.score,
      combo: state.comboQuarter / 4,
      player: { rail: state.player.rail, moveTicks: state.player.moveTicks },
      stitch: state.stitch,
      objects: state.objects.map((object) => ({ ...object })),
      bossHits: state.bossHits,
    };
  }

  return {
    CONSTANTS,
    createGameState,
    getWaveSchedule,
    snapshotGame,
    validateSchedule,
  };
});
```

- [ ] **Step 4: Run the foundation tests**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: PASS with no output and exit code 0.

- [ ] **Step 5: Commit the engine foundation**

```bash
git add src/js/rift-stitch-engine.js scripts/test-rift-stitch-mechanics.mjs
git diff --cached --check
git commit -m "Build deterministic Rift Stitch engine"
```

### Task 3: Drive lane movement, stitches, and X knots with tests

**Files:**
- Modify: `src/js/rift-stitch-engine.js`
- Modify: `scripts/test-rift-stitch-mechanics.mjs`

- [ ] **Step 1: Add failing movement and stitch assertions**

Append these tests, using a helper that starts without scheduled spawns:

```js
const { queueAction, stepGame } = engine;

function createRunningState() {
  const state = createGameState({ seed: 4242, mode: 'running' });
  state.schedule = [];
  return state;
}

const boundary = createRunningState();
queueAction(boundary, 'left');
queueAction(boundary, 'left');
stepGame(boundary, 8);
assert.equal(boundary.player.rail, 0);
assert.equal(boundary.stitch.type, 'normal');
assert.deepEqual(boundary.stitch.pair, [0, 1]);
assert.equal(boundary.stitch.expiresAt - boundary.tick, 54);
queueAction(boundary, 'left');
stepGame(boundary, 8);
assert.equal(boundary.player.rail, 0);

const exactX = createRunningState();
queueAction(exactX, 'left');
stepGame(exactX, 8);
stepGame(exactX, 17);
queueAction(exactX, 'right');
stepGame(exactX, 8);
assert.equal(exactX.stitch.type, 'x');
assert.equal(exactX.stitch.segments.length, 2);
assert.equal(exactX.stitch.expiresAt - exactX.tick, 39);

const lateReverse = createRunningState();
queueAction(lateReverse, 'left');
stepGame(lateReverse, 8);
stepGame(lateReverse, 18);
queueAction(lateReverse, 'right');
stepGame(lateReverse, 8);
assert.equal(lateReverse.stitch.type, 'normal');

stepGame(lateReverse, 54);
assert.equal(lateReverse.stitch, null);
```

- [ ] **Step 2: Verify the missing-action failure**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: FAIL because `queueAction` and `stepGame` are not functions.

- [ ] **Step 3: Implement one action queue and fixed-tick movement**

Add these functions to the engine and export `queueAction` and `stepGame`:

```js
function pairFor(fromRail, toRail) {
  return fromRail < toRail ? [fromRail, toRail] : [toRail, fromRail];
}

function samePair(first, second) {
  return first[0] === second[0] && first[1] === second[1];
}

function makeSegment(fromRail, toRail) {
  return {
    x1: CONSTANTS.RAILS[fromRail],
    y1: CONSTANTS.STITCH_BOTTOM,
    x2: CONSTANTS.RAILS[toRail],
    y2: CONSTANTS.STITCH_TOP,
  };
}

function queueAction(state, action) {
  if (state.mode !== 'running' || state.player.moveTicks > 0) {
    return false;
  }
  const delta = action === 'left' ? -1 : action === 'right' ? 1 : 0;
  const target = state.player.rail + delta;
  if (!delta || target < 0 || target > 2) {
    return false;
  }
  state.player.fromRail = state.player.rail;
  state.player.toRail = target;
  state.player.moveTicks = CONSTANTS.MOVE_TICKS;
  return true;
}

function finishMove(state) {
  const fromRail = state.player.fromRail;
  const toRail = state.player.toRail;
  const pair = pairFor(fromRail, toRail);
  const segment = makeSegment(fromRail, toRail);
  const canCross =
    state.stitch &&
    state.stitch.type === 'normal' &&
    samePair(state.stitch.pair, pair) &&
    state.stitch.fromRail === toRail &&
    state.stitch.toRail === fromRail &&
    state.tick - state.stitch.createdAt <= CONSTANTS.X_WINDOW_TICKS;

  state.player.rail = toRail;
  state.stitch = canCross
    ? {
        id: state.tick,
        type: 'x',
        pair,
        fromRail,
        toRail,
        segments: [state.stitch.segments[0], segment],
        createdAt: state.tick,
        expiresAt: state.tick + CONSTANTS.X_STITCH_TICKS,
      }
    : {
        id: state.tick,
        type: 'normal',
        pair,
        fromRail,
        toRail,
        segments: [segment],
        createdAt: state.tick,
        expiresAt: state.tick + CONSTANTS.STITCH_TICKS,
      };
  state.events.push({ type: canCross ? 'x-created' : 'stitch-created' });
}

function stepOne(state) {
  if (state.mode !== 'running') {
    return;
  }
  state.tick += 1;
  state.waveTick += 1;
  if (state.player.moveTicks > 0) {
    state.player.moveTicks -= 1;
    if (state.player.moveTicks === 0) {
      finishMove(state);
    }
  }
  if (state.stitch && state.tick >= state.stitch.expiresAt) {
    state.stitch = null;
  }
}

function stepGame(state, ticks = 1) {
  if (!Number.isSafeInteger(ticks) || ticks < 1) {
    throw new RangeError('ticks must be a positive safe integer');
  }
  for (let index = 0; index < ticks; index += 1) {
    stepOne(state);
  }
  return state;
}
```

`state.events` is an append-only outbox between controller reads. Every event is an object with a
`type` property. `stepGame()` does not erase it; `RiftStitchGame.consumeEvents()` drains it with
`splice(0)` after the requestAnimationFrame catch-up loop. Invalid tick counts throw before any
state field changes.

- [ ] **Step 4: Run the focused engine test**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: PASS; the exact 25-tick reverse creates X and the 26-tick reverse does not.

- [ ] **Step 5: Commit movement and stitching**

```bash
git add src/js/rift-stitch-engine.js scripts/test-rift-stitch-mechanics.mjs
git diff --cached --check
git commit -m "Add Rift Stitch weaving mechanics"
```

### Task 4: Resolve targets, damage, scoring, and combo

**Files:**
- Modify: `src/js/rift-stitch-engine.js`
- Modify: `scripts/test-rift-stitch-mechanics.mjs`

- [ ] **Step 1: Add failing collision and scoring scenarios**

Append helpers and assertions that build targets at deterministic coordinates:

```js
function addObject(state, object) {
  state.objects.push({
    id: state.nextObjectId++,
    speed: 0,
    radius: 18,
    hitStitchIds: [],
    ...object,
  });
}

const normalHit = createRunningState();
queueAction(normalHit, 'left');
stepGame(normalHit, 8);
addObject(normalHit, { type: 'rift', rail: 0, x: 360, y: 445 });
stepGame(normalHit, 1);
assert.equal(normalHit.objects.length, 0);
assert.equal(normalHit.score, 150);
assert.equal(normalHit.comboQuarter, 5);

const armorImmune = createRunningState();
queueAction(armorImmune, 'left');
stepGame(armorImmune, 8);
addObject(armorImmune, { type: 'armor', rail: 0, x: 360, y: 445 });
stepGame(armorImmune, 1);
assert.equal(armorImmune.objects.length, 1);

const armorX = createRunningState();
queueAction(armorX, 'left');
stepGame(armorX, 8);
queueAction(armorX, 'right');
stepGame(armorX, 8);
addObject(armorX, { type: 'armor', rail: 1, x: 360, y: 445 });
stepGame(armorX, 1);
assert.equal(armorX.objects.length, 0);
assert.equal(armorX.score, 350);

const burnDamage = createRunningState();
addObject(burnDamage, { type: 'burn', rail: 1, x: 480, y: 510 });
stepGame(burnDamage, 1);
assert.equal(burnDamage.integrity, 2);
assert.equal(burnDamage.comboQuarter, 4);
assert.equal(burnDamage.objects.length, 0);

const gameOver = createRunningState();
gameOver.integrity = 1;
addObject(gameOver, { type: 'rift', rail: 0, x: 240, y: 530 });
stepGame(gameOver, 1);
assert.equal(gameOver.integrity, 0);
assert.equal(gameOver.mode, 'game-over');
```

- [ ] **Step 2: Verify collision tests fail before implementation**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: FAIL because objects are neither collided nor damaged.

- [ ] **Step 3: Implement geometry and deterministic score bookkeeping**

Add complete point-to-segment and resolution helpers:

```js
function distanceToSegmentSquared(point, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSquared = dx * dx + dy * dy;
  const raw = lengthSquared === 0
    ? 0
    : ((point.x - segment.x1) * dx + (point.y - segment.y1) * dy) / lengthSquared;
  const amount = Math.max(0, Math.min(1, raw));
  const x = segment.x1 + dx * amount;
  const y = segment.y1 + dy * amount;
  const offsetX = point.x - x;
  const offsetY = point.y - y;
  return offsetX * offsetX + offsetY * offsetY;
}

function scoreHit(state, base, precision) {
  state.score += Math.floor(((base + precision) * state.comboQuarter) / 4);
  state.comboQuarter = Math.min(20, state.comboQuarter + 1);
  state.comboIdleTicks = 0;
}

function applyDamage(state, source) {
  state.integrity = Math.max(0, state.integrity - 1);
  state.comboQuarter = 4;
  state.comboIdleTicks = 0;
  state.stitch = null;
  state.waveDamage += 1;
  state.damageFlashTicks = 18;
  state.events.push({ type: 'damage', source });
  if (state.integrity === 0) {
    state.mode = 'game-over';
    state.events.push({ type: 'game-over' });
  }
}
```

In `stepOne()`, move objects by `object.speed / CONSTANTS.TICK_RATE`, resolve rifts against any stitch segment, resolve armor only against the X intersection, ignore stitches for burn knots, consume a burn knot colliding with the current player rail at `PLAYER_Y`, and damage any surviving rift/armor after `y >= 530`. Filter destroyed objects once per tick so one object can score only once. Update combo decay after collision resolution:

```js
state.comboIdleTicks += 1;
if (state.comboIdleTicks > 90 && (state.comboIdleTicks - 90) % 30 === 0) {
  state.comboQuarter = Math.max(4, state.comboQuarter - 1);
}
```

Use a midpoint bonus of 50 when the collision point is within 18 pixels of `(360 or 600, 445)` for the active rail pair.

- [ ] **Step 4: Run all current mechanics assertions**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: PASS for normal, precision, armor, burn, game-over, and combo assertions.

- [ ] **Step 5: Commit collision and score behavior**

```bash
git add src/js/rift-stitch-engine.js scripts/test-rift-stitch-mechanics.mjs
git diff --cached --check
git commit -m "Resolve Rift Stitch targets and scoring"
```

### Task 5: Complete waves, lifecycle, boss, restart, and self-check

**Files:**
- Modify: `src/js/rift-stitch-engine.js`
- Modify: `scripts/test-rift-stitch-mechanics.mjs`

- [ ] **Step 1: Add failing lifecycle, wave, and boss assertions**

Append assertions for state transitions and unique boss hits:

```js
const lifecycle = createGameState({ seed: 4242 });
assert.equal(queueAction(lifecycle, 'start'), true);
assert.equal(lifecycle.mode, 'countdown');
stepGame(lifecycle, CONSTANTS.COUNTDOWN_TICKS);
assert.equal(lifecycle.mode, 'running');
queueAction(lifecycle, 'pause');
assert.equal(lifecycle.mode, 'paused');
const pausedTick = lifecycle.tick;
stepGame(lifecycle, 60);
assert.equal(lifecycle.tick, pausedTick);
queueAction(lifecycle, 'pause');
assert.equal(lifecycle.mode, 'countdown');

const waveClear = createRunningState();
waveClear.waveTick = CONSTANTS.WAVE_TICKS - 1;
waveClear.scheduleIndex = waveClear.schedule.length;
stepGame(waveClear, 1);
assert.equal(waveClear.mode, 'wave-result');
assert.equal(waveClear.score, 1000);
stepGame(waveClear, CONSTANTS.WAVE_RESULT_TICKS);
assert.equal(waveClear.wave, 2);
assert.equal(waveClear.mode, 'running');

const boss = createRunningState();
boss.wave = 6;
boss.schedule = [];
addObject(boss, {
  type: 'boss',
  rail: 1,
  x: 360,
  y: 445,
  radius: 30,
  health: 3,
  hitStitchIds: [],
});
for (let hit = 0; hit < 3; hit += 1) {
  boss.stitch = {
    id: 100 + hit,
    type: 'x',
    pair: [0, 1],
    segments: [],
    createdAt: boss.tick,
    expiresAt: boss.tick + 39,
  };
  stepGame(boss, 1);
}
assert.equal(boss.mode, 'won');
assert.equal(boss.bossHits, 3);
assert.equal(boss.score, 2500);

const check = engine.runSelfCheck();
assert.equal(check.ok, true);
assert.equal(check.xBoundary, true);
assert.equal(check.damagePath, true);
```

- [ ] **Step 2: Verify lifecycle tests fail**

Run `node scripts/test-rift-stitch-mechanics.mjs`.

Expected: FAIL on the first unsupported `start` action.

- [ ] **Step 3: Add all six schedules and lifecycle transitions**

Expand `BASE_WAVES` with authored event arrays for waves 2-6. Every event must have integer `tick`, `impactTick`, `type`, `rail`, and `speed`; armor events also have `pair`, and the single wave-6 boss has `health: 3`. Keep every schedule under `WAVE_TICKS - 120`, validate it at module initialization, and throw ``Invalid Rift Stitch wave ${wave}: ${problems.join(', ')}`` if a built-in schedule is invalid.

Extend `queueAction()` with these exact state transitions:

```js
if (action === 'start' && ['idle', 'game-over', 'won'].includes(state.mode)) {
  const fresh = createGameState({ seed: state.seed });
  Object.assign(state, fresh, { mode: 'countdown', countdownTicks: CONSTANTS.COUNTDOWN_TICKS });
  return true;
}
if (action === 'restart') {
  const fresh = createGameState({ seed: state.seed });
  Object.assign(state, fresh, { mode: 'countdown', countdownTicks: CONSTANTS.COUNTDOWN_TICKS });
  return true;
}
if (action === 'pause' && state.mode === 'running') {
  state.resumeMode = 'running';
  state.mode = 'paused';
  return true;
}
if (action === 'pause' && state.mode === 'paused') {
  state.mode = 'countdown';
  state.countdownTicks = CONSTANTS.COUNTDOWN_TICKS;
  return true;
}
```

Update `stepOne()` to decrement countdown/result modes, spawn due events, award a no-damage bonus exactly once, advance to the next wave after 120 result ticks, and enter `won` only after the third unique X-stitch boss hit. A boss tracks `hitStitchIds`, so one X knot cannot score twice.

Implement `runSelfCheck()` entirely through public actions and fixed ticks. Return:

```js
{
  ok: deterministic && xBoundary && damagePath && bossPath,
  deterministic,
  xBoundary,
  damagePath,
  bossPath,
  checkedWaves: 6,
}
```

- [ ] **Step 4: Run mechanics and repeatability checks**

Run twice and compare output hashes:

```bash
node scripts/test-rift-stitch-mechanics.mjs
node -e "const e=require('./src/js/rift-stitch-engine.js'); console.log(JSON.stringify(e.runSelfCheck()))"
node -e "const e=require('./src/js/rift-stitch-engine.js'); console.log(JSON.stringify(e.runSelfCheck()))"
```

Expected: all commands pass and the two self-check JSON payloads are identical.

- [ ] **Step 5: Commit the complete engine loop**

```bash
git add src/js/rift-stitch-engine.js scripts/test-rift-stitch-mechanics.mjs
git diff --cached --check
git commit -m "Complete Rift Stitch wave loop"
```

### Task 6: Build the semantic page, responsive visual system, and browser controller

**Files:**
- Create: `rift-stitch.html`
- Create: `src/css/rift-stitch.css`
- Create: `src/js/rift-stitch.js`
- Create: `scripts/test-rift-stitch-browser.mjs`

- [ ] **Step 1: Write a failing Chrome boot contract**

Create `scripts/test-rift-stitch-browser.mjs` with an owned static server, local Chrome launcher, page-error tracking, and this first scenario:

```js
import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  buildTestUrl,
  maybeCaptureScreenshot,
  readRenderState,
  trackPageErrors,
} from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';
import { startStaticServer } from './static-server.mjs';

const rootDir = process.cwd();
const capture = process.env.RIFT_STITCH_CAPTURE === '1';
const screenshotDir = path.resolve(rootDir, 'output/rift-stitch-browser');
const ownsServer = !process.env.RIFT_STITCH_TEST_URL && !process.env.DEMOCODEX_BASE_URL;
const server = ownsServer ? await startStaticServer({ rootDir }) : null;
if (server) process.env.DEMOCODEX_BASE_URL = server.url;

const url = buildTestUrl({
  envName: 'RIFT_STITCH_TEST_URL',
  pathname: '/rift-stitch.html',
  query: '?autotest=1&seed=4242',
});
const { browser, executablePath } = await launchLocalChrome(chromium);

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = trackPageErrors(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  const idle = await readRenderState(page);
  assert.equal(idle.mode, 'idle');
  assert.equal(idle.player.rail, 1);
  assert.equal(await page.locator('#rift-canvas').getAttribute('role'), 'img');
  assert.equal(await page.locator('#rift-start').isVisible(), true);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(JSON.stringify({ ok: true, browser: executablePath, idle }));
} finally {
  await browser.close();
  if (server) await server.close();
}
```

- [ ] **Step 2: Run the browser test and verify page absence**

Run `node scripts/test-rift-stitch-browser.mjs`.

Expected: FAIL because `/rift-stitch.html` does not expose the test protocol.

- [ ] **Step 3: Create the exact HTML DOM contract**

Create a `zh-CN` HTML document that loads `src/css/rift-stitch.css`, then `src/js/rift-stitch-engine.js`, then `src/js/rift-stitch.js`. The shell must contain these IDs exactly:

```html
<main class="rift-shell">
  <header class="rift-hero">
    <a class="rift-back" href="index.html">返回合集</a>
    <div>
      <p class="rift-eyebrow">Rift Stitch · Real-time Arcade</p>
      <h1>裂光织梭</h1>
      <p>移动就是攻击。换轨留下缝线，快速折返织成 X 结。</p>
    </div>
    <div class="rift-hero__actions">
      <button id="rift-start" type="button">启动织机</button>
      <button id="rift-pause" type="button">暂停</button>
      <button id="rift-restart" type="button">重织</button>
      <button id="rift-mute" type="button" aria-pressed="false">静音</button>
    </div>
  </header>
  <section class="rift-layout">
    <section class="rift-panel rift-panel--game" aria-label="裂光织梭游戏区">
      <div class="rift-hud">
        <article><span>得分</span><strong id="rift-score">0</strong></article>
        <article><span>完整度</span><strong id="rift-integrity">3</strong></article>
        <article><span>波次</span><strong id="rift-wave">1 / 6</strong></article>
        <article><span>连击</span><strong id="rift-combo">1×</strong></article>
        <article><span>织线</span><strong id="rift-stitch">待机</strong></article>
        <article><span>纪录</span><strong id="rift-best">0</strong></article>
      </div>
      <div class="rift-stage">
        <canvas id="rift-canvas" width="960" height="600" role="img" aria-label="三条光轨上的裂影、缝线与光梭实时战场"></canvas>
        <div id="rift-overlay" class="rift-overlay is-visible" aria-live="polite">
          <p id="rift-overlay-kicker">城市织机待命</p>
          <h2 id="rift-overlay-title">按 Enter 或启动织机</h2>
          <p id="rift-overlay-body">左右换轨会留下可切开裂影的光线。</p>
        </div>
      </div>
      <div class="rift-touch" aria-label="移动控制">
        <button id="rift-left" type="button" aria-label="向左换轨">← 左织</button>
        <button id="rift-right" type="button" aria-label="向右换轨">右织 →</button>
      </div>
    </section>
    <aside class="rift-panel rift-panel--side">
      <section><h2>当前任务</h2><p id="rift-status" aria-live="polite">准备校准第一条缝线。</p></section>
      <section><h2>威胁图例</h2><ul><li>○ 裂影：任意缝线</li><li>◇ 死结：只认 X 结</li><li>△ 灼结：必须躲开</li></ul></section>
      <section><h2>键盘</h2><ul><li>A / D 或方向键：换轨</li><li>P / Esc：暂停</li><li>R：重织</li><li>M：静音</li></ul></section>
      <section><h2>行动记录</h2><ul id="rift-feed"></ul></section>
    </aside>
  </section>
</main>
```

- [ ] **Step 4: Implement controller boot, lifecycle, test bridge, and first render**

Create `src/js/rift-stitch.js` as an IIFE. Validate every required element, parse `seed` and `autotest`, create a `RiftStitchGame` class, store bound listener references, and expose:

```js
window.riftStitchGame = game;
window.render_game_to_text = () => JSON.stringify(game.renderGameToText());
window.advanceTime = (ms = 1000 / 60) => game.advanceTime(ms);
window.__riftStitchTest = game.createTestBridge();
```

Use a capped accumulator in normal mode:

```js
frame(now) {
  const elapsed = Math.min(250, now - this.lastFrame);
  this.lastFrame = now;
  this.accumulator += elapsed;
  while (this.accumulator >= 1000 / this.engine.CONSTANTS.TICK_RATE) {
    this.engine.stepGame(this.state, 1);
    this.accumulator -= 1000 / this.engine.CONSTANTS.TICK_RATE;
  }
  this.consumeEvents();
  this.render();
  this.rafId = requestAnimationFrame(this.boundFrame);
}
```

`consumeEvents()` begins with `const events = this.state.events.splice(0);` and dispatches that
detached list to audio, feed, status, and overlay handlers. Autotest stepping performs the same
drain after each requested burst.

Autotest mode must not request a frame. `advanceTime(ms)` converts milliseconds to integer ticks and then calls the same engine `stepGame()`. `dispose()` removes keyboard, visibility, Canvas pointer, and button listeners; cancels `rafId`; closes audio; and clears resume timers.

Render a deterministic baseline containing the three rails, defense band, shuttle, active stitch segments, and all object shapes. Decorations use controller-only time and never alter engine state.

- [ ] **Step 5: Implement responsive, accessible CSS**

Create `src/css/rift-stitch.css` with CSS variables for the indigo/cyan/magenta/amber theme; a `minmax(0, 1fr) 320px` desktop grid; `canvas { width: 100%; height: auto; aspect-ratio: 8 / 5; }`; 56px touch controls; `:focus-visible`; a one-column breakpoint at 820px; no fixed page width; `overflow-wrap: anywhere` for status text; `@media (prefers-reduced-motion: reduce)` that removes transitions, shake, and decorative animation; and `@media (prefers-contrast: more)` that increases border and rail contrast.

- [ ] **Step 6: Run the Chrome boot contract**

Run `node scripts/test-rift-stitch-browser.mjs`.

Expected: PASS, output names `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, idle rail 1, and zero browser errors.

- [ ] **Step 7: Commit the playable page foundation**

```bash
git add rift-stitch.html src/css/rift-stitch.css src/js/rift-stitch.js scripts/test-rift-stitch-browser.mjs
git diff --cached --check
git commit -m "Create Rift Stitch arcade page"
```

### Task 7: Prove desktop mechanics, mobile controls, audio, and visual states in Chrome

**Files:**
- Modify: `src/js/rift-stitch.js`
- Modify: `src/css/rift-stitch.css`
- Modify: `scripts/test-rift-stitch-browser.mjs`

- [ ] **Step 1: Extend the browser test with failing scenarios**

Add helper calls through `window.__riftStitchTest` for `normal`, `armor`, `damage`, and `boss` scenarios. Assert:

```js
await page.evaluate(() => window.__riftStitchTest.loadScenario('normal'));
await page.keyboard.press('ArrowLeft');
await page.evaluate(() => window.__riftStitchTest.step(40));
const stitch = await readRenderState(page);
assert.equal(stitch.score, 150);
assert.equal(stitch.objects.length, 0);

await page.evaluate(() => window.__riftStitchTest.loadScenario('armor'));
await page.keyboard.press('ArrowLeft');
await page.evaluate(() => window.__riftStitchTest.step(8));
await page.keyboard.press('ArrowRight');
await page.evaluate(() => window.__riftStitchTest.step(40));
const xKnot = await readRenderState(page);
assert.equal(xKnot.stitch.type, 'x');
assert.equal(xKnot.score, 350);

await page.keyboard.press('KeyP');
const paused = await readRenderState(page);
await page.evaluate(() => window.__riftStitchTest.step(60));
assert.deepEqual(await readRenderState(page), paused);

await page.keyboard.press('KeyM');
assert.equal((await readRenderState(page)).muted, true);
assert.equal(await page.locator('#rift-mute').getAttribute('aria-pressed'), 'true');
```

Open a second page at `390 x 844`, assert `document.documentElement.scrollWidth <= 390`, both touch buttons are at least 56px high, the Canvas is no wider than its parent, and clicking `#rift-left` changes the rail through the same test snapshot as `ArrowLeft`.

Capture `idle.png`, `stitch.png`, `x-knot.png`, `boss.png`, and `mobile.png` only when `RIFT_STITCH_CAPTURE=1`.

- [ ] **Step 2: Run and confirm missing-scenario failures**

Run `node scripts/test-rift-stitch-browser.mjs`.

Expected: FAIL because `loadScenario()` does not yet recognize the named scenarios.

- [ ] **Step 3: Implement deterministic scenario loading and UI synchronization**

`createTestBridge()` must reject use outside autotest mode and expose:

```js
{
  reset: (options = {}) => this.reset(options),
  dispatch: (action) => this.dispatch(action),
  step: (ticks) => this.stepTicks(ticks),
  snapshot: () => this.renderGameToText(),
  loadScenario: (name) => this.loadScenario(name),
}
```

Each scenario creates a fresh running engine state with an empty schedule, then adds only the object needed for that scenario. All subsequent resolution still uses `queueAction()` and `stepGame()`; the controller must not directly award score, damage, or victory.

Complete HUD, overlay, status, feed, best-score, mute, synthesized audio, pause/resume countdown, visibility pause, Canvas-half pointer input, touch buttons, and terminal restart. Store keys are unique:

```js
const STORAGE_KEYS = {
  best: 'demoCodexRiftStitchBest',
  muted: 'demoCodexRiftStitchMuted',
};
```

The accessible live region only updates on start, wave, damage, pause, win, and game-over events.

- [ ] **Step 4: Run functional and capture passes**

```bash
npm run -s test:rift-stitch:browser
RIFT_STITCH_CAPTURE=1 npm run -s test:rift-stitch:browser
```

The first command will become available in Task 8; before that, use `node scripts/test-rift-stitch-browser.mjs`. Expected: desktop and mobile scenarios pass, local Chrome path is printed, and five screenshots are created during capture.

- [ ] **Step 5: Inspect every screenshot**

Open all five files and verify: overlay text is not fading over gameplay; normal stitch is cyan and legible; X knot is visibly crossed and magenta; boss and incoming threats do not overlap the HUD; mobile has no horizontal clipping and both controls are fully visible. Fix CSS/render timing and rerun capture if any check fails.

- [ ] **Step 6: Commit the browser-complete game**

```bash
git add src/js/rift-stitch.js src/css/rift-stitch.css scripts/test-rift-stitch-browser.mjs
git diff --cached --check
git commit -m "Verify Rift Stitch browser play"
```

### Task 8: Feature the game and reconcile repository metadata

**Files:**
- Modify: `package.json`
- Modify: `src/js/index-menu.js:1-30,1450-1480`
- Modify: `index.html:24-68`
- Modify: `README.md:1-330`
- Modify: `.github/project-about.md:5`

- [ ] **Step 1: Add npm entry points first and observe manifest mismatch**

Add adjacent scripts:

```json
"test:rift-stitch:logic": "node scripts/test-rift-stitch-mechanics.mjs",
"test:rift-stitch:browser": "node scripts/test-rift-stitch-browser.mjs"
```

Run `npm run check:manifest` before homepage integration. Expected: FAIL after the page exists because the README and menu counts still describe the previous collection.

- [ ] **Step 2: Add the featured card and default spotlight**

Insert this card near the beginning of `cards`:

```js
{
  title: "裂光织梭 · Rift Stitch",
  href: "rift-stitch.html",
  icon: "🪡",
  badge: "⚡ 全新街机",
  featured: true,
  theme: ["#22d3ee", "#ec4899"],
  description:
    "移动就是攻击。沿三条光轨左右换道留下切割缝线，快速折返织成 X 结，封住暴雨中的重甲裂隙。",
  features: ["实时换轨", "缝线切割", "X 结重击", "三分钟波次"],
  cta: "🪡 启动织机",
},
```

Change `getDefaultSpotlight()` to prefer `rift-stitch.html` before featured fallback. Do not add the page to `strategyHrefs`; the existing fallback deliberately categorizes it as `arcade`.

- [ ] **Step 3: Update the static homepage fallback**

Set all homepage total/visible values and subtitle to 70, featured to 5, and replace the Magnet Forge spotlight fallback with Rift Stitch title, description, tags meta `街机动作 · 2 到 8 分钟 · 节奏更快`, href, and CTA.

- [ ] **Step 4: Update README and GitHub About coherently**

Make these exact numeric changes:

- playable badge: 76;
- curated badge: 70;
- manifest sentence: 76 HTML pages and 70 homepage works;
- Fast Facts: 76, 70, and 157 combined `src/js` / `src/css` files;
- logic suite wording: 60 suites after npm auto-discovery;
- `.github/project-about.md`: `70 playable browser-native mini games and interactive experiments, from real-time arcade action to creative tools, built with vanilla JavaScript.`.

Add Rift Stitch as the first Start With These row, add a real-time arcade row to the complete catalog, mention deterministic fixed-tick testing in the technical features, and update the manifest description to state that GitHub About is also guarded.

- [ ] **Step 5: Run focused integration verification**

```bash
npm run check:manifest
npm run test:manifest:logic
npm run test:rift-stitch:logic
npm run test:rift-stitch:browser
npm test
```

Expected manifest: `htmlCount: 76`, `menuCardCount: 70`, `featuredCardCount: 5`, `projectAboutCount: 70`, `spotlightHref: "rift-stitch.html"`, and no missing targets. Expected aggregate logic count: 60.

- [ ] **Step 6: Commit shared integration**

```bash
git add package.json src/js/index-menu.js index.html README.md .github/project-about.md
git diff --cached --check
git commit -m "Feature Rift Stitch on DemoCodex"
```

### Task 9: Complete full regression, manual play, review, and delivery audit

**Files:**
- Modify only files required by observed failures or review blockers.

- [ ] **Step 1: Run whitespace and repository consistency checks**

```bash
git diff main...HEAD --check
git status --short --branch
npm run check:manifest
npm run test:manifest:logic
npm run test:rift-stitch:logic
```

Expected: no diff errors, clean feature worktree, and all focused checks pass.

- [ ] **Step 2: Run captured local-Chrome regression and inspect artifacts**

```bash
RIFT_STITCH_CAPTURE=1 npm run test:rift-stitch:browser
```

Open `output/rift-stitch-browser/{idle,stitch,x-knot,boss,mobile}.png` and record visual observations. Do not accept text-state assertions as proof of screenshot correctness.

- [ ] **Step 3: Manually play the complete first wave**

Serve the worktree, open `rift-stitch.html` in local Google Chrome without `autotest`, and verify start, first tutorial cut, burn dodge, pause/resume countdown, mute, restart, best-score persistence, keyboard, Canvas pointer, and touch buttons. Confirm focus and reduced-motion behavior through DevTools emulation or media emulation.

- [ ] **Step 4: Run the complete aggregate suites**

```bash
npm test
npm run test:browser
```

Expected: 60 logic suites and 57 browser suites pass; re-read actual counts from output rather than assuming these planned numbers if package discovery has changed.

- [ ] **Step 5: Perform two independent read-only reviews**

Game reviewer scope: `rift-stitch.html`, `src/css/rift-stitch.css`, `src/js/rift-stitch-engine.js`, `src/js/rift-stitch.js`, and both Rift Stitch tests. Integration reviewer scope: manifest checker/tests, menu, homepage, package scripts, README, project About, and Git history. Each review must report blockers, evidence, and a score above 90. Fix every blocker, rerun affected checks, and request a fresh score; a score of exactly 90 is not sufficient.

- [ ] **Step 6: Run verification-before-completion after all review fixes**

Repeat focused tests, captured browser test, full logic suite, full browser suite, diff check, and worktree status after the final code change. Record command exit codes and current commit.

- [ ] **Step 7: Commit any verified review fixes**

Stage only named task files, never `git add -A` from the primary worktree:

```bash
git add rift-stitch.html src/css/rift-stitch.css src/js/rift-stitch-engine.js src/js/rift-stitch.js scripts/test-rift-stitch-mechanics.mjs scripts/test-rift-stitch-browser.mjs scripts/check-demo-manifest.mjs scripts/test-check-demo-manifest.mjs src/js/index-menu.js index.html README.md package.json .github/project-about.md
git diff --cached --check
git commit -m "Polish Rift Stitch delivery"
```

Skip the commit only when there are no review changes.

- [ ] **Step 8: Integrate linearly into local main**

From the primary worktree, verify that only `.codex/` is untracked, then fast-forward `main` to `codex/rift-stitch`. Do not merge if either worktree has an unexplained change.

- [ ] **Step 9: Push and prove the remote main state**

Use the existing HTTPS remote and local credential helper:

```bash
git push origin main
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
```

Expected: the three commit values are identical, primary status is `main...origin/main` plus only the preserved `?? .codex/`, and remote `refs/heads/main` points at the final delivery commit.
