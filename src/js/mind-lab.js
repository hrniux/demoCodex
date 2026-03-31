const QUESTIONS = [
  {
    prompt: '数列：2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '44'],
    correct: 2,
    hint: '每次递增的差值是 4, 6, 8, 10。',
  },
  {
    prompt: '如果所有的“蓝石”都是“圆形”，且有些“圆形”会发光，那么可以确定什么？',
    options: ['所有蓝石都会发光', '有些蓝石可能发光', '所有发光体都是蓝石', '没有蓝石发光'],
    correct: 1,
  },
  {
    prompt: '把单词 TRACE 逆序后，每个字母向后移动一位，结果是？',
    options: ['FDBSU', 'FDCSU', 'FDSBU', 'FECSU'],
    correct: 0,
  },
  {
    prompt: '一块积木每转 90 度会依次显示 △ ○ □ ☆，初始是 △。转 450 度后显示什么？',
    options: ['△', '○', '□', '☆'],
    correct: 1,
  },
  {
    prompt: '三个人中，安比博高，博比成矮，成比安高。谁最高？',
    options: ['安', '博', '成', '无法确定'],
    correct: 2,
  },
  {
    prompt: '哪一个最不像其它三个？',
    options: ['地图', '罗盘', '望远镜', '目录'],
    correct: 3,
  },
  {
    prompt: '如果今天是周三，往后数 17 天是星期几？',
    options: ['周五', '周六', '周日', '周一'],
    correct: 1,
  },
  {
    prompt: '把 9 个点分成 3 组，每组点数互不相同且总和为 9，可能的一组是？',
    options: ['1, 3, 5', '2, 3, 4', '1, 2, 6', '2, 2, 5'],
    correct: 0,
  },
];

function getResultBand(score) {
  if (score <= 2) {
    return {
      title: '观察型热身状态',
      body: '你更像在先收集信息、后进入状态。适合先做两三题热身，再切到高强度逻辑任务。',
    };
  }
  if (score <= 4) {
    return {
      title: '稳健型推理状态',
      body: '你具备稳定的规则识别能力，适合在有限时间内处理清晰边界的问题。',
    };
  }
  if (score <= 6) {
    return {
      title: '分析型模式识别',
      body: '你在数列、条件判断和信息筛选上的连贯性不错，适合处理结构化难题。',
    };
  }
  return {
    title: '高敏型模式策略者',
    body: '你不仅能快速抓住模式，还能在不同题型间切换策略，适合做复杂问题拆解。',
  };
}

function runSelfCheck() {
  return {
    ok:
      QUESTIONS.length === 8 &&
      QUESTIONS.every(
        (question) =>
          question.options.length === 4 &&
          question.correct >= 0 &&
          question.correct < question.options.length,
      ) &&
      getResultBand(7).title.length > 0,
  };
}

function setup() {
  if (typeof document === 'undefined') {
    return;
  }

  const intro = document.getElementById('mind-intro');
  const quiz = document.getElementById('mind-quiz');
  const result = document.getElementById('mind-result');
  const startButton = document.getElementById('mind-start');
  const restartButton = document.getElementById('mind-restart');
  const questionTitle = document.getElementById('mind-question-title');
  const questionBody = document.getElementById('mind-question-body');
  const optionsRoot = document.getElementById('mind-options');
  const step = document.getElementById('mind-step');
  const scoreText = document.getElementById('mind-score');
  const resultTitle = document.getElementById('mind-result-title');
  const resultBody = document.getElementById('mind-result-body');
  const summary = document.getElementById('mind-summary');

  const state = {
    index: 0,
    score: 0,
  };

  function renderQuestion() {
    const current = QUESTIONS[state.index];
    step.textContent = `第 ${state.index + 1} 题 / ${QUESTIONS.length}`;
    scoreText.textContent = `当前得分 ${state.score}`;
    questionTitle.textContent = `题目 ${state.index + 1}`;
    questionBody.textContent = current.prompt;
    optionsRoot.innerHTML = '';

    current.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mind-option';
      button.dataset.index = String(optionIndex);
      button.textContent = `${optionIndex + 1}. ${option}`;
      button.addEventListener('click', () => answer(optionIndex));
      optionsRoot.appendChild(button);
    });
  }

  function showResult() {
    const band = getResultBand(state.score);
    intro.hidden = true;
    quiz.hidden = true;
    result.hidden = false;
    resultTitle.textContent = `${band.title} · ${state.score} / ${QUESTIONS.length}`;
    resultBody.textContent = band.body;
    summary.innerHTML = [
      `正确率：${Math.round((state.score / QUESTIONS.length) * 100)}%`,
      state.score < 4
        ? '建议多做条件推理和数列题，先提取规律再动手。'
        : '建议继续做混合题型训练，强化切换题型时的稳定性。',
      '如果你是靠后半程找回状态，说明你适合先做热身题再处理重点任务。',
    ]
      .map((item) => `<div class="mind-chip">${item}</div>`)
      .join('');
    result.focus();
  }

  function answer(optionIndex) {
    if (optionIndex === QUESTIONS[state.index].correct) {
      state.score += 1;
    }
    state.index += 1;

    if (state.index >= QUESTIONS.length) {
      showResult();
      return;
    }

    renderQuestion();
  }

  function start() {
    state.index = 0;
    state.score = 0;
    intro.hidden = true;
    result.hidden = true;
    quiz.hidden = false;
    renderQuestion();
  }

  startButton.addEventListener('click', start);
  restartButton.addEventListener('click', start);

  window.addEventListener('keydown', (event) => {
    if (quiz.hidden) {
      return;
    }
    const mapped = Number.parseInt(event.key, 10);
    if (Number.isInteger(mapped) && mapped >= 1 && mapped <= 4) {
      event.preventDefault();
      answer(mapped - 1);
    }
  });

  window.mindLabApp = {
    QUESTIONS,
    getResultBand,
    runSelfCheck,
    start,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    QUESTIONS,
    getResultBand,
    runSelfCheck,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setup);
}
