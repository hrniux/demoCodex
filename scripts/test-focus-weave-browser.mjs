import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildTestUrl, maybeCaptureScreenshot, trackPageErrors } from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

const testUrl = buildTestUrl({
  envName: 'FOCUS_WEAVE_TEST_URL',
  pathname: '/focus-weave.html',
});

const captureEnabled = process.env.FOCUS_WEAVE_CAPTURE === '1';
const screenshotDir = path.resolve(process.cwd(), 'output/focus-weave-browser');

const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1440, height: 1400 },
});
const errors = trackPageErrors(page);

try {
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
  await page.fill('#focus-title', '整理发版清单');
  await page.fill('#focus-start', '09:30');
  await page.selectOption('#focus-energy', 'high');
  await page.selectOption('#focus-task', 'coding');
  await page.selectOption('#focus-duration', '75');
  await page.selectOption('#focus-interruption', 'medium');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    const resultBody = document.getElementById('focus-result-body');
    return resultBody && !resultBody.hidden;
  });

  const payload = await page.evaluate(() => {
    const resultBody = document.getElementById('focus-result-body');
    const empty = document.getElementById('focus-empty');
    return {
      resultVisible: Boolean(resultBody && !resultBody.hidden),
      emptyHidden: Boolean(empty && empty.hidden),
      title: document.getElementById('focus-title-display')?.textContent || '',
      mode: document.getElementById('focus-mode')?.textContent || '',
      lead: document.getElementById('focus-lead')?.textContent || '',
      chips: document.querySelectorAll('#focus-meta .focus-chip').length,
      timelineSteps: document.querySelectorAll('#focus-timeline .focus-step').length,
      checklistItems: document.querySelectorAll('#focus-checklist li').length,
      guardrailItems: document.querySelectorAll('#focus-guardrails li').length,
    };
  });

  assert.equal(payload.resultVisible, true);
  assert.equal(payload.emptyHidden, true);
  assert.equal(payload.title, '整理发版清单');
  assert.match(payload.mode, /匹配度 \d+\/100/);
  assert(!payload.lead.includes('。。'), 'generated lead contains duplicated punctuation');
  assert(!payload.lead.includes('更适合更适合'), 'generated lead contains duplicated phrase');
  assert(payload.chips >= 5, 'expected at least 5 meta chips');
  assert(payload.timelineSteps >= 5, 'expected timeline steps to render');
  assert(payload.checklistItems >= 3, 'expected checklist items to render');
  assert(payload.guardrailItems >= 3, 'expected guardrail items to render');

  await page.click('#focus-clear');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('focus-result-body');
    const empty = document.getElementById('focus-empty');
    return resultBody && resultBody.hidden && empty && !empty.hidden;
  });

  const afterClear = await page.evaluate(() => ({
    resultHidden: document.getElementById('focus-result-body')?.hidden ?? false,
    emptyVisible: !(document.getElementById('focus-empty')?.hidden ?? true),
  }));

  assert.equal(afterClear.resultHidden, true);
  assert.equal(afterClear.emptyVisible, true);

  const screenshot = await maybeCaptureScreenshot(page, screenshotDir, 'result.png', captureEnabled);
  assert.equal(errors.length, 0, `unexpected browser errors: ${JSON.stringify(errors)}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: testUrl,
        browser: executablePath,
        screenshot,
        payload,
        afterClear,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
