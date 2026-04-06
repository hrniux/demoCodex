const TASK_PROFILES = {
  'deep-work': {
    label: '深度工作',
    mode: '深挖推进',
    group: 'build',
    startLine: '先锁定唯一完成标准，再开始动手。',
    firstMove: '先处理最难、最关键的那一段。',
    closure: '收尾时把结果整理成可直接交付的版本。',
    risk: '不要先看消息或开新标签页。',
  },
  coding: {
    label: '编码实现',
    mode: '最小闭环推进',
    group: 'build',
    startLine: '先跑通最小闭环，再补边角和美化。',
    firstMove: '先写能验证路径的最小实现。',
    closure: '把输出压成能提交、能跑通的状态。',
    risk: '不要一开始就重构全局结构。',
  },
  writing: {
    label: '写作整理',
    mode: '骨架起稿',
    group: 'build',
    startLine: '先列骨架，再补例子和收束句。',
    firstMove: '先写标题、段落顺序和结论。',
    closure: '最后统一语气、删重复、收尾。',
    risk: '不要先追求字面完美。',
  },
  planning: {
    label: '规划拆解',
    mode: '结构梳理',
    group: 'explore',
    startLine: '先定义边界，再拆步骤和依赖。',
    firstMove: '先把目标、限制和下一步写清楚。',
    closure: '把计划落成一个可执行的下一动作。',
    risk: '不要让范围在过程里不断膨胀。',
  },
  admin: {
    label: '事务清理',
    mode: '批量收口',
    group: 'sync',
    startLine: '先集中处理可快速关闭的事项。',
    firstMove: '先按“能否立即完成”分组。',
    closure: '把剩余事项转成待办清单。',
    risk: '不要在单条事务上停留太久。',
  },
  'meeting-prep': {
    label: '会议准备',
    mode: '对齐准备',
    group: 'sync',
    startLine: '先准备问题清单和结论锚点。',
    firstMove: '先把必须确认的三件事列出来。',
    closure: '把发言顺序和收尾动作收束好。',
    risk: '不要带着散乱材料直接进入会议。',
  },
  creative: {
    label: '创意发散',
    mode: '发散起草',
    group: 'explore',
    startLine: '先扩展选项，再筛选可用方向。',
    firstMove: '先做不评判的快速发散。',
    closure: '最后收成少数可继续推进的方案。',
    risk: '不要在发散阶段过早否定想法。',
  },
  review: {
    label: '复盘审阅',
    mode: '精炼校准',
    group: 'sync',
    startLine: '先看偏差，再决定保留和删减。',
    firstMove: '先把最关键的差异标出来。',
    closure: '把结论压缩成下一轮可用的规则。',
    risk: '不要在细节上无限循环。',
  },
};

const ENERGY_PROFILES = {
  low: {
    label: '偏低，先稳住',
    modeHint: '低负荷回收',
    setupMinutes: 5,
    breakMinutes: 6,
    secondBreakMinutes: 0,
    firstBlockBias: 0.5,
    wording: '当前更适合短块推进，靠节奏而不是强拉长战线。',
  },
  steady: {
    label: '稳定，可持续',
    modeHint: '稳态推进',
    setupMinutes: 5,
    breakMinutes: 5,
    secondBreakMinutes: 5,
    firstBlockBias: 0.56,
    wording: '当前适合稳定输出，保持节奏比冲刺更划算。',
  },
  high: {
    label: '充沛，适合深挖',
    modeHint: '深挖推进',
    setupMinutes: 4,
    breakMinutes: 4,
    secondBreakMinutes: 5,
    firstBlockBias: 0.6,
    wording: '当前能量足够，建议把最难的部分前置处理。',
  },
};

const INTERRUPTION_PROFILES = {
  low: {
    label: '低，基本安静',
    penalty: 0,
    reminder: '可以把通知全关，只留必要通道。',
  },
  medium: {
    label: '中，偶尔会被打断',
    penalty: 4,
    reminder: '预留一个统一的查看窗口，不要随手开消息。',
  },
  high: {
    label: '高，需要刻意防护',
    penalty: 8,
    reminder: '先建立防打断边界：静音、免打扰、单窗口工作。',
  },
};

const TIME_WINDOW_PROFILES = [
  {
    key: 'early',
    label: '清晨',
    start: 5,
    end: 8,
    hint: '适合启动、预热和低噪音深挖。',
    groupBonus: { build: 12, explore: 8, sync: 4 },
  },
  {
    key: 'morning',
    label: '上午',
    start: 9,
    end: 11,
    hint: '最适合处理难度最高的任务。',
    groupBonus: { build: 14, explore: 10, sync: 6 },
  },
  {
    key: 'midday',
    label: '中午',
    start: 12,
    end: 13,
    hint: '适合轻量推进或先收口再吃饭。',
    groupBonus: { build: 6, explore: 6, sync: 12 },
  },
  {
    key: 'afternoon',
    label: '下午',
    start: 14,
    end: 17,
    hint: '适合稳态推进、切块执行、减少切换。',
    groupBonus: { build: 10, explore: 8, sync: 12 },
  },
  {
    key: 'evening',
    label: '傍晚',
    start: 18,
    end: 21,
    hint: '适合收尾、整理和把事情做成闭环。',
    groupBonus: { build: 6, explore: 8, sync: 14 },
  },
  {
    key: 'night',
    label: '夜间',
    start: 22,
    end: 23,
    hint: '适合低噪音任务、清单整理和轻量处理。',
    groupBonus: { build: 2, explore: 8, sync: 16 },
  },
  {
    key: 'night',
    label: '夜间',
    start: 0,
    end: 4,
    hint: '适合低噪音任务、清单整理和轻量处理。',
    groupBonus: { build: 2, explore: 8, sync: 16 },
  },
];

const DEFAULT_VALUES = {
  title: '',
  startTime: getCurrentTimeValue(),
  energy: 'steady',
  taskType: 'deep-work',
  duration: '50',
  interruption: 'medium',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getCurrentTimeValue(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parseTimeValue(timeValue) {
  const [hourText, minuteText] = String(timeValue || DEFAULT_VALUES.startTime).split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 9, minute: 0 };
  }

  return {
    hour: clamp(hour, 0, 23),
    minute: clamp(minute, 0, 59),
  };
}

function toMinutesOfDay(hour, minute) {
  return hour * 60 + minute;
}

function formatClock(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function addMinutesToClock(timeValue, minutesToAdd) {
  const { hour, minute } = parseTimeValue(timeValue);
  return formatClock(toMinutesOfDay(hour, minute) + minutesToAdd);
}

function getWindowByTime(timeValue) {
  const { hour } = parseTimeValue(timeValue);
  return (
    TIME_WINDOW_PROFILES.find((profile) => {
      if (profile.key === 'night' && profile.start > profile.end) {
        return hour >= profile.start || hour <= profile.end;
      }
      return hour >= profile.start && hour <= profile.end;
    }) || TIME_WINDOW_PROFILES[3]
  );
}

function getTaskProfile(taskType) {
  return TASK_PROFILES[taskType] || TASK_PROFILES['deep-work'];
}

function getEnergyProfile(energy) {
  return ENERGY_PROFILES[energy] || ENERGY_PROFILES.steady;
}

function getInterruptionProfile(interruption) {
  return INTERRUPTION_PROFILES[interruption] || INTERRUPTION_PROFILES.medium;
}

function normalizeWeaveInput(input = {}) {
  const parsed = parseTimeValue(input.startTime);
  const duration = clamp(Number.parseInt(input.duration, 10) || 50, 15, 180);
  return {
    title: String(input.title || '').trim(),
    startTime: `${pad2(parsed.hour)}:${pad2(parsed.minute)}`,
    energy: ENERGY_PROFILES[input.energy] ? input.energy : 'steady',
    taskType: TASK_PROFILES[input.taskType] ? input.taskType : 'deep-work',
    duration,
    interruption: INTERRUPTION_PROFILES[input.interruption] ? input.interruption : 'medium',
  };
}

function resolveMode(timeWindow, energyProfile, taskProfile) {
  if (energyProfile.modeHint === '低负荷回收') {
    return '低负荷回收';
  }

  if (timeWindow.groupBonus[taskProfile.group] >= 12 && energyProfile.modeHint === '深挖推进') {
    return '深挖推进';
  }

  if (taskProfile.group === 'sync') {
    return '稳态收口';
  }

  if (taskProfile.group === 'explore') {
    return '发散起草';
  }

  return energyProfile.modeHint;
}

function scoreAlignment(normalized, timeWindow, energyProfile, taskProfile, interruptionProfile) {
  let score = 52;

  score += timeWindow.groupBonus[taskProfile.group] || 0;

  if (energyProfile.modeHint === '深挖推进' && taskProfile.group === 'build') {
    score += 10;
  }

  if (energyProfile.modeHint === '低负荷回收' && taskProfile.group === 'sync') {
    score += 10;
  }

  if (normalized.duration >= 75) {
    score += 6;
  } else if (normalized.duration < 40) {
    score -= 2;
  }

  score -= interruptionProfile.penalty;

  if (taskProfile.group === 'build' && timeWindow.key === 'morning') {
    score += 6;
  }

  if (taskProfile.group === 'sync' && (timeWindow.key === 'afternoon' || timeWindow.key === 'evening')) {
    score += 5;
  }

  return clamp(Math.round(score), 34, 96);
}

function buildSegments(normalized, energyProfile) {
  const { hour, minute } = parseTimeValue(normalized.startTime);
  const startMinutes = toMinutesOfDay(hour, minute);

  const setupMinutes = energyProfile.setupMinutes;

  if (normalized.duration < 40) {
    const closeMinutes = Math.min(4, Math.max(3, Math.round(normalized.duration * 0.12)));
    const focusMinutes = Math.max(8, normalized.duration - setupMinutes - closeMinutes);
    const finalClose = normalized.duration - setupMinutes - focusMinutes;

    return composeSegments(startMinutes, [
      {
        kind: 'setup',
        title: '起盘',
        minutes: setupMinutes,
        note: '写下完成定义、边界和这段时间不能做的事。',
      },
      {
        kind: 'focus',
        title: '主块',
        minutes: focusMinutes,
        note: '只处理一个核心任务，不切换上下文。',
      },
      {
        kind: 'close',
        title: '收口',
        minutes: finalClose,
        note: '把结果整理成可提交、可继续推进的状态。',
      },
    ]);
  }

  if (normalized.duration < 70) {
    const breakMinutes = energyProfile.breakMinutes + (normalized.interruption === 'high' ? 1 : 0);
    const closeMinutes = 5;
    const coreMinutes = normalized.duration - setupMinutes - breakMinutes - closeMinutes;
    const firstFocus = Math.round(coreMinutes * energyProfile.firstBlockBias);
    const secondFocus = coreMinutes - firstFocus;

    return composeSegments(startMinutes, [
      {
        kind: 'setup',
        title: '起盘',
        minutes: setupMinutes,
        note: '把目标和完成标准压缩成一行，马上开始。',
      },
      {
        kind: 'focus',
        title: '主块 A',
        minutes: firstFocus,
        note: '先啃最难的子任务，允许慢启动但不要切换。',
      },
      {
        kind: 'break',
        title: '缓冲',
        minutes: breakMinutes,
        note: '站起来、喝水、松开视线，不要接新信息。',
      },
      {
        kind: 'focus',
        title: '主块 B',
        minutes: secondFocus,
        note: '把最关键的输出整理成能交出去的版本。',
      },
      {
        kind: 'close',
        title: '收口',
        minutes: closeMinutes,
        note: '留下下一步和已完成内容，方便下次快速续上。',
      },
    ]);
  }

  const firstBreak = energyProfile.breakMinutes + (normalized.interruption === 'high' ? 1 : 0);
  const secondBreak = energyProfile.secondBreakMinutes + (normalized.interruption === 'high' ? 1 : 0);
  const closeMinutes = 6;
  const coreMinutes = normalized.duration - setupMinutes - firstBreak - secondBreak - closeMinutes;
  const firstFocus = Math.round(coreMinutes * 0.36);
  const secondFocus = Math.round(coreMinutes * 0.34);
  const thirdFocus = coreMinutes - firstFocus - secondFocus;

  return composeSegments(startMinutes, [
    {
      kind: 'setup',
      title: '起盘',
      minutes: setupMinutes,
      note: '先写出唯一目标，随后关闭干扰源。',
    },
    {
      kind: 'focus',
      title: '主块 A',
      minutes: firstFocus,
      note: '先做会显著推进结果的那一段。',
    },
    {
      kind: 'break',
      title: '短休',
      minutes: firstBreak,
      note: '离屏休息，避免在切换里浪费注意力。',
    },
    {
      kind: 'focus',
      title: '主块 B',
      minutes: secondFocus,
      note: '继续把内容往可交付方向收紧。',
    },
    {
      kind: 'break',
      title: '再缓冲',
      minutes: secondBreak,
      note: '第二次补水、整理桌面、恢复注意力。',
    },
    {
      kind: 'focus',
      title: '主块 C',
      minutes: thirdFocus,
      note: '完成最后一段推进，保留收尾空间。',
    },
    {
      kind: 'close',
      title: '收口',
      minutes: closeMinutes,
      note: '把下一步写好，避免结束后丢失上下文。',
    },
  ]);
}

function composeSegments(startMinutes, rawSegments) {
  let current = startMinutes;
  return rawSegments.map((segment) => {
    const start = current;
    current += segment.minutes;
    return {
      ...segment,
      window: `${formatClock(start)}-${formatClock(current)}`,
    };
  });
}

function buildWeavePlan(input = {}) {
  const normalized = normalizeWeaveInput(input);
  const timeWindow = getWindowByTime(normalized.startTime);
  const energyProfile = getEnergyProfile(normalized.energy);
  const taskProfile = getTaskProfile(normalized.taskType);
  const interruptionProfile = getInterruptionProfile(normalized.interruption);
  const mode = resolveMode(timeWindow, energyProfile, taskProfile);
  const score = scoreAlignment(normalized, timeWindow, energyProfile, taskProfile, interruptionProfile);
  const segments = buildSegments(normalized, energyProfile);
  const { hour, minute } = parseTimeValue(normalized.startTime);
  const startMinutes = toMinutesOfDay(hour, minute);
  const title = normalized.title || `${taskProfile.label}编排`;
  const focusSummary = `${timeWindow.label}时段${energyProfile.label.includes('偏低') ? '更适合短块推进' : '更适合连续推进'}，任务类型是${taskProfile.label}，建议把第一步定为「${taskProfile.firstMove}」`;

  const reasons = [
    `${timeWindow.label}时间窗口的特点是：${timeWindow.hint}`,
    `${energyProfile.label}对应的处理方式是${energyProfile.wording}`,
    `${taskProfile.label}最稳的做法是${taskProfile.startLine}`,
  ];

  const checklist = [
    '只保留一个主任务标签，其余事情先放到侧边。',
    taskProfile.firstMove,
    '在结果段结束前 3 分钟开始整理输出。',
  ];

  const guardrails = [
    interruptionProfile.reminder,
    taskProfile.risk,
    normalized.energy === 'low'
      ? '如果状态明显下滑，先缩短块长，不要硬撑到失焦。'
      : '如果出现切换冲动，先把它记到纸上，等下一段再处理。',
  ];

  const rhythmLabel =
    segments.length <= 3
      ? '单段收束'
      : segments.length === 5
        ? '双段推进'
        : '三段推进';

  return {
    title,
    mode,
    score,
    timeWindowLabel: timeWindow.label,
    energyLabel: energyProfile.label,
    taskLabel: taskProfile.label,
    interruptionLabel: INTERRUPTION_PROFILES[normalized.interruption].label,
    startTime: normalized.startTime,
    endTime: addMinutesToClock(normalized.startTime, normalized.duration),
    duration: normalized.duration,
    summary: `从 ${normalized.startTime} 到 ${addMinutesToClock(normalized.startTime, normalized.duration)} 的 ${normalized.duration} 分钟窗口，建议采用「${mode}」：${focusSummary}。`,
    rhythmLabel,
    rhythmNote:
      segments.length <= 3
        ? '这段时间更适合一个起盘、一个主块、一个收口。'
        : segments.length === 5
          ? '这段时间更适合起盘、双主块和一次缓冲。'
          : '这段时间更适合起盘、三段推进和两次缓冲。',
    confidence: score,
    segments,
    reasons,
    checklist,
    guardrails,
    taskFirstMove: taskProfile.firstMove,
  };
}

function renderChip(container, text, tone) {
  const chip = document.createElement('span');
  chip.className = 'focus-chip';
  if (tone) {
    chip.dataset.tone = tone;
  }
  chip.textContent = text;
  container.appendChild(chip);
}

function renderList(container, items) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'focus-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  container.appendChild(list);
}

function renderTimeline(container, segments) {
  container.replaceChildren();
  for (const segment of segments) {
    const item = document.createElement('li');
    item.className = 'focus-step';
    item.dataset.kind = segment.kind;

    const time = document.createElement('span');
    time.className = 'focus-step__time';
    time.textContent = segment.window;

    const body = document.createElement('div');
    body.className = 'focus-step__body';

    const title = document.createElement('p');
    title.className = 'focus-step__title';
    title.textContent = `${segment.title} · ${segment.minutes} 分钟`;

    const note = document.createElement('p');
    note.className = 'focus-step__note';
    note.textContent = segment.note;

    body.append(title, note);
    item.append(time, body);
    container.appendChild(item);
  }
}

function setDefaultFormValues(form) {
  const timeField = form.elements.namedItem('focus-start');
  if (timeField) {
    timeField.value = getCurrentTimeValue();
  }

  const defaults = {
    'focus-title': DEFAULT_VALUES.title,
    'focus-energy': DEFAULT_VALUES.energy,
    'focus-task': DEFAULT_VALUES.taskType,
    'focus-duration': DEFAULT_VALUES.duration,
    'focus-interruption': DEFAULT_VALUES.interruption,
  };

  for (const [name, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  }
}

function collectFormValues(form) {
  return {
    title: form.elements.namedItem('focus-title')?.value || '',
    startTime: form.elements.namedItem('focus-start')?.value || DEFAULT_VALUES.startTime,
    energy: form.elements.namedItem('focus-energy')?.value || DEFAULT_VALUES.energy,
    taskType: form.elements.namedItem('focus-task')?.value || DEFAULT_VALUES.taskType,
    duration: form.elements.namedItem('focus-duration')?.value || DEFAULT_VALUES.duration,
    interruption: form.elements.namedItem('focus-interruption')?.value || DEFAULT_VALUES.interruption,
  };
}

function renderPlan(plan, refs) {
  const { resultBody, emptyState, mode, titleDisplay, lead, meta, rhythm, reasons, timeline, checklist, guardrails } =
    refs;

  emptyState.hidden = true;
  resultBody.hidden = false;

  mode.textContent = `${plan.mode} · 匹配度 ${plan.confidence}/100`;
  titleDisplay.textContent = plan.title;
  lead.textContent = plan.summary;

  meta.replaceChildren();
  renderChip(meta, plan.timeWindowLabel, 'time');
  renderChip(meta, plan.energyLabel, 'energy');
  renderChip(meta, plan.taskLabel, 'task');
  renderChip(meta, `${plan.startTime} → ${plan.endTime}`, 'window');
  renderChip(meta, `${plan.duration} 分钟`, 'duration');
  renderChip(meta, plan.interruptionLabel, 'interruption');

  rhythm.replaceChildren();
  const rhythmList = document.createElement('ul');
  rhythmList.className = 'focus-list';
  const rhythmItems = [
    `节奏标签：${plan.rhythmLabel}`,
    plan.rhythmNote,
    plan.taskFirstMove,
  ];
  for (const item of rhythmItems) {
    const li = document.createElement('li');
    li.textContent = item;
    rhythmList.appendChild(li);
  }
  rhythm.appendChild(rhythmList);

  renderList(reasons, plan.reasons);
  renderTimeline(timeline, plan.segments);
  renderList(checklist, plan.checklist);
  renderList(guardrails, plan.guardrails);
}

function clearResult(refs) {
  refs.resultBody.hidden = true;
  refs.emptyState.hidden = false;
}

function runSelfCheck() {
  const sample = buildWeavePlan({
    title: '写作周报',
    startTime: '09:30',
    energy: 'high',
    taskType: 'writing',
    duration: 75,
    interruption: 'medium',
  });

  const lowEnergySample = buildWeavePlan({
    title: '整理事务',
    startTime: '21:15',
    energy: 'low',
    taskType: 'admin',
    duration: 25,
    interruption: 'high',
  });

  return {
    ok:
      sample.segments.reduce((sum, segment) => sum + segment.minutes, 0) === sample.duration &&
      lowEnergySample.segments.reduce((sum, segment) => sum + segment.minutes, 0) ===
        lowEnergySample.duration &&
      sample.segments.length >= 5 &&
      lowEnergySample.segments.length === 3 &&
      sample.summary.includes('建议采用') &&
      typeof sample.confidence === 'number',
    sampleMode: sample.mode,
    sampleScore: sample.confidence,
    lowEnergyMode: lowEnergySample.mode,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const form = document.getElementById('focus-form');
  const result = document.getElementById('focus-result');
  const emptyState = document.getElementById('focus-empty');
  const resultBody = document.getElementById('focus-result-body');
  const mode = document.getElementById('focus-mode');
  const titleDisplay = document.getElementById('focus-title-display');
  const lead = document.getElementById('focus-lead');
  const meta = document.getElementById('focus-meta');
  const rhythm = document.getElementById('focus-rhythm');
  const reasons = document.getElementById('focus-reasons');
  const timeline = document.getElementById('focus-timeline');
  const checklist = document.getElementById('focus-checklist');
  const guardrails = document.getElementById('focus-guardrails');
  const regenerateButton = document.getElementById('focus-regenerate');
  const clearButton = document.getElementById('focus-clear');

  setDefaultFormValues(form);

  const refs = {
    resultBody,
    emptyState,
    mode,
    titleDisplay,
    lead,
    meta,
    rhythm,
    reasons,
    timeline,
    checklist,
    guardrails,
  };

  function generateFromForm() {
    const plan = buildWeavePlan(collectFormValues(form));
    renderPlan(plan, refs);
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

  window.focusWeaveApp = {
    DEFAULT_VALUES,
    TASK_PROFILES,
    buildWeavePlan,
    getCurrentTimeValue,
    getTaskProfile,
    getEnergyProfile,
    getInterruptionProfile,
    getWindowByTime,
    normalizeWeaveInput,
    runSelfCheck,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VALUES,
    TASK_PROFILES,
    buildWeavePlan,
    getCurrentTimeValue,
    getTaskProfile,
    getEnergyProfile,
    getInterruptionProfile,
    getWindowByTime,
    normalizeWeaveInput,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
