# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DemoCodex is a collection of browser-based HTML5 mini-games and interactive demos. All games run directly in the browser with no build step — open any `.html` file locally or serve via a static file server.

## Architecture

The project contains multiple independent games, each with its own HTML entry point:

- `index.html` — games collection hub
- `tank-battle.html` / `tank-battle-pixel.html` / `tank-battle-achievements.html` — tank battle variants
- `snake_game.html`, `voxelcraft.html`, `physics_playground.html`, `dinosaur_museum.html`, `daily-insights.html`, etc.

### Source Structure (`src/`)

**`src/js/modules/`** — the most structured module system, used by the main voxelcraft/physics games:
- `Config.js`, `Game.js`, `Scene.js` — top-level game orchestration
- `core/` — `AudioBus.js`, `Input.js`, `MathUtil.js`, `TouchControls.js`
- `entities/` — `Entity.js` (base), `Player.js`, `Enemy.js`, `Projectile.js`
- `render/Renderer.js` — canvas rendering
- `systems/` — `Combat.js`, `Physics.js`

**`src/js/`** — older/simpler game scripts:
- `core/game.js`, `core/input.js` — basic game loop and input
- `entities/tank.js`, `entities/projectile.js` — tank game entities
- `world/map.js` — map/world logic
- `tank-game/game-enhanced.js`, `tank-game/achievements.js` — enhanced tank battle
- `daily-insights/app.js`, `daily-insights/insights-engine.js` — daily insights feature
- `constants.js`, `main.js` — shared constants and entry

**`src/css/`** — per-game stylesheets (`styles.css` shared, others game-specific)

**`assets/`** — static resources split into `images/` and `audio/`

## Development

No build tools, package managers, or test frameworks. To develop:

```bash
# Serve locally (any static server works)
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in a browser.

## Key Conventions (from AGENTS.md)

- Game loop logic goes in dedicated classes/objects, not inline scripts
- DOM manipulation is centralized, not scattered across modules
- Use `requestAnimationFrame` for all animation; support pause/resume
- Remove event listeners when no longer needed
- CSS variables for theming; BEM-style class naming
- Minimize external dependencies — prefer native browser APIs
