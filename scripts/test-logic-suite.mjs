import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createSuiteLabel,
  formatDurationMs,
  runJsonCommand,
} from './json-command-runner.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const logicSuiteTimeoutMs = Number(process.env.DEMOCODEX_LOGIC_SUITE_TIMEOUT_MS || '120000');

function readPackageScripts() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts || {};
}

export function listLogicScripts(scripts = readPackageScripts()) {
  return Object.keys(scripts).filter((scriptName) => /^test:[^:]+:logic$/.test(scriptName));
}

async function main() {
  const logicScripts = listLogicScripts();
  const startedAt = Date.now();
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const tests = {};

  for (const [index, scriptName] of logicScripts.entries()) {
    const key = scriptName.replace(/^test:/, '').replace(/:logic$/, '');
    const label = createSuiteLabel({
      index: index + 1,
      total: logicScripts.length,
      key,
    });
    const scriptStartedAt = Date.now();

    console.error(`${label} running ${scriptName}`);
    tests[key] = await runJsonCommand({
      command: npmCommand,
      args: ['run', '-s', scriptName],
      cwd: repoRoot,
      timeoutMs: logicSuiteTimeoutMs,
    });
    console.error(`${label} passed in ${formatDurationMs(Date.now() - scriptStartedAt)}`);
  }

  console.error(
    `[logic-suite] completed ${logicScripts.length} suites in ${formatDurationMs(Date.now() - startedAt)}`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: logicScripts.length,
        tests,
      },
      null,
      2,
    ),
  );
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === entryFile) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
