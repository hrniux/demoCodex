import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildMenuViewSearch,
  parseMenuViewFromSearch,
} = require('../src/js/index-menu-url-state.js');

const options = {
  allowedCategories: ['all', 'strategy', 'classic', 'interactive'],
  allowedSorts: ['recommended', 'recent', 'quick', 'name'],
  allowedSpotlights: ['magnet-forge.html', 'storm-lock.html'],
  defaultCategory: 'all',
  defaultSort: 'recommended',
};

assert.deepEqual(
  parseMenuViewFromSearch('?q=%20%E5%83%8F%E7%B4%A0%20%20%E7%AD%96%E7%95%A5%20&category=strategy&sort=quick&spotlight=storm-lock.html', options),
  {
    query: '像素 策略',
    category: 'strategy',
    sort: 'quick',
    spotlightHref: 'storm-lock.html',
  },
  'should read and normalize a shareable menu view from URL params',
);

assert.deepEqual(
  parseMenuViewFromSearch('?q=%20%20&category=ghost&sort=broken&spotlight=ghost.html', options),
  {
    query: '',
    category: 'all',
    sort: 'recommended',
    spotlightHref: null,
  },
  'should ignore invalid params and fall back to defaults',
);

assert.equal(
  buildMenuViewSearch(
    {
      query: '  像素   策略  ',
      category: 'strategy',
      sort: 'quick',
      spotlightHref: 'storm-lock.html',
    },
    options,
  ),
  '?q=%E5%83%8F%E7%B4%A0+%E7%AD%96%E7%95%A5&category=strategy&sort=quick&spotlight=storm-lock.html',
  'should produce a stable search string for sharable views',
);

assert.equal(
  buildMenuViewSearch(
    {
      query: '',
      category: 'all',
      sort: 'recommended',
      spotlightHref: null,
      onlyFavorites: true,
    },
    options,
  ),
  '',
  'should omit default or non-shareable state from the URL',
);

console.log(JSON.stringify({ ok: true, checks: 4 }));
