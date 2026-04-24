import path from 'node:path';
import { startStaticServer } from './static-server.mjs';
import {
  createSuiteLabel,
  formatDurationMs,
  runJsonCommand,
} from './json-command-runner.mjs';

const rootDir = process.cwd();
const shouldCapture = process.env.DEMOCODEX_BROWSER_CAPTURE === '1';
const browserSuiteTimeoutMs = Number(process.env.DEMOCODEX_BROWSER_SUITE_TIMEOUT_MS || '300000');
const browserSuites = [
  { key: 'indexMenu', script: 'scripts/test-index-menu-browser.mjs', captureEnv: 'INDEX_MENU_CAPTURE' },
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
  { key: 'mossMission', script: 'scripts/test-moss-mission-browser.mjs', captureEnv: 'MOSS_MISSION_CAPTURE' },
  { key: 'kilnCaravan', script: 'scripts/test-kiln-caravan-browser.mjs', captureEnv: 'KILN_CARAVAN_CAPTURE' },
  { key: 'dockDrift', script: 'scripts/test-dock-drift-browser.mjs', captureEnv: 'DOCK_DRIFT_CAPTURE' },
  { key: 'canopyScout', script: 'scripts/test-canopy-scout-browser.mjs', captureEnv: 'CANOPY_SCOUT_CAPTURE' },
  { key: 'amberAisle', script: 'scripts/test-amber-aisle-browser.mjs', captureEnv: 'AMBER_AISLE_CAPTURE' },
  { key: 'auroraBreach', script: 'scripts/test-aurora-breach-browser.mjs', captureEnv: 'AURORA_BREACH_CAPTURE' },
  { key: 'reefKeeper', script: 'scripts/test-reef-keeper-browser.mjs', captureEnv: 'REEF_KEEPER_CAPTURE' },
  { key: 'focusWeave', script: 'scripts/test-focus-weave-browser.mjs', captureEnv: 'FOCUS_WEAVE_CAPTURE' },
  { key: 'orchidGuard', script: 'scripts/test-orchid-guard-browser.mjs', captureEnv: 'ORCHID_GUARD_CAPTURE' },
  { key: 'signalDunes', script: 'scripts/test-signal-dunes-browser.mjs', captureEnv: 'SIGNAL_DUNES_CAPTURE' },
  { key: 'voltPier', script: 'scripts/test-volt-pier-browser.mjs', captureEnv: 'VOLT_PIER_CAPTURE' },
  { key: 'phaseGarden', script: 'scripts/test-phase-garden-browser.mjs', captureEnv: 'PHASE_GARDEN_CAPTURE' },
  { key: 'mirrorVault', script: 'scripts/test-mirror-vault-browser.mjs', captureEnv: 'MIRROR_VAULT_CAPTURE' },
  { key: 'breakerYard', script: 'scripts/test-breaker-yard-browser.mjs', captureEnv: 'BREAKER_YARD_CAPTURE' },
  { key: 'emberGate', script: 'scripts/test-ember-gate-browser.mjs', captureEnv: 'EMBER_GATE_CAPTURE' },
  { key: 'riftRelay', script: 'scripts/test-rift-relay-browser.mjs', captureEnv: 'RIFT_RELAY_CAPTURE' },
  { key: 'stormLock', script: 'scripts/test-storm-lock-browser.mjs', captureEnv: 'STORM_LOCK_CAPTURE' },
  { key: 'skylineSwitch', script: 'scripts/test-skyline-switch-browser.mjs', captureEnv: 'SKYLINE_SWITCH_CAPTURE' },
  { key: 'gearVault', script: 'scripts/test-gear-vault-browser.mjs', captureEnv: 'GEAR_VAULT_CAPTURE' },
  { key: 'decisionCompass', script: 'scripts/test-decision-compass-browser.mjs', captureEnv: 'DECISION_COMPASS_CAPTURE' },
  { key: 'meetingWeave', script: 'scripts/test-meeting-weave-browser.mjs', captureEnv: 'MEETING_WEAVE_CAPTURE' },
  { key: 'priorityCanvas', script: 'scripts/test-priority-canvas-browser.mjs', captureEnv: 'PRIORITY_CANVAS_CAPTURE' },
];

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
