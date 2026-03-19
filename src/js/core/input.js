const MOVE_KEYS = Object.freeze({
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
});

const FIRE_KEYS = new Set(["Space", "Enter"]);
const PAUSE_KEYS = new Set(["KeyP", "Escape"]);

export class KeyboardInput {
  #controller;

  constructor(target = window) {
    this.target = target;
    this.state = new Set();
    this.fire = false;
    this.pause = false;
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    target.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
    target.addEventListener("keyup", (event) => this.#onKeyUp(event), { signal });
  }

  getDirection() {
    let x = 0;
    let y = 0;
    if (this.state.has("left")) x -= 1;
    if (this.state.has("right")) x += 1;
    if (this.state.has("up")) y -= 1;
    if (this.state.has("down")) y += 1;
    if (x && y) {
      x = Math.sign(x);
      y = Math.sign(y);
    }
    return { x, y };
  }

  consumeFire() {
    const requested = this.fire;
    this.fire = false;
    return requested;
  }

  consumePause() {
    const requested = this.pause;
    this.pause = false;
    return requested;
  }

  dispose() {
    this.#controller.abort();
    this.state.clear();
  }

  #onKeyDown(event) {
    if (event.repeat) return;
    const key = MOVE_KEYS[event.code];
    if (key) {
      event.preventDefault();
      this.state.add(key);
    }
    if (FIRE_KEYS.has(event.code)) {
      event.preventDefault();
      this.fire = true;
    }
    if (PAUSE_KEYS.has(event.code)) {
      event.preventDefault();
      this.pause = true;
    }
  }

  #onKeyUp(event) {
    const key = MOVE_KEYS[event.code];
    if (key) {
      this.state.delete(key);
    }
    if (FIRE_KEYS.has(event.code)) {
      this.fire = false;
    }
  }
}
