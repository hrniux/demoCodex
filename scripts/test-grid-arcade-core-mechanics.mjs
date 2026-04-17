import assert from 'node:assert/strict';
import core from '../src/js/grid-arcade-core.js';

function createBaseConfig(overrides = {}) {
  return {
    name: 'grid-core-mechanics',
    shortTitle: '核心测试',
    mode: 'items',
    target: 0,
    maxHull: 3,
    pushBoxes: false,
    slidePlayer: false,
    spreadHazards: false,
    scoreItem: 40,
    scoreHazard: 25,
    scoreClear: 220,
    scoreSwitch: 20,
    hitPenalty: 30,
    labels: {
      progress: '样本',
      wait: '等待',
    },
    storage: {
      score: 'demoCodexGridCoreTestBestScore',
      floor: 'demoCodexGridCoreTestBestFloor',
    },
    special: {
      label: '脉冲',
      button: '脉冲',
      effect: 'clear',
      radius: 1,
      cooldown: 3,
    },
    objective: {
      ready: '测试准备中。',
      exit: '测试撤离中。',
    },
    overlay: {
      kicker: '核心测试',
      title: '核心测试',
      body: '核心测试',
      gameOverTitle: '核心测试',
      hitTitle: '核心测试',
      hitBody: '核心测试',
    },
    copy: {
      boot: '核心测试',
      live: '核心测试',
      unlocked: '核心测试',
      progress: '核心测试',
      special: '核心测试',
      hit: '核心测试',
      clear: '核心测试',
      gameOver: '核心测试',
      switch: '核心测试',
    },
    palette: {
      bg: '#000000',
      gridA: '#111111',
      gridB: '#222222',
      wall: '#333333',
      goal: '#444444',
      exitOn: '#555555',
      exitOff: '#666666',
      item: '#777777',
      box: '#888888',
      boxLocked: '#999999',
      hazard: '#aaaaaa',
      special: '#bbbbbb',
      player: '#ffffff',
      switch: '#00ff88',
      gateClosed: '#ff6688',
      gateOpen: '#66ccff',
      teleport: '#c084fc',
    },
    templates: [
      {
        rows: [
          '.....',
          '.S...',
          '.....',
          '...X.',
          '.....',
        ],
      },
    ],
    ...overrides,
  };
}

function runSwitchGateTest() {
  const config = createBaseConfig({
    templates: [
      {
        rows: [
          '.....',
          '.SsdX',
          '.....',
          '.....',
          '.....',
        ],
      },
    ],
  });
  const layout = core.parseTemplate(config, 1, 4242);
  const state = core.createState(config, layout, { floor: 1, mode: 'active' });

  const switchStep = core.applyAction(config, layout, state, 'right');
  assert.equal(switchStep.invalid, false, 'player should be able to step on the switch tile');
  assert.equal(switchStep.state.gatesOpen, true, 'switch tile should permanently open gates');
  assert.equal(layout.gates.length, 1, 'template should parse one gate');
  assert.equal(layout.switches.length, 1, 'template should parse one switch');

  const gateStep = core.applyAction(config, layout, switchStep.state, 'right');
  assert.equal(gateStep.invalid, false, 'opened gate should stop blocking movement');
  assert.deepEqual(gateStep.state.player, { x: 3, y: 1 }, 'player should be able to move through the opened gate');
}

function runTeleportTest() {
  const config = createBaseConfig({
    templates: [
      {
        rows: [
          '.....',
          '.S1..',
          '.....',
          '..1X.',
          '.....',
        ],
      },
    ],
  });
  const layout = core.parseTemplate(config, 1, 4242);
  const state = core.createState(config, layout, { floor: 1, mode: 'active' });

  const step = core.applyAction(config, layout, state, 'right');
  assert.equal(layout.teleporters.length, 2, 'template should parse one teleporter pair');
  assert.equal(step.invalid, false, 'player should be able to enter a teleporter tile');
  assert.deepEqual(step.state.player, { x: 2, y: 3 }, 'player should emerge from the paired teleporter tile');
}

function runSlideThroughTeleportTest() {
  const config = createBaseConfig({
    slidePlayer: true,
    templates: [
      {
        rows: [
          '#######',
          '#S..1.#',
          '#.....#',
          '#1#...#',
          '#....X#',
          '#.....#',
          '#######',
        ],
      },
    ],
  });
  const layout = core.parseTemplate(config, 1, 4242);
  const state = core.createState(config, layout, { floor: 1, mode: 'active' });

  const step = core.applyAction(config, layout, state, 'right');
  assert.equal(step.invalid, false, 'sliding move should stay valid when crossing a teleporter');
  assert.equal(step.teleported, true, 'sliding across a teleporter should trigger teleportation immediately');
  assert.deepEqual(
    step.state.player,
    { x: 1, y: 3 },
    'player should stop at the paired teleporter exit when the exit immediately meets a wall',
  );
}

function main() {
  runSwitchGateTest();
  runTeleportTest();
  runSlideThroughTeleportTest();

  console.log(
    JSON.stringify({
      ok: true,
      checks: ['switch-gate', 'teleport', 'slide-through-teleport'],
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(1);
}
