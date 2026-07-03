import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverBrowserSuitesFromScripts } from './browser-suite-discovery.mjs';
import { startStaticServer } from './static-server.mjs';
import {
  createSuiteLabel,
  formatDurationMs,
  runJsonCommand,
} from './json-command-runner.mjs';

const rootDir = process.cwd();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const shouldCapture = process.env.DEMOCODEX_BROWSER_CAPTURE === '1';
const browserSuiteTimeoutMs = Number(process.env.DEMOCODEX_BROWSER_SUITE_TIMEOUT_MS || '300000');

function readPackageScripts() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts || {};
}

const browserSuites = discoverBrowserSuitesFromScripts(readPackageScripts());

async function main() {
  const server = await startStaticServer({ rootDir });

  try {
    const sharedEnv = browserSuites.reduce(
      (env, suite) => ({
        ...env,
        [suite.captureEnv]: shouldCapture ? '1' : process.env[suite.captureEnv],
      }),
      { DEMOCODEX_BASE_URL: server.url },
    );
    const tests = {};
    const suiteStart = Date.now();

    for (const [index, suite] of browserSuites.entries()) {
      const label = createSuiteLabel({
        index: index + 1,
        total: browserSuites.length,
        key: suite.key,
      });
      const startedAt = Date.now();

      console.error(`${label} running ${suite.script}`);
      tests[suite.key] = await runJsonCommand({
        command: process.execPath,
        args: [path.resolve(rootDir, suite.script)],
        cwd: rootDir,
        env: sharedEnv,
        timeoutMs: browserSuiteTimeoutMs,
        attempts: 2,
      });
      console.error(`${label} passed in ${formatDurationMs(Date.now() - startedAt)}`);
    }

    console.error(
      `[browser-suite] completed ${browserSuites.length} suites in ${formatDurationMs(Date.now() - suiteStart)}`,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          server: server.url,
          tests,
        },
        null,
        2,
      ),
    );
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
