import { Game } from './modules/Game.js';
import { Input } from './modules/core/Input.js';
import { AudioBus } from './modules/core/AudioBus.js';
import { TouchControls } from './modules/core/TouchControls.js';

// Entry point: initialize game once DOM is ready
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input();
const audio = new AudioBus({ muted: false });
const game = new Game({ canvas, ctx, input, audio });
let touch = null;

// HUD wiring
const $hp = document.getElementById('hud-hp');
const $stamina = document.getElementById('hud-stamina');
const $energy = document.getElementById('hud-energy');
const $skills = document.getElementById('hud-skills');
const $tips = document.getElementById('hud-tips');
const $btnPause = document.getElementById('btn-pause');
const $btnMute = document.getElementById('btn-mute');

// Build HUD bars
for (const el of [$hp, $stamina, $energy]) {
  const v = document.createElement('div');
  v.className = 'value';
  el.appendChild(v);
}

function skillIcon(key, label) {
  const s = document.createElement('div');
  s.className = 'hud__skill';
  s.dataset.key = key;
  const cd = document.createElement('div');
  cd.className = 'cd';
  const l = document.createElement('div');
  l.className = 'label';
  l.textContent = label;
  s.appendChild(cd);
  s.appendChild(l);
  return s;
}

const skillMap = [
  ['Digit1', '风'],
  ['Digit2', '土'],
  ['Digit3', '水'],
  ['Digit4', '火'],
  ['Digit5', '雷'],
];
skillMap.forEach(([code, label]) => $skills.appendChild(skillIcon(code, label)));

function updateHUD() {
  const p = game.player;
  if (!p) return;
  const hpPct = Math.max(0, p.health / p.maxHealth) * 100;
  const stPct = Math.max(0, p.stamina / p.maxStamina) * 100;
  const enPct = Math.max(0, p.energy / p.maxEnergy) * 100;
  $hp.setAttribute('aria-valuenow', Math.round(hpPct).toString());
  $stamina.setAttribute('aria-valuenow', Math.round(stPct).toString());
  $energy.setAttribute('aria-valuenow', Math.round(enPct).toString());
  $hp.querySelector('.value').style.width = hpPct + '%';
  $stamina.querySelector('.value').style.width = stPct + '%';
  $energy.querySelector('.value').style.width = enPct + '%';

  // Skill cooldowns
  const cds = game.getPlayerSkillCooldowns();
  for (const [code, t] of Object.entries(cds)) {
    const el = $skills.querySelector(`.hud__skill[data-key="${code}"] .cd`);
    if (el) {
      el.style.height = `${Math.min(100, Math.max(0, t * 100))}%`;
    }
  }
  $tips.textContent = game.getTip();
}

// Controls wiring
function togglePause() {
  const newPaused = !game.paused;
  game.setPaused(newPaused);
  $btnPause.setAttribute('aria-pressed', String(newPaused));
  $btnPause.textContent = newPaused ? '继续' : '暂停';
}
$btnPause.addEventListener('click', togglePause);
input.bindToggle('KeyP', togglePause);

function toggleMute() {
  audio.toggleMute();
  $btnMute.setAttribute('aria-pressed', String(audio.muted));
}
$btnMute.addEventListener('click', toggleMute);
input.bindToggle('KeyM', toggleMute);

input.bindToggle('KeyR', () => game.reset());

// Game lifecycle
let rafId = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); // clamp delta
  last = now;
  game.update(dt);
  game.render();
  updateHUD();
  rafId = requestAnimationFrame(frame);
}

function start() {
  game.init();
  last = performance.now();
  rafId = requestAnimationFrame(frame);
  // Mount touch controls on small screens or touch devices
  const isSmall = window.matchMedia('(max-width: 1024px)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if ((isSmall || isTouch) && !touch) {
    touch = new TouchControls(document.querySelector('main.game'), input);
    touch.mount();
  }
}

function cleanup() {
  cancelAnimationFrame(rafId);
  input.dispose();
  game.dispose();
  touch?.dispose?.();
}

window.addEventListener('blur', () => game.setPaused(true));
window.addEventListener('beforeunload', cleanup);
start();
