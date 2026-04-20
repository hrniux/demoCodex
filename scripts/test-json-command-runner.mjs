import assert from 'node:assert/strict';

import {
  createSuiteLabel,
  formatDurationMs,
  runJsonCommand,
} from './json-command-runner.mjs';

assert.equal(formatDurationMs(950), '950ms');
assert.equal(formatDurationMs(1250), '1.3s');
assert.equal(createSuiteLabel({ index: 3, total: 12, key: 'indexMenu' }), '[3/12] indexMenu');

const okPayload = await runJsonCommand({
  command: process.execPath,
  args: ['-e', 'console.log(JSON.stringify({ ok: true, value: 7 }))'],
  cwd: process.cwd(),
  timeoutMs: 1_000,
});

assert.deepEqual(okPayload, { ok: true, value: 7 });

await assert.rejects(
  () =>
    runJsonCommand({
      command: process.execPath,
      args: ['-e', 'setTimeout(() => console.log(JSON.stringify({ ok: true })), 200)'],
      cwd: process.cwd(),
      timeoutMs: 50,
    }),
  /timed out after 50ms/,
);

console.log(JSON.stringify({ ok: true, checks: 5 }));
