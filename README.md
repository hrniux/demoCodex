# DemoCodex

> 一个以原生 Web 技术构建的小游戏与互动实验合集。  
> A curated collection of browser-native mini games, pixel-art experiments, and interactive demos.

[打开合集入口](./index.html) | [仓库地址](https://github.com/hrniux/demoCodex) | [GitHub About 文案](./.github/project-about.md)

DemoCodex 聚焦于“无需构建、打开即玩”的浏览器体验。当前仓库包含 32 个可直接运行的 HTML 页面，其中 `index.html` 聚合了 27 个主推作品；其余页面保留为实验原型、历史版本或扩展说明页，方便继续迭代和对照实现。

## 项目亮点

- 原生技术栈：以 HTML、CSS、JavaScript、Canvas 与 ES Modules 为核心，不依赖前端框架。
- 上手门槛低：克隆仓库后即可通过本地静态服务器访问，无需安装构建工具。
- 题材覆盖广：包含街机、解谜、像素科普、交互式内容与浏览器实验作品。
- 本地优先：多个页面使用 `localStorage` 保存高分、最佳时间或用户状态。
- 结构可持续：复杂页面逐步拆到 `src/css` 与 `src/js`，便于维护和复用。

## 从哪里开始

推荐入口是 [`index.html`](./index.html)，它提供当前主推页面的统一导航。

### 本地运行

```bash
git clone https://github.com/hrniux/demoCodex.git
cd demoCodex
python3 -m http.server 8000
```

然后在浏览器中访问：

- `http://localhost:8000/index.html`

说明：

- 大多数单文件页面可直接打开。
- 含 ES Module 的页面更适合通过本地静态服务器访问，兼容性更稳定。
- `voxelcraft.html` 依赖 CDN 加载 `three.js`，需要联网。

### 本地验证

```bash
npm install
npm test
npm run test:browser
```

补充说明：

- `npm test` 运行当前内建的逻辑自检，现已覆盖现有主推策略页与新增的 8 个像素小游戏。
- `npm run test:browser` 会自动拉起仓库根目录的本地静态服务，再顺序执行当前已接入统一套件的主推像素游戏浏览器回归。
- 浏览器回归只使用本机已安装的 `Google Chrome`；如路径不在默认位置，可通过环境变量 `DEMOCODEX_CHROME_EXECUTABLE` 指向现有本机 Chrome 可执行文件。
- 仓库不会回退到 Playwright bundled browser，也不需要为本项目运行 `playwright install`。

## 作品清单

### 合集主推页面

| 类型 | 页面 | 简述 |
| --- | --- | --- |
| 导航入口 | `index.html` | DemoCodex 主合集页，适合作为仓库首页和试玩入口。 |
| 个性化内容 | `daily-insights.html` | 融合生肖、星座与节气的每日洞见生成器。 |
| 结构化工具 | `bazi-insights.html` | 输入出生信息后生成五行偏向、性格侧重与行动建议的规则映射工具。 |
| 结构化工具 | `mind-lab.html` | 8 题轻量逻辑测试，提供即时得分、结果分段与简短解读。 |
| 像素街机 | `tank-battle-pixel.html` | 简约像素风坦克大战，强调基地防守、轻量 AI 和零依赖。 |
| 像素策略 | `ember-shift.html` | 像素火线推箱谜局，把水桶送进火点并用泡沫冻结余烬。 |
| 像素策略 | `rail-rift.html` | 断轨峡谷中的补给调度关卡，围绕收集、切线与跃轨窗口展开。 |
| 像素策略 | `glyph-keeper.html` | 符文收集与暗影追逐结合的小型守门关卡。 |
| 像素策略 | `magnet-forge.html` | 像素风磁力推箱谜局，用推动与脉冲牵引把磁芯电池送进反应座，并躲开巡检火花。 |
| 像素策略 | `pixel-orchard.html` | 果园采收街机，边摘果边躲乌鸦，用惊鸟哨抢节奏。 |
| 像素策略 | `signal-sprint.html` | 惯性滑行与芯片收集结合的像素冲刺关卡。 |
| 像素策略 | `vault-pusher.html` | 金库推箱变体，把金条箱推上称重点并躲开探灯。 |
| 像素策略 | `comet-lantern.html` | 夜巡拾星小游戏，用闪灯脉冲震开黑影并回收彗尘。 |
| 像素爆破 | `cavern-blast.html` | 像素风回合制爆破地城，围绕雷芯延时爆炸、碎岩清障与虫群追击展开。 |
| 像素策略 | `frostbite-freight.html` | 冰面惯性货运谜局，利用滑行和制动器把货箱送进停靠位。 |
| 潜行解谜 | `neon-heist.html` | 回合制霓虹潜入小游戏，围绕巡逻同步推进、EMP 停滞、诱饵错位与路线计算展开。 |
| 轨道策略 | `orbit-rescue.html` | 环形轨道回收游戏，利用停滞脉冲与节拍式移动在碎片环带间抢回救生舱。 |
| 港湾策略 | `tide-courier.html` | 港湾潮道投递谜局，利用潮流拖拽与换流浮标反转航道，在驳船间抢回漂流货箱。 |
| 经典休闲 | `snake_game.html` | 经典贪吃蛇，高分可本地保存。 |
| 科普互动 | `dino-pixel-encyclopedia.html` | 像素风恐龙百科，兼顾视觉和知识内容。 |
| 科普互动 | `armory-pixel-arsenal.html` | 像素兵工图鉴，以专题内容页形式展示武器演进。 |
| 科普互动 | `dinosaur_museum.html` | 虚拟恐龙博物馆页面，侧重沉浸式浏览。 |
| 生存动作 | `stellar-escape.html` | 护盾、冲刺与高分追逐结合的太空生存街机体验。 |
| 记忆挑战 | `echo-matrix.html` | 记忆序列与节奏压力结合的霓虹风挑战。 |
| 经典益智 | `tetris.html` | 俄罗斯方块，支持幽灵提示、逐级加速和本地高分。 |
| 经典益智 | `minesweeper.html` | 扫雷，含多难度和最佳时间记录。 |
| 经典益智 | `2048.html` | 2048 滑块合并玩法，支持触摸与键盘。 |
| 街机复刻 | `flappy-bird.html` | 像素飞鸟，一键操作的高分挑战。 |

### 实验与历史页面

| 页面 | 定位 |
| --- | --- |
| `physics_playground.html` | 物理概念展示型页面，使用多个 Canvas 小实验解释基础现象。 |
| `voxelcraft.html` | 基于 `three.js` 的单文件体素世界实验，是仓库中少数依赖外部 CDN 的页面。 |
| `tank-battle.html` | 功能更重的坦克大战历史版本，保留作参考实现。 |
| `tank-battle-achievements.html` | 坦克大战成就展示页，与历史版本配套。 |

## 技术特征

- 渲染方式：Canvas 2D 是主要交互载体，部分页面采用像素风绘制和 `requestAnimationFrame` 循环。
- 代码组织：仓库同时存在单文件原型页与按 `src/css`、`src/js` 拆分的模块化页面。
- 状态持久化：贪吃蛇、2048、扫雷、俄罗斯方块、回声矩阵、星环逃逸、霓虹潜行、轨道营救、潮汐信使、晶洞爆破、磁场工坊、余烬搬运、裂轨列调、符文守卫、像素果园、信号冲刺、金库推箱、彗灯拾星、霜轨货运、像素坦克等页面都使用了浏览器本地存储。
- 依赖策略：除 `voxelcraft.html` 和个别字体资源外，整体坚持轻依赖甚至零依赖。

## 目录结构

```text
.
├── index.html                     # 合集入口 / 默认首页
├── *.html                         # 各独立页面与实验原型
├── src/
│   ├── css/                       # 页面样式
│   └── js/                        # 页面脚本与可复用模块
├── assets/                        # 预留静态资源目录
├── DAILY_INSIGHTS_README.md       # Daily Insights 专项文档
├── TANK_BATTLE_README.md          # 历史坦克大战专项文档
└── .github/project-about.md       # GitHub About 文案源文件
```

## 适合这个仓库的协作方式

- 新增主推页面时，优先把 HTML 保持为骨架，并把样式与逻辑拆到 `src/css`、`src/js`。
- 如果新增的是合集级作品，记得同步更新 `index.html` 的入口和简介。
- 尽量减少外部依赖；若必须引入 CDN 或第三方资源，请在页面头部和 README 中说明。
- 提交前至少用本地静态服务器做一轮人工检查，确认入口、交互和资源路径可用。

## 专项文档

- [`DAILY_INSIGHTS_README.md`](./DAILY_INSIGHTS_README.md)
- [`DAILY_INSIGHTS_QUICKSTART.md`](./DAILY_INSIGHTS_QUICKSTART.md)
- [`TANK_BATTLE_README.md`](./TANK_BATTLE_README.md)
- [`TANK_BATTLE_QUICKSTART.md`](./TANK_BATTLE_QUICKSTART.md)

## GitHub About

仓库 About 的推荐描述、主题标签与主页建议已经整理在 [`./.github/project-about.md`](./.github/project-about.md)。如果你启用了 GitHub Pages，可以直接按该文件中的建议补上项目主页。
