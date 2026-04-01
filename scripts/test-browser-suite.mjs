import path from 'node:path';
import { spawn } from 'node:child_process';
import { startStaticServer } from './static-server.mjs';

const rootDir = process.cwd();
const shouldCapture = process.env.DEMOCODEX_BROWSER_CAPTURE === '1';
const browserSuites = [
  { key: 'solarSentry', script: 'scripts/test-solar-sentry-browser.mjs', captureEnv: 'SOLAR_SENTRY_CAPTURE' },
  { key: 'crateCircuit', script: 'scripts/test-crate-circuit-browser.mjs', captureEnv: 'CRATE_CIRCUIT_CAPTURE' },
  { key: 'reefRaider', script: 'scripts/test-reef-raider-browser.mjs', captureEnv: 'REEF_RAIDER_CAPTURE' },
  { key: 'forgeFeint', script: 'scripts/test-forge-feint-browser.mjs', captureEnv: 'FORGE_FEINT_CAPTURE' },
  { key: 'prismPatrol', script: 'scripts/test-prism-patrol-browser.mjs', captureEnv: 'PRISM_PATROL_CAPTURE' },
  { key: 'glacierSwitch', script: 'scripts/test-glacier-switch-browser.mjs', captureEnv: 'GLACIER_SWITCH_CAPTURE' },
  { key: 'thornTrail', script: 'scripts/test-thorn-trail-browser.mjs', captureEnv: 'THORN_TRAIL_CAPTURE' },
  { key: 'relayRush', script: 'scripts/test-relay-rush-browser.mjs', captureEnv: 'RELAY_RUSH_CAPTURE' },
  { key: 'lumenLift', script: 'scripts/test-lumen-lift-browser.mjs', captureEnv: 'LUMEN_LIFT_CAPTURE' },
  { key: 'quarryQuest', script: 'scripts/test-quarry-quest-browser.mjs', captureEnv: 'QUARRY_QUEST_CAPTURE' },
  { key: 'neonHeist', script: 'scripts/test-neon-heist-browser.mjs', captureEnv: 'NEON_HEIST_CAPTURE' },
  { key: 'orbitRescue', script: 'scripts/test-orbit-rescue-browser.mjs', captureEnv: 'ORBIT_RESCUE_CAPTURE' },
  { key: 'tideCourier', script: 'scripts/test-tide-courier-browser.mjs', captureEnv: 'TIDE_COURIER_CAPTURE' },
  { key: 'cavernBlast', script: 'scripts/test-cavern-blast-browser.mjs', captureEnv: 'CAVERN_BLAST_CAPTURE' },
  { key: 'magnetForge', script: 'scripts/test-magnet-forge-browser.mjs', captureEnv: 'MAGNET_FORGE_CAPTURE' },
  { key: 'emberShift', script: 'scripts/test-ember-shift-browser.mjs', captureEnv: 'EMBER_SHIFT_CAPTURE' },
  { key: 'railRift', script: 'scripts/test-rail-rift-browser.mjs', captureEnv: 'RAIL_RIFT_CAPTURE' },
  { key: 'glyphKeeper', script: 'scripts/test-glyph-keeper-browser.mjs', captureEnv: 'GLYPH_KEEPER_CAPTURE' },
  { key: 'pixelOrchard', script: 'scripts/test-pixel-orchard-browser.mjs', captureEnv: 'PIXEL_ORCHARD_CAPTURE' },
  { key: 'signalSprint', script: 'scripts/test-signal-sprint-browser.mjs', captureEnv: 'SIGNAL_SPRINT_CAPTURE' },
  { key: 'vaultPusher', script: 'scripts/test-vault-pusher-browser.mjs', captureEnv: 'VAULT_PUSHER_CAPTURE' },
  { key: 'cometLantern', script: 'scripts/test-comet-lantern-browser.mjs', captureEnv: 'COMET_LANTERN_CAPTURE' },
  { key: 'frostbiteFreight', script: 'scripts/test-frostbite-freight-browser.mjs', captureEnv: 'FROSTBITE_FREIGHT_CAPTURE' },
];

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
    const sharedEnv = browserSuites.reduce(
      (env, suite) => ({
        ...env,
        [suite.captureEnv]: shouldCapture ? '1' : process.env[suite.captureEnv],
      }),
      { DEMOCODEX_BASE_URL: server.url },
    );
    const tests = {};

    for (const suite of browserSuites) {
      tests[suite.key] = await runNodeScript(path.resolve(rootDir, suite.script), sharedEnv);
    }

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
