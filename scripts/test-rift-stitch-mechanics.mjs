import assert from 'node:assert/strict';
import test from 'node:test';

import engine from '../src/js/rift-stitch-engine.js';

const { CONSTANTS, createGameState, getWaveSchedule, nextRandom, snapshotGame, validateSchedule } = engine;

assert.equal(CONSTANTS.TICK_RATE, 60);
assert.deepEqual(CONSTANTS, {
  TICK_RATE: 60,
  WIDTH: 960,
  HEIGHT: 600,
  RAILS: [240, 480, 720],
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
assert.equal(Object.isFrozen(CONSTANTS), true);
assert.equal(Object.isFrozen(CONSTANTS.RAILS), true);

const firstState = createGameState({ seed: 4242 });
const secondState = createGameState({ seed: 4242 });
assert.deepEqual(snapshotGame(firstState), snapshotGame(secondState));

assert.equal(firstState.mode, 'idle');
assert.equal(firstState.integrity, 3);
assert.equal(firstState.player.rail, 1);
assert.deepEqual(Object.keys(firstState), [
  'seed',
  'rngState',
  'mode',
  'resumeMode',
  'tick',
  'wave',
  'waveTick',
  'countdownTicks',
  'resultTicks',
  'integrity',
  'score',
  'comboQuarter',
  'comboIdleTicks',
  'player',
  'stitch',
  'objects',
  'schedule',
  'scheduleIndex',
  'nextObjectId',
  'bossHits',
  'waveDamage',
  'events',
]);
const evenWave = getWaveSchedule(4242, 1);
const repeatedEvenWave = getWaveSchedule(4242, 1);
const oddWave = getWaveSchedule(4243, 1);

assert.deepEqual(evenWave, repeatedEvenWave);
assert.notEqual(evenWave, repeatedEvenWave);
assert.notEqual(evenWave[0], repeatedEvenWave[0]);
assert.notDeepEqual(evenWave, oddWave);
assert.deepEqual(evenWave, [
  { tick: 180, impactTick: 320, type: 'rift', rail: 0, speed: 180 },
  { tick: 420, impactTick: 560, type: 'rift', rail: 1, speed: 180 },
  { tick: 660, impactTick: 800, type: 'rift', rail: 2, speed: 180 },
]);
assert.deepEqual(
  oddWave.map((event) => event.rail),
  [2, 1, 0],
);

assert.deepEqual(validateSchedule(evenWave), { ok: true, problems: [] });

const blockedBurn = validateSchedule([
  { tick: 100, impactTick: 260, type: 'burn', rail: 0 },
  { tick: 110, impactTick: 260, type: 'burn', rail: 1 },
  { tick: 120, impactTick: 260, type: 'burn', rail: 2 },
]);
assert.equal(blockedBurn.ok, false);
assert.equal(
  blockedBurn.problems.some(
    (problem) => problem.includes('burn') && problem.includes('260') && problem.includes('all three rails'),
  ),
  true,
);

test('publishes the CommonJS engine on globalThis as an independent UMD outlet', () => {
  assert.equal(globalThis.RiftStitchEngine, engine);
});

test('exposes nextRandom as part of the engine contract', () => {
  assert.deepEqual(Object.keys(engine).sort(), [
    'CONSTANTS',
    'createGameState',
    'getWaveSchedule',
    'nextRandom',
    'snapshotGame',
    'validateSchedule',
  ]);
});

test('nextRandom returns the pure xorshift32 next state', () => {
  assert.equal(nextRandom?.(4242), 1079534331);
});

test('createGameState advances rngState from seed || 1', () => {
  assert.equal(createGameState({ seed: 4242 }).rngState, 1079534331);
  assert.equal(createGameState({ seed: 0 }).rngState, nextRandom?.(1));
});

test('unknown waves fall back to a fresh wave-one schedule', () => {
  assert.deepEqual(getWaveSchedule(4242, 99), evenWave);
});

test('rejects an event at the exclusive WAVE_TICKS boundary', () => {
  const boundaryResult = validateSchedule([
    { tick: CONSTANTS.WAVE_TICKS, impactTick: CONSTANTS.WAVE_TICKS, type: 'rift', rail: 0, speed: 180 },
  ]);

  assert.equal(boundaryResult.ok, false);
});

test('initializes resumeMode to null', () => {
  assert.equal(firstState.resumeMode, null);
});

test('initializes countdownTicks to zero', () => {
  assert.equal(firstState.countdownTicks, 0);
});

test('initializes the player with the exact rail-transition fields', () => {
  assert.deepEqual(firstState.player, {
    rail: 1,
    fromRail: 1,
    toRail: 1,
    moveTicks: 0,
  });
});
