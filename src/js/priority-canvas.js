const IMPACT_LEVELS = {
  1: { label: '1 - 影响很小', score: 12 },
  2: { label: '2 - 影响有限', score: 28 },
  3: { label: '3 - 中等影响', score: 48 },
  4: { label: '4 - 高影响', score: 72 },
  5: { label: '5 - 关键影响', score: 92 },
};

const EFFORT_LEVELS = {
  1: { label: '1 - 很省时', penalty: 4 },
  2: { label: '2 - 低投入', penalty: 10 },
  3: { label: '3 - 中等投入', penalty: 18 },
  4: { label: '4 - 较高投入', penalty: 28 },
  5: { label: '5 - 很重投入', penalty: 38 },
};

const DEADLINE_LEVELS = {
  today: { label: '今天', bonus: 24, tone: 'very-urgent' },
  'this-week': { label: '本周', bonus: 16, tone: 'urgent' },
  'this-month': { label: '本月', bonus: 8, tone: 'steady' },
  flexible: { label: '较灵活', bonus: 0, tone: 'calm' },
};

const DEPENDENCY_LEVELS = {
  none: { label: '没有明显依赖', penalty: 0, note: '可以独立启动。' },
  few: { label: '有少量依赖', penalty: 9, note: '先解开一两个关键节点。' },
  many: { label: '依赖较多', penalty: 18, note: '先拆依赖再谈主推进。' },
};

const DEFAULT_VALUES = {
  title: '',
  impact: '3',
  effort: '3',
  deadline: 'this-week',
  dependency: 'none',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function trimSentenceEnd(value) {
  return String(value || '').replace(/[。.]$/, '');
}

function normalizePriorityInput(input = {}) {
  const impact = IMPACT_LEVELS[input.impact] ? String(input.impact) : DEFAULT_VALUES.impact;
  const effort = EFFORT_LEVELS[input.effort] ? String(input.effort) : DEFAULT_VALUES.effort;
  const deadline = DEADLINE_LEVELS[input.deadline] ? input.deadline : DEFAULT_VALUES.deadline;
  const dependency = DEPENDENCY_LEVELS[input.dependency] ? input.dependency : DEFAULT_VALUES.dependency;

  return {
    title: String(input.title || '').trim(),
    impact,
    effort,
    deadline,
    dependency,
  };
}

function resolvePlacement(score, normalized) {
  const impact = Number.parseInt(normalized.impact, 10);
  const effort = Number.parseInt(normalized.effort, 10);

  if (score >= 80 && impact >= 4 && effort <= 3) {
    return '先做';
  }
  if (score >= 65) {
    return '计划做';
  }
  if (score >= 45) {
    return '顺手做';
  }
  return '放后做';
}

function buildPriorityCanvas(input = {}) {
  const normalized = normalizePriorityInput(input);
  const impactProfile = IMPACT_LEVELS[normalized.impact];
  const effortProfile = EFFORT_LEVELS[normalized.effort];
  const deadlineProfile = DEADLINE_LEVELS[normalized.deadline];
  const dependencyProfile = DEPENDENCY_LEVELS[normalized.dependency];

  const score = clamp(
    Math.round(impactProfile.score - effortProfile.penalty + deadlineProfile.bonus - dependencyProfile.penalty),
    0,
    100,
  );
  const placement = resolvePlacement(score, normalized);
  const title = normalized.title || '未命名任务';

  const reasons = [
    `影响是${impactProfile.label}，说明这件事对结果的拉动${Number.parseInt(normalized.impact, 10) >= 4 ? '很大' : '处在中间或以下'}。`,
    `投入是${effortProfile.label}，意味着成本${Number.parseInt(normalized.effort, 10) >= 4 ? '偏高' : '可控'}。`,
    `期限是${deadlineProfile.label}，依赖是${dependencyProfile.label}，${trimSentenceEnd(dependencyProfile.note)}。`,
  ];

  const nextAction = [
    placement === '先做'
      ? '今天就先开一个最小闭环，先把信号跑出来。'
      : placement === '计划做'
        ? '先排到今天的工作块里，给它稳定的开始时间。'
        : placement === '顺手做'
          ? '放进低切换成本的空档，顺便处理掉。'
          : '先不要直接开做，先把依赖和边界拆清楚。',
    dependencyProfile.penalty > 0
      ? '先解决最卡住的依赖，再决定是否真正推进。'
      : '只要有空档就可以推进，不必额外等待。',
  ];

  const risks = [
    deadlineProfile.tone === 'very-urgent'
      ? '期限很近，先别把时间浪费在高成本优化上。'
      : '期限不算极限，仍要避免无必要的切换。',
    dependencyProfile.note,
    score < 50
      ? '如果开始做了却迟迟看不到收益，优先检查是否选错顺序。'
      : '推进时仍要留一个检查点，防止在高投入里失速。',
  ];

  const board = [
    {
      key: 'do-first',
      title: '先做',
      text: '高影响、低投入、期限近且依赖少的任务。最适合先开工。',
      active: placement === '先做',
    },
    {
      key: 'plan',
      title: '计划做',
      text: '影响高但投入也不低。先排时间，再分步执行。',
      active: placement === '计划做',
    },
    {
      key: 'quick-win',
      title: '顺手做',
      text: '影响一般、投入偏低。适合在空档或切换成本低时处理。',
      active: placement === '顺手做',
    },
    {
      key: 'defer',
      title: '放后做',
      text: '影响偏低或依赖太重。先拆依赖再推进。',
      active: placement === '放后做',
    },
  ];

  const meta = [
    { label: '影响', value: impactProfile.label },
    { label: '投入', value: effortProfile.label },
    { label: '期限', value: deadlineProfile.label },
    { label: '依赖', value: dependencyProfile.label },
    { label: '优先分', value: `${score}/100` },
  ];

  return {
    title,
    score,
    placement,
    board,
    reasons,
    nextAction,
    risks,
    meta,
    summary: `这件事现在更适合放在「${placement}」的位置。`,
  };
}

function renderChip(container, label, value) {
  const chip = document.createElement('span');
  chip.className = 'priority-chip';
  chip.innerHTML = `<strong>${label}</strong> ${value}`;
  container.appendChild(chip);
}

function renderList(container, items) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'priority-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  container.appendChild(list);
}

function renderBoard(container, board) {
  container.replaceChildren();
  for (const cell of board) {
    const div = document.createElement('div');
    div.className = 'priority-cell';
    div.dataset.active = String(cell.active);
    div.innerHTML = `<strong>${cell.title}</strong><p>${cell.text}</p>`;
    container.appendChild(div);
  }
}

function renderCanvas(canvas, refs) {
  const { resultBody, emptyState, mode, titleDisplay, lead, meta, board, reasons, next, risks } = refs;

  emptyState.hidden = true;
  resultBody.hidden = false;

  mode.textContent = `优先分 ${canvas.score}/100 · ${canvas.placement}`;
  titleDisplay.textContent = canvas.title;
  lead.textContent = canvas.summary;

  meta.replaceChildren();
  for (const item of canvas.meta) {
    renderChip(meta, item.label, item.value);
  }

  renderBoard(board, canvas.board);
  renderList(reasons, canvas.reasons);
  renderList(next, canvas.nextAction);
  renderList(risks, canvas.risks);
}

function clearResult(refs) {
  refs.resultBody.hidden = true;
  refs.emptyState.hidden = false;
}

function collectFormValues(form) {
  return {
    title: form.elements.namedItem('priority-title')?.value || '',
    impact: form.elements.namedItem('priority-impact')?.value || DEFAULT_VALUES.impact,
    effort: form.elements.namedItem('priority-effort')?.value || DEFAULT_VALUES.effort,
    deadline: form.elements.namedItem('priority-deadline')?.value || DEFAULT_VALUES.deadline,
    dependency: form.elements.namedItem('priority-dependency')?.value || DEFAULT_VALUES.dependency,
  };
}

function setDefaultFormValues(form) {
  const defaults = {
    'priority-title': DEFAULT_VALUES.title,
    'priority-impact': DEFAULT_VALUES.impact,
    'priority-effort': DEFAULT_VALUES.effort,
    'priority-deadline': DEFAULT_VALUES.deadline,
    'priority-dependency': DEFAULT_VALUES.dependency,
  };

  for (const [name, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  }
}

function runSelfCheck() {
  const fastWin = buildPriorityCanvas({
    title: '修复登录错误',
    impact: '5',
    effort: '2',
    deadline: 'today',
    dependency: 'none',
  });
  const slowChunk = buildPriorityCanvas({
    title: '整理参考资料',
    impact: '2',
    effort: '4',
    deadline: 'flexible',
    dependency: 'many',
  });

  return {
    ok:
      fastWin.placement === '先做' &&
      slowChunk.placement === '放后做' &&
      fastWin.board.length === 4 &&
      fastWin.meta.length === 5 &&
      slowChunk.risks.length === 3 &&
      fastWin.score > slowChunk.score,
    fastScore: fastWin.score,
    slowScore: slowChunk.score,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const form = document.getElementById('priority-form');
  const result = document.getElementById('priority-result');
  const emptyState = document.getElementById('priority-empty');
  const resultBody = document.getElementById('priority-result-body');
  const mode = document.getElementById('priority-mode');
  const titleDisplay = document.getElementById('priority-title-display');
  const lead = document.getElementById('priority-lead');
  const meta = document.getElementById('priority-meta');
  const board = document.getElementById('priority-board');
  const reasons = document.getElementById('priority-reasons');
  const next = document.getElementById('priority-next');
  const risks = document.getElementById('priority-risks');
  const regenerateButton = document.getElementById('priority-regenerate');
  const clearButton = document.getElementById('priority-clear');

  setDefaultFormValues(form);

  const refs = {
    resultBody,
    emptyState,
    mode,
    titleDisplay,
    lead,
    meta,
    board,
    reasons,
    next,
    risks,
  };

  function generateFromForm() {
    const canvas = buildPriorityCanvas(collectFormValues(form));
    renderCanvas(canvas, refs);
    result.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    generateFromForm();
  });

  form.addEventListener('reset', (event) => {
    event.preventDefault();
    setDefaultFormValues(form);
    clearResult(refs);
    result.focus();
  });

  regenerateButton.addEventListener('click', generateFromForm);
  clearButton.addEventListener('click', () => {
    clearResult(refs);
    result.focus();
  });

  window.priorityCanvasApp = {
    DEFAULT_VALUES,
    IMPACT_LEVELS,
    EFFORT_LEVELS,
    DEADLINE_LEVELS,
    DEPENDENCY_LEVELS,
    normalizePriorityInput,
    buildPriorityCanvas,
    runSelfCheck,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VALUES,
    IMPACT_LEVELS,
    EFFORT_LEVELS,
    DEADLINE_LEVELS,
    DEPENDENCY_LEVELS,
    normalizePriorityInput,
    buildPriorityCanvas,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
