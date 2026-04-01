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

  const grid = document.getElementById("games-grid");
  const totalEl = document.getElementById("menu-total");
  const featuredEl = document.getElementById("menu-featured");
  const subtitleEl = document.getElementById("menu-subtitle");

  if (!grid || !totalEl || !featuredEl || !subtitleEl) {
    return;
  }

  const featuredCount = cards.filter((card) => card.featured).length;
  totalEl.textContent = String(cards.length);
  featuredEl.textContent = String(featuredCount);
  subtitleEl.textContent = `精品 HTML5 游戏 · 纯原生 JavaScript · 零依赖 · ${cards.length} 个主推作品`;

  const fragment = document.createDocumentFragment();

  for (const card of cards) {
    const link = document.createElement("a");
    link.className = card.featured ? "menu-card menu-card--featured" : "menu-card";
    link.href = card.href;
    link.setAttribute("aria-label", card.title);
    link.style.setProperty("--card-start", card.theme[0]);
    link.style.setProperty("--card-end", card.theme[1]);

    const banner = document.createElement("div");
    banner.className = "menu-card__banner";
    banner.setAttribute("aria-hidden", "true");
    banner.textContent = card.icon;

    const content = document.createElement("div");
    content.className = "menu-card__content";

    if (card.badge) {
      const badge = document.createElement("span");
      badge.className = "menu-card__badge";
      badge.textContent = card.badge;
      content.appendChild(badge);
    }

    const title = document.createElement("h3");
    title.className = "menu-card__title";
    title.textContent = card.title;
    content.appendChild(title);

    const description = document.createElement("p");
    description.className = "menu-card__description";
    description.textContent = card.description;
    content.appendChild(description);

    const features = document.createElement("div");
    features.className = "menu-card__features";
    for (const feature of card.features) {
      const tag = document.createElement("span");
      tag.className = "menu-card__tag";
      tag.textContent = feature;
      features.appendChild(tag);
    }
    content.appendChild(features);

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
    fragment.appendChild(link);
  }

  grid.appendChild(fragment);
  grid.setAttribute("aria-busy", "false");
})();
