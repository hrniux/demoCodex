import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const game = require('../src/js/glow-grove.js');

const result = game.runSelfCheck(4);
assert.equal(result.ok, true, JSON.stringify(result));

const route = game.runGlowGroveRouteCheck();
assert.equal(route.ok, true, JSON.stringify(route));
assert.deepEqual(route.player, { x: 4, y: 1 });
assert.equal(route.progress, 1);
assert.equal(route.gatesOpen, true);
assert.equal(route.score, 122);

const burst = game.runLanternBurstCheck();
assert.equal(burst.ok, true, JSON.stringify(burst));
assert.equal(burst.clearedHazards, 2);
assert.equal(burst.cooldown, 3);
assert.equal(burst.score, 70);

console.log(
  JSON.stringify(
    {
      ok: true,
      route,
      burst,
    },
    null,
    2,
  ),
);
