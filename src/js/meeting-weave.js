const GOAL_PROFILES = {
  decision: {
    label: '做决定',
    mode: '决策会议',
    opening: '先确认需要做的具体决定，而不是泛泛讨论。',
    closure: '最后必须形成明确结论、责任人和时间点。',
  },
  sync: {
    label: '状态同步',
    mode: '同步会议',
    opening: '先把每个人要同步的内容压缩到同一格式。',
    closure: '结束前统一下一步和风险提醒。',
  },
  brainstorm: {
    label: '头脑风暴',
    mode: '发散会议',
    opening: '先锁定主题和评判边界，再进入发散。',
    closure: '最后收束成少数可继续推进的方向。',
  },
  review: {
    label: '评审复盘',
    mode: '复盘评审会议',
    opening: '先回看事实和样本，再讨论偏差。',
    closure: '结尾必须明确改动项和归因。',
  },
  kickoff: {
    label: '启动对齐',
    mode: '启动会议',
    opening: '先对齐目标、范围和节奏，再谈执行。',
    closure: '结尾锁定里程碑、接口人和下次检查点。',
  },
  'one-on-one': {
    label: '一对一沟通',
    mode: '一对一会议',
    opening: '先确认双方都想解决什么问题。',
    closure: '结束前写下明确的承诺和待跟进事项。',
  },
};

const DEFAULT_VALUES = {
  title: '',
  goal: 'decision',
  headcount: 6,
  duration: 30,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMeetingInput(input = {}) {
  const goal = GOAL_PROFILES[input.goal] ? input.goal : DEFAULT_VALUES.goal;
  const headcount = clamp(Number.parseInt(input.headcount, 10) || DEFAULT_VALUES.headcount, 2, 24);
  const duration = clamp(Number.parseInt(input.duration, 10) || DEFAULT_VALUES.duration, 15, 120);

  return {
    title: String(input.title || '').trim(),
    goal,
    headcount,
    duration,
  };
}

function distributeMinutes(total, labels, weights) {
  const raw = weights.reduce((sum, weight) => sum + weight, 0);
  let remainingMinutes = total;
  let remainingWeight = raw;

  return labels.map((label, index) => {
    const remainingSlots = labels.length - index;
    let minutes;

    if (index === labels.length - 1) {
      minutes = remainingMinutes;
    } else {
      const ideal = Math.round((remainingMinutes * weights[index]) / remainingWeight);
      const maxForThis = remainingMinutes - (remainingSlots - 1);
      minutes = clamp(ideal, 1, maxForThis);
    }

    remainingMinutes -= minutes;
    remainingWeight -= weights[index];

    return { label, minutes };
  });
}

function buildAgenda(normalized) {
  const { goal, headcount, duration } = normalized;
  const profile = GOAL_PROFILES[goal];
  const sizeFactor = headcount >= 8 ? 1.15 : headcount >= 5 ? 1.05 : 0.95;

  if (duration <= 20) {
    const segments = distributeMinutes(duration, ['开场', '核心', '决定', '收口'], [
      3,
      goal === 'brainstorm' ? 7 : 8,
      goal === 'sync' ? 5 : 6,
      2,
    ]);
    return { profile, segments, focus: '短会', ruleTone: '极简时间盒' };
  }

  if (duration <= 45) {
    const segments = distributeMinutes(duration, ['开场', '上下文', '讨论', '决定', '收口'], [
      4,
      goal === 'decision' ? 8 : 7,
      goal === 'brainstorm' ? 10 : 9,
      goal === 'decision' ? 7 : 6,
      3,
    ]);
    return {
      profile,
      segments,
      focus: sizeFactor > 1 ? '多人对齐' : '紧凑推进',
      ruleTone: '轮次清晰、结论前置',
    };
  }

  const segments = distributeMinutes(duration, ['开场', '背景', '讨论', '收敛', '行动', '收口'], [
    5,
    goal === 'review' ? 12 : 10,
    goal === 'brainstorm' ? 16 : 14,
    goal === 'decision' ? 12 : 10,
    8,
    5,
  ]);

  return {
    profile,
    segments,
    focus: headcount >= 8 ? '多人会议结构' : '中长会议结构',
    ruleTone: '节奏明确、每段有负责人',
  };
}

function buildMeetingWeavePlan(input = {}) {
  const normalized = normalizeMeetingInput(input);
  const { profile, segments, focus, ruleTone } = buildAgenda(normalized);
  const title = normalized.title || `${profile.label}编排`;
  const totalMinutes = segments.reduce((sum, item) => sum + item.minutes, 0);
  const needsStrictTimeboxes = normalized.headcount >= 8 || normalized.duration <= 30;
  const withDecision = normalized.goal === 'decision' || normalized.goal === 'review';

  const meta = [
    { label: '会议目标', value: profile.label },
    { label: '参与人数', value: `${normalized.headcount} 人` },
    { label: '总时长', value: `${normalized.duration} 分钟` },
    { label: '会议重点', value: focus },
    { label: '建议风格', value: ruleTone },
  ];

  const lead = `这场会议适合用「${profile.mode}」来主持：先做${normalized.headcount >= 8 ? '强约束分段' : '清晰分段'}，再把结果收成可执行事项。`;

  const rules = [
    needsStrictTimeboxes
      ? '每一段都要有明确时长，到点就切换，不要靠感觉延长。'
      : '保留一点缓冲，但不要让讨论无限扩张。',
    normalized.headcount >= 6
      ? '先规定发言顺序，避免少数人占满节奏。'
      : '可以保留更自然的对话，但主持人仍要控制偏题。',
    withDecision
      ? '在进入讨论前先给出可选项，结尾必须落到明确决定。'
      : '在结束前确认所有人都知道下一步要做什么。',
  ];

  const prep = [
    profile.opening,
    normalized.goal === 'brainstorm'
      ? '提前写好问题边界和筛选标准，避免发散后无从收束。'
      : '提前准备 1 页背景材料，减少会议中的重复解释。',
    normalized.headcount >= 8
      ? '把要点拆成 3 个以内的主题，方便轮次控制。'
      : '准备好一条主线，让讨论不偏离目标。',
  ];

  const close = [
    profile.closure,
    normalized.duration <= 30
      ? '把决定、待办和负责人压缩成最短可执行格式。'
      : '整理成“结论 / 待办 / 风险 / 下次检查点”四项。',
    '会后最好在 10 分钟内发出纪要，避免上下文丢失。',
  ];

  const timeline = segments.map((segment, index) => ({
    index: index + 1,
    label: segment.label,
    minutes: segment.minutes,
    note:
      segment.label === '开场'
        ? profile.opening
        : segment.label === '收口'
          ? profile.closure
          : segment.label === '决定'
            ? '把选项压成明确选择，并标记结论。'
            : segment.label === '行动'
              ? '明确负责人、截止时间和依赖。'
              : segment.label === '讨论'
                ? '让讨论围绕主题，不要发散到细枝末节。'
                : '先给大家足够背景，再进入核心内容。',
  }));

  return {
    title,
    mode: profile.mode,
    focus,
    totalMinutes,
    meta,
    lead,
    timeline,
    rules,
    prep,
    close,
  };
}

function renderChip(container, label, value) {
  const chip = document.createElement('span');
  chip.className = 'meeting-chip';
  chip.innerHTML = `<strong>${label}</strong> ${value}`;
  container.appendChild(chip);
}

function renderList(container, items) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'meeting-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  container.appendChild(list);
}

function renderTimeline(container, items) {
  container.replaceChildren();
  for (const item of items) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.label} · ${item.minutes} 分钟</strong>：${item.note}`;
    container.appendChild(li);
  }
}

function renderMeeting(plan, refs) {
  const { resultBody, emptyState, mode, titleDisplay, lead, meta, timeline, rules, prep, close } = refs;

  emptyState.hidden = true;
  resultBody.hidden = false;

  mode.textContent = `${plan.mode} · ${plan.totalMinutes} 分钟`;
  titleDisplay.textContent = plan.title;
  lead.textContent = plan.lead;

  meta.replaceChildren();
  for (const item of plan.meta) {
    renderChip(meta, item.label, item.value);
  }

  renderTimeline(timeline, plan.timeline);
  renderList(rules, plan.rules);
  renderList(prep, plan.prep);
  renderList(close, plan.close);
}

function clearResult(refs) {
  refs.resultBody.hidden = true;
  refs.emptyState.hidden = false;
}

function collectFormValues(form) {
  return {
    title: form.elements.namedItem('meeting-title')?.value || '',
    goal: form.elements.namedItem('meeting-goal')?.value || DEFAULT_VALUES.goal,
    headcount: form.elements.namedItem('meeting-headcount')?.value || DEFAULT_VALUES.headcount,
    duration: form.elements.namedItem('meeting-duration')?.value || DEFAULT_VALUES.duration,
  };
}

function setDefaultFormValues(form) {
  const defaults = {
    'meeting-title': DEFAULT_VALUES.title,
    'meeting-goal': DEFAULT_VALUES.goal,
    'meeting-headcount': String(DEFAULT_VALUES.headcount),
    'meeting-duration': String(DEFAULT_VALUES.duration),
  };

  for (const [name, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  }
}

function runSelfCheck() {
  const decisionMeeting = buildMeetingWeavePlan({
    title: '版本评审',
    goal: 'decision',
    headcount: 8,
    duration: 45,
  });
  const smallSync = buildMeetingWeavePlan({
    title: '一对一',
    goal: 'one-on-one',
    headcount: 2,
    duration: 15,
  });

  return {
    ok:
      decisionMeeting.totalMinutes === 45 &&
      smallSync.totalMinutes === 15 &&
      decisionMeeting.timeline.every((item) => item.minutes > 0) &&
      smallSync.timeline.every((item) => item.minutes > 0) &&
      decisionMeeting.timeline.length >= 5 &&
      smallSync.timeline.length === 4 &&
      decisionMeeting.rules.length === 3 &&
      decisionMeeting.prep.length === 3 &&
      decisionMeeting.close.length === 3,
    decisionMode: decisionMeeting.mode,
    syncMode: smallSync.mode,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const form = document.getElementById('meeting-form');
  const result = document.getElementById('meeting-result');
  const emptyState = document.getElementById('meeting-empty');
  const resultBody = document.getElementById('meeting-result-body');
  const mode = document.getElementById('meeting-mode');
  const titleDisplay = document.getElementById('meeting-title-display');
  const lead = document.getElementById('meeting-lead');
  const meta = document.getElementById('meeting-meta');
  const timeline = document.getElementById('meeting-timeline');
  const rules = document.getElementById('meeting-rules');
  const prep = document.getElementById('meeting-prep');
  const close = document.getElementById('meeting-close');
  const regenerateButton = document.getElementById('meeting-regenerate');
  const clearButton = document.getElementById('meeting-clear');

  setDefaultFormValues(form);

  const refs = {
    resultBody,
    emptyState,
    mode,
    titleDisplay,
    lead,
    meta,
    timeline,
    rules,
    prep,
    close,
  };

  function generateFromForm() {
    const plan = buildMeetingWeavePlan(collectFormValues(form));
    renderMeeting(plan, refs);
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

  window.meetingWeaveApp = {
    DEFAULT_VALUES,
    GOAL_PROFILES,
    normalizeMeetingInput,
    buildMeetingWeavePlan,
    runSelfCheck,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VALUES,
    GOAL_PROFILES,
    normalizeMeetingInput,
    buildMeetingWeavePlan,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
