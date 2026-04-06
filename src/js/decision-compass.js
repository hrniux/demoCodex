const URGENCY_PROFILES = {
  low: {
    label: '低紧急度',
    score: 24,
    cue: '时间窗口宽，先把判断做扎实。',
  },
  medium: {
    label: '中紧急度',
    score: 58,
    cue: '需要尽快推进，但仍能保留一步验证。',
  },
  high: {
    label: '高紧急度',
    score: 84,
    cue: '时间在收紧，优先做能落地的动作。',
  },
};

const REVERSIBILITY_PROFILES = {
  reversible: {
    label: '高可逆',
    penalty: 0,
    cue: '先动手的成本低，适合快速试探。',
  },
  partial: {
    label: '中可逆',
    penalty: 9,
    cue: '可以推进，但要给回滚和修正留余地。',
  },
  hard: {
    label: '低可逆',
    penalty: 20,
    cue: '一旦执行就很难倒回，需要更高的把握度。',
  },
};

const DEFAULT_VALUES = {
  title: '',
  urgency: 'medium',
  reversibility: 'partial',
  confidence: 68,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function trimSentenceEnd(value) {
  return String(value || '').replace(/[。.]$/, '');
}

function normalizeCompassInput(input = {}) {
  const parsedConfidence = Number.parseInt(input.confidence, 10);
  const confidence = clamp(
    Number.isFinite(parsedConfidence) ? parsedConfidence : DEFAULT_VALUES.confidence,
    0,
    100,
  );
  const urgency = URGENCY_PROFILES[input.urgency] ? input.urgency : DEFAULT_VALUES.urgency;
  const reversibility =
    REVERSIBILITY_PROFILES[input.reversibility] ? input.reversibility : DEFAULT_VALUES.reversibility;

  return {
    title: String(input.title || '').trim(),
    urgency,
    reversibility,
    confidence,
  };
}

function deriveDecisionMode(normalized) {
  if (normalized.urgency === 'high' && normalized.reversibility !== 'hard' && normalized.confidence >= 55) {
    return '立即行动';
  }

  if (normalized.urgency === 'high' && normalized.reversibility === 'hard') {
    return normalized.confidence >= 70 ? '先做最小可逆动作' : '先补信息';
  }

  if (normalized.urgency === 'low' && normalized.confidence < 60) {
    return '先观察再决定';
  }

  if (normalized.confidence < 45) {
    return normalized.reversibility === 'reversible' ? '先试探' : '先补信息';
  }

  if (normalized.reversibility === 'hard' && normalized.confidence < 75) {
    return '先做风险隔离';
  }

  return '按计划推进';
}

function buildDecisionCompass(input = {}) {
  const normalized = normalizeCompassInput(input);
  const urgencyProfile = URGENCY_PROFILES[normalized.urgency];
  const reversibilityProfile = REVERSIBILITY_PROFILES[normalized.reversibility];
  const rawScore = urgencyProfile.score + normalized.confidence - reversibilityProfile.penalty;
  const score = clamp(Math.round(rawScore / 2), 0, 100);
  const mode = deriveDecisionMode(normalized);

  const title = normalized.title || '未命名决策';
  const rationale = [
    `紧急度是${urgencyProfile.label}，说明时间压力${normalized.urgency === 'high' ? '已经很强' : normalized.urgency === 'low' ? '还不算高' : '处在中间区间'}。`,
    `可逆性是${reversibilityProfile.label}，${trimSentenceEnd(reversibilityProfile.cue)}。`,
    `把握度是 ${normalized.confidence}/100，意味着你更适合 ${normalized.confidence >= 70 ? '直接推进' : normalized.confidence >= 50 ? '带着验证推进' : '先补足信息再决定'}。`,
  ];

  const firstStep =
    mode === '立即行动'
      ? '先执行一件最小、最能产生信号的动作。'
      : mode === '先做最小可逆动作'
        ? '先做可以撤回或修正的小动作，确认方向后再扩大。'
        : mode === '先试探'
          ? '先拿一个低成本样本做验证，避免一次性下注。'
          : mode === '先补信息'
            ? '先补齐最关键的缺口，再回到决定。'
            : mode === '先做风险隔离'
              ? '先把回滚、审批和边界条件准备好，再继续。'
              : '按照既定顺序往前推，并设置一个检查点。';

  const checkpoints = [
    normalized.urgency === 'high' ? '今天要能看到推进信号。' : '先确认是否真的需要今天完成。',
    normalized.reversibility === 'hard'
      ? '把回退成本写清楚，避免误伤不可逆部分。'
      : '准备一个低成本回滚路径，以免试错成本过高。',
    normalized.confidence >= 70 ? '确认主要风险已被覆盖。' : '列出最关键的 1 个未知项并优先验证。',
  ];

  const guardrail = [
    normalized.reversibility === 'hard'
      ? '不要在信息不完整时直接拍板。'
      : '不要因为可逆就无限拖延，拖延本身也会产生成本。',
    normalized.confidence < 50
      ? '先把不确定性写成问题列表，再决定是否继续。'
      : '用一个检查点控制节奏，而不是反复改主意。',
  ];

  const meta = [
    { label: '紧急度', value: urgencyProfile.label },
    { label: '可逆性', value: reversibilityProfile.label },
    { label: '把握度', value: `${normalized.confidence}/100` },
    { label: '建议模式', value: mode },
    { label: '罗盘分', value: `${score}/100` },
  ];

  const summary = `当前建议是「${mode}」：${firstStep}`;

  return {
    title,
    mode,
    score,
    summary,
    firstStep,
    rationale,
    checkpoints,
    guardrail,
    meta,
  };
}

function renderChip(container, label, value) {
  const chip = document.createElement('span');
  chip.className = 'decision-chip';
  chip.innerHTML = `<strong>${label}</strong> ${value}`;
  container.appendChild(chip);
}

function renderList(container, items) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'decision-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  container.appendChild(list);
}

function renderCompass(compass, refs) {
  const { resultBody, emptyState, mode, titleDisplay, lead, meta, action, reasons, checkpoints, guardrail } = refs;

  emptyState.hidden = true;
  resultBody.hidden = false;

  mode.textContent = `${compass.mode} · 罗盘分 ${compass.score}/100`;
  titleDisplay.textContent = compass.title;
  lead.textContent = compass.summary;

  meta.replaceChildren();
  for (const item of compass.meta) {
    renderChip(meta, item.label, item.value);
  }

  renderList(action, [compass.firstStep, compass.score >= 70 ? '优先处理最关键的一步。' : '优先处理最能暴露信息缺口的一步。']);
  renderList(reasons, compass.rationale);
  renderList(checkpoints, compass.checkpoints);
  renderList(guardrail, compass.guardrail);
}

function clearResult(refs) {
  refs.resultBody.hidden = true;
  refs.emptyState.hidden = false;
}

function collectFormValues(form) {
  return {
    title: form.elements.namedItem('decision-title')?.value || '',
    urgency: form.elements.namedItem('decision-urgency')?.value || DEFAULT_VALUES.urgency,
    reversibility: form.elements.namedItem('decision-reversibility')?.value || DEFAULT_VALUES.reversibility,
    confidence: form.elements.namedItem('decision-confidence')?.value || DEFAULT_VALUES.confidence,
  };
}

function setDefaultFormValues(form) {
  const defaults = {
    'decision-title': DEFAULT_VALUES.title,
    'decision-urgency': DEFAULT_VALUES.urgency,
    'decision-reversibility': DEFAULT_VALUES.reversibility,
    'decision-confidence': String(DEFAULT_VALUES.confidence),
  };

  for (const [name, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  }
}

function runSelfCheck() {
  const quick = buildDecisionCompass({
    title: '是否今天上线',
    urgency: 'high',
    reversibility: 'hard',
    confidence: 82,
  });
  const slow = buildDecisionCompass({
    title: '是否先做调研',
    urgency: 'low',
    reversibility: 'reversible',
    confidence: 38,
  });
  const zeroConfidence = buildDecisionCompass({
    title: '是否继续推进',
    urgency: 'low',
    reversibility: 'reversible',
    confidence: 0,
  });

  return {
    ok:
      quick.mode === '先做最小可逆动作' &&
      slow.mode === '先观察再决定' &&
      zeroConfidence.mode === '先观察再决定' &&
      zeroConfidence.meta[2].value === '0/100' &&
      quick.meta.length === 5 &&
      quick.checkpoints.length === 3 &&
      slow.guardrail.length === 2 &&
      quick.score > slow.score,
    quickScore: quick.score,
    slowScore: slow.score,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const form = document.getElementById('decision-form');
  const result = document.getElementById('decision-result');
  const emptyState = document.getElementById('decision-empty');
  const resultBody = document.getElementById('decision-result-body');
  const mode = document.getElementById('decision-mode');
  const titleDisplay = document.getElementById('decision-title-display');
  const lead = document.getElementById('decision-lead');
  const meta = document.getElementById('decision-meta');
  const action = document.getElementById('decision-action');
  const reasons = document.getElementById('decision-reasons');
  const checkpoints = document.getElementById('decision-checkpoints');
  const guardrail = document.getElementById('decision-guardrail');
  const regenerateButton = document.getElementById('decision-regenerate');
  const clearButton = document.getElementById('decision-clear');

  setDefaultFormValues(form);

  const refs = {
    resultBody,
    emptyState,
    mode,
    titleDisplay,
    lead,
    meta,
    action,
    reasons,
    checkpoints,
    guardrail,
  };

  function generateFromForm() {
    const compass = buildDecisionCompass(collectFormValues(form));
    renderCompass(compass, refs);
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

  window.decisionCompassApp = {
    DEFAULT_VALUES,
    URGENCY_PROFILES,
    REVERSIBILITY_PROFILES,
    normalizeCompassInput,
    buildDecisionCompass,
    runSelfCheck,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VALUES,
    URGENCY_PROFILES,
    REVERSIBILITY_PROFILES,
    normalizeCompassInput,
    buildDecisionCompass,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
