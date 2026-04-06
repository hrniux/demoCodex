import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildTestUrl, maybeCaptureScreenshot, trackPageErrors } from './browser-test-helpers.mjs';
import { launchLocalChrome } from './local-chrome.mjs';

const TEST_URL = buildTestUrl({
  envName: 'MEETING_WEAVE_TEST_URL',
  pathname: '/meeting-weave.html',
});
const CAPTURE_SCREENSHOTS = process.env.MEETING_WEAVE_CAPTURE === '1';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'output/meeting-weave-browser');

const { browser, executablePath } = await launchLocalChrome(chromium);
const page = await browser.newPage({
  viewport: { width: 1440, height: 1280 },
});
const errors = trackPageErrors(page);

try {
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
  await page.fill('#meeting-title', '版本评审会');
  await page.selectOption('#meeting-goal', 'decision');
  await page.fill('#meeting-headcount', '8');
  await page.selectOption('#meeting-duration', '45');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    const resultBody = document.getElementById('meeting-result-body');
    return resultBody && !resultBody.hidden;
  });

  const payload = await page.evaluate(() => ({
    selfCheck: window.meetingWeaveApp?.runSelfCheck?.() || null,
    resultVisible: Boolean(document.getElementById('meeting-result-body') && !document.getElementById('meeting-result-body').hidden),
    emptyHidden: Boolean(document.getElementById('meeting-empty') && document.getElementById('meeting-empty').hidden),
    mode: document.getElementById('meeting-mode')?.textContent || '',
    title: document.getElementById('meeting-title-display')?.textContent || '',
    lead: document.getElementById('meeting-lead')?.textContent || '',
    chips: document.querySelectorAll('#meeting-meta .meeting-chip').length,
    timelineItems: document.querySelectorAll('#meeting-timeline li').length,
    ruleItems: document.querySelectorAll('#meeting-rules li').length,
    prepItems: document.querySelectorAll('#meeting-prep li').length,
    closeItems: document.querySelectorAll('#meeting-close li').length,
  }));

  assert.equal(payload.selfCheck?.ok, true);
  assert.equal(payload.resultVisible, true);
  assert.equal(payload.emptyHidden, true);
  assert.equal(payload.title, '版本评审会');
  assert.match(payload.mode, /45 分钟/);
  assert(payload.lead.includes('会议结构') || payload.lead.includes('主持'));
  assert.equal(payload.chips, 5);
  assert.equal(payload.timelineItems, 5);
  assert.equal(payload.ruleItems, 3);
  assert.equal(payload.prepItems, 3);
  assert.equal(payload.closeItems, 3);

  const minutes = await page.evaluate(() =>
    window.meetingWeaveApp
      .buildMeetingWeavePlan({
        title: '版本评审会',
        goal: 'decision',
        headcount: 8,
        duration: 45,
      })
      .timeline.map((item) => item.minutes),
  );

  assert.equal(minutes.reduce((sum, item) => sum + item, 0), 45);
  assert(minutes.every((item) => item > 0));

  await page.click('#meeting-clear');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('meeting-result-body');
    const empty = document.getElementById('meeting-empty');
    return resultBody && resultBody.hidden && empty && !empty.hidden;
  });

  await page.fill('#meeting-title', '临时同步');
  await page.fill('#meeting-headcount', '4');
  await page.click('#meeting-reset');
  await page.waitForFunction(() => {
    const resultBody = document.getElementById('meeting-result-body');
    const empty = document.getElementById('meeting-empty');
    const title = document.getElementById('meeting-title');
    const headcount = document.getElementById('meeting-headcount');
    const duration = document.getElementById('meeting-duration');
    return (
      resultBody &&
      resultBody.hidden &&
      empty &&
      !empty.hidden &&
      title &&
      title.value === '' &&
      headcount &&
      headcount.value === '6' &&
      duration &&
      duration.value === '30'
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
        minutes,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
