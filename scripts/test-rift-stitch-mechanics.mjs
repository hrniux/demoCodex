import assert from 'node:assert/strict';
import test from 'node:test';

import engine from '../src/js/rift-stitch-engine.js';

const {
  CONSTANTS,
  createGameState,
  getWaveSchedule,
  queueAction,
  snapshotGame,
  stepGame,
  validateSchedule,
} = engine;

function createRunningState() {
  const state = createGameState({ seed: 4242, mode: 'running' });
  state.schedule = [];
  return state;
}

function validateEvent(overrides = {}) {
  return validateSchedule([
    {
      tick: 0,
      impactTick: 120,
      type: 'rift',
      rail: 1,
      ...overrides,
    },
  ]);
}

function assertRejectedActionDoesNotMutate(state, action) {
  const before = structuredClone(state);

  assert.equal(queueAction(state, action), false);
  assert.deepEqual(state, before);
}

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

test('exposes exactly the public engine contract', () => {
  assert.deepEqual(Object.keys(engine).sort(), [
    'CONSTANTS',
    'createGameState',
    'getWaveSchedule',
    'queueAction',
    'snapshotGame',
    'stepGame',
    'validateSchedule',
  ]);
});

test('moves to an adjacent rail after eight ticks and creates one normal stitch', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  assert.deepEqual(state.player, {
    rail: 1,
    fromRail: 1,
    toRail: 0,
    moveTicks: 8,
  });
  assert.equal(queueAction(state, 'left'), false);

  assert.equal(stepGame(state, 7), state);
  assert.equal(state.player.rail, 1);
  assert.equal(state.player.moveTicks, 1);
  assert.equal(state.stitch, null);

  stepGame(state, 1);

  assert.equal(state.tick, 8);
  assert.equal(state.player.rail, 0);
  assert.equal(state.player.moveTicks, 0);
  assert.equal(state.stitch.type, 'normal');
  assert.deepEqual(state.stitch.pair, [0, 1]);
  assert.equal(state.stitch.fromRail, 1);
  assert.equal(state.stitch.toRail, 0);
  assert.deepEqual(state.stitch.segments, [
    { x1: 480, y1: 500, x2: 240, y2: 390 },
  ]);
  assert.equal(state.stitch.createdAt, state.tick);
  assert.equal(state.stitch.expiresAt - state.tick, 54);
  assert.deepEqual(state.events, ['stitch-created']);
});

test('rejects movement beyond the left boundary without mutating state', () => {
  const state = createRunningState();
  state.player = {
    rail: 0,
    fromRail: 0,
    toRail: 0,
    moveTicks: 0,
  };
  const before = structuredClone(state);

  assert.equal(queueAction(state, 'left'), false);
  assert.deepEqual(state, before);
});

test('rejects a duplicate action while moving without mutating state', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  assertRejectedActionDoesNotMutate(state, 'right');
});

for (const mode of ['idle', 'paused', 'countdown']) {
  test(`rejects movement in ${mode} mode without mutating state`, () => {
    const state = createGameState({ seed: 4242, mode });

    assertRejectedActionDoesNotMutate(state, 'left');
  });
}

for (const action of ['up', '']) {
  test(`rejects invalid ${JSON.stringify(action)} action without mutating state`, () => {
    assertRejectedActionDoesNotMutate(createRunningState(), action);
  });
}

for (const [rail, action] of [
  [0, 'left'],
  [2, 'right'],
]) {
  test(`rejects ${action} at rail ${rail} without mutating state`, () => {
    const state = createRunningState();
    state.player = {
      rail,
      fromRail: rail,
      toRail: rail,
      moveTicks: 0,
    };

    assertRejectedActionDoesNotMutate(state, action);
  });
}

test('creates an X stitch at the exact twenty-five-tick crossing boundary', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 8);
  const firstSegment = { ...state.stitch.segments[0] };
  const firstCreatedAt = state.stitch.createdAt;

  stepGame(state, 17);
  assert.equal(queueAction(state, 'right'), true);
  stepGame(state, 8);

  assert.equal(state.tick, 33);
  assert.equal(state.tick - firstCreatedAt, 25);
  assert.equal(state.stitch.type, 'x');
  assert.deepEqual(state.stitch.pair, [0, 1]);
  assert.equal(state.stitch.fromRail, 0);
  assert.equal(state.stitch.toRail, 1);
  assert.deepEqual(state.stitch.segments, [
    firstSegment,
    { x1: 240, y1: 500, x2: 480, y2: 390 },
  ]);
  assert.equal(state.stitch.createdAt, state.tick);
  assert.equal(state.stitch.expiresAt - state.tick, 39);
  assert.deepEqual(state.events, ['x-created']);
});

test('does not create an X stitch after the twenty-five-tick crossing window', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 8);
  const firstCreatedAt = state.stitch.createdAt;

  stepGame(state, 18);
  assert.equal(queueAction(state, 'right'), true);
  stepGame(state, 8);

  assert.equal(state.tick, 34);
  assert.equal(state.tick - firstCreatedAt, 26);
  assert.equal(state.stitch.type, 'normal');
  assert.deepEqual(state.stitch.pair, [0, 1]);
  assert.deepEqual(state.stitch.segments, [
    { x1: 240, y1: 500, x2: 480, y2: 390 },
  ]);
  assert.deepEqual(state.events, ['stitch-created']);
});

test('replaces a prior normal stitch instead of accumulating active structures', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 8);
  const firstId = state.stitch.id;
  const firstSegments = state.stitch.segments.map((segment) => ({ ...segment }));

  stepGame(state, 18);
  assert.equal(queueAction(state, 'right'), true);
  stepGame(state, 8);

  assert.notEqual(state.stitch.id, firstId);
  assert.equal(state.stitch.type, 'normal');
  assert.equal(state.stitch.segments.length, 1);
  assert.notDeepEqual(state.stitch.segments, firstSegments);
});

test('replaces an unrelated normal stitch with only the new rail-pair segment', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 8);
  stepGame(state, 18);
  assert.equal(queueAction(state, 'right'), true);
  stepGame(state, 8);

  assert.equal(state.player.rail, 1);
  assert.equal(state.stitch.type, 'normal');
  assert.deepEqual(state.stitch.pair, [0, 1]);
  const previousId = state.stitch.id;
  const previousSegment = { ...state.stitch.segments[0] };

  assert.equal(queueAction(state, 'right'), true);
  stepGame(state, 8);

  assert.notEqual(state.stitch.id, previousId);
  assert.equal(state.stitch.type, 'normal');
  assert.deepEqual(state.stitch.pair, [1, 2]);
  assert.equal(state.stitch.fromRail, 1);
  assert.equal(state.stitch.toRail, 2);
  assert.deepEqual(state.stitch.segments, [
    { x1: 480, y1: 500, x2: 720, y2: 390 },
  ]);
  assert.notDeepEqual(state.stitch.segments[0], previousSegment);
});

test('expires a stitch exactly at expiresAt', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 8);
  const { expiresAt } = state.stitch;

  stepGame(state, expiresAt - state.tick - 1);
  assert.equal(state.tick, expiresAt - 1);
  assert.notEqual(state.stitch, null);

  stepGame(state, 1);
  assert.equal(state.tick, expiresAt);
  assert.equal(state.stitch, null);
});

for (const mode of ['idle', 'paused', 'countdown']) {
  test(`does not advance ticks while the game is ${mode}`, () => {
    const state = createGameState({ seed: 4242, mode });
    const before = {
      tick: state.tick,
      waveTick: state.waveTick,
    };

    assert.equal(stepGame(state, 5), state);
    assert.deepEqual(
      {
        tick: state.tick,
        waveTick: state.waveTick,
      },
      before,
    );
  });
}

test('retains an event emitted before the final internal tick of stepGame', () => {
  const state = createRunningState();

  assert.equal(queueAction(state, 'left'), true);
  stepGame(state, 9);

  assert.equal(state.tick, 9);
  assert.deepEqual(state.events, ['stitch-created']);
});

test('advancing 300 Task 3 ticks only changes tick counters with the default schedule', () => {
  const state = createGameState({ seed: 4242, mode: 'running' });
  const before = structuredClone(state);

  stepGame(state, 300);

  assert.deepEqual(state, {
    ...before,
    tick: 300,
    waveTick: 300,
  });
  assert.equal(state.score, 0);
  assert.equal(state.integrity, 3);
  assert.deepEqual(state.objects, []);
  assert.equal(state.scheduleIndex, 0);
  assert.equal(state.mode, 'running');
});

test('createGameState advances rngState from seed || 1', () => {
  assert.equal(createGameState({ seed: 4242 }).rngState, 1079534331);
  assert.equal(createGameState({ seed: 0 }).rngState, 270369);
});

test('unknown waves fall back to a fresh wave-one schedule', () => {
  assert.deepEqual(getWaveSchedule(4242, 99), evenWave);
});

for (const tick of [0, CONSTANTS.WAVE_TICKS - 1]) {
  test(`accepts an event at tick ${tick}`, () => {
    assert.equal(validateEvent({ tick }).ok, true);
  });
}

for (const [description, tick] of [
  ['a negative', -1],
  ['a noninteger', 1.5],
  ['the exclusive WAVE_TICKS boundary', CONSTANTS.WAVE_TICKS],
]) {
  test(`rejects an event with ${description} tick`, () => {
    assert.equal(validateEvent({ tick }).ok, false);
  });
}

for (const type of ['rift', 'armor', 'burn', 'boss']) {
  test(`accepts the allowed ${type} event type`, () => {
    assert.equal(validateEvent({ type }).ok, true);
  });
}

test('rejects an unknown event type', () => {
  assert.equal(validateEvent({ type: 'unknown' }).ok, false);
});

for (const [description, schedule] of [
  ['null', [null]],
  ['undefined', [undefined]],
  ['a sparse slot', Array(1)],
]) {
  test(`rejects ${description} schedule entries as non-objects`, () => {
    const result = validateSchedule(schedule);

    assert.equal(result.ok, false);
    assert.equal(result.problems.filter((problem) => problem === 'event 0 must be an object').length, 1);
  });
}

for (const rail of [-1, 3]) {
  test(`rejects rail ${rail}`, () => {
    assert.equal(validateEvent({ rail }).ok, false);
  });
}

for (const rail of [0, 1, 2]) {
  test(`accepts rail ${rail}`, () => {
    assert.equal(validateEvent({ rail }).ok, true);
  });
}

test('snapshot mutations do not change nested source state', () => {
  const state = createGameState({ seed: 4242 });
  state.player = {
    rail: 1,
    fromRail: 0,
    toRail: 2,
    moveTicks: 4,
  };
  state.stitch = {
    id: 17,
    type: 'x',
    pair: [0, 2],
    fromRail: 0,
    toRail: 2,
    segments: [
      { x1: 240, y1: 500, x2: 720, y2: 390 },
      { x1: 720, y1: 500, x2: 240, y2: 390 },
    ],
    createdAt: 17,
    expiresAt: 56,
  };
  state.objects = [
    { id: 7, type: 'boss', rail: 1, hitStitchIds: [17] },
  ];

  const expectedSource = {
    player: {
      rail: 1,
      fromRail: 0,
      toRail: 2,
      moveTicks: 4,
    },
    stitch: {
      id: 17,
      type: 'x',
      pair: [0, 2],
      fromRail: 0,
      toRail: 2,
      segments: [
        { x1: 240, y1: 500, x2: 720, y2: 390 },
        { x1: 720, y1: 500, x2: 240, y2: 390 },
      ],
      createdAt: 17,
      expiresAt: 56,
    },
    objects: [
      { id: 7, type: 'boss', rail: 1, hitStitchIds: [17] },
    ],
  };

  const snapshot = snapshotGame(state);
  snapshot.player.rail = 2;
  snapshot.stitch.pair[0] = 1;
  snapshot.stitch.segments[0].x1 = 999;
  snapshot.stitch.segments.push({ x1: 0, y1: 0, x2: 0, y2: 0 });
  snapshot.objects[0].hitStitchIds.push(56);
  snapshot.objects.push({ id: 8, type: 'rift', rail: 2, hitStitchIds: [] });

  assert.deepEqual(
    {
      player: state.player,
      stitch: state.stitch,
      objects: state.objects,
    },
    expectedSource,
  );
});

test('snapshot object arrays are isolated and optional hitStitchIds stay optional', () => {
  const state = createGameState({ seed: 4242 });
  state.objects = [
    { id: 7, type: 'armor', rail: 1, pair: [0, 1], hitStitchIds: [7] },
    { id: 8, type: 'rift', rail: 2 },
  ];

  const snapshot = snapshotGame(state);
  snapshot.objects[0].pair[0] = 2;
  snapshot.objects[0].hitStitchIds.push(8);

  assert.deepEqual(state.objects, [
    { id: 7, type: 'armor', rail: 1, pair: [0, 1], hitStitchIds: [7] },
    { id: 8, type: 'rift', rail: 2 },
  ]);
  assert.equal(Object.hasOwn(snapshot.objects[1], 'hitStitchIds'), false);
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
