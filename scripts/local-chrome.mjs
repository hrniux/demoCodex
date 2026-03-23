import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_LOCAL_CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const LOCAL_CHROME_ENV = 'DEMOCODEX_CHROME_EXECUTABLE';

function isBundledPlaywrightBrowser(targetPath) {
  const normalized = targetPath.replaceAll('\\', '/');
  return (
    normalized.includes('/ms-playwright/') ||
    normalized.includes('/playwright/') ||
    normalized.includes('chromium_headless_shell')
  );
}

export async function resolveLocalChromeExecutable() {
  const configuredPath = process.env[LOCAL_CHROME_ENV] || DEFAULT_LOCAL_CHROME;
  const executablePath = path.resolve(configuredPath);

  if (isBundledPlaywrightBrowser(executablePath)) {
    throw new Error(
      `Refusing to use Playwright bundled browser: ${executablePath}. DemoCodex browser tests must use an existing local Chrome install.`,
    );
  }

  try {
    await fs.access(executablePath, fsConstants.X_OK);
  } catch {
    throw new Error(
      `Local Chrome executable not found or not executable: ${executablePath}. Install Google Chrome locally or point ${LOCAL_CHROME_ENV} to an existing local Chrome binary. DemoCodex browser tests do not fall back to Playwright bundled browsers.`,
    );
  }

  const realPath = await fs.realpath(executablePath).catch(() => executablePath);

  if (isBundledPlaywrightBrowser(realPath)) {
    throw new Error(
      `Resolved Chrome path points to a Playwright bundled browser: ${realPath}. DemoCodex browser tests must stay on local Chrome only.`,
    );
  }

  return realPath;
}

export async function launchLocalChrome(browserType, overrides = {}) {
  const executablePath = await resolveLocalChromeExecutable();
  const browser = await browserType.launch({
    executablePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader'],
    ...overrides,
  });

  return { browser, executablePath };
}
