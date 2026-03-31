(function () {
  const core =
    typeof window !== 'undefined' ? window.GridArcadeCore : require('./grid-arcade-core.js');

  function renameId(currentId, nextId) {
    const element = document.getElementById(currentId);
    if (element) {
      element.id = nextId;
    }
    return element;
  }

  function ensureAutotestNode() {
    let node = document.getElementById('game-autotest');
    if (!node) {
      node = document.createElement('p');
      node.id = 'game-autotest';
      node.hidden = true;
      document.body.appendChild(node);
    }
    return node;
  }

  function normalizeShell() {
    renameId('pixel-canvas', 'game-canvas');
    renameId('app-start', 'game-start');
    renameId('app-reset', 'game-reset');
    renameId('action-wait', 'game-wait-action');
    renameId('action-skill', 'game-ability-action');
    renameId('action-restart', 'game-restart');
    renameId('pixel-overlay', 'game-overlay');

    const kicker = document.querySelector('.pixel-overlay__kicker');
    if (kicker) {
      kicker.id = 'game-overlay-kicker';
    }

    renameId('overlay-title', 'game-overlay-title');
    renameId('overlay-body', 'game-overlay-body');
    renameId('stat-stage', 'game-floor');
    renameId('stat-score', 'game-score');
    renameId('stat-life', 'game-hull');
    renameId('stat-target', 'game-progress');
    renameId('stat-skill', 'game-special');
    renameId('stat-best', 'game-best');
    renameId('status-text', 'game-status');
    renameId('objective-text', 'game-objective');
    renameId('metric-turn', 'game-turns');
    renameId('metric-danger', 'game-hazards');
    renameId('metric-best-stage', 'game-best-floor');
    renameId('feed-list', 'game-feed');

    const statLabels = document.querySelectorAll('.pixel-stat__label');
    if (statLabels[3]) {
      statLabels[3].id = 'game-progress-label';
    }
    if (statLabels[4]) {
      statLabels[4].id = 'game-special-label';
    }

    const pad = document.querySelector('.pixel-pad');
    if (pad) {
      pad.classList.add('pg-pad');
      pad.querySelectorAll('[data-action="skill"]').forEach((button) => {
        button.dataset.action = 'ability';
      });
    }

    ensureAutotestNode();
  }

  function bootstrap(config, globalName) {
    if (typeof document === 'undefined') {
      return null;
    }

    normalizeShell();

    const params = new URLSearchParams(window.location.search);
    const fixedSeed = core.parseSeedValue(params.get('seed'));
    const autotest = params.has('autotest');
    const game = core.mount(config, {
      autotest,
      fixedSeed,
    });

    if (!game) {
      return null;
    }

    window[globalName] = game;
    window.render_game_to_text = () => game.renderGameToText();
    window.advanceTime = async () => game.advanceTime();
    return game;
  }

  const api = {
    bootstrap,
    normalizeShell,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined') {
    window.PixelPageRuntime = api;
  }
})();
