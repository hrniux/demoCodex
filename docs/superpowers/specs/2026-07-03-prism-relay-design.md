# Prism Relay Design

## Goal

Add one polished DemoCodex game and one small project optimization:

- New game: `prism-relay.html`, a pixel strategy puzzle named `棱镜中继`.
- Optimization: reduce duplicate browser-suite maintenance by discovering browser test scripts from `package.json`.

## Current Context

DemoCodex is a static HTML game collection. The current preferred game pattern is:

- one top-level HTML page,
- one CSS file under `src/css`,
- one JS module under `src/js`,
- one logic test script,
- one browser test wrapper,
- one card in `src/js/index-menu.js`,
- matching README and manifest counts.

Recent grid strategy games reuse `src/js/grid-arcade-core.js` and `src/js/pixel-page-runtime.js`. This keeps game rules testable in Node and page behavior consistent in the browser.

## New Game Concept

`棱镜中继` is a turn-based pixel puzzle about restoring a broken light relay.

The player must:

- step on relay switches to open light gates,
- push prism blocks onto relay pads,
- use a short-range refraction pulse to clear nearby light traces,
- unlock the exit after all relay pads are powered,
- leave through the exit before hull/energy is depleted.

The feel should match existing strategy titles: compact board, readable hazards, clear objective, no external dependencies.

## Gameplay Rules

The implementation should reuse the grid arcade core in `goals` mode:

- `target`: 3 powered relay pads.
- `pushBoxes`: true.
- `spreadHazards`: true.
- `slidePlayer`: false.
- Special ability:
  - label: `折光`,
  - effect: `clear`,
  - radius: 1,
  - cooldown: 4.

Core interactions:

- Moving into a switch opens gates.
- Moving into a prism block pushes it if the target cell is free.
- A prism block on a relay pad locks and increments progress.
- When progress reaches target, the exit unlocks.
- Hazards pressure the player each turn.
- The special ability clears adjacent hazards and starts cooldown.

## Files

Create:

- `prism-relay.html`: semantic page shell, stats, canvas, mobile controls, instructions.
- `src/css/prism-relay.css`: page-specific variables importing `pixel-page-base.css`.
- `src/js/prism-relay.js`: game config, self-check helpers, browser bootstrap.
- `scripts/test-prism-relay-mechanics.mjs`: Node logic assertions for route and special ability.
- `scripts/test-prism-relay-browser.mjs`: browser wrapper using `runNamedGridArcadeBrowserTest`.

Modify:

- `package.json`: add `test:prism-relay:logic` and `test:prism-relay:browser`.
- `src/js/index-menu.js`: add the homepage card and include it in strategy categorization.
- `README.md`: update counts and add the new game to recommended lists/facts.
- `scripts/grid-arcade-browser-presets.mjs`: add a Prism Relay browser preset.
- `scripts/test-browser-suite.mjs`: discover browser suites from `package.json` instead of maintaining a long duplicated list.
- `scripts/test-json-command-runner.mjs` or a new helper only if needed for clean script discovery.
- `scripts/test-browser-suite:logic` path is already `scripts/test-json-command-runner.mjs`; add coverage there only if it is the established place for suite-runner behavior.

## Project Optimization

The current `scripts/test-browser-suite.mjs` duplicates every browser wrapper script in a manually maintained array. The optimized suite should:

- read `package.json`,
- discover script names matching `test:<name>:browser`,
- skip `test:browser` and other aggregate scripts because they do not match the three-part pattern,
- derive each suite key from `<name>`,
- run scripts in package order for stable output,
- preserve capture env behavior where possible by deriving an uppercase env key from the suite name, for example `prism-relay` to `PRISM_RELAY_CAPTURE`,
- keep using the shared static server and shared Chrome-only browser helpers.

The discovery code should be small and testable. It should not change the Chrome policy and must not introduce browser downloads.

## Testing

Use TDD for production behavior:

1. Add failing logic tests for Prism Relay route and refraction pulse.
2. Implement the minimal game config and helper checks.
3. Add/adjust browser-suite discovery tests so the optimization is covered.
4. Add the browser preset and wrapper.
5. Update homepage and docs.

Required verification before completion:

- `npm run check:manifest`
- `npm run test:prism-relay:logic`
- `npm run test:browser-suite:logic`
- `npm run test:prism-relay:browser`
- `npm test`

If full `npm run test:browser` is too slow for the interactive turn, at minimum run the new Prism Relay browser wrapper and the browser-suite discovery logic test, then state that the full browser suite was not run.

## Acceptance Criteria

- `prism-relay.html` opens from the homepage card.
- Homepage count and README count agree with the actual HTML file count.
- The new game has a playable start/reset flow, keyboard controls, touch buttons, visible stats, instructions, and a canvas board.
- The logic self-check proves gate opening, prism pushing, relay progress, and refraction pulse behavior.
- The browser test proves the page boots and core interactions work through the shared browser test preset.
- Browser-suite maintenance is improved by automatic script discovery from `package.json`.
- No new runtime dependency is added.
- No Playwright browser install flow is introduced.
