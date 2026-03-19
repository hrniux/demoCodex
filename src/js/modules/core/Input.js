export class Input {
  constructor() {
    this.keys = new Map();
    this.pressed = new Set();
    this.released = new Set();
    this.toggles = new Map();
    this.listeners = [];

    this._onDown = (e) => {
      if (e.repeat) return;
      this.keys.set(e.code, true);
      this.pressed.add(e.code);
      const t = this.toggles.get(e.code);
      if (t) t();
    };
    this._onUp = (e) => {
      this.keys.set(e.code, false);
      this.released.add(e.code);
    };
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
    this.listeners.push(['keydown', this._onDown]);
    this.listeners.push(['keyup', this._onUp]);
  }

  isDown(code) { return !!this.keys.get(code); }
  wasPressed(code) { return this.pressed.has(code); }
  wasReleased(code) { return this.released.has(code); }
  bindToggle(code, fn) { this.toggles.set(code, fn); }

  // Programmatic control for touch/UI
  press(code) { this.keys.set(code, true); }
  release(code) { this.keys.set(code, false); this.released.add(code); }
  simulatePress(code) { this.keys.set(code, true); this.pressed.add(code); setTimeout(() => this.release(code), 0); }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }

  dispose() {
    for (const [type, fn] of this.listeners) window.removeEventListener(type, fn);
    this.listeners = [];
  }
}
