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

const RING_COUNT = 5;
const SECTOR_COUNT = 12;
const POD_TARGET = 3;
const MAX_HULL = 3;
const STORAGE_SCORE_KEY = 'demoCodexOrbitRescueBestScore';
const STORAGE_ORBIT_KEY = 'demoCodexOrbitRescueBestOrbit';

const MOVE_KEYS = new Map([
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
  ['ArrowUp', 'in'],
  ['KeyW', 'in'],
  ['ArrowDown', 'out'],
  ['KeyS', 'out'],
]);

const WAIT_KEYS = new Set(['Space', 'KeyX', 'Period']);
const PULSE_KEYS = new Set(['KeyQ']);

const copy = {
  boot: '先回收 3 个救生舱，再返回外环对接点撤离。',
  live: '环带持续转动中，注意碎片每回合都会换位。',
  dock: '全部救生舱已就位，立即返航。',
  freeze: '停滞脉冲已展开，环带将暂时静止。',
  hit: '船体擦撞，已弹回外环对接点。',
  orbitClear: '本条轨道已净空，准备切入下一层。',
  gameOver: '船体耗尽，任务失败。按 Enter 或按钮重新部署。',
};

const ORBIT_TEMPLATES = [
  {
    pods: [
      { ring: 4, sector: 3 },
      { ring: 2, sector: 8 },
      { ring: 1, sector: 5 },
    ],
    pulseNodes: [
      { ring: 3, sector: 10 },
      { ring: 1, sector: 1 },
    ],
    debrisByRing: [
      [2, 7],
      [0, 4, 9],
      [3, 6],
      [1, 5, 11],
      [2, 7, 9],
    ],
  },
  {
    pods: [
      { ring: 3, sector: 4 },
      { ring: 2, sector: 10 },
      { ring: 0, sector: 6 },
    ],
    pulseNodes: [
      { ring: 4, sector: 8 },
      { ring: 2, sector: 1 },
    ],
    debrisByRing: [
      [1, 8],
      [2, 7],
      [0, 5, 9],
      [3, 6, 11],
      [4, 10],
    ],
  },
  {
    pods: [
      { ring: 4, sector: 5 },
      { ring: 3, sector: 11 },
      { ring: 1, sector: 2 },
    ],
    pulseNodes: [
      { ring: 2, sector: 7 },
      { ring: 0, sector: 9 },
    ],
    debrisByRing: [
      [3, 9],
      [1, 5, 10],
      [2, 8],
      [0, 4, 7],
      [3, 6, 9],
    ],
  },
  {
    pods: [
      { ring: 4, sector: 9 },
      { ring: 2, sector: 4 },
      { ring: 0, sector: 11 },
    ],
    pulseNodes: [
      { ring: 3, sector: 2 },
      { ring: 1, sector: 7 },
    ],
    debrisByRing: [
      [0, 5],
      [3, 8],
      [1, 6, 10],
      [2, 9],
      [4, 7, 11],
    ],
  },
];

function normalizeSector(value) {
  return ((value % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT;
}

function cellKey(cell) {
  return `${cell.ring}:${normalizeSector(cell.sector)}`;
}

function sameCell(a, b) {
  return a.ring === b.ring && normalizeSector(a.sector) === normalizeSector(b.sector);
}

function cloneCell(cell) {
  return { ring: cell.ring, sector: normalizeSector(cell.sector) };
}

function cloneActors(items) {
  return items.map((item) => ({ ...item, sector: normalizeSector(item.sector) }));
}

function cloneState(state) {
  return {
    ...state,
    player: cloneCell(state.player),
    debris: cloneActors(state.debris),
    pods: cloneActors(state.pods),
    pulseNodes: cloneActors(state.pulseNodes),
  };
}

function createSeedBase() {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function rotateCell(cell, rotation) {
  return {
    ring: cell.ring,
    sector: normalizeSector(cell.sector + rotation),
  };
}

function addActor(items, actor, occupied, nextId) {
  const key = cellKey(actor);
  if (occupied.has(key)) {
    return nextId;
  }
  occupied.add(key);
  items.push({ id: nextId, ring: actor.ring, sector: normalizeSector(actor.sector) });
  return nextId + 1;
}

function createOrbitLayout(level, seed) {
  const template = ORBIT_TEMPLATES[(level - 1) % ORBIT_TEMPLATES.length];
  const rotation = normalizeSector((seed >>> 0) + level * 3);
  const start = { ring: RING_COUNT - 1, sector: 0 };
  const dock = { ring: RING_COUNT - 1, sector: 0 };
  const directions = [1, -1, 1, -1, 1];
  const pods = template.pods.map((cell, index) => ({
    id: index,
    ...rotateCell(cell, rotation),
  }));
  const pulseNodes = template.pulseNodes.map((cell, index) => ({
    id: index,
    ...rotateCell(cell, rotation + level),
  }));

  const occupied = new Set([cellKey(start), ...pods.map(cellKey), ...pulseNodes.map(cellKey)]);
  const debris = [];
  let nextId = 0;

  template.debrisByRing.forEach((sectors, ring) => {
    sectors.forEach((sector, sectorIndex) => {
      const actor = {
        ring,
        sector: normalizeSector(sector + rotation + ring * level + sectorIndex),
      };
      nextId = addActor(debris, actor, occupied, nextId);
    });
  });

  const extraDensity = Math.min(3, Math.max(0, level - 1));
  for (let extra = 0; extra < extraDensity; extra += 1) {
    const ring = (level + extra) % RING_COUNT;
    const startSector = normalizeSector(rotation + level * 2 + ring * 3 + extra * 5);
    for (let offset = 0; offset < SECTOR_COUNT; offset += 1) {
      const actor = {
        ring,
        sector: normalizeSector(startSector + offset),
      };
      const key = cellKey(actor);
      if (!occupied.has(key)) {
        nextId = addActor(debris, actor, occupied, nextId);
        break;
      }
    }
  }

  return {
    level,
    seed,
    start,
    dock,
    directions,
    pods,
    pulseNodes,
    debris,
  };
}

function validateLayout(layout) {
  const seen = new Set([cellKey(layout.start)]);
  const items = [...layout.pods, ...layout.pulseNodes, ...layout.debris];

  for (const item of items) {
    const key = cellKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  if (layout.pods.length !== POD_TARGET) {
    return false;
  }

  return layout.debris.every((item) => item.ring >= 0 && item.ring < RING_COUNT);
}

function createMissionState(layout, hull = MAX_HULL, score = 0) {
  return {
    mode: 'idle',
    orbit: layout.level,
    hull,
    score,
    player: cloneCell(layout.start),
    debris: cloneActors(layout.debris),
    pods: layout.pods.map((item) => ({ ...item, active: true })),
    pulseNodes: layout.pulseNodes.map((item) => ({ ...item, active: true })),
    collected: 0,
    pulseCharges: 0,
    freezeTurns: 0,
    turns: 0,
    dockUnlocked: false,
  };
}

function movePlayer(player, action) {
  switch (action) {
    case 'left':
      return { ring: player.ring, sector: normalizeSector(player.sector - 1) };
    case 'right':
      return { ring: player.ring, sector: normalizeSector(player.sector + 1) };
    case 'in':
      return player.ring === 0 ? null : { ring: player.ring - 1, sector: player.sector };
    case 'out':
      return player.ring === RING_COUNT - 1 ? null : { ring: player.ring + 1, sector: player.sector };
    case 'wait':
      return cloneCell(player);
    default:
      return null;
  }
}

function hasCollision(state) {
  return state.debris.some((item) => sameCell(item, state.player));
}

function collectPickups(state, outcome) {
  for (const pod of state.pods) {
    if (pod.active && sameCell(pod, state.player)) {
      pod.active = false;
      state.collected += 1;
      state.score += 120 + state.orbit * 20;
      outcome.collectedPod = true;
    }
  }

  for (const node of state.pulseNodes) {
    if (node.active && sameCell(node, state.player)) {
      node.active = false;
      state.pulseCharges += 1;
      state.score += 35;
      outcome.collectedPulse = true;
    }
  }

  state.dockUnlocked = state.collected >= POD_TARGET;
}

function applyHit(layout, state, outcome) {
  state.hull -= 1;
  state.freezeTurns = 0;
  state.score = Math.max(0, state.score - 45);
  outcome.hit = true;
  if (state.hull <= 0) {
    state.mode = 'gameover';
    outcome.gameOver = true;
    return;
  }
  state.player = cloneCell(layout.start);
}

function rotateDebris(layout, state) {
  state.debris = state.debris.map((item) => ({
    ...item,
    sector: normalizeSector(item.sector + layout.directions[item.ring]),
  }));
}

function applyAction(layout, currentState, action) {
  const state = cloneState(currentState);
  const outcome = {
    state,
    action,
    changed: false,
    invalid: false,
    collectedPod: false,
    collectedPulse: false,
    usedPulse: false,
    movedDebris: false,
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

  if (action === 'pulse') {
    if (state.pulseCharges <= 0) {
      outcome.invalid = true;
      outcome.message = '当前没有可用脉冲。';
      return outcome;
    }
    state.pulseCharges -= 1;
    state.freezeTurns = Math.max(state.freezeTurns, 2);
    outcome.usedPulse = true;
  } else {
    const moved = movePlayer(state.player, action);
    if (!moved) {
      outcome.invalid = true;
      outcome.message = '已经抵达环带边界，无法再切换。';
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

  if (state.freezeTurns > 0) {
    state.freezeTurns -= 1;
    outcome.message = copy.freeze;
  } else {
    rotateDebris(layout, state);
    outcome.movedDebris = true;
  }

  if (hasCollision(state)) {
    applyHit(layout, state, outcome);
    outcome.message = state.mode === 'gameover' ? copy.gameOver : copy.hit;
    return outcome;
  }

  if (state.dockUnlocked && sameCell(state.player, layout.dock)) {
    state.score += 180 + state.orbit * 40;
    outcome.extracted = true;
    outcome.message = copy.orbitClear;
    return outcome;
  }

  if (state.dockUnlocked) {
    outcome.message = copy.dock;
  } else if (outcome.collectedPod) {
    outcome.message = '已回收救生舱，继续搜索剩余信号。';
  } else if (outcome.collectedPulse) {
    outcome.message = '停滞节点入库，可按 Q 冻结环带。';
  } else {
    outcome.message = copy.live;
  }

  return outcome;
}

function runSelfCheck(rounds = 6) {
  const layouts = [];

  for (let orbit = 1; orbit <= rounds; orbit += 1) {
    const layout = createOrbitLayout(orbit, (4242 + orbit * 17) >>> 0);
    if (!validateLayout(layout)) {
      return { ok: false, reason: 'invalid-layout', orbit };
    }
    const state = createMissionState(layout);
    state.mode = 'active';
    if (hasCollision(state)) {
      return { ok: false, reason: 'spawn-collision', orbit };
    }
    const step = applyAction(layout, state, 'right');
    if (!step.changed || step.state.turns !== 1 || step.invalid) {
      return { ok: false, reason: 'right-step-failed', orbit };
    }
    layouts.push({
      orbit,
      debris: step.state.debris.length,
      pods: step.state.pods.length,
    });
  }

  const pulseLayout = createOrbitLayout(1, 4242);
  const pulseState = createMissionState(pulseLayout);
  pulseState.mode = 'active';
  pulseState.player = { ring: 4, sector: 0 };
  pulseState.debris = [{ id: 0, ring: 4, sector: 2 }];
  pulseState.pods = [];
  pulseState.pulseNodes = [];
  pulseState.pulseCharges = 1;

  const afterPulse = applyAction(pulseLayout, pulseState, 'pulse');
  if (
    !afterPulse.usedPulse ||
    afterPulse.state.freezeTurns !== 1 ||
    afterPulse.state.debris[0].sector !== 2
  ) {
    return { ok: false, reason: 'pulse-freeze-failed', details: afterPulse };
  }

  const afterMove = applyAction(pulseLayout, afterPulse.state, 'right');
  if (afterMove.state.freezeTurns !== 0 || afterMove.state.debris[0].sector !== 2) {
    return { ok: false, reason: 'pulse-carryover-failed', details: afterMove };
  }

  const afterWait = applyAction(pulseLayout, afterMove.state, 'wait');
  if (afterWait.state.debris[0].sector !== 3) {
    return { ok: false, reason: 'debris-rotate-failed', details: afterWait };
  }

  const extractLayout = createOrbitLayout(1, 5001);
  const extractState = createMissionState(extractLayout, 2, 200);
  extractState.mode = 'active';
  extractState.player = { ring: 4, sector: 11 };
  extractState.debris = [{ id: 0, ring: 2, sector: 6 }];
  extractState.pods = [];
  extractState.pulseNodes = [];
  extractState.collected = POD_TARGET;
  extractState.dockUnlocked = true;

  const extracted = applyAction(extractLayout, extractState, 'right');
  if (!extracted.extracted || extracted.state.score !== 420) {
    return { ok: false, reason: 'extract-failed', details: extracted };
  }

  return {
    ok: true,
    layouts,
    pulse: {
      afterPulseFreeze: afterPulse.state.freezeTurns,
      afterWaitDebrisSector: afterWait.state.debris[0].sector,
    },
    extractionScore: extracted.state.score,
  };
}

class OrbitRescueGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.canvas = refs.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.autotest = Boolean(options.autotest);
    this.seedBase = options.seedBase ?? createSeedBase();
    this.storageAvailable = this.canUseStorage();
    this.bestScore = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_SCORE_KEY) || 0)
      : 0;
    this.bestOrbit = this.storageAvailable
      ? Number(localStorage.getItem(STORAGE_ORBIT_KEY) || 0)
      : 0;
    this.logs = [];
    this.layout = null;
    this.state = null;
    this.boundKeydown = (event) => this.onKeydown(event);
    this.boundPadClick = (event) => this.onPadClick(event);
    this.bindEvents();
    this.resetMission();
  }

  canUseStorage() {
    try {
      const key = '__orbit_rescue__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    this.refs.start.addEventListener('click', () => this.startMission());
    this.refs.reset.addEventListener('click', () => this.resetMission());
    this.refs.wait.addEventListener('click', () => this.handleAction('wait'));
    this.refs.pulseAction.addEventListener('click', () => this.handleAction('pulse'));
    this.refs.restart.addEventListener('click', () => this.resetMission());
    this.refs.pad.addEventListener('click', this.boundPadClick);
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    this.refs.pad.removeEventListener('click', this.boundPadClick);
  }

  seedForOrbit(orbit) {
    return (this.seedBase + orbit * 2654435761) >>> 0;
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
      this.refs.objective.textContent = '船体已耗尽，按 Enter 或重新部署开始新任务。';
      return;
    }

    if (this.state.dockUnlocked) {
      this.refs.objective.textContent = '对接灯塔已点亮，尽快返回外环 12 点位撤离。';
      return;
    }

    if (this.state.pulseCharges > 0) {
      this.refs.objective.textContent = `已储备 ${this.state.pulseCharges} 次停滞脉冲，可按 Q 冻结环带两拍。`;
      return;
    }

    const remainingNodes = this.state.pulseNodes.filter((item) => item.active).length;
    if (remainingNodes > 0) {
      this.refs.objective.textContent = '优先留意金色停滞节点，它们能把全部环带冻结两拍。';
      return;
    }

    this.refs.objective.textContent = '继续回收剩余救生舱，外环对接灯塔将在满载后开启。';
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

  commitBestOrbit(orbit) {
    if (orbit > this.bestOrbit) {
      this.bestOrbit = orbit;
      this.saveRecord(STORAGE_ORBIT_KEY, this.bestOrbit);
    }
  }

  loadOrbit(orbit, options = {}) {
    const nextLayout = createOrbitLayout(orbit, this.seedForOrbit(orbit));
    const nextState = createMissionState(
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

  resetMission() {
    this.logs = [];
    this.loadOrbit(1, { hull: MAX_HULL, score: 0, mode: 'idle' });
    this.pushLog('外环对接点上线。');
    this.setStatus(copy.boot);
    this.setObjective();
    this.setOverlay('按开始回收或 Enter 出发', '方向键切换轨道，空格等待，Q 释放停滞脉冲。');
    this.render();
  }

  startMission() {
    if (this.state.mode === 'active') {
      return;
    }

    if (this.state.mode === 'gameover') {
      this.resetMission();
    }

    this.state.mode = 'active';
    this.setStatus(copy.live);
    this.setObjective();
    this.clearOverlay();
    this.pushLog(`切入第 ${this.state.orbit} 号轨道。`);
    this.updateHud();
    this.render();
  }

  onKeydown(event) {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      this.startMission();
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      this.resetMission();
      return;
    }

    if (WAIT_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('wait');
      return;
    }

    if (PULSE_KEYS.has(event.code)) {
      event.preventDefault();
      this.handleAction('pulse');
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
      left: '逆时针换位。',
      right: '顺时针换位。',
      in: '切向内环。',
      out: '切向外环。',
      wait: '保持轨道姿态。',
      pulse: '释放停滞脉冲。',
    };

    const outcome = applyAction(this.layout, this.state, action);
    this.state = outcome.state;

    if (outcome.invalid) {
      this.setStatus(outcome.message);
      this.setObjective();
      this.render();
      return;
    }

    if (outcome.usedPulse) {
      this.pushLog(labels.pulse);
    } else if (action !== 'wait') {
      this.pushLog(labels[action]);
    }

    if (outcome.collectedPod) {
      this.pushLog(`已回收第 ${this.state.collected} 个救生舱。`);
    }

    if (outcome.collectedPulse) {
      this.pushLog('停滞节点入库。');
    }

    if (outcome.hit) {
      this.pushLog(copy.hit);
    }

    this.setStatus(outcome.message);
    this.setObjective();
    this.commitBestScore();

    if (outcome.extracted) {
      this.commitBestOrbit(this.state.orbit);
      this.pushLog(`第 ${this.state.orbit} 号轨道已净空。`);
      const score = this.state.score;
      const hull = this.state.hull;
      const nextOrbit = this.state.orbit + 1;
      this.loadOrbit(nextOrbit, { hull, score, mode: 'active' });
      this.setStatus(copy.orbitClear);
      this.setObjective();
      this.pushLog(`切入第 ${nextOrbit} 号轨道。`);
    }

    if (this.state.mode === 'gameover') {
      this.setOverlay('船体耗尽', '按 Enter、重置任务，或重新部署开始一条新回收线。');
    }

    this.updateHud();
    this.render();
  }

  updateHud() {
    this.refs.level.textContent = String(this.state.orbit);
    this.refs.score.textContent = String(this.state.score);
    this.refs.hull.textContent = String(this.state.hull);
    this.refs.pods.textContent = `${this.state.collected} / ${POD_TARGET}`;
    this.refs.pulse.textContent = String(this.state.pulseCharges);
    this.refs.best.textContent = String(this.bestScore);
    this.refs.turns.textContent = String(this.state.turns);
    this.refs.bestLevel.textContent = String(this.bestOrbit);
    this.refs.drift.textContent = this.layout.directions
      .map((direction, index) => `${index + 1}${direction > 0 ? '↻' : '↺'}`)
      .join(' ');
  }

  radiusForRing(ring) {
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const minRadius = maxRadius * 0.28;
    const gap = (maxRadius - minRadius) / (RING_COUNT - 1);
    return minRadius + ring * gap;
  }

  angleForSector(sector) {
    return -Math.PI / 2 + normalizeSector(sector) * ((Math.PI * 2) / SECTOR_COUNT);
  }

  pointForCell(cell, offset = 0) {
    const angle = this.angleForSector(cell.sector);
    const radius = this.radiusForRing(cell.ring) + offset;
    return {
      x: this.width / 2 + Math.cos(angle) * radius,
      y: this.height / 2 + Math.sin(angle) * radius,
      angle,
      radius,
    };
  }

  drawBackdrop() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.08,
      this.width / 2,
      this.height / 2,
      this.width * 0.48,
    );
    gradient.addColorStop(0, 'rgba(103, 232, 249, 0.12)');
    gradient.addColorStop(0.55, 'rgba(11, 21, 38, 0.18)');
    gradient.addColorStop(1, 'rgba(2, 7, 18, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let ring = 0; ring < RING_COUNT; ring += 1) {
      const radius = this.radiusForRing(ring);
      ctx.save();
      ctx.strokeStyle =
        ring === this.state.player.ring ? 'rgba(103, 232, 249, 0.32)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = ring === this.state.player.ring ? 3 : 2;
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let sector = 0; sector < SECTOR_COUNT; sector += 1) {
      const inner = this.pointForCell({ ring: 0, sector }, -28);
      const outer = this.pointForCell({ ring: RING_COUNT - 1, sector }, 28);
      ctx.beginPath();
      ctx.moveTo(inner.x, inner.y);
      ctx.lineTo(outer.x, outer.y);
      ctx.stroke();
    }
    ctx.restore();

    const dockStart = this.angleForSector(this.layout.dock.sector) - Math.PI / SECTOR_COUNT;
    const dockEnd = dockStart + (Math.PI * 2) / SECTOR_COUNT;
    ctx.save();
    ctx.strokeStyle = this.state.dockUnlocked ? 'rgba(251, 191, 36, 0.9)' : 'rgba(103, 232, 249, 0.38)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, this.radiusForRing(RING_COUNT - 1), dockStart, dockEnd);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, this.radiusForRing(0) - 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPods() {
    const ctx = this.ctx;
    for (const pod of this.state.pods) {
      if (!pod.active) {
        continue;
      }
      const point = this.pointForCell(pod);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(point.angle + Math.PI / 2);
      ctx.fillStyle = '#67e8f9';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-10, -14, 20, 28, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#05111c';
      ctx.fillRect(-4, -8, 8, 16);
      ctx.restore();
    }
  }

  drawPulseNodes() {
    const ctx = this.ctx;
    for (const node of this.state.pulseNodes) {
      if (!node.active) {
        continue;
      }
      const point = this.pointForCell(node);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(point.angle);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#101723';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillRect(-10, -3, 20, 6);
      ctx.restore();
    }
  }

  drawDebris() {
    const ctx = this.ctx;
    for (const item of this.state.debris) {
      const point = this.pointForCell(item);
      const frozen = this.state.freezeTurns > 0;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(point.angle);
      ctx.fillStyle = frozen ? '#c4b5fd' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, -3);
      ctx.lineTo(8, 12);
      ctx.lineTo(-8, 12);
      ctx.lineTo(-12, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawPlayer() {
    const ctx = this.ctx;
    const point = this.pointForCell(this.state.player);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(point.angle + Math.PI / 2);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLabels() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '600 14px "Avenir Next", "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    for (let ring = 0; ring < RING_COUNT; ring += 1) {
      const point = this.pointForCell({ ring, sector: 6 }, -18);
      ctx.fillText(`轨 ${ring + 1}`, point.x, point.y);
    }
    ctx.fillStyle = 'rgba(251, 191, 36, 0.86)';
    ctx.fillText('DOCK', this.width / 2, this.height / 2 - this.radiusForRing(RING_COUNT - 1) - 26);
    ctx.restore();
  }

  render() {
    this.drawBackdrop();
    this.drawPods();
    this.drawPulseNodes();
    this.drawDebris();
    this.drawPlayer();
    this.drawLabels();
  }

  renderGameToText() {
    return JSON.stringify({
      mode: this.state.mode,
      orbit: this.state.orbit,
      player: this.state.player,
      hull: this.state.hull,
      score: this.state.score,
      collected: this.state.collected,
      pulseCharges: this.state.pulseCharges,
      freezeTurns: this.state.freezeTurns,
      turns: this.state.turns,
      dockUnlocked: this.state.dockUnlocked,
      debris: this.state.debris.map((item) => ({ ring: item.ring, sector: item.sector })),
      pods: this.state.pods
        .filter((item) => item.active)
        .map((item) => ({ ring: item.ring, sector: item.sector })),
    });
  }

  advanceTime() {
    this.render();
    return this.renderGameToText();
  }
}

function getRefs() {
  return {
    canvas: document.querySelector('#orbit-canvas'),
    overlay: document.querySelector('#orbit-overlay'),
    overlayTitle: document.querySelector('#orbit-overlay-title'),
    overlayBody: document.querySelector('#orbit-overlay-body'),
    status: document.querySelector('#orbit-status'),
    objective: document.querySelector('#orbit-objective'),
    feed: document.querySelector('#orbit-feed'),
    level: document.querySelector('#orbit-level'),
    score: document.querySelector('#orbit-score'),
    hull: document.querySelector('#orbit-hull'),
    pods: document.querySelector('#orbit-pods'),
    pulse: document.querySelector('#orbit-pulse'),
    best: document.querySelector('#orbit-best'),
    turns: document.querySelector('#orbit-turns'),
    drift: document.querySelector('#orbit-drift'),
    bestLevel: document.querySelector('#orbit-best-level'),
    start: document.querySelector('#orbit-start'),
    reset: document.querySelector('#orbit-reset'),
    wait: document.querySelector('#orbit-wait'),
    pulseAction: document.querySelector('#orbit-pulse-action'),
    restart: document.querySelector('#orbit-restart'),
    pad: document.querySelector('.orbit-pad'),
    autotest: document.querySelector('#orbit-autotest'),
  };
}

const OrbitRescueInternals = {
  RING_COUNT,
  SECTOR_COUNT,
  POD_TARGET,
  createOrbitLayout,
  createMissionState,
  applyAction,
  runSelfCheck,
  validateLayout,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrbitRescueInternals;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const refs = getRefs();
    if (!refs.canvas) {
      return;
    }

    const game = new OrbitRescueGame(refs, {
      autotest: AUTOTEST,
      seedBase: FIXED_SEED ?? createSeedBase(),
    });

    if (AUTOTEST) {
      const result = runSelfCheck(5);
      refs.autotest.hidden = false;
      refs.autotest.textContent = result.ok
        ? `AUTOTEST PASS ${JSON.stringify(result)}`
        : `AUTOTEST FAIL ${JSON.stringify(result)}`;
      document.body.dataset.autotest = result.ok ? 'pass' : 'fail';
      window.orbitRescueSelfCheck = result;
    }

    window.render_game_to_text = () => game.renderGameToText();
    window.advanceTime = async () => game.advanceTime();
    window.orbitRescueGame = game;
    window.addEventListener('beforeunload', () => game.dispose(), { once: true });
  });
}
