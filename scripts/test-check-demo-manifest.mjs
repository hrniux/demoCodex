import assert from 'node:assert/strict';

import {
  findMissingTargets,
  parseMenuTargets,
  parseProjectAboutCount,
  parseSpotlightHref,
} from './check-demo-manifest.mjs';

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

assert.deepEqual(parseProjectAboutCount('70 playable browser-native mini games'), {
  count: 70,
  problem: null,
});

assert.deepEqual(parseProjectAboutCount('Browser-native mini games'), {
  count: null,
  problem: '.github/project-about.md does not contain the expected playable count.',
});

assert.deepEqual(parseProjectAboutCount('many playable browser-native mini games'), {
  count: null,
  problem: '.github/project-about.md playable count many is not numeric.',
});

console.log(JSON.stringify({ ok: true, checks: 6 }));
