import assert from 'node:assert/strict';

import { findMissingTargets, parseMenuTargets, parseSpotlightHref } from './check-demo-manifest.mjs';

const sampleMenuScript = `
  const cards = [
    { href: "orbit-rescue.html" },
    { href: "storm-lock.html" },
    { href: "storm-lock.html" },
  ];
`;

assert.deepEqual(parseMenuTargets(sampleMenuScript), [
  'orbit-rescue.html',
  'storm-lock.html',
  'storm-lock.html',
]);

assert.equal(
  parseSpotlightHref('<a class="menu-spotlight__link" id="menu-spotlight-link" href="magnet-forge.html">Play</a>'),
  'magnet-forge.html'
);

assert.deepEqual(
  findMissingTargets(['orbit-rescue.html', 'ghost-page.html', 'ghost-page.html'], new Set(['orbit-rescue.html'])),
  ['ghost-page.html']
);

console.log(JSON.stringify({ ok: true, checks: 3 }));
