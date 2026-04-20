import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildTestUrl, maybeCaptureScreenshot, trackPageErrors } from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';
import { startStaticServer } from './static-server.mjs';

const rootDir = process.cwd();
const ownsServer = !process.env.INDEX_MENU_TEST_URL && !process.env.DEMOCODEX_BASE_URL;
const server = ownsServer ? await startStaticServer({ rootDir }) : null;
if (server) {
  process.env.DEMOCODEX_BASE_URL = server.url;
}
const testUrl = buildTestUrl({
  envName: 'INDEX_MENU_TEST_URL',
  pathname: '/index.html',
  query: '?q=%E6%8E%A8%E7%AE%B1&category=strategy&sort=quick&spotlight=storm-lock.html',
});

const captureEnabled = process.env.INDEX_MENU_CAPTURE === '1';
const screenshotDir = path.resolve(process.cwd(), 'output/index-menu-browser');

const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1480, height: 1400 },
});
const errors = trackPageErrors(page);

await page.addInitScript(() => {
  window.__copiedText = null;

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text) => {
        window.__copiedText = text;
      },
    },
  });
});

try {
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const grid = document.getElementById('games-grid');
    return grid && grid.getAttribute('aria-busy') === 'false' && grid.children.length > 0;
  });

  const initial = await page.evaluate(() => {
    const activeChip = document.querySelector('#menu-category-chips .menu-chip[aria-pressed="true"]');
    return {
      searchValue: document.getElementById('menu-search')?.value || '',
      sortValue: document.getElementById('menu-sort')?.value || '',
      activeCategory: activeChip?.textContent || '',
      resultsSummary: document.getElementById('menu-results-summary')?.textContent || '',
      spotlightTitle: document.getElementById('menu-spotlight-title')?.textContent || '',
      shareFeedback: document.getElementById('menu-share-feedback')?.textContent || '',
      locationSearch: window.location.search,
      visibleCards: document.querySelectorAll('#games-grid .menu-card').length,
    };
  });

  assert.equal(initial.searchValue, '推箱');
  assert.equal(initial.sortValue, 'quick');
  assert.match(initial.activeCategory, /策略谜局/);
  assert.match(initial.resultsSummary, /按短平快优先排序/);
  assert.match(initial.spotlightTitle, /风暴锁港/);
  assert.match(initial.shareFeedback, /已同步到地址栏/);
  assert.match(initial.locationSearch, /category=strategy/);
  assert.match(initial.locationSearch, /spotlight=storm-lock\.html/);
  assert(initial.visibleCards > 0, 'expected filtered index view to render cards');

  await page.click('#menu-share-view');
  await page.waitForFunction(() => Boolean(window.__copiedText));

  const copied = await page.evaluate(() => ({
    copiedText: window.__copiedText,
    shareFeedback: document.getElementById('menu-share-feedback')?.textContent || '',
  }));

  assert.match(copied.shareFeedback, /已复制/);
  assert.match(copied.copiedText, /index\.html\?q=%E6%8E%A8%E7%AE%B1&category=strategy&sort=quick&spotlight=storm-lock\.html/);

  await page.click('#menu-reset');
  await page.waitForFunction(() => {
    const search = document.getElementById('menu-search');
    const sort = document.getElementById('menu-sort');
    return window.location.search === '' && search && search.value === '' && sort && sort.value === 'recommended';
  });

  const afterReset = await page.evaluate(() => ({
    locationSearch: window.location.search,
    shareFeedback: document.getElementById('menu-share-feedback')?.textContent || '',
    spotlightTitle: document.getElementById('menu-spotlight-title')?.textContent || '',
    visibleCards: document.querySelectorAll('#games-grid .menu-card').length,
  }));

  assert.equal(afterReset.locationSearch, '');
  assert.match(afterReset.shareFeedback, /默认合集视图/);
  assert(afterReset.spotlightTitle.length > 0, 'expected default spotlight title after reset');
  assert(afterReset.visibleCards > initial.visibleCards, 'expected reset to restore the full shelf');

  const screenshot = await maybeCaptureScreenshot(page, screenshotDir, 'index-menu.png', captureEnabled);
  assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: testUrl,
        browser: executablePath,
        screenshot,
        initial,
        copied,
        afterReset,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  if (server) {
    await server.close();
  }
}
