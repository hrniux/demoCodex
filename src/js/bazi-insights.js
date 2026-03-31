const STEMS = [
  { name: '甲', element: 'wood' },
  { name: '乙', element: 'wood' },
  { name: '丙', element: 'fire' },
  { name: '丁', element: 'fire' },
  { name: '戊', element: 'earth' },
  { name: '己', element: 'earth' },
  { name: '庚', element: 'metal' },
  { name: '辛', element: 'metal' },
  { name: '壬', element: 'water' },
  { name: '癸', element: 'water' },
];

const BRANCHES = [
  { name: '子', animal: '鼠', element: 'water' },
  { name: '丑', animal: '牛', element: 'earth' },
  { name: '寅', animal: '虎', element: 'wood' },
  { name: '卯', animal: '兔', element: 'wood' },
  { name: '辰', animal: '龙', element: 'earth' },
  { name: '巳', animal: '蛇', element: 'fire' },
  { name: '午', animal: '马', element: 'fire' },
  { name: '未', animal: '羊', element: 'earth' },
  { name: '申', animal: '猴', element: 'metal' },
  { name: '酉', animal: '鸡', element: 'metal' },
  { name: '戌', animal: '狗', element: 'earth' },
  { name: '亥', animal: '猪', element: 'water' },
];

const ELEMENT_LABELS = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

const FOCUS_COPY = {
  career: '把更多注意力放在任务排序和节奏设计上，避免只凭情绪冲刺。',
  study: '适合把输入拆成模块，先打基础，再做高强度输出。',
  finance: '更适合审视现金流和决策速度，而不是只看短线机会。',
  relationship: '沟通上先确认边界和需求，再谈情绪表达，效率会更高。',
  wellbeing: '保持睡眠、饮水和运动节奏，会比额外堆补剂更有效。',
};

const TONE_COPY = {
  steady: '建议把节奏压稳，优先做好持续性和收尾。',
  bold: '可以适度提高出手频率，但每次行动仍要留一层缓冲。',
  clear: '当前更适合做信息减法，先看关键变量，再决定扩张。',
  soft: '当下适合用更柔和的反馈方式换取更长线的合作空间。',
};

function getStemBranch(year) {
  const offset = year - 1984;
  const stem = STEMS[((offset % 10) + 10) % 10];
  const branch = BRANCHES[((offset % 12) + 12) % 12];
  return { stem, branch };
}

function getHourBranch(hour) {
  return BRANCHES[Math.floor(((hour + 1) % 24) / 2)];
}

function getSeasonElement(month) {
  if ([3, 4, 5].includes(month)) {
    return 'wood';
  }
  if ([6, 7, 8].includes(month)) {
    return 'fire';
  }
  if ([9, 10, 11].includes(month)) {
    return 'metal';
  }
  if ([12, 1, 2].includes(month)) {
    return 'water';
  }
  return 'earth';
}

function rankElements(values) {
  return Object.entries(values).sort((a, b) => b[1] - a[1]);
}

function buildElementScores({ date, hour }) {
  const { stem, branch } = getStemBranch(date.getFullYear());
  const hourBranch = getHourBranch(hour);
  const scores = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  scores[stem.element] += 2;
  scores[branch.element] += 1;
  scores[hourBranch.element] += 1;
  scores[getSeasonElement(date.getMonth() + 1)] += 2;
  scores[Object.keys(scores)[date.getDate() % 5]] += 1;
  scores[Object.keys(scores)[(date.getMonth() + hour) % 5]] += 1;

  return { scores, stem, branch, hourBranch };
}

function buildReading(input) {
  const { scores, stem, branch, hourBranch } = buildElementScores(input);
  const ranked = rankElements(scores);
  const dominant = ranked[0][0];
  const weaker = ranked[ranked.length - 1][0];

  const summary = `${stem.name}${branch.name}年的${branch.animal}象意配上${hourBranch.name}时气，当前最突出的偏向是${ELEMENT_LABELS[dominant]}，相对需要补的是${ELEMENT_LABELS[weaker]}。`;
  const balance = [
    `主导元素：${ELEMENT_LABELS[dominant]}，代表你做事时更容易依赖 ${dominant === 'wood' ? '扩张与生长' : dominant === 'fire' ? '表达与推动' : dominant === 'earth' ? '承接与稳定' : dominant === 'metal' ? '判断与边界' : '流动与感知'}。`,
    `补强元素：${ELEMENT_LABELS[weaker]}，说明你在 ${weaker === 'wood' ? '起步决断' : weaker === 'fire' ? '情绪点燃' : weaker === 'earth' ? '落地耐心' : weaker === 'metal' ? '规则筛选' : '休息与恢复'} 上更需要刻意设计。`,
  ];

  const profile = [
    dominant === 'wood' && '你偏向先看到机会，再逐步长出路径，适合做开局和搭框架的人。',
    dominant === 'fire' && '你偏向用表达和行动带动局面，适合推动氛围和快速点燃项目。',
    dominant === 'earth' && '你偏向稳住节奏、守住秩序，适合承担中段衔接和收尾责任。',
    dominant === 'metal' && '你偏向识别问题、切分优先级，适合做判断和精炼方案的人。',
    dominant === 'water' && '你偏向先感知环境，再找最顺的通道，适合应对变化和复杂情境。',
  ].filter(Boolean);

  const action = [
    FOCUS_COPY[input.focus],
    TONE_COPY[input.tone],
    `补${ELEMENT_LABELS[weaker]}的最好方式，不是空想，而是给这一类行为安排固定时段和固定动作。`,
  ];

  const relationship = [
    dominant === 'metal'
      ? '关系里容易过早进入评判模式，先确认对方想要的是回应还是建议。'
      : '关系里更适合先说明自己的位置和节奏，再讨论对错。',
    weaker === 'water'
      ? '注意保留情绪恢复空间，过度硬扛会让沟通显得更尖锐。'
      : '保持稳定反馈频率，比一次性说很多更容易建立信任。',
  ];

  return {
    summary,
    dominant,
    weaker,
    scores,
    balance,
    profile,
    action,
    relationship,
  };
}

function renderTags(scores) {
  return rankElements(scores)
    .map(
      ([element, value]) =>
        `<span class="bazi-tag" data-tone="${element}">${ELEMENT_LABELS[element]} ${value}</span>`,
    )
    .join('');
}

function renderList(items) {
  return `<ul class="bazi-result-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function runSelfCheck() {
  const reading = buildReading({
    date: new Date('1994-08-17T00:00:00'),
    hour: 9,
    focus: 'career',
    tone: 'steady',
  });
  return {
    ok:
      reading.summary.length > 0 &&
      reading.balance.length === 2 &&
      reading.profile.length >= 1 &&
      reading.action.length === 3 &&
      reading.relationship.length === 2,
    dominant: reading.dominant,
    weaker: reading.weaker,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const form = document.getElementById('bazi-form');
  const result = document.getElementById('bazi-result');
  const placeholder = document.getElementById('bazi-placeholder');
  const summary = document.getElementById('bazi-summary');
  const grid = document.getElementById('bazi-grid');
  const balance = document.getElementById('bazi-balance');
  const profile = document.getElementById('bazi-profile');
  const action = document.getElementById('bazi-action');
  const relationship = document.getElementById('bazi-relationship');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const dateValue = document.getElementById('birth-date').value;
    const timeValue = document.getElementById('birth-time').value;
    const focus = document.getElementById('focus-area').value;
    const tone = document.getElementById('tone').value;
    const [hour] = timeValue.split(':').map(Number);
    const reading = buildReading({
      date: new Date(`${dateValue}T00:00:00`),
      hour,
      focus,
      tone,
    });

    placeholder.hidden = true;
    summary.hidden = false;
    grid.hidden = false;
    summary.innerHTML = `<p>${reading.summary}</p><div class="bazi-tags">${renderTags(reading.scores)}</div>`;
    balance.innerHTML = renderList(reading.balance);
    profile.innerHTML = renderList(reading.profile);
    action.innerHTML = renderList(reading.action);
    relationship.innerHTML = renderList(reading.relationship);
    result.focus();
  });

  form.addEventListener('reset', () => {
    placeholder.hidden = false;
    summary.hidden = true;
    grid.hidden = true;
  });

  window.baziInsightsApp = {
    buildReading,
    runSelfCheck,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildReading,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
