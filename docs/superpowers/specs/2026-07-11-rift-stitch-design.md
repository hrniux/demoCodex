# Rift Stitch Design

## Goal

Add one polished, browser-native real-time arcade game named **Rift Stitch / 裂光织梭** and make DemoCodex easier to keep accurate as the collection grows.

The work has two equally required outcomes:

1. add a distinct 2-3 minute action game that is not another Grid Arcade push-box reskin;
2. repair the stale GitHub-facing project count and extend the manifest guard so the homepage, README, and project About copy cannot silently drift apart again.

## Current Context

The current verified baseline is:

- 75 runnable HTML pages;
- 69 homepage cards;
- 4 featured cards;
- 51 of the 69 homepage cards are categorized as strategy puzzles;
- the default spotlight is `magnet-forge.html`;
- `.github/project-about.md` still says `43 playable`, which no longer matches the collection;
- `main`, `origin/main`, and the remote `refs/heads/main` all start at `c2eab43d165ee82d2b38101b98a633f3235dffec`.

The new game should become a featured arcade entry and the default spotlight. After integration, the expected counts are 76 HTML pages, 70 homepage cards, and 5 featured cards.

## Product Direction

**One-line hook:** movement is the weapon. The player changes between three rails, and every lane change leaves a short-lived diagonal stitch that cuts incoming rifts. A quick reverse move crosses the previous stitch into an X knot that can break armored enemies.

Rift Stitch is deliberately different from existing titles:

- it is not free-movement survival like `stellar-escape`;
- it is not single-button gravity avoidance like `flappy-bird`;
- it is not memory playback like `echo-matrix`;
- it does not use `GridArcadeCore`, boxes, goals, switches, gates, extraction, or a clear/freeze ability.

The first ten seconds must teach the hook without a separate tutorial screen: one slow normal rift approaches, the lane-change prompt pulses, and the first successful stitch visibly cuts the target.

## Core Rules

### Arena

- Logical canvas size: `960 x 600`.
- Rail centers: `x = 240`, `480`, and `720`.
- The player stays near `y = 510` and moves only between adjacent rails.
- Incoming objects move from the top toward the player.
- The active defense band spans roughly `y = 390` through `y = 500`.

### Lane changes and stitches

- Left and right inputs move the player by one adjacent rail.
- A lane change takes 8 simulation ticks and ignores additional movement input during that short lock.
- A completed move creates one diagonal stitch from the old rail at the bottom of the defense band to the new rail at the top.
- A normal stitch lasts 54 ticks (`0.9s`).
- Only one stitch structure can be active. A new unrelated stitch replaces the old one, preventing screen-filling input spam.
- Reversing across the same rail pair within 25 ticks (`0.417s`) adds the opposite diagonal and upgrades the structure to an X knot.
- An X knot lasts 39 ticks (`0.65s`).
- A reverse input after the 25-tick boundary creates a new ordinary stitch instead of an X knot.

### Incoming object types

1. **Rift / 裂影**
   - Circular silhouette with an inward arrow.
   - Destroyed by intersecting either segment of an active stitch.
   - Reaching the damage line costs one integrity.

2. **Armored knot / 死结**
   - Diamond silhouette with a cross-hatched shell.
   - Ignores ordinary stitches.
   - Destroyed only when its center reaches the intersection area of an active X knot.
   - Reaching the damage line costs one integrity.

3. **Burn knot / 灼结**
   - Amber triangular silhouette with diagonal warning stripes.
   - Cannot be destroyed by stitches.
   - Must be dodged by leaving its rail before it crosses the player line.
   - A collision costs one integrity.

4. **Rift core / 裂界核心**
   - Final-wave boss.
   - Uses the already-taught normal, armored, and burn-knot patterns.
   - Requires three valid X-knot hits to seal.
   - Does not introduce a new control or hidden rule.

### Integrity, scoring, and combo

- The player starts with 3 integrity.
- Damage consumes the object that caused it, clears the active stitch, resets the combo to `1x`, and shows an 18-tick visual recovery flash. The flash grants no invulnerability against a different object.
- Zero integrity enters `game-over` immediately.
- Normal rift: 100 base points.
- Precision cut within 18 logical pixels of the stitch midpoint: +50 points.
- Armored knot destroyed by an X knot: 300 base points.
- No-damage wave: +1000 points.
- Final core sealed: +2500 points.
- A successful cut raises the multiplier by `0.25x`, capped at `5x`.
- After 90 ticks (`1.5s`) without a hit, the multiplier falls by `0.25x` every 30 ticks until it reaches `1x`.
- Missing an enemy or taking a burn-knot hit resets the multiplier immediately.
- There is no passive survival score.

All score calculations use integer quarter-steps internally so results remain deterministic and do not accumulate floating-point drift.

## Session Structure

The game has six authored 30-second waves. Each wave includes its own brief preview and result beat, so a successful run remains approximately three minutes.

1. **Calibration:** slow single rifts and the first stitch prompt.
2. **Crossflow:** alternating and paired rifts plus the first burn knot.
3. **Dead Knot:** introduces the armored target and the X-knot prompt.
4. **Rail Lock:** burn-knot patterns temporarily make one route unsafe.
5. **Downpour:** shorter telegraphs and mixed formations using only learned rules.
6. **Rift Core:** the boss combines the previous patterns and requires three X-knot hits.

Wave schedules are authored templates, then mirrored or rail-rotated by a seeded deterministic transform. This provides replay variation without generating impossible combinations. Each transformed schedule is validated before use:

- no two burn knots make every rail unsafe at the player line;
- an armored target always has enough time for two valid lane changes;
- concurrent targets never require mutually exclusive player positions;
- the final boss always exposes three valid X-knot windows.

The state machine is explicit:

`idle -> countdown -> running -> wave-result -> running -> won`

`running -> paused -> running`

`running -> game-over -> countdown`

The document becoming hidden automatically enters `paused`. Returning to the page requires a three-second countdown before simulation resumes.

## Controls and Feedback

### Keyboard and pointer

- `A` / `ArrowLeft`: move left.
- `D` / `ArrowRight`: move right.
- `P` / `Escape`: pause or resume.
- `Enter`: start or restart from a terminal state.
- `R`: restart.
- `M`: toggle mute.
- Mobile: two persistent buttons at least 56 CSS pixels square.
- Pointer: pressing the left or right half of the canvas issues the same discrete action as the corresponding keyboard command.

Every input source maps into the same action queue. Keyboard, canvas pointer, and touch-button behavior must therefore be mechanically identical.

### Audio

Audio is auxiliary feedback, never required information:

- generated with Web Audio oscillators after a user gesture;
- no external audio asset or runtime dependency;
- separate tones for stitch, precision cut, X knot, damage, and wave clear;
- `M` and a visible mute button control it;
- mute preference is persisted;
- autotest mode disables audio creation.

### Accessibility

- Semantic `main`, `section`, `aside`, `button`, `dl`, and status elements.
- Canvas uses `role="img"` and a specific Chinese `aria-label`.
- Score, integrity, wave, combo, stitch state, and game status are mirrored as DOM text.
- One restrained `aria-live="polite"` region announces wave changes, damage, pause, victory, and game over, but not every kill.
- Threat types differ by shape, outline, pattern, icon, and color.
- All controls have visible `:focus-visible` states.
- Reduced-motion mode removes rain parallax, shake, and decorative particles while keeping gameplay positions and telegraphs.
- High-contrast CSS preserves a minimum readable distinction between rails, targets, stitches, and text.

## Visual Design

The setting is a giant city loom in heavy rain:

- deep indigo sky and near-black architecture;
- cyan normal stitches;
- magenta X knots;
- amber non-cuttable danger;
- pale player shuttle with a clear directional notch;
- sparse skyline windows that briefly illuminate after successful cuts.

The canvas uses geometric drawing only. Particles, rain, parallax buildings, and screen shake are presentation layers and never participate in collision logic.

Desktop layout places the game beside a compact mission/status panel. At widths below 820px, the canvas, HUD, controls, and instructions become one column. At approximately `390 x 844`:

- the page must have no horizontal overflow;
- the full canvas width remains visible;
- both touch buttons remain above the fold after the compact HUD;
- controls remain at least 56px high;
- long Chinese status strings wrap without clipping.

## Architecture

Rift Stitch uses a private real-time engine because its continuous fixed-step simulation and segment collisions do not belong in `GridArcadeCore`.

### `src/js/rift-stitch-engine.js`

A pure UMD-style simulation module usable from both Node and the browser. It owns:

- constants and authored wave templates;
- seeded `xorshift32` variation;
- state creation and restart;
- action queue processing;
- fixed-tick movement;
- stitch and X-knot creation;
- segment/circle and player/object collision rules;
- score, combo, integrity, wave, boss, win, and game-over transitions;
- schedule validation;
- deterministic snapshots and self-checks.

It performs no DOM, Canvas, Web Audio, localStorage, `requestAnimationFrame`, or wall-clock access.

`state.events` is a durable outbox. Engine transitions append object-shaped events such as
`{ type: 'stitch-created' }`; `stepGame()` never clears an unconsumed event and validates its
positive integer tick count before touching state. The browser controller drains the outbox with
`state.events.splice(0)` after each catch-up loop, so events produced on an intermediate fixed tick
cannot disappear before audio, feed, and accessibility consumers see them.

Public API:

```js
createGameState(options)
queueAction(state, action)
stepGame(state, ticks)
snapshotGame(state)
validateSchedule(schedule)
runSelfCheck()
```

### `src/js/rift-stitch.js`

The browser controller owns:

- DOM lookup and validation;
- the requestAnimationFrame accumulator;
- keyboard, pointer, button, visibility, and resize events;
- Canvas rendering and presentation-only particles;
- Web Audio feedback and mute persistence;
- best-score persistence;
- accessible status and feed updates;
- start, pause, resume countdown, restart, win, and game-over overlays;
- the deterministic browser test bridge.

The controller stores bound handler references and implements `dispose()` so all listeners, animation frames, audio nodes, and pending timers can be released.

### Browser test protocol

The page exposes:

```js
window.riftStitchGame
window.render_game_to_text()
window.advanceTime(ms)
window.__riftStitchTest = {
  reset(options),
  dispatch(action),
  step(ticks),
  snapshot(),
  loadScenario(name),
}
```

In `?autotest=1&seed=4242` mode:

- the real animation clock is stopped;
- localStorage writes, audio, vibration, and decorative randomness are disabled;
- only explicit `step()` or `advanceTime()` calls advance simulation;
- test scenarios use the same engine transitions as normal play.

`render_game_to_text()` returns concise JSON with the coordinate convention, mode, tick, wave, score, combo, integrity, player rail, active stitch type and lifetime, incoming objects, boss health, mute state, and pause state.

## Files

Create:

- `rift-stitch.html`
- `src/css/rift-stitch.css`
- `src/js/rift-stitch-engine.js`
- `src/js/rift-stitch.js`
- `scripts/test-rift-stitch-mechanics.mjs`
- `scripts/test-rift-stitch-browser.mjs`
- `docs/superpowers/specs/2026-07-11-rift-stitch-design.md`

Modify:

- `src/js/index-menu.js`
- `index.html`
- `README.md`
- `package.json`
- `.github/project-about.md`
- `scripts/check-demo-manifest.mjs`
- `scripts/test-check-demo-manifest.mjs`

No external runtime or browser dependency is added. The existing Chrome-only helper, static server, and browser test helpers remain authoritative.

## Project Optimization

### GitHub-facing count guard

Update `.github/project-about.md` from `43 playable` to `70 playable`, matching the post-integration homepage-card count.

Extend `scripts/check-demo-manifest.mjs` to parse the leading playable count from `.github/project-about.md` and compare it with `menuCardCount`. The checker should fail clearly when:

- the About count is missing;
- the About count is not numeric;
- the count differs from the actual homepage card count.

Extend `scripts/test-check-demo-manifest.mjs` with positive and negative fixtures for this rule. This turns an observed documentation drift into a permanently guarded invariant.

### Homepage curation

- Add Rift Stitch as a featured card.
- Make it the default spotlight in `index.html` and `src/js/index-menu.js`.
- Keep it in the existing `arcade` category, not `strategy`.
- Update homepage counts to 70 total and 5 featured.
- Update README counts to 76 HTML pages and 70 homepage cards.
- Add Rift Stitch to the quick-start/recommended section and complete catalog.

## Testing Strategy

### TDD engine coverage

Write failing logic tests before engine behavior for:

- seed and schedule determinism;
- schedule validity and invalid-combination rejection;
- lane boundaries and the 8-tick input lock;
- normal stitch creation, replacement, and 54-tick expiry;
- X-knot creation at the 25-tick boundary and rejection at 26 ticks;
- normal-rift segment collision and single-score protection;
- precision midpoint bonus;
- armored-knot immunity to normal stitches and destruction by an X knot;
- burn-knot immunity and player collision;
- integrity loss, combo reset, and game over;
- integer multiplier growth, decay, and cap;
- wave transitions and no-damage bonus;
- three-hit boss seal and `won` state;
- restart returning to a clean deterministic state;
- `runSelfCheck()` covering a representative successful and failure path.

### Browser regression

The dedicated wrapper must use the existing static server and `scripts/local-chrome.mjs`; it must never install or fall back to a Playwright browser.

Desktop scenarios:

- page boots in idle mode with no console or page errors;
- Enter starts the countdown;
- keyboard lane change creates a stitch and cuts a normal rift;
- reverse keyboard input creates an X knot and breaks armor;
- pause freezes the tick and resume performs a countdown;
- damage updates DOM, Canvas state, and accessible status;
- restart clears terminal state;
- scripted boss scenario reaches `won`;
- mute button and `M` remain equivalent;
- `render_game_to_text()` matches the internal snapshot.

Mobile scenario at approximately `390 x 844`:

- no horizontal overflow;
- touch targets are at least 56px high;
- left and right buttons generate the same state transitions as keyboard input;
- the canvas remains within its container;
- critical HUD and controls are visible and unclipped.

Capture mode should write and visually inspect:

- `idle.png`
- `stitch.png`
- `x-knot.png`
- `boss.png`
- `mobile.png`

### Required final verification

```bash
npm run check:manifest
npm run test:manifest:logic
npm run test:rift-stitch:logic
RIFT_STITCH_CAPTURE=1 npm run test:rift-stitch:browser
npm test
npm run test:browser
```

All browser commands must report the local Google Chrome executable. The controller must also be manually exercised through the full first wave before completion.

## Acceptance Criteria

- The first ten seconds visibly teach that lane changes create attacking stitches.
- A full game can be won in approximately three minutes using only left/right movement plus pause/restart controls.
- Normal, armored, burn-knot, and boss rules are visually and mechanically distinct.
- Keyboard, Canvas pointer, and touch-button inputs share one action path.
- The game is playable with audio muted and with reduced motion enabled.
- Desktop and mobile browser regressions pass in local Google Chrome.
- The deterministic engine is fully testable without a DOM.
- Rift Stitch appears as a featured homepage card and default spotlight.
- Homepage, README, and GitHub About counts agree and the manifest guard enforces the agreement.
- No unrelated user file, especially `.codex/config.toml`, is committed.
- Independent subagent review finds no blocker and scores both game quality and project integration above 90 before push.
- Local `HEAD`, `origin/main`, and remote `refs/heads/main` point to the same final commit after push.

## Non-Goals

- Multiplayer or online leaderboards.
- External art, font, music, or analytics dependencies.
- Procedurally generated unvalidated waves.
- A general-purpose real-time game framework.
- Refactoring existing games to use the Rift Stitch engine.
- Expanding `GridArcadeCore` with mechanics that do not belong to grid games.
