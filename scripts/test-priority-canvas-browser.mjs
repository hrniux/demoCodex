import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildTestUrl, maybeCaptureScreenshot, trackPageErrors } from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

const TEST_URL = buildTestUrl({
  envName: 'PRIORITY_CANVAS_TEST_URL',
  pathname: '/priority-canvas.html',
});
const CAPTURE_SCREENSHOTS = process.env.PRIORITY_CANVAS_CAPTURE === '1';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/priority-canvas-browser');

const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1440, height: 1280 },
});
const errors = trackPageErrors(page);

try {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('#priority-title', '修复登录错误');
  await page.selectOption('#priority-impact', '5');
  await page.selectOption('#priority-effort', '2');
  await page.selectOption('#priority-deadline', 'today');
  await page.selectOption('#priority-dependency', 'none');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    const resultBody = document.getElementById('priority-result-body');
    return resultBody && !resultBody.hidden;
  });

  const payload = await page.evaluate(() => ({
    selfCheck: window.priorityCanvasApp?.runSelfCheck?.() || null,
    resultVisible: Boolean(document.getElementById('priority-result-body') && !document.getElementById('priority-result-body').hidden),
    emptyHidden: Boolean(document.getElementById('priority-empty') && document.getElementById('priority-empty').hidden),
    mode: document.getElementById('priority-mode')?.textContent || '',
    title: document.getElementById('priority-title-display')?.textContent || '',
    lead: document.getElementById('priority-lead')?.textContent || '',
    chips: document.querySelectorAll('#priority-meta .priority-chip').length,
    boardCells: document.querySelectorAll('#priority-board .priority-cell').length,
    activeCells: document.querySelectorAll('#priority-board .priority-cell[data-active="true"]').length,
    reasonItems: document.querySelectorAll('#priority-reasons li').length,
    nextItems: document.querySelectorAll('#priority-next li').length,
    riskItems: document.querySelectorAll('#priority-risks li').length,
  }));

  assert.equal(payload.selfCheck?.ok, true);
  assert.equal(payload.resultVisible, true);
  assert.equal(payload.emptyHidden, true);
  assert.equal(payload.title, '修复登录错误');
  assert.match(payload.mode, /优先分 \d+\/100/);
  assert(payload.lead.includes('先做') || payload.lead.includes('计划做'));
  assert.equal(payload.chips, 5);
  assert.equal(payload.boardCells, 4);
  assert.equal(payload.activeCells, 1);
  assert.equal(payload.reasonItems, 3);
  assert.equal(payload.nextItems, 2);
  assert.equal(payload.riskItems, 3);

  await page.click('#priority-clear');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('priority-result-body');
    const empty = document.getElementById('priority-empty');
    return resultBody && resultBody.hidden && empty && !empty.hidden;
  });

  await page.fill('#priority-title', '补充文档');
  await page.selectOption('#priority-impact', '1');
  await page.click('#priority-reset');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('priority-result-body');
    const empty = document.getElementById('priority-empty');
    const title = document.getElementById('priority-title');
    const impact = document.getElementById('priority-impact');
    const effort = document.getElementById('priority-effort');
    return (
      resultBody &&
      resultBody.hidden &&
      empty &&
      !empty.hidden &&
      title &&
      title.value === '' &&
      impact &&
      impact.value === '3' &&
      effort &&
      effort.value === '3'
    );
  });

  const screenshot = await maybeCaptureScreenshot(page, SCREENSHOT_DIR, 'result.png', CAPTURE_SCREENSHOTS);
  assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: TEST_URL,
        browser: executablePath,
        screenshot,
        payload,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
