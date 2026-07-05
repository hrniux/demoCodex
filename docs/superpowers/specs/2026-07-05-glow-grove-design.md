# Glow Grove Design

## Goal

Add one complete DemoCodex game page named `辉苔林廊` (`glow-grove`) and keep the project easier to extend by using the existing grid arcade runtime, npm auto-discovery, and shared browser regression path.

## Approach

`glow-grove` uses the established `GridArcadeCore` plus `PixelPageRuntime` pattern instead of introducing a new engine. The game is a tactical push-box route: step on a grove switch, move through the opened gate, push three glow boxes onto goals, and use a short-cooldown lantern burst to clear adjacent hazards.

The implementation stays in the existing file layout:

- `glow-grove.html` contains page metadata and semantic UI structure.
- `src/css/glow-grove.css` defines only theme variables and imports `pixel-page-base.css`.
- `src/js/glow-grove.js` contains the game configuration and two small self-check helpers.
- `scripts/test-glow-grove-mechanics.mjs` validates core route and ability behavior.
- `scripts/test-glow-grove-browser.mjs` uses the shared browser preset runner.

## Behavior

The route check proves the gate opens, the player can pass through, and a box locks on a goal for a score of `122`. The ability check proves the lantern burst clears exactly two adjacent hazards, starts a `3` turn cooldown, and awards `70` points. Browser scenarios cover progress, special ability use, and a floor transition through extraction.

## Integration

The game is added to the homepage data, strategy category set, README curated list, manifest counts, package scripts, and browser-suite auto-discovery. The existing manifest and suite discovery checks should pick up the page without any hard-coded suite list changes.

## Verification

Required checks before pushing:

- `npm run check:manifest`
- `npm run -s test:glow-grove:logic`
- `GLOW_GROVE_CAPTURE=1 npm run -s test:glow-grove:browser`
- inspect the generated `progress.png`, `special.png`, and `extract.png`
- `npm test`
- `npm run test:browser`
