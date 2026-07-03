import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const game = require('../src/js/prism-relay.js');

const result = game.runSelfCheck(4);
assert.equal(result.ok, true, JSON.stringify(result));

const route = game.runPrismRelayRouteCheck();
assert.equal(route.ok, true, JSON.stringify(route));
assert.deepEqual(route.player, { x: 4, y: 1 });
assert.equal(route.progress, 1);
assert.equal(route.gatesOpen, true);
assert.equal(route.score, 126);

const pulse = game.runRefractionPulseCheck();
assert.equal(pulse.ok, true, JSON.stringify(pulse));
assert.equal(pulse.clearedHazards, 2);
assert.equal(pulse.cooldown, 4);
assert.equal(pulse.score, 76);

console.log(
  JSON.stringify(
    {
      ok: true,
      route,
      pulse,
    },
    null,
    2,
  ),
);
