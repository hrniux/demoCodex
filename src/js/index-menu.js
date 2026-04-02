(() => {
  const cards = [
    {
      title: "Daily Insights · 每日洞见",
      href: "daily-insights.html",
      icon: "✨",
      badge: "🆕 全新发布",
      featured: true,
      theme: ["#8b5cf6", "#ec4899"],
      description:
        "融合中国生肖、西方星座和二十四节气的个性化指导系统。面向海外用户，提供可执行的每日建议，覆盖事业、学业、财富、感情、健康、心态 6 大领域。",
      features: ["🌟 个性化", "🎯 可执行建议", "🌏 文化融合", "✨ 每日更新", "🔮 古老智慧", "🌈 现代科技"],
      cta: "✨ 获取洞见",
      stats: [
        { value: "3,456", label: "独特组合" },
        { value: "6", label: "关注领域" },
        { value: "24", label: "建议模板/领域" },
      ],
    },
    {
      title: "钢铁前线 · 像素坦克大战",
      href: "tank-battle-pixel.html",
      icon: "🎮",
      badge: "⭐ 全新发布",
      featured: true,
      theme: ["#ff6b35", "#f7931e"],
      description:
        "回归简约街机本质的坦克大战版本。像素风主战场、纯原生 JavaScript、基地防守与轻量 AI，同样能打出足够紧张的战斗节奏。",
      features: ["🎯 基地防守", "🧱 可破坏地形", "👾 像素风格", "🤖 轻量 AI", "⌨️ 键盘即玩", "🪶 简洁实现"],
      cta: "🎮 开始游戏",
      stats: [
        { value: "1", label: "核心战场" },
        { value: "60 FPS", label: "流畅运行" },
        { value: "0", label: "外部依赖" },
      ],
    },
    {
      title: "贪吃蛇",
      href: "snake_game.html",
      icon: "🐍",
      theme: ["#06ffa5", "#00b277"],
      description: "经典贪吃蛇游戏，简洁优雅的设计，流畅的操作体验。",
      features: ["经典玩法", "高分记录"],
      cta: "🎮 开始游戏",
    },
    {
      title: "恐龙像素百科",
      href: "dino-pixel-encyclopedia.html",
      icon: "🦖",
      theme: ["#4ecdc4", "#2a9d8f"],
      description: "互动式恐龙百科全书，精美的像素艺术，丰富的恐龙知识。",
      features: ["像素风格", "知识学习"],
      cta: "📖 浏览百科",
    },
    {
      title: "像素武器库",
      href: "armory-pixel-arsenal.html",
      icon: "🔫",
      theme: ["#718dff", "#4361ee"],
      description: "展示各种像素风格武器，炫酷的视觉效果，详细的武器信息。",
      features: ["像素艺术", "武器展示"],
      cta: "⚔️ 查看武器",
    },
    {
      title: "恐龙博物馆",
      href: "dinosaur_museum.html",
      icon: "🏛️",
      theme: ["#ffd60a", "#e85d04"],
      description: "虚拟恐龙博物馆，沉浸式的展览体验，学习古生物知识。",
      features: ["3D 展示", "教育内容"],
      cta: "🦕 参观博物馆",
    },
    {
      title: "星环逃逸",
      href: "stellar-escape.html",
      icon: "☄️",
      theme: ["#38bdf8", "#8b5cf6"],
      description:
        "在逐渐失控的陨石风暴中存活下来。护盾能硬吃风险弹道，冲刺能切开死线，晶体则决定你能坚持多久。",
      features: ["生存街机", "护盾与冲刺", "高分追逐"],
      cta: "☄️ 进入战区",
    },
    {
      title: "回声矩阵",
      href: "echo-matrix.html",
      icon: "🧠",
      theme: ["#fbbf24", "#f472b6"],
      description:
        "记忆和节奏混合在一起的霓虹挑战。每轮多一个步骤，同时还要在限时内完成整段输入。",
      features: ["记忆挑战", "限时压力", "连击计分"],
      cta: "🧠 开始演算",
    },
    {
      title: "霓虹潜行",
      href: "neon-heist.html",
      icon: "🕶️",
      badge: "🆕 新增",
      theme: ["#34d399", "#f59e0b"],
      description:
        "回合制潜入小品。每移动一步，巡逻无人机也会同步推进一步，必须在有限生命内拿齐核心，并用 EMP 与诱饵算准撤离窗口。",
      features: ["潜行解谜", "回合推进", "EMP 冻结", "诱饵错位"],
      cta: "🕶️ 开始潜入",
    },
    {
      title: "轨道营救",
      href: "orbit-rescue.html",
      icon: "🛰️",
      badge: "🆕 新增",
      theme: ["#67e8f9", "#a78bfa"],
      description:
        "在不断旋转的碎片环带之间抢回救生舱。每动一步，所有环带也会同步换位，还得把停滞脉冲留给最危险的返航窗口。",
      features: ["轨道谜局", "回合推进", "脉冲冻结", "救援撤离"],
      cta: "🛰️ 开始回收",
    },
    {
      title: "潮汐信使",
      href: "tide-courier.html",
      icon: "⛵",
      badge: "🆕 新增",
      theme: ["#38bdf8", "#fb923c"],
      description:
        "港湾潮道会在每回合同步拖拽小艇和驳船。你得抢回漂流货箱，踩到换流浮标后反转整片水道，再从灯塔码头完成极限投递。",
      features: ["潮道漂移", "回合策略", "换流反转", "港湾投递"],
      cta: "⛵ 开始出航",
    },
    {
      title: "晶洞爆破",
      href: "cavern-blast.html",
      icon: "🧨",
      badge: "🆕 新增",
      theme: ["#2ee6c6", "#ff8a3d"],
      description:
        "像素风回合制爆破地城。你要一边埋雷、一边引怪，把碎岩炸成通路，把追击虫群炸成积分，再带着 3 枚晶体冲向升降台。",
      features: ["像素爆破", "地城走位", "雷芯节奏", "虫群追击"],
      cta: "🧨 下井开炸",
    },
    {
      title: "磁场工坊",
      href: "magnet-forge.html",
      icon: "🧲",
      badge: "🆕 新增",
      theme: ["#22d3ee", "#fbbf24"],
      description:
        "像素风磁力推箱谜局。你既要顶着磁芯电池找角度，也要用脉冲把远处磁芯拖近一格，再赶在巡检火花贴身前点亮 3 座反应座。",
      features: ["磁力推箱", "像素工坊", "脉冲牵引", "巡检追击"],
      cta: "🧲 启动工坊",
    },
    {
      title: "余烬搬运",
      href: "ember-shift.html",
      icon: "🌋",
      badge: "🆕 新增",
      theme: ["#fb7185", "#f97316"],
      description:
        "像素火线推箱谜局。你要把水桶顶进火点封死余烬走廊，再用泡沫技能抢出一条撤离路径。",
      features: ["火线调度", "推箱封点", "回合撤离"],
      cta: "🌋 进入火线",
    },
    {
      title: "裂轨列调",
      href: "rail-rift.html",
      icon: "🚆",
      badge: "🆕 新增",
      theme: ["#60a5fa", "#fbbf24"],
      description:
        "像素轨道调度小品。沿断裂峡谷边缘抢收补给片，用跃轨窗口避开最危险的轨障区段。",
      features: ["轨道走位", "补给收集", "跃轨保命"],
      cta: "🚆 发车调度",
    },
    {
      title: "符文守卫",
      href: "glyph-keeper.html",
      icon: "🗿",
      badge: "🆕 新增",
      theme: ["#8b5cf6", "#38bdf8"],
      description:
        "像素符文追逐战。边点亮散落符文，边躲暗影逼近，用专注屏障拖住最危险的一回合。",
      features: ["符文收集", "暗影追逐", "专注冻结"],
      cta: "🗿 守住石门",
    },
    {
      title: "像素果园",
      href: "pixel-orchard.html",
      icon: "🍎",
      badge: "🆕 新增",
      theme: ["#22c55e", "#facc15"],
      description:
        "在像素果园里抢收成熟果子，边躲乌鸦边规划回仓路线，哨声用得好能一口气带走最后一筐。",
      features: ["果园采收", "乌鸦压迫", "惊鸟技能"],
      cta: "🍎 开始采收",
    },
    {
      title: "信号冲刺",
      href: "signal-sprint.html",
      icon: "⚡",
      badge: "🆕 新增",
      theme: ["#06b6d4", "#2563eb"],
      description:
        "像素滑行冲刺关卡。靠惯性连吃芯片，利用短冲技能清掉贴脸闸门，把一整段节奏跑顺。",
      features: ["惯性滑行", "芯片连吃", "冲刺破门"],
      cta: "⚡ 冲刺起跑",
    },
    {
      title: "金库推箱",
      href: "vault-pusher.html",
      icon: "💰",
      badge: "🆕 新增",
      theme: ["#fbbf24", "#a855f7"],
      description:
        "经典推箱节奏配上巡逻探灯。把金条箱推上称重点，再卡着烟幕窗口摸到出口。",
      features: ["推箱关卡", "探灯追击", "烟幕潜入"],
      cta: "💰 潜入金库",
    },
    {
      title: "彗灯拾星",
      href: "comet-lantern.html",
      icon: "🌠",
      badge: "🆕 新增",
      theme: ["#0f172a", "#f59e0b"],
      description:
        "提着灯在夜场里收彗尘、躲黑影。闪灯脉冲能清出安全圈，但最关键的还是回收路线判断。",
      features: ["夜巡拾星", "黑影追踪", "闪灯脉冲"],
      cta: "🌠 点亮提灯",
    },
    {
      title: "霜轨货运",
      href: "frostbite-freight.html",
      icon: "❄️",
      badge: "🆕 新增",
      theme: ["#67e8f9", "#94a3b8"],
      description: "整个月台都在打滑。利用货箱挡位、临时制动和冰面惯性，把 3 个货箱送进停靠位。",
      features: ["冰面惯性", "货运推箱", "制动布局"],
      cta: "❄️ 开始发运",
    },
    {
      title: "太阳哨站",
      href: "solar-sentry.html",
      icon: "☀️",
      badge: "🆕 新增",
      theme: ["#fbbf24", "#f97316"],
      description: "高速巡检型回收关卡。先收回 4 颗光核，再用日冕脉冲扫掉碎片，为最后的回航窗口留路。",
      features: ["光核回收", "清场脉冲", "轨道巡检"],
      cta: "☀️ 接管阵列",
    },
    {
      title: "箱线回路",
      href: "crate-circuit.html",
      icon: "📦",
      badge: "🆕 新增",
      theme: ["#22d3ee", "#14b8a6"],
      description: "机房推箱新变体。把 3 个电路箱推到节点上，再卡着断流窗口穿过闸门。",
      features: ["机房推箱", "节点点亮", "断流冻结"],
      cta: "📦 开始接线",
    },
    {
      title: "暗礁打捞",
      href: "reef-raider.html",
      icon: "🪸",
      badge: "🆕 新增",
      theme: ["#22c55e", "#0ea5e9"],
      description: "海床打捞路线题。收回 6 枚遗物，声呐脉冲负责压住潮流，再沿右下出口撤离。",
      features: ["海床潜行", "遗物打捞", "声呐冻结"],
      cta: "🪸 下潜回收",
    },
    {
      title: "炉火佯动",
      href: "forge-feint.html",
      icon: "⚒️",
      badge: "🆕 新增",
      theme: ["#fb7185", "#f97316"],
      description: "锻点推箱谜局。推动 3 块钢胚压住锻点，用冷锤冻结火星，挤出一条侧门路线。",
      features: ["锻点推箱", "火星压迫", "冷锤冻结"],
      cta: "⚒️ 进入锻炉",
    },
    {
      title: "棱镜巡线",
      href: "prism-patrol.html",
      icon: "🔶",
      badge: "🆕 新增",
      theme: ["#a78bfa", "#38bdf8"],
      description: "收束节奏很强的采集关。沿着光廊拿满 5 枚棱镜，用锁光停住威胁，再干净撤离。",
      features: ["棱镜采集", "锁光停顿", "短线撤离"],
      cta: "🔶 开始巡线",
    },
    {
      title: "冰川换道",
      href: "glacier-switch.html",
      icon: "🧊",
      badge: "🆕 新增",
      theme: ["#67e8f9", "#2563eb"],
      description: "会滑行的冰面推箱版。靠雪楔清掉贴脸冰刺，把货箱送上停靠位后再滑进出口。",
      features: ["冰面滑行", "推箱换道", "雪楔清障"],
      cta: "🧊 切入冰道",
    },
    {
      title: "荆棘小径",
      href: "thorn-trail.html",
      icon: "🌿",
      badge: "🆕 新增",
      theme: ["#84cc16", "#f97316"],
      description: "慢节奏林径采集。目标是 7 颗露芽，修枝刀能临时切开藤刺，非常考验绕行判断。",
      features: ["林径采集", "藤刺扩散", "修枝清场"],
      cta: "🌿 穿过荆棘",
    },
    {
      title: "中继冲刺",
      href: "relay-rush.html",
      icon: "📡",
      badge: "🆕 新增",
      theme: ["#06b6d4", "#8b5cf6"],
      description: "高速滑行信道局。沿直线吃下 6 个中继节点，再靠稳频波压住干扰，冲回终端塔。",
      features: ["滑行信道", "节点冲刺", "稳频冻结"],
      cta: "📡 开始冲线",
    },
    {
      title: "琉光升塔",
      href: "lumen-lift.html",
      icon: "💡",
      badge: "🆕 新增",
      theme: ["#38bdf8", "#fbbf24"],
      description: "补光塔主题推箱页。把棱镜箱送上光台，聚光脉冲负责给暗影踩刹车。",
      features: ["补光推箱", "暗影压迫", "聚光冻结"],
      cta: "💡 点亮塔心",
    },
    {
      title: "矿场追标",
      href: "quarry-quest.html",
      icon: "⛏️",
      badge: "🆕 新增",
      theme: ["#f59e0b", "#84cc16"],
      description: "矿区推石撤离关。把 3 块矿石推进标记槽，再卡着定锚窗口从北侧井口带走样本。",
      features: ["矿道推箱", "标记封存", "定锚冻结"],
      cta: "⛏️ 下井清点",
    },
    {
      title: "八字映射实验室",
      href: "bazi-insights.html",
      icon: "☯️",
      badge: "🆕 新站点",
      theme: ["#e9d5c0", "#b65d3b"],
      description:
        "输入出生日期、时间和关注点，基于规则映射生成结构化的五行偏向、性格侧重与行动建议。",
      features: ["结构化解读", "五行偏向", "行动建议"],
      cta: "☯️ 生成解读",
    },
    {
      title: "Mind Lab 智力测试",
      href: "mind-lab.html",
      icon: "🧩",
      badge: "🆕 新站点",
      theme: ["#58d5ff", "#2563eb"],
      description: "8 道轻量逻辑题，覆盖数列、条件推理和模式识别，3 到 5 分钟就能完成一次状态测试。",
      features: ["多题测试", "即时计分", "结果分段"],
      cta: "🧩 开始测试",
    },
    {
      title: "俄罗斯方块",
      href: "tetris.html",
      icon: "🧱",
      badge: "🆕 新增",
      theme: ["#00e5ff", "#7c4dff"],
      description: "经典俄罗斯方块，7 种标准方块、幽灵提示、逐级加速，支持键盘和触屏操控。",
      features: ["经典玩法", "逐级加速", "高分记录"],
      cta: "🧱 开始游戏",
    },
    {
      title: "扫雷",
      href: "minesweeper.html",
      icon: "💣",
      badge: "🆕 新增",
      theme: ["#22c55e", "#15803d"],
      description: "经典扫雷游戏，三种难度等级，首次点击安全机制，最佳时间记录。",
      features: ["三种难度", "安全首击", "计时排名"],
      cta: "💣 开始游戏",
    },
    {
      title: "2048",
      href: "2048.html",
      icon: "🔢",
      badge: "🆕 新增",
      theme: ["#edc22e", "#f59563"],
      description: "经典滑块益智游戏，合并数字方块达到 2048。支持键盘和触摸滑动操作。",
      features: ["益智策略", "触摸操作", "最佳分数"],
      cta: "🔢 开始游戏",
    },
    {
      title: "像素飞鸟",
      href: "flappy-bird.html",
      icon: "🐦",
      badge: "🆕 新增",
      theme: ["#facc15", "#f97316"],
      description: "经典飞翔闯关游戏，点击或按空格控制小鸟穿越管道，看你能飞多远。",
      features: ["一键操作", "无限关卡", "高分记录"],
      cta: "🐦 开始飞翔",
    },
  ];

  const STORAGE_KEYS = {
    favorites: "democodex-menu-favorites",
    recent: "democodex-menu-recent",
  };

  const RECENT_LIMIT = 6;
  const interactiveHrefs = new Set([
    "daily-insights.html",
    "bazi-insights.html",
    "mind-lab.html",
  ]);
  const showcaseHrefs = new Set([
    "dino-pixel-encyclopedia.html",
    "armory-pixel-arsenal.html",
    "dinosaur_museum.html",
  ]);
  const classicHrefs = new Set([
    "snake_game.html",
    "tetris.html",
    "minesweeper.html",
    "2048.html",
    "flappy-bird.html",
  ]);
  const strategyHrefs = new Set([
    "neon-heist.html",
    "orbit-rescue.html",
    "tide-courier.html",
    "cavern-blast.html",
    "magnet-forge.html",
    "ember-shift.html",
    "rail-rift.html",
    "glyph-keeper.html",
    "pixel-orchard.html",
    "signal-sprint.html",
    "vault-pusher.html",
    "comet-lantern.html",
    "frostbite-freight.html",
    "solar-sentry.html",
    "crate-circuit.html",
    "reef-raider.html",
    "forge-feint.html",
    "prism-patrol.html",
    "glacier-switch.html",
    "thorn-trail.html",
    "relay-rush.html",
    "lumen-lift.html",
    "quarry-quest.html",
  ]);

  const categoryCatalog = [
    { id: "all", label: "全部作品", duration: "随时开玩", mood: "主入口视角" },
    { id: "strategy", label: "策略谜局", duration: "4 到 10 分钟", mood: "紧张但清晰" },
    { id: "arcade", label: "街机动作", duration: "2 到 8 分钟", mood: "节奏更快" },
    { id: "classic", label: "经典复刻", duration: "3 到 12 分钟", mood: "熟悉即上手" },
    { id: "interactive", label: "互动内容", duration: "3 到 6 分钟", mood: "轻量探索" },
    { id: "showcase", label: "科普展示", duration: "2 到 5 分钟", mood: "适合慢慢看" },
  ];

  const categoryById = new Map(categoryCatalog.map((item) => [item.id, item]));
  const preparedCards = cards.map((card, index) => prepareCard(card, index));
  const featuredCount = preparedCards.filter((card) => card.featured).length;

  const elements = {
    grid: document.getElementById("games-grid"),
    total: document.getElementById("menu-total"),
    featured: document.getElementById("menu-featured"),
    visible: document.getElementById("menu-visible"),
    subtitle: document.getElementById("menu-subtitle"),
    randomPick: document.getElementById("menu-random-pick"),
    reset: document.getElementById("menu-reset"),
    spotlightLabel: document.getElementById("menu-spotlight-label"),
    spotlightTitle: document.getElementById("menu-spotlight-title"),
    spotlightDescription: document.getElementById("menu-spotlight-description"),
    spotlightTags: document.getElementById("menu-spotlight-tags"),
    spotlightMeta: document.getElementById("menu-spotlight-meta"),
    spotlightLink: document.getElementById("menu-spotlight-link"),
    search: document.getElementById("menu-search"),
    sort: document.getElementById("menu-sort"),
    favoritesToggle: document.getElementById("menu-favorites-toggle"),
    categoryChips: document.getElementById("menu-category-chips"),
    resultsSummary: document.getElementById("menu-results-summary"),
    activeFilters: document.getElementById("menu-active-filters"),
  };

  if (Object.values(elements).some((element) => !element)) {
    return;
  }

  const state = {
    query: "",
    category: "all",
    sort: "recommended",
    onlyFavorites: false,
    favorites: new Set(loadStoredList(STORAGE_KEYS.favorites)),
    recent: loadStoredList(STORAGE_KEYS.recent),
    spotlightHref: getDefaultSpotlight(preparedCards).href,
    spotlightMode: "auto",
  };

  bindEvents();
  render();

  function prepareCard(card, index) {
    const categoryId = deriveCategoryId(card.href);
    const categoryInfo = categoryById.get(categoryId);
    const freshness = card.badge ? 1 : 0;
    const searchText = normalizeText(
      [card.title, card.description, card.cta, categoryInfo.label, ...card.features].join(" ")
    );

    return {
      ...card,
      index,
      categoryId,
      categoryLabel: categoryInfo.label,
      durationLabel: categoryInfo.duration,
      moodLabel: categoryInfo.mood,
      durationWeight: getDurationWeight(categoryId),
      freshness,
      searchText,
    };
  }

  function bindEvents() {
    elements.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      state.spotlightMode = "auto";
      render();
    });

    elements.sort.addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.spotlightMode = "auto";
      render();
    });

    elements.favoritesToggle.addEventListener("click", () => {
      state.onlyFavorites = !state.onlyFavorites;
      state.spotlightMode = "auto";
      render();
    });

    elements.randomPick.addEventListener("click", () => {
      const visibleCards = getVisibleCards();
      if (visibleCards.length === 0) {
        return;
      }

      const nextCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      state.spotlightHref = nextCard.href;
      state.spotlightMode = "random";
      render();
      elements.spotlightLink.focus();
    });

    elements.reset.addEventListener("click", () => {
      resetFilters();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && document.activeElement !== elements.search) {
        event.preventDefault();
        elements.search.focus();
        elements.search.select();
      }

      if (event.key === "Escape" && document.activeElement === elements.search && state.query) {
        event.preventDefault();
        state.query = "";
        elements.search.value = "";
        render();
      }
    });
  }

  function render() {
    const visibleCards = getVisibleCards();
    syncControls();
    renderHero(visibleCards);
    renderCategories();
    renderActiveFilters();
    renderSpotlight(visibleCards);
    renderGrid(visibleCards);
  }

  function syncControls() {
    elements.search.value = state.query;
    elements.sort.value = state.sort;
    elements.favoritesToggle.setAttribute("aria-pressed", String(state.onlyFavorites));
    elements.favoritesToggle.textContent = state.onlyFavorites ? "显示全部" : "只看收藏";
    elements.reset.disabled = !hasActiveFilters();
    elements.randomPick.disabled = getVisibleCards().length === 0;
  }

  function renderHero(visibleCards) {
    elements.total.textContent = String(preparedCards.length);
    elements.featured.textContent = String(featuredCount);
    elements.visible.textContent = String(visibleCards.length);
    elements.resultsSummary.textContent = buildSummary(visibleCards);
    elements.subtitle.textContent = buildSubtitle(visibleCards);
  }

  function renderCategories() {
    const fragment = document.createDocumentFragment();

    for (const category of categoryCatalog) {
      const button = document.createElement("button");
      const count = countCardsForCategory(category.id);
      button.className = "menu-chip";
      button.type = "button";
      button.setAttribute("aria-pressed", String(state.category === category.id));
      button.disabled = count === 0;
      button.addEventListener("click", () => {
        state.category = category.id;
        state.spotlightMode = "auto";
        render();
      });

      const label = document.createElement("span");
      label.textContent = category.label;

      const badge = document.createElement("span");
      badge.className = "menu-chip__count";
      badge.textContent = String(count);

      button.append(label, badge);
      fragment.appendChild(button);
    }

    elements.categoryChips.replaceChildren(fragment);
  }

  function renderActiveFilters() {
    const fragment = document.createDocumentFragment();
    const activeBits = [];

    if (state.category !== "all") {
      activeBits.push(`分类：${categoryById.get(state.category).label}`);
    }

    if (state.query.trim()) {
      activeBits.push(`搜索：${state.query.trim()}`);
    }

    if (state.onlyFavorites) {
      activeBits.push("只看收藏");
    }

    if (state.sort !== "recommended") {
      activeBits.push(`排序：${getSortLabel(state.sort)}`);
    }

    for (const bit of activeBits) {
      const pill = document.createElement("span");
      pill.className = "menu-filter-pill";
      pill.textContent = bit;
      fragment.appendChild(pill);
    }

    if (activeBits.length > 0) {
      const clearButton = document.createElement("button");
      clearButton.className = "menu-clear-filters";
      clearButton.type = "button";
      clearButton.textContent = "清空筛选";
      clearButton.addEventListener("click", () => {
        resetFilters();
      });
      fragment.appendChild(clearButton);
    }

    elements.activeFilters.replaceChildren(fragment);
  }

  function renderSpotlight(visibleCards) {
    const spotlightCard = resolveSpotlightCard(visibleCards);

    if (!spotlightCard) {
      elements.spotlightLabel.textContent = "暂时没找到";
      elements.spotlightTitle.textContent = "没有匹配结果";
      elements.spotlightDescription.textContent = "换个关键词，或者清空筛选后再随机挑一页。";
      elements.spotlightMeta.textContent = "试试：策略、经典、像素、测试、知识";
      elements.spotlightTags.replaceChildren();
      elements.spotlightLink.textContent = "回到全部作品";
      elements.spotlightLink.href = "#menu-browse-title";
      elements.spotlightLink.onclick = () => {
        resetFilters();
      };
      return;
    }

    state.spotlightHref = spotlightCard.href;
    elements.spotlightLabel.textContent = getSpotlightLabel(spotlightCard);
    elements.spotlightTitle.textContent = spotlightCard.title;
    elements.spotlightDescription.textContent = spotlightCard.description;
    elements.spotlightMeta.textContent = `${spotlightCard.categoryLabel} · ${spotlightCard.durationLabel} · ${spotlightCard.moodLabel}`;
    elements.spotlightLink.textContent = spotlightCard.cta;
    elements.spotlightLink.href = spotlightCard.href;
    elements.spotlightLink.onclick = () => {
      recordVisit(spotlightCard.href);
    };

    const tags = spotlightCard.features.slice(0, 4).map((feature) => {
      const tag = document.createElement("span");
      tag.className = "menu-spotlight__tag";
      tag.textContent = feature;
      return tag;
    });
    elements.spotlightTags.replaceChildren(...tags);
  }

  function renderGrid(visibleCards) {
    const fragment = document.createDocumentFragment();

    if (visibleCards.length === 0) {
      fragment.appendChild(createEmptyState());
    } else {
      visibleCards.forEach((card, index) => {
        fragment.appendChild(createCard(card, index, shouldStretchCard(card)));
      });
    }

    elements.grid.replaceChildren(fragment);
    elements.grid.setAttribute("aria-busy", "false");
  }

  function createCard(card, index, featuredLayout) {
    const article = document.createElement("article");
    article.className = `menu-card${featuredLayout ? " menu-card--featured" : ""}${
      card.href === state.spotlightHref ? " menu-card--spotlighted" : ""
    }`;
    article.style.setProperty("--card-start", card.theme[0]);
    article.style.setProperty("--card-end", card.theme[1]);
    article.style.setProperty("--card-delay", `${Math.min(index, 8) * 60}ms`);

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "menu-card__favorite";
    favoriteButton.type = "button";
    favoriteButton.textContent = "★";
    favoriteButton.setAttribute("aria-pressed", String(state.favorites.has(card.href)));
    favoriteButton.setAttribute(
      "aria-label",
      state.favorites.has(card.href) ? `取消收藏 ${card.title}` : `收藏 ${card.title}`
    );
    favoriteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(card.href);
    });

    const link = document.createElement("a");
    link.className = "menu-card__link";
    link.href = card.href;
    link.setAttribute("aria-label", `${card.title}，${card.categoryLabel}`);
    link.addEventListener("click", () => {
      recordVisit(card.href);
    });

    const banner = document.createElement("div");
    banner.className = "menu-card__banner";
    banner.setAttribute("aria-hidden", "true");
    banner.textContent = card.icon;

    const content = document.createElement("div");
    content.className = "menu-card__content";

    const topLine = document.createElement("div");
    topLine.className = "menu-card__topline";

    const category = document.createElement("span");
    category.className = "menu-card__category";
    category.textContent = card.categoryLabel;
    topLine.appendChild(category);

    if (card.badge) {
      const badge = document.createElement("span");
      badge.className = "menu-card__badge";
      badge.textContent = card.badge;
      topLine.appendChild(badge);
    }

    if (state.recent.includes(card.href)) {
      const signal = document.createElement("span");
      signal.className = "menu-card__signal";
      signal.textContent = "最近玩过";
      topLine.appendChild(signal);
    } else if (state.favorites.has(card.href)) {
      const signal = document.createElement("span");
      signal.className = "menu-card__signal";
      signal.textContent = "已收藏";
      topLine.appendChild(signal);
    }

    const title = document.createElement("h3");
    title.className = "menu-card__title";
    title.textContent = card.title;

    const description = document.createElement("p");
    description.className = "menu-card__description";
    description.textContent = card.description;

    const micro = document.createElement("div");
    micro.className = "menu-card__micro";
    for (const text of [card.durationLabel, card.moodLabel, card.featured ? "精选路线" : "直接可玩"]) {
      const item = document.createElement("span");
      item.className = "menu-card__micro-item";
      item.textContent = text;
      micro.appendChild(item);
    }

    const features = document.createElement("div");
    features.className = "menu-card__features";
    for (const feature of card.features) {
      const tag = document.createElement("span");
      tag.className = "menu-card__tag";
      tag.textContent = feature;
      features.appendChild(tag);
    }

    content.append(topLine, title, description, micro, features);

    if (Array.isArray(card.stats) && card.stats.length > 0) {
      const stats = document.createElement("dl");
      stats.className = "menu-card__stats";

      for (const stat of card.stats) {
        const item = document.createElement("div");
        item.className = "menu-card__stat";

        const value = document.createElement("dt");
        value.className = "menu-card__stat-value";
        value.textContent = stat.value;

        const label = document.createElement("dd");
        label.className = "menu-card__stat-label";
        label.textContent = stat.label;

        item.append(value, label);
        stats.appendChild(item);
      }

      content.appendChild(stats);
    }

    const cta = document.createElement("span");
    cta.className = "menu-card__cta";
    cta.textContent = card.cta;
    content.appendChild(cta);

    link.append(banner, content);
    article.append(favoriteButton, link);
    return article;
  }

  function createEmptyState() {
    const wrapper = document.createElement("div");
    wrapper.className = "menu-empty";

    const title = document.createElement("h3");
    title.textContent = "这次筛得太狠了";

    const description = document.createElement("p");
    description.textContent =
      "当前没有作品同时满足这些条件。试着减少关键词、切回全部分类，或者直接点一次“随机挑一页”。";

    const button = document.createElement("button");
    button.className = "menu-clear-filters";
    button.type = "button";
    button.textContent = "清空筛选";
    button.addEventListener("click", () => {
      resetFilters();
    });

    wrapper.append(title, description, button);
    return wrapper;
  }

  function deriveCategoryId(href) {
    if (interactiveHrefs.has(href)) {
      return "interactive";
    }

    if (showcaseHrefs.has(href)) {
      return "showcase";
    }

    if (classicHrefs.has(href)) {
      return "classic";
    }

    if (strategyHrefs.has(href)) {
      return "strategy";
    }

    return "arcade";
  }

  function getDurationWeight(categoryId) {
    switch (categoryId) {
      case "showcase":
        return 2;
      case "interactive":
        return 3;
      case "arcade":
        return 4;
      case "strategy":
        return 5;
      case "classic":
        return 6;
      default:
        return 99;
    }
  }

  function loadStoredList(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  function saveStoredList(key, values) {
    try {
      window.localStorage.setItem(key, JSON.stringify(values));
    } catch {
      // Ignore storage quota issues; the menu still works without persistence.
    }
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getVisibleCards() {
    const query = normalizeText(state.query);
    const filteredCards = preparedCards.filter((card) => {
      if (state.onlyFavorites && !state.favorites.has(card.href)) {
        return false;
      }

      if (state.category !== "all" && card.categoryId !== state.category) {
        return false;
      }

      if (query && !card.searchText.includes(query)) {
        return false;
      }

      return true;
    });

    return sortCards(filteredCards);
  }

  function sortCards(visibleCards) {
    const nextCards = [...visibleCards];

    switch (state.sort) {
      case "recent":
        nextCards.sort((a, b) => getRecentRank(a.href) - getRecentRank(b.href) || compareRecommended(a, b));
        break;
      case "quick":
        nextCards.sort((a, b) => a.durationWeight - b.durationWeight || compareRecommended(a, b));
        break;
      case "name":
        nextCards.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
        break;
      default:
        nextCards.sort(compareRecommended);
        break;
    }

    return nextCards;
  }

  function compareRecommended(a, b) {
    return (
      Number(b.featured) - Number(a.featured) ||
      b.freshness - a.freshness ||
      a.durationWeight - b.durationWeight ||
      a.index - b.index
    );
  }

  function getRecentRank(href) {
    const index = state.recent.indexOf(href);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  function countCardsForCategory(categoryId) {
    const query = normalizeText(state.query);

    return preparedCards.filter((card) => {
      if (state.onlyFavorites && !state.favorites.has(card.href)) {
        return false;
      }

      if (categoryId !== "all" && card.categoryId !== categoryId) {
        return false;
      }

      if (query && !card.searchText.includes(query)) {
        return false;
      }

      return true;
    }).length;
  }

  function buildSummary(visibleCards) {
    const bits = [`显示 ${visibleCards.length} / ${preparedCards.length} 个作品`];

    if (state.category !== "all") {
      bits.push(categoryById.get(state.category).label);
    }

    if (state.query.trim()) {
      bits.push(`命中“${state.query.trim()}”`);
    }

    if (state.onlyFavorites) {
      bits.push(`收藏 ${state.favorites.size} 个`);
    }

    if (state.sort !== "recommended") {
      bits.push(`按${getSortLabel(state.sort)}排序`);
    }

    return `${bits.join(" · ")}。`;
  }

  function buildSubtitle(visibleCards) {
    if (visibleCards.length === 0) {
      return "没有找到匹配项。换个关键词，或者清空筛选后重新开始。";
    }

    if (!hasActiveFilters()) {
      return `${preparedCards.length} 个精选页面，覆盖像素策略、经典街机、互动内容与展示型实验。`;
    }

    const leadCard = visibleCards[0];
    return `当前筛出 ${visibleCards.length} 个结果，第一推荐是「${leadCard.title}」，属于 ${leadCard.categoryLabel}，适合 ${leadCard.durationLabel} 的一轮体验。`;
  }

  function resolveSpotlightCard(visibleCards) {
    if (visibleCards.length === 0) {
      return null;
    }

    const current = visibleCards.find((card) => card.href === state.spotlightHref);
    if (current) {
      return current;
    }

    state.spotlightMode = "auto";

    const fromRecent = visibleCards.find((card) => state.recent.includes(card.href));
    if (fromRecent) {
      return fromRecent;
    }

    return getDefaultSpotlight(visibleCards);
  }

  function getDefaultSpotlight(visibleCards) {
    return visibleCards.find((card) => card.href === "magnet-forge.html") ||
      visibleCards.find((card) => card.featured) ||
      visibleCards[0];
  }

  function getSpotlightLabel(card) {
    if (state.spotlightMode === "random") {
      return "随机点名";
    }

    if (state.onlyFavorites && state.favorites.has(card.href)) {
      return "你的收藏";
    }

    if (state.recent[0] === card.href) {
      return "继续上次那页";
    }

    if (card.featured) {
      return "编辑精选";
    }

    if (state.query.trim()) {
      return "搜索结果中的高匹配项";
    }

    return "今日推荐";
  }

  function getSortLabel(sortId) {
    switch (sortId) {
      case "recent":
        return "最近打开";
      case "quick":
        return "短平快优先";
      case "name":
        return "名称";
      default:
        return "编辑推荐";
    }
  }

  function shouldStretchCard(card) {
    return (
      card.featured &&
      state.category === "all" &&
      !state.query.trim() &&
      !state.onlyFavorites &&
      state.sort === "recommended"
    );
  }

  function toggleFavorite(href) {
    if (state.favorites.has(href)) {
      state.favorites.delete(href);
    } else {
      state.favorites.add(href);
    }

    saveStoredList(STORAGE_KEYS.favorites, [...state.favorites]);
    render();
  }

  function recordVisit(href) {
    state.recent = [href, ...state.recent.filter((item) => item !== href)].slice(0, RECENT_LIMIT);
    saveStoredList(STORAGE_KEYS.recent, state.recent);
  }

  function resetFilters() {
    state.query = "";
    state.category = "all";
    state.sort = "recommended";
    state.onlyFavorites = false;
    state.spotlightMode = "auto";
    state.spotlightHref = getDefaultSpotlight(preparedCards).href;
    render();
  }

  function hasActiveFilters() {
    return state.category !== "all" || Boolean(state.query.trim()) || state.onlyFavorites || state.sort !== "recommended";
  }
})();
