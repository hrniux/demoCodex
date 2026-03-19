const BTN = (cls, label, aria) => {
  const b = document.createElement('button');
  b.className = `touch__btn ${cls}`;
  b.textContent = label;
  b.setAttribute('aria-label', aria || label);
  b.setAttribute('aria-pressed', 'false');
  return b;
};

export class TouchControls {
  constructor(root, input) {
    this.root = root;
    this.input = input;
    this.el = null;
    this.buttons = new Map();
  }

  mount() {
    if (this.el) return;
    const wrap = document.createElement('section');
    wrap.className = 'touch';

    const left = document.createElement('div');
    left.className = 'touch__col touch__col--left';
    const right = document.createElement('div');
    right.className = 'touch__col touch__col--right';

    const btnLeft = BTN('', '←', '向左');
    const btnRight = BTN('', '→', '向右');
    const btnJump = BTN('', '跳', '跳跃');
    const btnDash = BTN('', '闪', '闪避');
    const btnAtk = BTN('', '攻', '普攻');
    const btnBlk = BTN('', '挡', '格挡');

    // Skills as compact row
    const skillCodes = ['Digit1','Digit2','Digit3','Digit4','Digit5'];
    const skillLabels = ['风','土','水','火','雷'];
    const skillWrap = document.createElement('div');
    skillWrap.style.display = 'flex';
    skillWrap.style.gap = '8px';
    const skillBtns = skillLabels.map((l,i)=> BTN('touch__btn--small', l, `技能${l}`));
    skillBtns.forEach(b=> skillWrap.appendChild(b));

    left.appendChild(btnLeft); left.appendChild(btnRight); left.appendChild(btnJump);
    right.appendChild(btnBlk); right.appendChild(btnAtk); right.appendChild(btnDash); right.appendChild(skillWrap);

    wrap.appendChild(left); wrap.appendChild(right);
    this.root.appendChild(wrap);
    this.el = wrap;

    const holdMap = [
      [btnLeft, 'KeyA'],
      [btnRight, 'KeyD'],
      [btnBlk, 'KeyK'],
    ];

    holdMap.forEach(([btn, code]) => this._bindHold(btn, code));

    // Tap actions
    this._bindTap(btnJump, ['Space','KeyW']);
    this._bindTap(btnDash, ['ShiftLeft']);
    this._bindTap(btnAtk, ['KeyJ']);
    skillBtns.forEach((b, i) => this._bindTap(b, [skillCodes[i]]));
  }

  _bindHold(btn, code) {
    const press = (e) => { e.preventDefault(); this.input.press(code); btn.setAttribute('aria-pressed','true'); };
    const release = (e) => { e.preventDefault(); this.input.release(code); btn.setAttribute('aria-pressed','false'); };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  }

  _bindTap(btn, codes) {
    const tap = (e) => { e.preventDefault(); for (const c of codes) this.input.simulatePress(c); };
    btn.addEventListener('pointerdown', tap);
  }

  dispose() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}

