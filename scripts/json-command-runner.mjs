import { spawn } from 'node:child_process';

export function formatDurationMs(durationMs) {
  const safeDuration = Math.max(0, Number(durationMs) || 0);

  if (safeDuration < 1_000) {
    return `${safeDuration}ms`;
  }

  return `${(safeDuration / 1_000).toFixed(1)}s`;
}

export function createSuiteLabel({ index, total, key }) {
  return `[${index}/${total}] ${key}`;
}

export function runJsonCommand({
  command,
  args = [],
  cwd,
  env = {},
  timeoutMs = 30_000,
  attempts = 1,
}) {
  const maxAttempts = Math.max(1, Number(attempts) || 1);

  async function runAttempt() {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let settled = false;
      let timer = null;

      let timeoutError = null;

      const finish = (callback) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        callback();
      };

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timeoutError = new Error(
            `Command timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}\nstdout:\n${stdout.trim()}\nstderr:\n${stderr.trim()}`,
          );
          timeoutError.code = 'ETIMEDOUT';

          child.kill('SIGTERM');
          setTimeout(() => {
            if (!settled) {
              child.kill('SIGKILL');
            }
          }, 1_000).unref();
        }, timeoutMs);
      }

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        finish(() => reject(error));
      });

      child.on('close', (code) => {
        if (settled) {
          return;
        }

        if (timeoutError) {
          finish(() => reject(timeoutError));
          return;
        }

        if (code !== 0) {
          finish(() => {
            reject(
              new Error(
                `Command failed: ${command} ${args.join(' ')}\nstdout:\n${stdout.trim()}\nstderr:\n${stderr.trim()}`,
              ),
            );
          });
          return;
        }

        try {
          const payload = JSON.parse(stdout);
          finish(() => resolve(payload));
        } catch {
          finish(() => {
            reject(
              new Error(
                `Command returned non-JSON output: ${command} ${args.join(' ')}\nstdout:\n${stdout.trim()}\nstderr:\n${stderr.trim()}`,
              ),
            );
          });
        }
      });
    });
  }

  return (async () => {
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await runAttempt();
      } catch (error) {
        lastError = error;
        if (error.code !== 'ETIMEDOUT' || attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw lastError;
  })();
}
