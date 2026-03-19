const AUTOTEST = new URLSearchParams(window.location.search).has('autotest');

const padBlueprints = [
  { name: '焰', hint: '高热脉冲', color: '#fb7185' },
  { name: '潮', hint: '柔性回响', color: '#38bdf8' },
  { name: '砂', hint: '稳态堆栈', color: '#f59e0b' },
  { name: '霓', hint: '折射镜像', color: '#f472b6' },
  { name: '雷', hint: '瞬时加速', color: '#a78bfa' },
  { name: '森', hint: '生长节点', color: '#4ade80' },
  { name: '曜', hint: '亮度翻倍', color: '#facc15' },
  { name: '澜', hint: '深层共振', color: '#22d3ee' },
  { name: '雾', hint: '缓冲残响', color: '#c084fc' },
];

class EchoMatrixGame {
  constructor(refs, options = {}) {
    this.refs = refs;
    this.pads = [];
    this.autotest = Boolean(options.autotest);
    this.best = this.canUseStorage() ? Number(localStorage.getItem('echoBest') || 0) : 0;
    this.seed = 0x13572468;
    this.running = false;
    this.acceptingInput = false;
    this.showingSequence = false;
    this.sequence = [];
    this.round = 0;
    this.score = 0;
    this.streak = 0;
    this.hearts = 3;
    this.inputIndex = 0;
    this.bonusPad = -1;
    this.turnLimit = 0;
    this.turnRemaining = 0;
    this.loopHandle = 0;
    this.lastFrame = 0;
    this.showToken = 0;
    this.logs = [];
    this.timeouts = new Set();
    this.boundKeydown = (event) => this.onKeydown(event);
    this.buildPadGrid();
    this.bindEvents();
    this.reset();
    this.renderLoop(performance.now());
  }

  canUseStorage() {
    try {
      const key = '__echo_matrix__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  buildPadGrid() {
    const fragment = document.createDocumentFragment();
    padBlueprints.forEach((pad, index) => {
      const button = document.createElement('button');
      button.className = 'echo-pad';
      button.type = 'button';
      button.dataset.index = String(index);
      button.style.setProperty('--pad-color', pad.color);
      button.innerHTML = `
        <span class="echo-pad__index">${index + 1}</span>
        <span class="echo-pad__title">${pad.name}</span>
        <span class="echo-pad__hint">${pad.hint}</span>
      `;
      fragment.appendChild(button);
      this.pads.push(button);
    });
    this.refs.grid.appendChild(fragment);
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    this.refs.grid.addEventListener('click', (event) => {
      const button = event.target.closest('.echo-pad');
      if (!button) {
        return;
      }
      this.handlePadPress(Number(button.dataset.index));
    });
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeydown);
    cancelAnimationFrame(this.loopHandle);
    this.clearTimers();
  }

  reset() {
    this.clearTimers();
    this.running = false;
    this.acceptingInput = false;
    this.showingSequence = false;
    this.sequence = [];
    this.round = 0;
    this.score = 0;
    this.streak = 0;
    this.hearts = 3;
    this.inputIndex = 0;
    this.turnLimit = 0;
    this.turnRemaining = 0;
    this.bonusPad = -1;
    this.seed = 0x13572468;
    this.showToken += 1;
    this.clearPadStates();
    this.logs = [];
    this.setStatus('准备开始第一轮共振演算');
    this.pushLog('系统待机。');
    this.updateHud();
  }

  onKeydown(event) {
    if (event.code === 'Enter') {
      this.start();
      return;
    }

    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < 9) {
      this.handlePadPress(index);
    }
  }

  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  clearTimers() {
    for (const timer of this.timeouts) {
      clearTimeout(timer);
    }
    this.timeouts.clear();
  }

  delay(ms) {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.timeouts.delete(timer);
        resolve();
      }, ms);
      this.timeouts.add(timer);
    });
  }

  setStatus(message) {
    this.refs.status.textContent = message;
  }

  pushLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 5);
    this.refs.feed.innerHTML = this.logs.map((item) => `<li>${item}</li>`).join('');
  }

  updateHud() {
    this.refs.round.textContent = String(this.round);
    this.refs.score.textContent = String(Math.round(this.score));
    this.refs.streak.textContent = String(this.streak);
    this.refs.hearts.textContent = String(this.hearts);
    this.refs.timer.textContent = `${Math.max(0, this.turnRemaining).toFixed(1)}s`;
    const pct =
      this.turnLimit > 0 ? (Math.max(0, this.turnRemaining) / this.turnLimit) * 100 : 0;
    this.refs.timerFill.style.width = `${pct}%`;
  }

  hardMode() {
    return this.refs.hardMode.checked;
  }

  async start() {
    this.reset();
    this.running = true;
    this.pushLog(this.hardMode() ? '高压模式已启用。' : '常规模式已启用。');
    await this.advanceRound();
  }

  async advanceRound() {
    if (!this.running) {
      return;
    }

    this.round += 1;
    this.sequence.push(Math.floor(this.random() * 9));
    this.bonusPad = Math.floor(this.random() * 9);
    this.inputIndex = 0;
    this.acceptingInput = false;
    this.clearBonusState();
    this.setPadBonus(this.bonusPad);
    this.setStatus(`第 ${this.round} 轮：记住 ${this.sequence.length} 个步骤`);
    this.pushLog(`共振格锁定在 ${this.bonusPad + 1} 号。`);
    await this.showSequence();
    if (!this.running) {
      return;
    }
    this.acceptingInput = true;
    this.startTurnTimer();
    this.setStatus(`开始输入，第 1 / ${this.sequence.length} 步`);
  }

  async showSequence() {
    const token = ++this.showToken;
    this.showingSequence = true;
    const flashMs = this.autotest ? 32 : this.hardMode() ? 320 : 420;
    const gapMs = this.autotest ? 18 : this.hardMode() ? 90 : 150;

    for (const step of this.sequence) {
      if (token !== this.showToken || !this.running) {
        return;
      }
      this.flashPad(step, flashMs, 'demo');
      await this.delay(flashMs + gapMs);
    }
    this.showingSequence = false;
  }

  startTurnTimer() {
    this.turnLimit = this.autotest ? 0.5 : Math.max(2.2, 4.5 - this.round * 0.16 - (this.hardMode() ? 0.55 : 0));
    this.turnRemaining = this.turnLimit;
    this.updateHud();
  }

  handlePadPress(index) {
    if (!this.running || !this.acceptingInput || this.showingSequence) {
      return;
    }

    this.flashPad(index, this.autotest ? 24 : 160, 'input');
    const expected = this.sequence[this.inputIndex];
    if (index !== expected) {
      this.registerMistake(`输入错误，当前应为 ${expected + 1} 号格`);
      return;
    }

    const bonus = index === this.bonusPad ? 55 : 0;
    const speedBonus = Math.round(this.turnRemaining * 18);
    this.score += 48 + this.round * 12 + speedBonus + bonus;
    this.streak += 1;
    this.inputIndex += 1;
    this.turnRemaining = this.turnLimit;
    this.updateHud();

    if (bonus > 0) {
      this.pushLog('命中共振格，额外加分。');
    }

    if (this.inputIndex >= this.sequence.length) {
      this.acceptingInput = false;
      this.score += this.round * 70;
      this.updateHud();
      this.setStatus(`第 ${this.round} 轮完成，准备进入下一轮`);
      this.pushLog(`完成第 ${this.round} 轮。`);
      const delayMs = this.autotest ? 30 : 600;
      this.delay(delayMs).then(() => this.advanceRound());
      return;
    }

    this.setStatus(`继续输入，第 ${this.inputIndex + 1} / ${this.sequence.length} 步`);
  }

  registerMistake(message) {
    this.acceptingInput = false;
    this.hearts -= 1;
    this.streak = 0;
    this.updateHud();

    if (this.hearts <= 0) {
      this.finishGame(message);
      return;
    }

    this.setStatus(`${message}，系统将回放本轮序列`);
    this.pushLog(`失误一次，剩余 ${this.hearts} 次机会。`);
    const token = ++this.showToken;
    const delayMs = this.autotest ? 36 : 760;
    this.delay(delayMs).then(async () => {
      if (!this.running || token !== this.showToken) {
        return;
      }
      this.inputIndex = 0;
      await this.showSequence();
      if (!this.running) {
        return;
      }
      this.acceptingInput = true;
      this.startTurnTimer();
      this.setStatus(`重新输入，第 1 / ${this.sequence.length} 步`);
    });
  }

  finishGame(message) {
    this.running = false;
    this.acceptingInput = false;
    this.setStatus(`挑战结束：${message}`);
    this.pushLog('演算终止。');
    if (this.score > this.best && this.canUseStorage()) {
      this.best = Math.round(this.score);
      localStorage.setItem('echoBest', String(this.best));
    }
  }

  flashPad(index, duration, mode) {
    const button = this.pads[index];
    if (!button) {
      return;
    }

    button.classList.add('is-active');
    button.style.boxShadow = `0 0 0 1px ${padBlueprints[index].color}, 0 16px 34px ${padBlueprints[index].color}55`;
    const timer = window.setTimeout(() => {
      this.timeouts.delete(timer);
      button.classList.remove('is-active');
      button.style.boxShadow = button.classList.contains('is-bonus')
        ? 'inset 0 0 0 1px rgba(251, 191, 36, 0.2)'
        : '';
    }, duration);
    this.timeouts.add(timer);
    if (mode === 'demo') {
      this.pushLog(`系统点亮 ${index + 1} 号格。`);
    }
  }

  clearPadStates() {
    this.pads.forEach((button) => {
      button.classList.remove('is-active', 'is-bonus');
      button.style.boxShadow = '';
    });
  }

  clearBonusState() {
    this.pads.forEach((button) => {
      button.classList.remove('is-bonus');
      if (!button.classList.contains('is-active')) {
        button.style.boxShadow = '';
      }
    });
  }

  setPadBonus(index) {
    const button = this.pads[index];
    if (!button) {
      return;
    }
    button.classList.add('is-bonus');
    button.style.boxShadow = 'inset 0 0 0 1px rgba(251, 191, 36, 0.2)';
  }

  renderLoop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000 || 0.016);
    this.lastFrame = now;
    if (this.running && this.acceptingInput) {
      this.turnRemaining -= dt;
      if (this.turnRemaining <= 0) {
        this.turnRemaining = 0;
        this.registerMistake('输入超时');
      }
      this.updateHud();
    }
    this.loopHandle = requestAnimationFrame((time) => this.renderLoop(time));
  }

  async waitFor(predicate, timeoutMs = 1600) {
    const started = performance.now();
    while (!predicate()) {
      if (performance.now() - started > timeoutMs) {
        return false;
      }
      await this.delay(20);
    }
    return true;
  }

  async runAutotest() {
    await this.start();
    const firstRoundReady = await this.waitFor(() => this.acceptingInput);
    if (!firstRoundReady) {
      this.finishAutotest(false, { reason: 'round-1-timeout' });
      return;
    }

    this.handlePadPress(this.sequence[0]);
    const secondRoundReady = await this.waitFor(() => this.round >= 2 && this.acceptingInput);
    if (!secondRoundReady) {
      this.finishAutotest(false, { reason: 'round-2-timeout' });
      return;
    }

    for (const step of this.sequence) {
      this.handlePadPress(step);
      await this.delay(10);
    }

    const thirdRoundReady = await this.waitFor(() => this.round >= 3 && this.acceptingInput);
    if (!thirdRoundReady) {
      this.finishAutotest(false, { reason: 'round-3-timeout' });
      return;
    }

    const heartsBeforeError = this.hearts;
    this.handlePadPress((this.sequence[0] + 1) % 9);
    await this.delay(80);

    const passed = this.round >= 3 && this.score > 0 && this.hearts === heartsBeforeError - 1;
    this.finishAutotest(passed, {
      round: this.round,
      score: Math.round(this.score),
      hearts: this.hearts,
      sequenceLength: this.sequence.length,
    });
  }

  finishAutotest(passed, details) {
    this.refs.autotest.hidden = false;
    this.refs.autotest.textContent = passed
      ? `AUTOTEST PASS ${JSON.stringify(details)}`
      : `AUTOTEST FAIL ${JSON.stringify(details)}`;
    document.body.dataset.autotest = passed ? 'pass' : 'fail';
  }
}

const refs = {
  grid: document.getElementById('echo-grid'),
  hardMode: document.getElementById('echo-hard-mode'),
  round: document.getElementById('echo-round'),
  score: document.getElementById('echo-score'),
  streak: document.getElementById('echo-streak'),
  hearts: document.getElementById('echo-hearts'),
  status: document.getElementById('echo-status'),
  timer: document.getElementById('echo-timer'),
  timerFill: document.getElementById('echo-timer-fill'),
  feed: document.getElementById('echo-feed'),
  start: document.getElementById('echo-start'),
  restart: document.getElementById('echo-restart'),
  autotest: document.getElementById('echo-autotest'),
};

const game = new EchoMatrixGame(refs, { autotest: AUTOTEST });

refs.start.addEventListener('click', () => {
  game.start();
});

refs.restart.addEventListener('click', () => {
  game.start();
});

window.addEventListener('beforeunload', () => game.dispose());
window.__echoMatrix = game;

if (AUTOTEST) {
  game.runAutotest();
}
