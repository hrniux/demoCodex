(function (root, factory) {
  const engine = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = engine;
  }

  root.RiftStitchEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

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

  const BASE_WAVES = Object.freeze({
    1: Object.freeze([
      Object.freeze({ tick: 180, impactTick: 320, type: 'rift', rail: 0, speed: 180 }),
      Object.freeze({ tick: 420, impactTick: 560, type: 'rift', rail: 1, speed: 180 }),
      Object.freeze({ tick: 660, impactTick: 800, type: 'rift', rail: 2, speed: 180 }),
    ]),
  });

  const EVENT_TYPES = Object.freeze(['rift', 'armor', 'burn', 'boss']);

  function nextRandom(rngState) {
    let nextState = rngState >>> 0;
    nextState ^= nextState << 13;
    nextState ^= nextState >>> 17;
    nextState ^= nextState << 5;
    nextState >>>= 0;

    return nextState;
  }

  function getWaveSchedule(seed, wave) {
    const shouldMirror = (seed >>> 0) % 2 === 1;
    const schedule = BASE_WAVES[wave] || BASE_WAVES[1];

    return schedule.map((event) => ({
      ...event,
      rail: shouldMirror ? 2 - event.rail : event.rail,
    }));
  }

  function validateSchedule(schedule) {
    const problems = [];
    const burnRailsByImpact = new Map();

    if (!Array.isArray(schedule)) {
      return { ok: false, problems: ['schedule must be an array'] };
    }

    for (let index = 0; index < schedule.length; index += 1) {
      const event = schedule[index];

      if (event === null || typeof event !== 'object' || Array.isArray(event)) {
        problems.push(`event ${index} must be an object`);
        continue;
      }

      if (!Number.isInteger(event.tick) || event.tick < 0 || event.tick >= CONSTANTS.WAVE_TICKS) {
        problems.push(`event ${index} tick must be an integer from 0 through ${CONSTANTS.WAVE_TICKS - 1}`);
      }

      if (!EVENT_TYPES.includes(event.type)) {
        problems.push(`event ${index} type must be one of ${EVENT_TYPES.join(', ')}`);
      }

      if (!Number.isInteger(event.rail) || event.rail < 0 || event.rail > 2) {
        problems.push(`event ${index} rail must be an integer from 0 through 2`);
      }

      if (event.type === 'burn' && Number.isInteger(event.rail) && event.rail >= 0 && event.rail <= 2) {
        const occupiedRails = burnRailsByImpact.get(event.impactTick) || new Set();
        occupiedRails.add(event.rail);
        burnRailsByImpact.set(event.impactTick, occupiedRails);
      }
    }

    for (const [impactTick, occupiedRails] of burnRailsByImpact) {
      if (occupiedRails.size === CONSTANTS.RAILS.length) {
        problems.push(`burn events at impactTick ${impactTick} occupy all three rails`);
      }
    }

    return {
      ok: problems.length === 0,
      problems,
    };
  }

  function createGameState({ seed = 4242, wave = 1, mode = 'idle' } = {}) {
    const normalizedSeed = seed >>> 0;

    return {
      seed: normalizedSeed,
      rngState: nextRandom(normalizedSeed || 1),
      mode,
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
      player: {
        rail: 1,
        fromRail: 1,
        toRail: 1,
        moveTicks: 0,
      },
      stitch: null,
      objects: [],
      schedule: getWaveSchedule(normalizedSeed, wave),
      scheduleIndex: 0,
      nextObjectId: 1,
      bossHits: 0,
      waveDamage: 0,
      events: [],
    };
  }

  function pairFor(fromRail, toRail) {
    return [Math.min(fromRail, toRail), Math.max(fromRail, toRail)];
  }

  function samePair(firstPair, secondPair) {
    return firstPair[0] === secondPair[0] && firstPair[1] === secondPair[1];
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

    const direction = action === 'left' ? -1 : action === 'right' ? 1 : 0;
    const targetRail = state.player.rail + direction;

    if (direction === 0 || targetRail < 0 || targetRail >= CONSTANTS.RAILS.length) {
      return false;
    }

    state.player.fromRail = state.player.rail;
    state.player.toRail = targetRail;
    state.player.moveTicks = CONSTANTS.MOVE_TICKS;

    return true;
  }

  function finishMove(state) {
    const { fromRail, toRail } = state.player;
    const pair = pairFor(fromRail, toRail);
    const segment = makeSegment(fromRail, toRail);
    const previousStitch = state.stitch;
    const createsX =
      previousStitch !== null &&
      previousStitch.type === 'normal' &&
      samePair(previousStitch.pair, pair) &&
      previousStitch.fromRail === toRail &&
      previousStitch.toRail === fromRail &&
      state.tick - previousStitch.createdAt <= CONSTANTS.X_WINDOW_TICKS;
    const stitchId = state.nextObjectId;

    state.nextObjectId += 1;
    state.stitch = {
      id: stitchId,
      type: createsX ? 'x' : 'normal',
      pair,
      fromRail,
      toRail,
      segments: createsX ? [previousStitch.segments[0], segment] : [segment],
      createdAt: state.tick,
      expiresAt:
        state.tick + (createsX ? CONSTANTS.X_STITCH_TICKS : CONSTANTS.STITCH_TICKS),
    };
    state.player.rail = toRail;
    state.events.push(createsX ? 'x-created' : 'stitch-created');
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
    state.events = [];

    if (Number.isInteger(ticks) && ticks > 0) {
      for (let index = 0; index < ticks; index += 1) {
        stepOne(state);
      }
    }

    return state;
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
      player: {
        rail: state.player.rail,
        moveTicks: state.player.moveTicks,
      },
      stitch: state.stitch
        ? {
            ...state.stitch,
            pair: [...state.stitch.pair],
            segments: state.stitch.segments.map((segment) => ({ ...segment })),
          }
        : state.stitch,
      objects: state.objects.map((object) => {
        const snapshot = { ...object };

        if (Array.isArray(object.pair)) {
          snapshot.pair = [...object.pair];
        }

        if (Array.isArray(object.hitStitchIds)) {
          snapshot.hitStitchIds = [...object.hitStitchIds];
        }

        return snapshot;
      }),
      bossHits: state.bossHits,
    };
  }

  return Object.freeze({
    CONSTANTS,
    createGameState,
    getWaveSchedule,
    queueAction,
    snapshotGame,
    stepGame,
    validateSchedule,
  });
});
