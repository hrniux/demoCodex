import path from 'node:path';
import { spawn } from 'node:child_process';
import { startStaticServer } from './static-server.mjs';

const rootDir = process.cwd();
const shouldCapture = process.env.DEMOCODEX_BROWSER_CAPTURE === '1';

function runNodeScript(scriptPath, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Script failed: ${scriptPath}\nstdout:\n${stdout.trim()}\nstderr:\n${stderr.trim()}`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new Error(
            `Script returned non-JSON output: ${scriptPath}\nstdout:\n${stdout.trim()}\nstderr:\n${stderr.trim()}`,
          ),
        );
      }
    });
  });
}

async function main() {
  const server = await startStaticServer({ rootDir });

  try {
    const sharedEnv = {
      DEMOCODEX_BASE_URL: server.url,
      NEON_HEIST_CAPTURE: shouldCapture ? '1' : process.env.NEON_HEIST_CAPTURE,
      ORBIT_RESCUE_CAPTURE: shouldCapture ? '1' : process.env.ORBIT_RESCUE_CAPTURE,
      TIDE_COURIER_CAPTURE: shouldCapture ? '1' : process.env.TIDE_COURIER_CAPTURE,
      CAVERN_BLAST_CAPTURE: shouldCapture ? '1' : process.env.CAVERN_BLAST_CAPTURE,
      MAGNET_FORGE_CAPTURE: shouldCapture ? '1' : process.env.MAGNET_FORGE_CAPTURE,
      EMBER_SHIFT_CAPTURE: shouldCapture ? '1' : process.env.EMBER_SHIFT_CAPTURE,
      RAIL_RIFT_CAPTURE: shouldCapture ? '1' : process.env.RAIL_RIFT_CAPTURE,
      GLYPH_KEEPER_CAPTURE: shouldCapture ? '1' : process.env.GLYPH_KEEPER_CAPTURE,
      PIXEL_ORCHARD_CAPTURE: shouldCapture ? '1' : process.env.PIXEL_ORCHARD_CAPTURE,
      SIGNAL_SPRINT_CAPTURE: shouldCapture ? '1' : process.env.SIGNAL_SPRINT_CAPTURE,
      VAULT_PUSHER_CAPTURE: shouldCapture ? '1' : process.env.VAULT_PUSHER_CAPTURE,
      COMET_LANTERN_CAPTURE: shouldCapture ? '1' : process.env.COMET_LANTERN_CAPTURE,
      FROSTBITE_FREIGHT_CAPTURE: shouldCapture ? '1' : process.env.FROSTBITE_FREIGHT_CAPTURE,
    };

    const neonHeist = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-neon-heist-browser.mjs'),
      sharedEnv,
    );
    const orbitRescue = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-orbit-rescue-browser.mjs'),
      sharedEnv,
    );
    const tideCourier = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-tide-courier-browser.mjs'),
      sharedEnv,
    );
    const cavernBlast = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-cavern-blast-browser.mjs'),
      sharedEnv,
    );
    const magnetForge = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-magnet-forge-browser.mjs'),
      sharedEnv,
    );
    const emberShift = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-ember-shift-browser.mjs'),
      sharedEnv,
    );
    const railRift = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-rail-rift-browser.mjs'),
      sharedEnv,
    );
    const glyphKeeper = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-glyph-keeper-browser.mjs'),
      sharedEnv,
    );
    const pixelOrchard = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-pixel-orchard-browser.mjs'),
      sharedEnv,
    );
    const signalSprint = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-signal-sprint-browser.mjs'),
      sharedEnv,
    );
    const vaultPusher = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-vault-pusher-browser.mjs'),
      sharedEnv,
    );
    const cometLantern = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-comet-lantern-browser.mjs'),
      sharedEnv,
    );
    const frostbiteFreight = await runNodeScript(
      path.resolve(rootDir, 'scripts/test-frostbite-freight-browser.mjs'),
      sharedEnv,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          server: server.url,
          tests: {
            neonHeist,
            orbitRescue,
            tideCourier,
            cavernBlast,
            magnetForge,
            emberShift,
            railRift,
            glyphKeeper,
            pixelOrchard,
            signalSprint,
            vaultPusher,
            cometLantern,
            frostbiteFreight,
          },
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
