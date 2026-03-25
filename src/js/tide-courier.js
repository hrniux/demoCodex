function parseSeedValue(value) {
  if (value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed >>> 0 : null;
}

const QUERY_PARAMS =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const AUTOTEST = Boolean(QUERY_PARAMS && QUERY_PARAMS.has('autotest'));
const FIXED_SEED = parseSeedValue(QUERY_PARAMS ? QUERY_PARAMS.get('seed') : null);

const BOARD_SIZE = 9;
const CARGO_TARGET = 3;
const MAX_HULL = 3;
const STORAGE_SCORE_KEY = 'demoCodexTideCourierBestScore';
const STORAGE_TIDE_KEY = 'demoCodexTideCourierBestTide';
const CURRENT_ROWS = new Map([
  [1, 1],
  [3, -1],
  [5, 1],
  [7, -1],
]);

const MOVE_KEYS = new Map([
  ['ArrowUp', 'up'],
  ['KeyW', 'up'],
  ['ArrowDown', 'down'],
  ['KeyS', 'down'],
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
]);

const WAIT_KEYS = new Set(['Space', 'KeyX', 'Period']);
const REVERSE_KEYS = new Set(['KeyQ']);

const copy = {
  boot: '抢回 3 个漂流货箱，再回到灯塔码头完成投递。',
  live: '注意潮道与驳船的同步推进，别在回合末被拖进会车点。',
  dock: '货箱已经装满，立即返回南侧灯塔码头。',
  reverse: '主潮道已反转，借这股新流向切线脱身。',
  hit: '驳船擦撞，小艇被拖回灯塔码头。',
  tideClear: '本波潮汐投递完成，下一波潮道正在进港。',
  gameOver: '船体耗尽，航线中断。按 Enter 或按钮重新出航。',
};

const HARBOR_TEMPLATES = [
  {
    cargos: [
      { x: 2, y: 1 },
      { x: 6, y: 4 },
      { x: 4, y: 7 },
    ],
    buoys: [{ x: 1, y: 5 }],
    bargesByRow: {
      1: [6],
      3: [1, 7],
      5: [3],
      7: [8],
    },
  },
  {
    cargos: [
      { x: 5, y: 1 },
      { x: 2, y: 3 },
      { x: 7, y: 6 },
    ],
    buoys: [{ x: 4, y: 5 }],
    bargesByRow: {
      1: [1, 7],
      3: [5],
      5: [0, 6],
      7: [3],
    },
  },
  {
    cargos: [
      { x: 4, y: 1 },
      { x: 6, y: 5 },
      { x: 1, y: 7 },
    ],
    buoys: [{ x: 7, y: 3 }],
    bargesByRow: {
      1: [0, 6],
      3: [2],
      5: [4, 8],
      7: [5],
    },
  },
  {
    cargos: [
      { x: 3, y: 1 },
      { x: 7, y: 3 },
      { x: 2, y: 5 },
    ],
    buoys: [{ x: 6, y: 7 }],
    bargesByRow: {
      1: [5],
      3: [0, 4],
      5: [7],
      7: [2, 8],
    },
  },
];

function normalizeX(value) {
  return ((value % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

function inBounds(cell) {
  return (
    cell.x >= 0 &&
    cell.x < BOARD_SIZE &&
    cell.y >= 0 &&
    cell.y < BOARD_SIZE
  );
}

function cellKey(cell) {
  return `${normalizeX(cell.x)}:${cell.y}`;
}

function sameCell(a, b) {
  return normalizeX(a.x) === normalizeX(b.x) && a.y === b.y;
}

function cloneCell(cell) {
  return { x: normalizeX(cell.x), y: cell.y };
}

function cloneActors(items) {
  return items.map((item) => ({ ...item, x: normalizeX(item.x) }));
}

function cloneState(state) {
  return {
    ...state,
    player: cloneCell(state.player),
    barges: cloneActors(state.barges),
    cargos: state.cargos.map((item) => ({ ...item, x: normalizeX(item.x) })),
    buoys: state.buoys.map((item) => ({ ...item, x: normalizeX(item.x) })),
  };
}

function createSeedBase() {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function rotateCellX(cell, rotation) {
  return {
    x: normalizeX(cell.x + rotation),
    y: cell.y,
  };
}

function createHarborLayout(tide, seed) {
  const template = HARBOR_TEMPLATES[(tide - 1) % HARBOR_TEMPLATES.length];
  const rotation = normalizeX((seed >>> 0) + tide * 2);
  const start = { x: 0, y: 8 };
  const dock = { x: 0, y: 8 };
  const cargos = template.cargos.map((cell, index) => ({
    id: index,
    ...rotateCellX(cell, rotation),
  }));
  const buoys = template.buoys.map((cell, index) => ({
    id: index,
    ...rotateCellX(cell, rotation + tide),
  }));

  const barges = [];
  let nextId = 0;
  const occupied = new Set([
    cellKey(start),
    ...cargos.map(cellKey),
    ...buoys.map(cellKey),
  ]);

  for (const [rowText, xs] of Object.entries(template.bargesByRow)) {
    const y = Number(rowText);
    const laneDrift = CURRENT_ROWS.get(y) || 1;
    xs.forEach((x, index) => {
      const startX = normalizeX(x + rotation + tide + index);
      let placed = null;

      for (let offset = 0; offset < BOARD_SIZE; offset += 1) {
        const candidate = {
          x: normalizeX(startX + offset * laneDrift),
          y,
        };
        const key = cellKey(candidate);
        if (!occupied.has(key)) {
          placed = candidate;
          occupied.add(key);
          break;
        }
      }

      barges.push({
        id: nextId,
        ...(placed || { x: startX, y }),
      });
      nextId += 1;
    });
  }

  return {
    tide,
    seed,
    start,
    dock,
    cargos,
    buoys,
    barges,
    initialPhase: ((seed ^ tide) & 1) === 0 ? 1 : -1,
  };
}

function validateLayout(layout) {
  if (layout.cargos.length !== CARGO_TARGET) {
    return false;
  }

  const seen = new Set([cellKey(layout.start)]);
  const items = [...layout.cargos, ...layout.buoys, ...layout.barges];

  for (const item of items) {
    const key = cellKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  return layout.barges.every((barge) => CURRENT_ROWS.has(barge.y));
}

function createRunState(layout, hull = MAX_HULL, score = 0) {
  return {
    mode: 'idle',
    tide: layout.tide,
    hull,
    score,
    player: cloneCell(layout.start),
    barges: cloneActors(layout.barges),
    cargos: layout.cargos.map((item) => ({ ...item, active: true })),
    buoys: layout.buoys.map((item) => ({ ...item, active: true })),
    collected: 0,
    relayCharges: 0,
    currentPhase: layout.initialPhase,
    turns: 0,
    dockUnlocked: false,
  };
}

function getCurrentDirection(state, row) {
  return (CURRENT_ROWS.get(row) || 0) * state.currentPhase;
}

function movePlayer(player, action) {
  switch (action) {
    case 'left':
      return player.x === 0 ? null : { x: player.x - 1, y: player.y };
    case 'right':
      return player.x === BOARD_SIZE - 1 ? null : { x: player.x + 1, y: player.y };
    case 'up':
      return player.y === 0 ? null : { x: player.x, y: player.y - 1 };
    case 'down':
      return player.y === BOARD_SIZE - 1 ? null : { x: player.x, y: player.y + 1 };
    case 'wait':
      return cloneCell(player);
    default:
      return null;
  }
}

function hasCollision(state) {
  return state.barges.some((barge) => sameCell(barge, state.player));
}

function collectPickups(state, outcome) {
  for (const cargo of state.cargos) {
    if (cargo.active && sameCell(cargo, state.player)) {
      cargo.active = false;
      state.collected += 1;
      state.score += 120 + state.tide * 20;
      outcome.collectedCargo = true;
    }
  }

  for (const buoy of state.buoys) {
    if (buoy.active && sameCell(buoy, state.player)) {
      buoy.active = false;
      state.relayCharges += 1;
      state.score += 45;
      outcome.collectedBuoy = true;
    }
  }

  state.dockUnlocked = state.collected >= CARGO_TARGET;
}

function advanceBarges(state) {
  state.barges = state.barges.map((barge) => ({
    ...barge,
    x: normalizeX(barge.x + getCurrentDirection(state, barge.y)),
  }));
}

function driftPlayer(state) {
  const drift = getCurrentDirection(state, state.player.y);
  if (!drift) {
    return 0;
  }

  state.player = {
    x: normalizeX(state.player.x + drift),
    y: state.player.y,
  };
  return drift;
}

function applyHit(layout, state, outcome) {
  state.hull -= 1;
  state.score = Math.max(0, state.score - 50);
  outcome.hit = true;
  if (state.hull <= 0) {
    state.mode = 'gameover';
    outcome.gameOver = true;
    return;
  }
  state.player = cloneCell(layout.start);
}

function applyAction(layout, currentState, action) {
  const state = cloneState(currentState);
  const outcome = {
    state,
    action,
    changed: false,
    invalid: false,
    collectedCargo: false,
    collectedBuoy: false,
    reversed: false,
    drifted: false,
    movedBarges: false,
    extracted: false,
    hit: false,
    gameOver: false,
    message: '',
  };

  if (state.mode !== 'active') {
    outcome.invalid = true;
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.boot;
    return outcome;
  }

  if (action === 'reverse') {
    if (state.relayCharges <= 0) {
      outcome.invalid = true;
      outcome.message = '当前没有可用的换流浮标。';
      return outcome;
    }
    state.relayCharges -= 1;
    state.currentPhase *= -1;
    outcome.reversed = true;
  } else {
    const moved = movePlayer(state.player, action);
    if (!moved) {
      outcome.invalid = true;
      outcome.message = '已经贴近港湾边界，无法继续向那个方向推进。';
      return outcome;
    }
    state.player = moved;
  }

  state.turns += 1;
  outcome.changed = true;

  collectPickups(state, outcome);
  if (hasCollision(state)) {
    applyHit(layout, state, outcome);
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  advanceBarges(state);
  outcome.movedBarges = true;

  if (driftPlayer(state)) {
    outcome.drifted = true;
  }

  collectPickups(state, outcome);
  if (hasCollision(state)) {
    applyHit(layout, state, outcome);
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  if (state.dockUnlocked && sameCell(state.player, layout.dock)) {
    state.score += 180 + state.tide * 50;
    outcome.extracted = true;
    outcome.message = copy.tideClear;
    return outcome;
  }

  if (state.dockUnlocked) {
    outcome.message = copy.dock;
  } else if (outcome.collectedCargo) {
    outcome.message = '货箱已入舱，继续追剩余漂流信号。';
  } else if (outcome.collectedBuoy) {
    outcome.message = '换流浮标入库，可按 Q 反转潮道。';
  } else if (outcome.reversed) {
    outcome.message = copy.reverse;
  } else {
    outcome.message = copy.live;
  }

  return outcome;
}

function runSelfCheck(rounds = 6) {
  const layouts = [];

  for (let tide = 1; tide <= rounds; tide += 1) {
    const layout = createHarborLayout(tide, (4242 + tide * 31) >>> 0);
    if (!validateLayout(layout)) {
      return { ok: false, reason: 'invalid-layout', tide };
    }

    const state = createRunState(layout);
    state.mode = 'active';
    const step = applyAction(layout, state, 'right');
    if (!step.changed || step.invalid || step.state.turns !== 1) {
      return { ok: false, reason: 'first-step-failed', tide };
    }

    layouts.push({
      tide,
      barges: step.state.barges.length,
      cargos: step.state.cargos.length,
      phase: step.state.currentPhase,
    });
  }

  const driftLayout = createHarborLayout(1, 4242);
  const driftState = createRunState(driftLayout);
  driftState.mode = 'active';
  driftState.player = { x: 1, y: 1 };
  driftState.barges = [{ id: 0, x: 6, y: 1 }];
  driftState.cargos = [
    { id: 0, x: 2, y: 1, active: true },
    { id: 1, x: 6, y: 4, active: true },
    { id: 2, x: 4, y: 7, active: true },
  ];
  driftState.buoys = [];
  driftState.currentPhase = 1;

  const drifted = applyAction(driftLayout, driftState, 'wait');
  if (
    drifted.state.player.x !== 2 ||
    drifted.state.barges[0].x !== 7 ||
    drifted.state.collected !== 1
  ) {
    return { ok: false, reason: 'drift-check-failed', details: drifted };
  }

  const reverseLayout = createHarborLayout(1, 4242);
  const reverseState = createRunState(reverseLayout);
  reverseState.mode = 'active';
  reverseState.player = { x: 4, y: 1 };
  reverseState.barges = [{ id: 0, x: 0, y: 1 }];
  reverseState.cargos = [];
  reverseState.buoys = [];
  reverseState.relayCharges = 1;
  reverseState.currentPhase = 1;

  const reversed = applyAction(reverseLayout, reverseState, 'reverse');
  if (
    !reversed.reversed ||
    reversed.state.currentPhase !== -1 ||
    reversed.state.player.x !== 3 ||
    reversed.state.barges[0].x !== 8
  ) {
    return { ok: false, reason: 'reverse-check-failed', details: reversed };
  }

  const extractLayout = createHarborLayout(1, 5001);
  const extractState = createRunState(extractLayout, 2, 220);
  extractState.mode = 'active';
  extractState.player = { x: 1, y: 8 };
  extractState.cargos = [];
  extractState.buoys = [];
  extractState.barges = [{ id: 0, x: 4, y: 1 }];
  extractState.collected = CARGO_TARGET;
  extractState.dockUnlocked = true;

  const extracted = applyAction(extractLayout, extractState, 'left');
  if (!extracted.extracted || extracted.state.score !== 450) {
    return { ok: false, reason: 'extract-check-failed', details: extracted };
  }

  return {
    ok: true,
    layouts,
    drift: {
      player: drifted.state.player,
      cargo: drifted.state.collected,
    },
    reverse: {
      player: reversed.state.player,
      phase: reversed.state.currentPhase,
    },
    extractionScore: extracted.state.score,
  };
}

class TideCourierGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = refs.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.autotest = Boolean(options.autotest);
    this.seedBase = options.seedBase ?? createSeedBase();
    this.storageAvailable = this.canUseStorage();
    this.bestScore = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_SCORE_KEY) || 0)
      : 0;
    this.bestTide = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_TIDE_KEY) || 0)
      : 0;
    this.logs = [];
    this.layout = null;
    this.state = null;
    this.boundKeydown = (event) => this.onKeydown(event);
    this.boundPadClick = (event) => this.onPadClick(event);
    this.bindEvents();
    this.resetVoyage();
  }

  canUseStorage() {
    try {
      const key = '__tide_courier__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    this.refs.start.addEventListener('click', () => this.startVoyage());
    this.refs.reset.addEventListener('click', () => this.resetVoyage());
    this.refs.wait.addEventListener('click', () => this.handleAction('wait'));
    this.refs.relayAction.addEventListener('click', () => this.handleAction('reverse'));
    this.refs.restart.addEventListener('click', () => this.resetVoyage());
    this.refs.pad.addEventListener('click', this.boundPadClick);
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    this.refs.pad.removeEventListener('click', this.boundPadClick);
  }

  seedForTide(tide) {
    return (this.seedBase + tide * 2654435761) >>> 0;
  }

  pushLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 6);
    this.refs.feed.innerHTML = this.logs.map((item) => `<li>${item}</li>`).join('');
  }

  setStatus(message) {
    this.refs.status.textContent = message;
  }

  setObjective() {
    if (this.state.mode === 'gameover') {
      this.refs.objective.textContent = '船体已耗尽，按 Enter 或重新出航开始新航线。';
      return;
    }

    if (this.state.dockUnlocked) {
      this.refs.objective.textContent = '灯塔码头已经亮起，立刻回到左下角完成投递。';
      return;
    }

    if (this.state.relayCharges > 0) {
      this.refs.objective.textContent = `已储备 ${this.state.relayCharges} 次换流，可按 Q 整体反转潮道。`;
      return;
    }

    const remainingBuoys = this.state.buoys.filter((item) => item.active).length;
    if (remainingBuoys > 0) {
      this.refs.objective.textContent = '优先摸到橙色换流浮标，它们能整体反转四条潮道。';
      return;
    }

    this.refs.objective.textContent = '继续抢收剩余漂流货箱，装满后才能回码头交付。';
  }

  setOverlay(title, body) {
    this.refs.overlayTitle.textContent = title;
    this.refs.overlayBody.textContent = body;
    this.refs.overlay.classList.toggle('is-visible', Boolean(title));
  }

  clearOverlay() {
    this.refs.overlay.classList.remove('is-visible');
  }

  saveRecord(key, value) {
    if (!this.storageAvailable) {
      return;
    }
    localStorage.setItem(key, String(value));
  }

  commitBestScore() {
    if (this.state.score > this.bestScore) {
      this.bestScore = this.state.score;
      this.saveRecord(STORAGE_SCORE_KEY, this.bestScore);
    }
  }

  commitBestTide(tide) {
    if (tide > this.bestTide) {
      this.bestTide = tide;
      this.saveRecord(STORAGE_TIDE_KEY, this.bestTide);
    }
  }

  loadTide(tide, options = {}) {
    const nextLayout = createHarborLayout(tide, this.seedForTide(tide));
    const nextState = createRunState(
      nextLayout,
      options.hull ?? MAX_HULL,
      options.score ?? 0,
    );
    nextState.mode = options.mode ?? 'idle';
    this.layout = nextLayout;
    this.state = nextState;
    this.setStatus(this.state.mode === 'active' ? copy.live : copy.boot);
    this.setObjective();
    this.updateHud();
    this.render();
  }

  resetVoyage() {
    this.logs = [];
    this.loadTide(1, { hull: MAX_HULL, score: 0, mode: 'idle' });
    this.pushLog('灯塔码头重新开放。');
    this.setStatus(copy.boot);
    this.setObjective();
    this.setOverlay(
      '按开始出航或 Enter 起航',
      '方向键移动，空格等待，Q 反转全部潮道。回合末小艇会被潮流拖拽一格。',
    );
    this.render();
  }

  startVoyage() {
    if (this.state.mode === 'active') {
      return;
    }

    if (this.state.mode === 'gameover') {
      this.resetVoyage();
    }

    this.state.mode = 'active';
    this.setStatus(copy.live);
    this.setObjective();
    this.clearOverlay();
    this.pushLog(`第 ${this.state.tide} 波潮汐进港。`);
    this.updateHud();
    this.render();
  }

  onKeydown(event) {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      this.startVoyage();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.resetVoyage();
      return;
    }

    if (WAIT_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('wait');
      return;
    }

    if (REVERSE_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('reverse');
      return;
    }

    const mapped = MOVE_KEYS.get(event.code);
    if (mapped) {
      event.preventDefault();
      this.handleAction(mapped);
    }
  }

  onPadClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }
    this.handleAction(button.dataset.action);
  }

  handleAction(action) {
    if (this.state.mode !== 'active') {
      return;
    }

    const labels = {
      left: '向西切线。',
      right: '向东切线。',
      up: '向北抄近道。',
      down: '向南靠泊。',
      wait: '贴着航标等待一拍。',
      reverse: '换流信号已发出。',
    };

    const outcome = applyAction(this.layout, this.state, action);
    this.state = outcome.state;

    if (outcome.invalid) {
      this.setStatus(outcome.message);
      this.setObjective();
      this.render();
      return;
    }

    this.pushLog(labels[action]);

    if (outcome.collectedCargo) {
      this.pushLog(`已装入第 ${this.state.collected} 个货箱。`);
    }

    if (outcome.collectedBuoy) {
      this.pushLog('换流浮标入舱。');
    }

    if (outcome.hit) {
      this.pushLog(copy.hit);
    }

    this.setStatus(outcome.message);
    this.setObjective();
    this.commitBestScore();

    if (outcome.extracted) {
      const completedTide = this.state.tide;
      const score = this.state.score;
      const hull = this.state.hull;
      const nextTide = completedTide + 1;
      this.commitBestTide(completedTide);
      this.pushLog(`第 ${completedTide} 波潮汐投递完成。`);
      this.loadTide(nextTide, { hull, score, mode: 'active' });
      this.setStatus(copy.tideClear);
      this.setObjective();
      this.pushLog(`第 ${nextTide} 波潮汐进港。`);
    } else if (this.state.mode === 'gameover') {
      this.setOverlay('航线中断', '船体已经耗尽。按 Enter 或重新出航按钮开始新一轮配送。');
    }

    this.updateHud();
    this.render();
  }

  getFlowSummary() {
    return [1, 3, 5, 7]
      .map((row) => `${row + 1}${getCurrentDirection(this.state, row) > 0 ? '→' : '←'}`)
      .join(' ');
  }

  updateHud() {
    this.refs.level.textContent = String(this.state.tide);
    this.refs.score.textContent = String(this.state.score);
    this.refs.hull.textContent = String(this.state.hull);
    this.refs.cargo.textContent = `${this.state.collected} / ${CARGO_TARGET}`;
    this.refs.relay.textContent = `${this.state.relayCharges}`;
    this.refs.best.textContent = String(this.bestScore);
    this.refs.turns.textContent = String(this.state.turns);
    this.refs.flow.textContent = this.getFlowSummary();
    this.refs.bestLevel.textContent = String(this.bestTide);
  }

  render() {
    const { ctx } = this;
    const cellSize = this.width / BOARD_SIZE;

    ctx.clearRect(0, 0, this.width, this.height);
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, '#0c2d41');
    bg.addColorStop(1, '#071521');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      const rowY = y * cellSize;
      const isCurrentRow = CURRENT_ROWS.has(y);
      const rowGradient = ctx.createLinearGradient(0, rowY, this.width, rowY + cellSize);
      if (isCurrentRow) {
        rowGradient.addColorStop(0, 'rgba(15, 83, 110, 0.94)');
        rowGradient.addColorStop(1, 'rgba(10, 58, 84, 0.92)');
      } else {
        rowGradient.addColorStop(0, 'rgba(127, 90, 53, 0.28)');
        rowGradient.addColorStop(1, 'rgba(62, 42, 23, 0.44)');
      }
      ctx.fillStyle = rowGradient;
      ctx.fillRect(0, rowY, this.width, cellSize);

      if (isCurrentRow) {
        ctx.fillStyle = 'rgba(223, 252, 247, 0.14)';
        ctx.font = `${Math.round(cellSize * 0.34)}px "Avenir Next", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const arrow = getCurrentDirection(this.state, y) > 0 ? '→' : '←';
        for (let x = 0; x < BOARD_SIZE; x += 1) {
          ctx.fillText(arrow, x * cellSize + cellSize / 2, rowY + cellSize / 2);
        }
      }
    }

    ctx.strokeStyle = 'rgba(137, 227, 246, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i += 1) {
      const offset = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(this.width, offset);
      ctx.stroke();
    }

    this.drawDock(ctx, cellSize);
    this.drawCargos(ctx, cellSize);
    this.drawBuoys(ctx, cellSize);
    this.drawBarges(ctx, cellSize);
    this.drawPlayer(ctx, cellSize);

    if (this.autotest) {
      this.refs.autotest.textContent = this.renderGameToText();
    }
  }

  drawDock(ctx, cellSize) {
    const dockX = this.layout.dock.x * cellSize;
    const dockY = this.layout.dock.y * cellSize;
    ctx.save();
    ctx.fillStyle = this.state.dockUnlocked ? 'rgba(251, 146, 60, 0.38)' : 'rgba(244, 216, 174, 0.24)';
    ctx.fillRect(dockX + 6, dockY + 6, cellSize - 12, cellSize - 12);
    ctx.strokeStyle = this.state.dockUnlocked ? '#fb923c' : 'rgba(244, 216, 174, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(dockX + 10, dockY + 10, cellSize - 20, cellSize - 20);
    ctx.fillStyle = '#f8fafc';
    ctx.font = `${Math.round(cellSize * 0.24)}px "Avenir Next", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('码头', dockX + cellSize / 2, dockY + cellSize / 2);
    ctx.restore();
  }

  drawCargos(ctx, cellSize) {
    this.state.cargos.forEach((cargo) => {
      if (!cargo.active) {
        return;
      }
      const x = cargo.x * cellSize;
      const y = cargo.y * cellSize;
      ctx.save();
      ctx.fillStyle = '#f4d8ae';
      ctx.fillRect(x + 22, y + 24, cellSize - 44, cellSize - 38);
      ctx.fillStyle = '#b7791f';
      ctx.fillRect(x + 28, y + 32, cellSize - 56, 10);
      ctx.strokeStyle = '#7c4a14';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 22, y + 24, cellSize - 44, cellSize - 38);
      ctx.restore();
    });
  }

  drawBuoys(ctx, cellSize) {
    this.state.buoys.forEach((buoy) => {
      if (!buoy.active) {
        return;
      }
      const centerX = buoy.x * cellSize + cellSize / 2;
      const centerY = buoy.y * cellSize + cellSize / 2;
      ctx.save();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(centerX, centerY + 4, cellSize * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(centerX - 5, centerY - 18, 10, 24);
      ctx.beginPath();
      ctx.moveTo(centerX + 5, centerY - 18);
      ctx.lineTo(centerX + 22, centerY - 10);
      ctx.lineTo(centerX + 5, centerY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  drawBarges(ctx, cellSize) {
    this.state.barges.forEach((barge) => {
      const x = barge.x * cellSize;
      const y = barge.y * cellSize;
      ctx.save();
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x + 14, y + 28, cellSize - 28, cellSize - 42);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + 26, y + 18, cellSize - 52, 18);
      ctx.strokeStyle = '#fecdd3';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 14, y + 28, cellSize - 28, cellSize - 42);
      ctx.restore();
    });
  }

  drawPlayer(ctx, cellSize) {
    const centerX = this.state.player.x * cellSize + cellSize / 2;
    const centerY = this.state.player.y * cellSize + cellSize / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(137, 227, 246, 0.45)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#dffcf7';
    ctx.beginPath();
    ctx.moveTo(centerX + 22, centerY);
    ctx.lineTo(centerX - 20, centerY - 18);
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(centerX - 20, centerY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(centerX - 2, centerY - 22, 6, 44);
    ctx.restore();
  }

  renderGameToText() {
    return JSON.stringify({
      mode: this.state.mode,
      tide: this.state.tide,
      score: this.state.score,
      hull: this.state.hull,
      collected: this.state.collected,
      relayCharges: this.state.relayCharges,
      dockUnlocked: this.state.dockUnlocked,
      turns: this.state.turns,
      currentPhase: this.state.currentPhase,
      coordinateSystem: 'origin top-left; x grows right; y grows downward; x wraps on tide rows',
      player: cloneCell(this.state.player),
      barges: cloneActors(this.state.barges).sort((a, b) => a.y - b.y || a.x - b.x),
      cargos: this.state.cargos
        .filter((item) => item.active)
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      buoys: this.state.buoys
        .filter((item) => item.active)
        .map((item) => cloneCell(item))
        .sort((a, b) => a.y - b.y || a.x - b.x),
      laneDirections: Array.from(CURRENT_ROWS.keys()).map((y) => ({
        y,
        dir: getCurrentDirection(this.state, y),
      })),
    });
  }

  advanceTime() {
    this.render();
    return this.renderGameToText();
  }
}

const TideCourierInternals = {
  BOARD_SIZE,
  CARGO_TARGET,
  CURRENT_ROWS,
  createHarborLayout,
  validateLayout,
  createRunState,
  applyAction,
  runSelfCheck,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TideCourierInternals;
}

function initTideCourier() {
  if (typeof document === 'undefined') {
    return null;
  }

  const refs = {
    canvas: document.getElementById('tide-canvas'),
    start: document.getElementById('tide-start'),
    reset: document.getElementById('tide-reset'),
    wait: document.getElementById('tide-wait'),
    relayAction: document.getElementById('tide-relay-action'),
    restart: document.getElementById('tide-restart'),
    pad: document.querySelector('.tide-pad'),
    overlay: document.getElementById('tide-overlay'),
    overlayTitle: document.getElementById('tide-overlay-title'),
    overlayBody: document.getElementById('tide-overlay-body'),
    status: document.getElementById('tide-status'),
    objective: document.getElementById('tide-objective'),
    level: document.getElementById('tide-level'),
    score: document.getElementById('tide-score'),
    hull: document.getElementById('tide-hull'),
    cargo: document.getElementById('tide-cargo'),
    relay: document.getElementById('tide-relay'),
    best: document.getElementById('tide-best'),
    turns: document.getElementById('tide-turns'),
    flow: document.getElementById('tide-flow'),
    bestLevel: document.getElementById('tide-best-level'),
    feed: document.getElementById('tide-feed'),
    autotest: document.getElementById('tide-autotest'),
  };

  if (!refs.canvas) {
    return null;
  }

  const game = new TideCourierGame(refs, {
    autotest: AUTOTEST,
    seedBase: FIXED_SEED ?? undefined,
  });

  if (AUTOTEST) {
    const result = runSelfCheck(5);
    window.tideCourierSelfCheck = result;
    refs.autotest.textContent = JSON.stringify(result);
  }

  window.render_game_to_text = () => game.renderGameToText();
  window.advanceTime = async () => game.advanceTime();
  window.tideCourierGame = game;
  return game;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTideCourier, { once: true });
  } else {
    initTideCourier();
  }
}
