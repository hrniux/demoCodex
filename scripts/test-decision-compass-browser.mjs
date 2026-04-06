import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildTestUrl, maybeCaptureScreenshot, trackPageErrors } from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

const TEST_URL = buildTestUrl({
  envName: 'DECISION_COMPASS_TEST_URL',
  pathname: '/decision-compass.html',
});
const CAPTURE_SCREENSHOTS = process.env.DECISION_COMPASS_CAPTURE === '1';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/decision-compass-browser');

const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1440, height: 1280 },
});
const errors = trackPageErrors(page);

try {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('#decision-title', '是否今天上线');
  await page.selectOption('#decision-urgency', 'high');
  await page.selectOption('#decision-reversibility', 'hard');
  await page.fill('#decision-confidence', '84');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    const resultBody = document.getElementById('decision-result-body');
    return resultBody && !resultBody.hidden;
  });

  const payload = await page.evaluate(() => ({
    selfCheck: window.decisionCompassApp?.runSelfCheck?.() || null,
    resultVisible: Boolean(document.getElementById('decision-result-body') && !document.getElementById('decision-result-body').hidden),
    emptyHidden: Boolean(document.getElementById('decision-empty') && document.getElementById('decision-empty').hidden),
    mode: document.getElementById('decision-mode')?.textContent || '',
    title: document.getElementById('decision-title-display')?.textContent || '',
    lead: document.getElementById('decision-lead')?.textContent || '',
    chips: document.querySelectorAll('#decision-meta .decision-chip').length,
    actionItems: document.querySelectorAll('#decision-action li').length,
    reasonItems: document.querySelectorAll('#decision-reasons li').length,
    checkpointItems: document.querySelectorAll('#decision-checkpoints li').length,
    guardrailItems: document.querySelectorAll('#decision-guardrail li').length,
  }));

  assert.equal(payload.selfCheck?.ok, true);
  assert.equal(payload.resultVisible, true);
  assert.equal(payload.emptyHidden, true);
  assert.equal(payload.title, '是否今天上线');
  assert.match(payload.mode, /罗盘分 \d+\/100/);
  assert(payload.lead.includes('先做最小可逆动作') || payload.lead.includes('先补信息'));
  assert.equal(payload.chips, 5);
  assert.equal(payload.actionItems, 2);
  assert.equal(payload.reasonItems, 3);
  assert.equal(payload.checkpointItems, 3);
  assert.equal(payload.guardrailItems, 2);

  await page.click('#decision-clear');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('decision-result-body');
    const empty = document.getElementById('decision-empty');
    return resultBody && resultBody.hidden && empty && !empty.hidden;
  });

  await page.fill('#decision-title', '零把握样本');
  await page.selectOption('#decision-urgency', 'low');
  await page.selectOption('#decision-reversibility', 'reversible');
  await page.fill('#decision-confidence', '0');
  await page.click('button[type="submit"]');

  const zeroPayload = await page.evaluate(() => ({
    mode: document.getElementById('decision-mode')?.textContent || '',
    lead: document.getElementById('decision-lead')?.textContent || '',
  }));

  assert.match(zeroPayload.mode, /先观察再决定/);
  assert.match(zeroPayload.lead, /先观察再决定/);

  await page.click('#decision-reset');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('decision-result-body');
    const empty = document.getElementById('decision-empty');
    const confidence = document.getElementById('decision-confidence');
    return (
      resultBody &&
      resultBody.hidden &&
      empty &&
      !empty.hidden &&
      confidence &&
      confidence.value === '68'
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
        zeroPayload,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
