# Story-to-Game v3.0 产品需求文档（PRD）

**日期**：2026-07-04
**版本**：v3.0
**状态**：草案 → 待评审（整合UI设计规范与玩法深度设计）
**基于**：竞品分析 + PRD v1 + PRD v2 + 路线图优化 + UI V2 设计规范 + 玩法深度建议 五份文档交叉验证

---

## 1. 产品定位

Story-to-Game 不是通用游戏引擎，不是纯 AI 聊天工具，也不是 UGC 内容平台。它的独特定位是：

> **「小说/剧本 → AI 高质量改编 → 单文件可部署互动文游」**

在 v2.0 中，这个定位升级为：

> **「类型小说（修仙/无限流/悬疑）专属轻 RPG 互动文游生成器」**

在 v3.0 中，进一步深化为：

> **「类型小说（修仙/无限流/悬疑/末世/宫斗）专属轻 RPG 互动文游生成器，拥有完整视觉设计系统与深度玩法机制」**

### 1.1 与竞品的差异化

| 维度 | Story-to-Game v3.0 | Ink/Inky | Twine | AI Dungeon | 橙光/易次元 |
|------|---------------------|----------|-------|------------|-------------|
| 目标用户 | 网文作者、类型小说读者 | 游戏叙事设计师 | 短篇故事作者 | 普通玩家 | UGC 创作者 |
| AI 改编 | 全流程 AI + 人工可编辑 | 无 | 无 | 实时生成（不稳定） | 无 |
| 文学保真 | 风格指纹 + 13 项校验 | 取决于作者 | 取决于作者 | 不稳定 | 取决于作者 |
| RPG 数值 | 轻 RPG（服务叙事） | 需手写 | 需手写 | 无 | 无 |
| 类型深度 | 5 种类型专属模板 + 主题色/VFX | 无 | 无 | 通用 | 浅层 |
| 视觉系统 | Glassmorphism + Design Tokens + 题材主题 | 取决于作者 | 取决于作者 | 无 | 平台统一 |
| 部署方式 | 单文件 HTML | 需集成 | HTML | 需联网 | 平台内 |
| 商业化 | 开源 + 高级订阅（远期） | 免费开源 | 免费开源 | 订阅制 | 分成 |
| 移动端入口 | 微信小程序并行轨 | 需自行开发 | 基础移动 Web | APP | APP/小程序 |

### 1.2 核心假设（必须验证）

1. **修仙小说的「境界体系」天然适合 RPG 数值化**，且目标用户（修仙读者）对此有明确期待
2. **轻 RPG 不会压过文学性**，只要数值变化先有文本回响、再有数值展示
3. **单文件 HTML 能承载轻 RPG 系统**，性能不会成为瓶颈
4. **微信小程序能复用同一份 JSON 剧本协议**，并成为中文用户传播和未来商业化的移动端入口
5. **AI 能稳定生成符合类型模板的 JSON**，人工可编辑作为兜底
6. **选择有重量感能提升沉浸感**：当玩家在做选择前能感知到选项的重要性时，决策过程的紧张感和参与度显著提升，而非"随便选一个"
7. **成长里程碑仪式感增加留存**：数值突破伴随视觉庆祝动画和题材专属 VFX，比纯数字跳动更能让玩家感受到成长的意义，进而驱动持续游玩

---

## 2. 目标用户

### 2.1 用户画像

| 优先级 | 用户类型 | 规模 | 核心需求 | 痛点 |
|--------|----------|------|----------|------|
| P0 | 修仙网文作者 | 20 万+ | 增加读者粘性、探索互动改编 | 不懂编程、没时间学复杂工具 |
| P0 | 修仙文游玩家 | 500 万+ | 深度互动、RPG 元素、重玩价值 | 现有平台作品互动深度不足 |
| P1 | 无限流爱好者 | 100 万+ | 任务/副本/团队信任机制 | 无专属互动模板 |
| P1 | 教育工作者 | 10 万+ | 创新教学工具、离线部署 | 技术门槛高 |
| P2 | 独立开发者 | 5 万+ | 快速原型、叙事系统 | Ink 学习曲线陡 |
| P2 | 同人创作者 | 50 万+ | 零编程制作同人互动文游 | 没有合适的工具 |

### 2.2 Kano 需求分析

| 需求 | 类型 | 说明 |
|------|------|------|
| AI 自动改编 | 必备 | 没有这个功能，目标用户不会用 |
| 文学质量保真 | 必备 | 改编后风格漂移，用户会弃用 |
| 单文件可部署 | 期望 | 越方便部署，满意度越高 |
| 微信小程序入口 | 期望 | 手机用户更容易在微信生态内传播和试玩 |
| 轻 RPG 系统 | 魅力（修仙用户） | 有则惊喜，没有也能接受（纯文学模式） |
| 选择重量感 | 魅力 | 让选择有"分量"，提升决策沉浸感 |
| 类型专属模板 | 魅力 | 修仙模板是核心差异化 |
| 视觉主题系统 | 魅力 | 毛玻璃/题材主题色/VFX 增强视觉辨识度 |
| 成长仪式感 | 魅力 | 里程碑庆祝动画增加成就感 |
| 移动端体验 | 期望 | 手机游玩是刚需 |
| 商业化支持 | 期望 | 创作者需要变现渠道 |

---

## 3. 核心功能需求

### 3.1 功能分层

```
Layer 1: 叙事引擎（已有）
  - 节点/段落/选项/分支/结局
  - 状态变量/标记/成就
  - 单文件 HTML 播放器

Layer 2: 轻 RPG 系统（v2.0 Q3）
  - 数值可视化（状态栏）
  - 变化反馈（选择后展示）
  - 条件选项（置灰/提示）
  - 类型专属数值（修仙：境界/修为/灵力/道心）
  - 选择重量提示（choice.weight）

Layer 3: 场景互动与深度玩法（v2.0 Q4 / v3.0）
  - 节点内可探索交互（渐进探索系统）
  - 背包/资源系统
  - 任务/倒计时机制
  - 三层后果系统（delayedChanges）
  - 成长里程碑系统（milestones）
  - 完整结局数据包（endings）

Layer 4: 视觉设计系统（UI V2，已实现原型）
  - Glassmorphism 毛玻璃组件系统
  - 5 种题材主题色（修仙金/恐怖红/悬疑蓝/末日绿/宫斗粉）
  - Design Tokens 体系（tokens.css）
  - 题材专属 VFX（转场动画 + 粒子效果）
  - 成就系统（3 种稀有度，8 个分类）
  - 存档系统（8 槽位 localStorage）

Layer 5: 类型模板生态（v2.1 2027）
  - 修仙/无限流/悬疑/末世/宫斗模板
  - AI Skill 自动生成类型适配 JSON
  - 示例库与教程

Parallel Track: 微信小程序播放器
  - 共享 JSON 剧本协议
  - 共享剧情运行核心
  - 原生小程序渲染层
  - 微信分享、云存档、未来支付
```

### 3.2 P0 需求（Q3 2026，必须做）

#### P0-1: `meta.rpg` 字段定义与解析

**需求描述**：在 JSON 顶层 `meta` 中增加 `rpg` 对象，定义可见数值、隐藏数值和展示规则。

**字段定义**：

```json
{
  "meta": {
    "title": "青炉夜火",
    "genre": "xianxia",
    "variableName": "道心",
    "initialVariable": 45,
    "rpg": {
      "enabled": true,
      "mode": "light",
      "primaryStats": [
        {
          "key": "realm",
          "label": "境界",
          "type": "text",
          "default": "炼气三层"
        },
        {
          "key": "cultivation",
          "label": "修为",
          "type": "bar",
          "max": 100
        },
        {
          "key": "qi",
          "label": "灵力",
          "type": "bar",
          "max": 80
        },
        {
          "key": "daoHeart",
          "label": "道心",
          "type": "number"
        }
      ],
      "hiddenStats": ["karma", "tribulationRisk"],
      "conditionDisplay": "disabled"
    }
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 是 | 是否启用 RPG 模式 |
| `mode` | string | 否 | `"light"`（轻 RPG）或 `"standard"`（标准 RPG） |
| `primaryStats` | array | 否 | 可见数值列表，最多 5 个 |
| `primaryStats[].key` | string | 是 | 对应 `variables` 中的键 |
| `primaryStats[].label` | string | 是 | UI 显示标签 |
| `primaryStats[].type` | string | 是 | `"text"` / `"number"` / `"bar"` |
| `primaryStats[].max` | number | 条件 | `type="bar"` 时必填，最大值 |
| `hiddenStats` | array | 否 | 隐藏数值键名列表 |
| `conditionDisplay` | string | 否 | `"hide"`（隐藏不满足）/ `"disabled"`（置灰显示） |

**验收标准**：
- JSON 能正确解析 `meta.rpg`
- `primaryStats` 引用的变量必须在 `variables` 中存在
- `type="bar"` 时必须有 `max`
- `enabled=false` 时完全不渲染 RPG UI

**工作量**：3 天（schema 定义 + 解析代码）

---

#### P0-1.5: 选择重量提示系统（`choice.weight`）

**需求描述**：玩家在做选择前应能感知到选择的重要性，通过视觉差异化让选项具有"重量感"。避免玩家对所有选项一视同仁，草率决策。

**字段定义**：

在 `choices` 数组的每个选项中新增 `weight` 字段：

```json
{
  "choices": [
    {
      "text": "替师父守住丹炉，放弃大比",
      "next": "node_guard_furnace",
      "weight": "critical",
      "weightTag": "关键分歧"
    },
    {
      "text": "参加大比，让丹炉自生自灭",
      "next": "node_join_tournament",
      "weight": "branch",
      "weightTag": "支线影响"
    },
    {
      "text": "先去吃个饭",
      "next": "node_eat",
      "weight": "minor",
      "weightTag": null
    },
    {
      "text": "随意说一句闲话",
      "next": "node_chatter",
      "weight": "cosmetic",
      "weightTag": null
    }
  ]
}
```

**`weight` 取值**：

| 值 | 含义 | 视觉表现 | 标签提示 |
|------|------|----------|----------|
| `critical` | 关键分歧，影响主线走向和结局 | 边框高亮 + 微光呼吸动画 + 特殊图标 | "关键抉择" |
| `branch` | 支线影响，影响次要剧情或NPC关系 | 边框强调 + 轻微高亮 | "支线影响" |
| `minor` | 小事，影响局部细节或小数值 | 默认样式（不添加额外视觉提示） | 无 |
| `cosmetic` | 纯对话，不影响任何状态 | 淡化样式（可选，较浅的透明度） | 无 |
| 未设置 | 向后兼容，视为 `minor` | 默认样式 | 无 |

**字段命名说明**：
- `weightTag`：显示在选择旁边的标签文字，如"关键抉择"、"支线影响"
- `weightHint`：鼠标悬停或长按时显示的详细提示，如"此选择将影响后续剧情走向"
- 两者独立配置，weightTag 用于视觉标签，weightHint 用于信息提示

**UI 规范**：

```
┌─────────────────────────────────────────────────┐
│  你要怎么做？                                    │
│                                                 │
│  [!] 关键抉择                                    │  <- critical: 特殊图标 + 标签
│  ┌──────────────────────────────────────┐       │
│  │  替师父守住丹炉，放弃大比              │  <- 边框高亮 + 呼吸动画
│  └──────────────────────────────────────┘       │
│                                                 │
│  [~] 支线影响                                    │  <- branch: 分支图标 + 标签
│  ┌──────────────────────────────────────┐       │
│  │  参加大比，让丹炉自生自灭              │  <- 边框强调
│  └──────────────────────────────────────┘       │
│                                                 │
│  ○ 先去吃个饭                                   │  <- minor: 默认样式
│                                                 │
└─────────────────────────────────────────────────┘
```

**视觉差异化规则**：

| weight | 边框 | 背景 | 图标 | 标签 | 动画 |
|--------|------|------|------|------|------|
| `critical` | 主题色高亮边框 (2px) | 主题色 10% 透明度底色 | 叹号/闪电 | "关键抉择"标签 | 边框呼吸动画（3s 循环） |
| `branch` | 次要强调色边框 (1px) | 次要色 5% 透明度底色 | 分支图标 | "支线影响"标签 | 无 |
| `minor` | 默认边框 | 无 | 无 | 无 | 无 |
| `cosmetic` | 默认边框（可选淡化） | 无 | 无 | 无 | 无 |

**主题色联动**：`critical` 的高亮颜色应使用当前题材主题色（修仙=金色、恐怖=深红、悬疑=冷蓝、末日=军绿、宫斗=金粉）。

**验收标准**：
- 4 种 weight 级别都有对应视觉样式
- `weight` 未设置时默认为 `minor`，不影响旧 JSON
- `critical` 选项有呼吸动画，在移动端不造成性能问题
- 主题色随 `meta.genre` 自动切换
- 标签文本可被 `weightTag` 自定义覆盖

**工作量**：4 天（UI 组件 + 动画 + 主题色联动）

---

#### P0-2: 启动器顶部状态栏 UI

**需求描述**：在播放器顶部增加 RPG 状态栏，展示 `primaryStats`。

**UI 规范**（对齐 UI V2 组件结构）：

```
┌─────────────────────────────────────────────────┐
│  status-bar (Glassmorphism 半透明底栏)           │
│  ┌──────────────────────────────────────────┐    │
│  │  [书名]     [境界：炼气三层] [修为: 12/100] │
│  │  [菜单]      [灵力: ████░░] [道心: 3]     │
│  └──────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
```

**设计约束**：
- 高度不超过 60px
- 背景：Glassmorphism 毛玻璃效果（`backdrop-filter: blur(12px)`），跟随题材主题色
- 支持暗色/亮色主题（跟随播放器主题）
- 数值条使用 Design Tokens 中的 `--bar-height`、`--bar-radius`、`--bar-fill-color`
- 移动端：横向滚动或折叠为图标

**技术实现**：
- 读取 `meta.rpg.primaryStats`
- `type="text"`：直接显示文本值
- `type="number"`：显示数字
- `type="bar"`：显示进度条（当前值 / max）
- 实时响应 `changes` 更新

**验收标准**：
- 4 种 primaryStats 类型都能正确渲染
- 数值变化时有平滑动画（300ms）
- 毛玻璃背景效果在支持 `backdrop-filter` 的浏览器中正常显示
- 移动端可正常显示
- 纯文学模式（`enabled=false`）不显示状态栏

**工作量**：5 天（UI 组件 + 动画 + 响应式 + 毛玻璃适配）

---

#### P0-3: 状态详情抽屉

**需求描述**：点击状态栏或「状态详情」按钮，展开抽屉展示所有 `variables`（包括隐藏数值）。

**UI 规范**：
- 右侧滑出抽屉（Glassmorphism 风格）
- 显示所有变量名、当前值、类型
- 隐藏数值标记为「隐藏」
- 支持搜索/筛选

**验收标准**：
- 抽屉展开/收起动画流畅
- 显示所有 variables
- 隐藏数值有视觉区分

**工作量**：3 天

---

#### P0-4: `changes` 变化反馈

**需求描述**：玩家做出选择后，系统计算 `changes` 前后的差异，并以 toast/弹窗形式展示。

**`changes` 扩展定义**：

```json
{
  "changes": {
    "val": 5,
    "set": {
      "qi": 40,
      "daoHeart": 2
    },
    "addFlag": {
      "flag": "helped_master",
      "label": "替师父守住丹炉"
    },
    "show": true
  }
}
```

**反馈展示规则**：

```
if changes.show === true:
  计算所有变化（val、set、addFlag）
  显示 toast：
    - 灵力 +10（绿色，positive）
    - 道心 +2（绿色，positive）
    - 修为 +5（绿色，positive）
    - 获得标记：替师父守住丹炉（蓝色，info）

if changes.show === false 或未定义:
  不显示反馈（保持旧行为）
```

**UI 规范**（对齐 UI V2 notifications 组件）：
- Toast 位置：屏幕中央偏下
- 持续时间：2 秒（可配置）
- 动画：从下往上滑入，淡出
- 颜色：positive=绿色，negative=红色，info=蓝色
- Toast 容器使用 Glassmorphism 半透明背景

**验收标准**：
- `show=true` 时正确显示所有变化
- `show=false` 时不显示
- 旧 JSON（无 `show`）保持旧行为
- 动画流畅，不遮挡选项

**工作量**：5 天（变化计算 + Toast 组件 + 动画）

---

#### P0-5: 条件选项置灰与提示

**需求描述**：当选项的 `condition` 不满足时，根据 `meta.rpg.conditionDisplay` 设置，隐藏或置灰该选项。

**`condition` 增强定义**：

```json
{
  "condition": {
    "all": [
      { "var": "qi", "op": ">=", "value": 20 },
      { "flag": "learned_basic_spell" }
    ]
  }
}
```

或简化字符串（向后兼容）：

```json
{
  "condition": "qi >= 20"
}
```

**展示规则**：

```
if conditionDisplay === "hide":
  不满足条件的选项不显示

if conditionDisplay === "disabled":
  不满足条件的选项置灰显示
  鼠标悬停/长按显示条件说明：
    "需要：灵力 >= 20（当前 12）"
    "需要：已学会基础法术"
```

**验收标准**：
- 字符串 condition 继续可用
- 对象 condition 正确解析
- `hide` 模式不显示不满足选项
- `disabled` 模式置灰并显示原因
- 条件满足后选项自动恢复正常

**工作量**：3 天

---

#### P0-6: 修仙 Demo JSON

**需求描述**：制作一个完整的修仙 Demo，展示所有 P0 功能。

**Demo 规格**：
- 节点数：40-80 个
- 结局数：3-5 个
- 核心数值：境界、修为、灵力、道心
- 必须包含：修炼、突破、因果选择、境界反馈
- 必须包含 `choice.weight` 示例（至少 2 个 critical、3 个 branch）
- 必须通过 `validate.py` 校验

**故事大纲**：
- 主角是外门弟子，在宗门大比前三个月获得奇遇
- 关键选择：修炼 vs 历练 vs 闭关
- 数值影响：修为决定突破成功率，道心影响心魔考验
- 结局：筑基成功 / 筑基失败但另有机缘 / 走火入魔

**验收标准**：
- 可完整游玩到结局
- 所有 P0 功能都有展示
- 文学质量不劣于原作
- 玩家测试满意度 >= 7/10

**工作量**：7 天（内容撰写 + JSON 制作 + 调试）

**注意**：这个任务可以和开发并行，但需要等 P0-1 到 P0-5 完成后才能最终联调。

---

#### P0-7: `validate.py` 增强

**需求描述**：校验器需要支持新的 RPG 字段校验。

**新增校验规则**：

| 规则 | 级别 | 说明 |
|------|------|------|
| RPG-001 | error | `meta.rpg.enabled=true` 时，`primaryStats` 不能为空 |
| RPG-002 | error | `primaryStats[].key` 必须在 `variables` 中存在 |
| RPG-003 | error | `type="bar"` 时必须有 `max` 字段 |
| RPG-004 | warning | `primaryStats` 超过 5 个 |
| RPG-005 | error | `hiddenStats` 中的变量必须在 `variables` 中存在 |
| RPG-006 | error | `changes.set` 修改的变量不存在于 `variables` |
| RPG-007 | warning | `condition` 引用的变量不存在于 `variables` |
| RPG-008 | error | `changes.inventory` 导致道具数量为负 |
| RPG-009 | warning | `choice.weight` 取值不在 `critical/branch/minor/cosmetic` 范围内 |
| RPG-010 | warning | `interaction.depth` 取值不在 `surface/deep/ultimate` 范围内 |
| RPG-011 | error | `milestones[].condition` 引用的变量不存在于 `variables` |
| RPG-012 | error | `endings[].condition` 引用的变量不存在于 `variables` |
| RPG-013 | warning | `delayedChanges.set` 修改的变量不存在于 `variables` |

**验收标准**：
- 所有新增规则正确执行
- 旧 JSON 不受影响
- 错误信息清晰，包含具体节点 ID

**工作量**：3 天

---

### 3.3 P1 需求（Q4 2026，应该做）

#### P1-1: 场景交互系统（`interactions`）

**需求描述**：在节点内增加可探索的交互对象，玩家可以先探索再选择。

**字段定义**：

```json
{
  "interactions": [
    {
      "id": "inspect_buddha",
      "label": "查看佛像背后",
      "once": true,
      "condition": "perception >= 3",
      "result": {
        "segments": [
          { "text": "佛像背后刻着一行细字：今晚不要答应任何人。" }
        ],
        "changes": {
          "addFlag": {
            "flag": "found_warning",
            "label": "发现佛像背后的警告"
          },
          "set": { "clue": 1 },
          "show": true
        }
      }
    }
  ]
}
```

**UI 规范**：
- 交互按钮在正文下方、选项上方（对齐 UI V2 的 `interactions` 组件区域）
- `once=true` 执行后标记为「已调查」或隐藏
- 条件不满足的交互置灰或隐藏

**验收标准**：
- 一个节点可包含多个 interactions
- 交互执行后状态变化生效
- once 交互不重复触发
- 交互与选项同屏共存

**工作量**：7 天

---

#### P1-1.5: 渐进探索系统（`interaction.depth`）

**需求描述**：探索应有渐进回报，不同深度的探索提供差异化内容和反馈。不是"看一眼全知道"，而是表面发现 -> 深入挖掘 -> 终极解锁的多层结构。

**字段定义**：

在 `interactions` 数组中，每个交互对象新增 `depth` 字段：

```json
{
  "interactions": [
    {
      "id": "search_library_surface",
      "label": "环顾藏书阁",
      "depth": "surface",
      "result": {
        "segments": [
          { "text": "藏书阁中灰尘厚积，书架上的典籍大多残缺。角落里一盏孤灯忽明忽暗。" }
        ],
        "changes": { "show": true }
      }
    },
    {
      "id": "search_library_deep",
      "label": "仔细翻阅书架底层",
      "depth": "deep",
      "condition": "perception >= 3",
      "result": {
        "segments": [
          { "text": "你蹲下身，在一堆发霉的竹简下发现了一本保存完好的手札。封面上写着《渡劫心要残卷》。" }
        ],
        "changes": {
          "addFlag": { "flag": "found_manual", "label": "发现渡劫心要残卷" },
          "set": { "cultivation": 15 },
          "show": true
        }
      }
    },
    {
      "id": "search_library_ultimate",
      "label": "触摸书架后方隐藏的机关",
      "depth": "ultimate",
      "condition": "all",
      "conditionDetail": [
        { "var": "perception", "op": ">=", "value": 5 },
        { "flag": "found_manual" },
        { "flag": "explored_library_3_times" }
      ],
      "result": {
        "segments": [
          { "text": "机关缓缓转动，书架后露出一间密室。密室中央悬浮着一颗灵珠，散发着温润的光芒。你感到体内灵力开始自行运转——这是一处上古修炼洞府！" }
        ],
        "changes": {
          "addFlag": { "flag": "discovered_secret_cave", "label": "发现上古修炼洞府" },
          "set": { "cultivation": 30, "realm": "筑基初期" },
          "show": true
        }
      }
    }
  ]
}
```

**`depth` 取值**：

| 值 | 含义 | 显示条件 | 反馈差异化 |
|------|------|----------|------------|
| `surface` | 表面探索，默认显示 | 无条件（始终可见） | 基础文本描述 |
| `deep` | 深度探索，需要条件 | 需要 `condition` 满足 | 更详细的文本 + 数值奖励 + 标记获取 |
| `ultimate` | 终极发现，隐藏 | 需要特殊条件（高属性 + 多标记组合 + 多次探索） | 最详细的文本 + 大幅奖励 + 关键标记 + 专属 VFX |

**差异化反馈规则**：

| depth | 文本风格 | 数值奖励 | VFX | 标记 |
|-------|----------|----------|-----|------|
| `surface` | 简短环境描述 | 无或极少 | 无 | 无 |
| `deep` | 中等长度的发现描述 | 中等奖励（+5~15） | 轻微闪光 | 获取一个标记 |
| `ultimate` | 长篇沉浸式描述 + 多段落 | 大幅奖励（+20~50） | 题材专属粒子爆发 + 全屏微光 | 获取关键标记 |

**UI 规范**：

```
可调查：
  [环顾藏书阁]                           <- surface: 默认样式，始终可见

  [仔细翻阅书架底层]                      <- deep: 有条件提示，满足后高亮
  （需要：感知 >= 3）

  [触摸书架后方隐藏的机关]                 <- ultimate: 未满足条件时完全不显示
                                           满足后出现并带有闪光效果
```

**验收标准**：
- 3 种 depth 级别有对应显示逻辑和视觉样式
- `surface` 始终显示，无需条件
- `deep` 有条件时高亮提示，不满足时显示条件要求
- `ultimate` 不满足条件时完全隐藏（不显示按钮），满足条件后以特殊动画出现
- 每种 depth 有差异化的文本长度和反馈强度
- `depth` 未设置时默认为 `surface`，不影响旧 JSON

**工作量**：5 天（UI 组件 + 条件逻辑 + VFX 联动）

---

#### P1-2: 背包与资源系统（`inventory`）

**需求描述**：支持道具获取、消耗和条件判断。

**字段定义**：

```json
{
  "inventory": {
    "spirit_stone": {
      "label": "下品灵石",
      "count": 3,
      "type": "resource"
    },
    "healing_pill": {
      "label": "回春丹",
      "count": 1,
      "type": "consumable"
    }
  }
}
```

轻量版：

```json
{
  "inventory": {
    "spirit_stone": 3,
    "healing_pill": 1
  }
}
```

**changes 扩展**：

```json
{
  "changes": {
    "inventory": {
      "spirit_stone": -1,
      "healing_pill": 1
    }
  }
}
```

**条件扩展**：

```json
{
  "condition": {
    "item": "spirit_stone",
    "op": ">=",
    "value": 1
  }
}
```

**验收标准**：
- 可获得/消耗道具
- 条件可检查道具数量
- 消耗不会降到负数
- 背包面板可打开/关闭（对齐 UI V2 的 `inventory` 组件）

**工作量**：5 天

---

#### P1-2.5: 三层后果系统（`delayedChanges`）

**需求描述**：选择的后果不应只是一次性 Toast，而应有三个层面，让玩家感受到选择的长期影响。

**三层后果架构**：

```
第一层：选择回响（即时反馈）
  - 定义：选择后立即展示的文本/数值反馈
  - 实现：现有的 changes.show 系统（已有）
  - 体验：Toast 弹出 "灵力 +10"、"获得标记：替师父守住丹炉"

第二层：即时后果（延迟到下一节点生效）
  - 定义：做出选择后，进入下一个节点时触发的变化
  - 实现：新增 delayedChanges 字段
  - 体验：进入新节点时，旁白自然融入 "你守了一夜丹炉，身体疲惫不堪" + 数值变化 "灵力 -5"
  - 目的：让后果融入叙事流，而非独立 Toast

第三层：延迟/隐藏后果（多步后显现）
  - 定义：数个节点后甚至不同章节后，之前的选择才产生可见影响
  - 实现：无需新字段，通过 routes/flags 系统实现
  - 体验：在 5 个节点后，因为之前帮助过NPC，该NPC在关键时刻出现帮你
  - 目的：创造"种因得果"的长线叙事体验
```

**`delayedChanges` 字段定义**：

在节点（node）级别新增 `delayedChanges` 字段，结构为数组，支持多条延迟变化：

```json
{
  "id": "node_guard_furnace",
  "segments": [
    { "text": "你选择留在丹炉旁守夜。炉火跳动，映照出你疲惫却坚定的面容。" }
  ],
  "choices": [
    {
      "text": "默默守护到天亮",
      "next": "node_next_morning"
    }
  ],
  "delayedChanges": [
    {
      "triggerNode": "node_025",
      "changes": {
        "val": -2,
        "set": {
          "qi": -5,
          "masterTrust": -10
        },
        "addFlag": {
          "flag": "guardian_of_furnace",
          "label": "丹炉守护者"
        },
        "show": true
      },
      "reason": "师父发现了你隐瞒真相的事"
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `triggerNode` | string | 是 | 延迟到哪个节点触发。值为目标节点的 `id`。MVP 阶段只支持 `"next"`（下一个节点），后续阶段支持任意节点 ID |
| `changes` | object | 是 | 触发时执行的状态变化，结构同 `changes` |
| `reason` | string | 否 | 解释延迟后果的原因文本，在触发时向玩家展示 |

**执行逻辑**：

```
玩家在节点 A 做出选择:
  1. 立即执行 A 的 changes（第一层：选择回响）→ Toast 显示
  2. 将 A 的 delayedChanges 存入 pending 队列，关联 triggerNode
  3. 进入节点 B 时:
     a. 先渲染 B 的 segments
     b. 检查 pending 队列中 triggerNode 匹配 B.id 的所有 delayedChanges
     c. 依次执行匹配的 delayedChanges
     d. 如果 reason 存在，以旁白风格插入到 B 的叙事文本中
     e. 如果 changes.show === true，额外显示 Toast
     f. 从 pending 队列中移除已执行的项
```

**验收标准**：
- `delayedChanges` 在下一节点进入时正确生效
- `reason` 文本以旁白风格自然融入当前节点叙事
- 第一层（changes.show）和第二层（delayedChanges）可以同时存在，互不干扰
- 第三层后果通过 flags/routes 系统正常工作
- `delayedChanges` 未设置时完全不影响旧 JSON

**工作量**：5 天（延迟队列 + 执行引擎 + reason 渲染）

---

#### P1-3: 成长里程碑系统（`milestones`）

**需求描述**：成长不应只是数字变化，应有仪式感。当玩家达成关键成长节点时，触发全屏庆祝动画和题材专属 VFX，让玩家切实感受到突破的分量。

**数据结构定义**：

在 JSON 顶层新增 `milestones` 数据包：

```json
{
  "meta": { "...": "..." },
  "milestones": [
    {
      "id": "milestone_first_win",
      "name": "初战告捷",
      "desc": "第一次在战斗中获胜",
      "condition": {
        "all": [
          { "var": "wins", "op": ">=", "value": 1 }
        ]
      },
      "celebration": "small",
      "vfx": "sparkle",
      "once": true,
      "segments": [
        { "text": "你第一次战胜了对手。虽然只是小试牛刀，但这个瞬间，你真切地感受到了自己的成长。" }
      ]
    },
    {
      "id": "milestone_breakthrough",
      "name": "突破筑基",
      "desc": "成功突破到筑基境界",
      "condition": {
        "all": [
          { "var": "realm", "op": "==", "value": "筑基初期" }
        ]
      },
      "celebration": "large",
      "vfx": "realm_breakthrough",
      "once": true,
      "segments": [
        { "text": "灵力在经脉中奔涌如潮，你感到一道屏障在体内碎裂——筑基，成功了！周身灵气化为一道金光冲天而起，整个宗门都感受到了这股波动。" }
      ]
    },
    {
      "id": "milestone_learn_spell",
      "name": "领悟功法",
      "desc": "学会第一个功法",
      "condition": {
        "flag": "learned_first_spell"
      },
      "celebration": "medium",
      "vfx": "spell_discover",
      "once": true,
      "segments": [
        { "text": "你翻阅着手中的功法，忽然灵光一闪——那些晦涩的文字仿佛活了过来，在你的脑海中自行演绎。你，领悟了。" }
      ]
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 里程碑唯一标识 |
| `name` | string | 是 | 里程碑名称 |
| `desc` | string | 否 | 简短描述 |
| `condition` | object/string | 是 | 触发条件，复用 condition 系统 |
| `celebration` | string | 是 | 庆祝规模：`"small"` / `"medium"` / `"large"` |
| `vfx` | string | 否 | VFX 类型标识，对应题材主题专属效果 |
| `once` | boolean | 否 | 是否只触发一次（默认 true） |
| `segments` | array | 否 | 触发时的叙事文本段落 |

**庆祝规模与视觉效果**：

| celebration | 视觉效果 | 持续时间 | 场景处理 |
|-------------|----------|----------|----------|
| `small` | 屏幕边缘微光 + 短暂音效提示 + 底部通知条 | 1.5 秒 | 不阻断叙事流，通知条叠加在当前场景上 |
| `medium` | 全屏半透明庆祝覆盖层 + 题材主题色光效 + 里程碑名称展示 + 简短叙事文本 | 3 秒 | 暂停当前场景，展示后恢复 |
| `large` | 全屏沉浸式庆祝动画 + 题材专属 VFX 粒子爆发 + 里程碑名称大字展示 + 长篇叙事文本 + 背景音乐变化 | 5-8 秒 | 全屏覆盖，展示后恢复到触发节点 |

**题材专属 VFX 映射**：

| genre | `small` VFX | `medium` VFX | `large` VFX |
|-------|-------------|--------------|------------|
| `xianxia` | 灵气微光 | 功法领悟（符文浮现） | 境界突破（金光冲天 + 水墨晕开） |
| `horror` | 生存闪光 | 线索发现（恐惧闪屏） | 存活归来（画面撕裂重组） |
| `mystery` | 线索微闪 | 推理成功（打字机效果） | 案件破解（线索聚合爆发） |
| `apocalypse` | 资源提示 | 避难所升级（警告闪光） | 幸存者集结（噪点闪烁 + 光芒） |
| `palace` | 金色微光 | 权力晋升（帷幕微动） | 登顶（帷幕拉开 + 金色粒子） |

**类型示例**：

**修仙题材里程碑**：
| 里程碑 | 庆祝级别 | 说明 |
|--------|----------|------|
| 突破境界（炼气 -> 筑基 -> 金丹） | `large` | 核心成长，全屏庆祝 |
| 领悟功法 | `medium` | 重要但非核心，中等庆祝 |
| 首次获胜 | `small` | 鼓励性反馈 |
| 获得法宝 | `medium` | 重要收获 |
| 道心觉醒 | `large` | 精神层面的突破 |

**无限恐怖题材里程碑**：
| 里程碑 | 庆祝级别 | 说明 |
|--------|----------|------|
| 存活归来 | `large` | 完成副本存活，全屏庆祝 |
| 首次团灭存活 | `medium` | 团队覆灭但主角存活 |
| 发现关键线索 | `small` | 推进剧情的小发现 |
| 奖励点突破 | `medium` | 经济系统的重要节点 |

**验收标准**：
- 3 种庆祝级别都有对应视觉效果
- 5 种题材主题的 VFX 正确联动
- `once=true` 的里程碑只触发一次
- 里程碑触发时不丢失当前游戏状态
- 移动端 large 庆祝动画不卡顿
- 里程碑未定义时，旧 JSON 完全不受影响

**工作量**：8 天（里程碑引擎 + 3 种庆祝 UI + 5 种题材 VFX + 移动端适配）

---

#### P1-3.5: 完整结局数据包（`endings`）

**需求描述**：在 JSON 顶层定义所有结局，支持多结局追踪、隐藏结局和结局回顾。

**数据结构定义**：

在 JSON 顶层新增 `endings` 数据包：

```json
{
  "meta": { "...": "..." },
  "endings": [
    {
      "id": "ending_core_success",
      "name": "筑基成功，大道可期",
      "desc": "你在宗门大比中脱颖而出，成功筑基。师父颔首微笑，前路虽然漫长，但你的修仙之路已经正式开启。",
      "type": "true",
      "condition": {
        "all": [
          { "var": "realm", "op": "==", "value": "筑基初期" },
          { "var": "daoHeart", "op": ">=", "value": 60 }
        ]
      },
      "hidden": false
    },
    {
      "id": "ending_dark",
      "name": "走火入魔",
      "desc": "灵力失控，经脉寸断。你沉沦在无边的黑暗中...",
      "type": "dark",
      "condition": {
        "all": [
          { "var": "qi", "op": "<=", "value": 0 },
          { "flag": "used_forbidden_technique" }
        ]
      },
      "hidden": false
    },
    {
      "id": "ending_hidden_master",
      "name": "??????",
      "desc": "一段尚未被揭示的命运...",
      "type": "hidden",
      "condition": {
        "all": [
          { "var": "cultivation", "op": ">=", "value": 100 },
          { "flag": "found_secret_cave" },
          { "flag": "refused_all_help" }
        ]
      },
      "hidden": true
    },
    {
      "id": "ending_ordinary",
      "name": "归于平凡",
      "desc": "你选择离开宗门，回到凡俗。修仙之路或许不属于你，但你找到了属于自己的平静。",
      "type": "neutral",
      "condition": {
        "flag": "chose_to_leave"
      },
      "hidden": false
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 结局唯一标识 |
| `name` | string | 是 | 结局名称（隐藏结局用 `??????` 或模糊化文字） |
| `desc` | string | 否 | 结局描述（隐藏结局用模糊描述） |
| `type` | string | 是 | 结局类型，见下表 |
| `condition` | object/string | 是 | 触发条件，复用 condition 系统 |
| `hidden` | boolean | 否 | 是否为隐藏结局（默认 false） |

#### 结局检测时机

endings 的 condition 检测有两种模式：

**节点候选模式（推荐，MVP 实现）**：
- 在特定节点上通过 `candidateEndings: ["ascension", "demon_path"]` 显式声明该节点是"结局候选节点"
- 只有到达结局候选节点时，才检测声明的 endings.condition
- 避免在非结局节点上误触发结局

**全量检测模式（后续）**：
- 每次状态变化后，遍历所有 endings.condition
- 增加防重复机制：同一结局在未解除"冷却"前不重复检测
- 适用于有多个可能的"意外结局"场景

**`candidateEndings` 用法示例**：

```json
{
  "id": "node_final_battle",
  "segments": [{ "text": "最终的战斗结束了..." }],
  "candidateEndings": ["ascension", "demon_path", "secret_ending", "ending_ordinary"]
}
```

**结局类型**：

| type | 含义 | 色调 |
|------|------|------|
| `true` | 真结局 / 最佳结局 | 金色 |
| `dark` | 坏结局 / 黑暗结局 | 深红 |
| `romance` | 感情结局 | 粉色 |
| `neutral` | 普通结局 / 平凡结局 | 灰色 |
| `noble` | 牺牲结局 / 壮烈结局 | 银白 |
| `hidden` | 隐藏结局 / 彩蛋结局 | 特殊渐变 |

**隐藏结局机制**：

- `hidden: true` 的结局在结局追踪 UI 中显示为模糊状态（名称和描述被 `???` 替代）
- 玩家达成隐藏结局后，永久解锁该结局的名称、描述和 CG/插图（如有）
- 隐藏结局的解锁状态保存在存档中

**结局追踪 UI（mini dot tracker）**：

```
结局收集：3/6

  [T] [D] [N] [?] [?] [?]
  已收集    未发现

图例：
  T = true（金色圆点）
  D = dark（深红圆点）
  N = neutral（灰色圆点）
  R = romance（粉色圆点）
  S = noble（银白圆点）
  ? = hidden（暗色圆点 + 微弱闪光）
```

- 位于存档界面或主菜单
- 已达成的结局显示类型缩写 + 对应颜色
- 未达成的普通结局显示为暗色空圆点
- 未达成的隐藏结局显示为暗色圆点 + 微弱闪光（暗示存在，但不透露信息）
- 点击已解锁的结局可查看回顾

**验收标准**：
- 所有结局类型有对应视觉样式
- 隐藏结局正确显示为模糊状态，达成后解锁
- 结局 dot tracker 正确显示收集进度
- 结局解锁状态正确持久化到存档
- `endings` 未定义时，旧 JSON 使用默认的节点结束行为

**工作量**：6 天（endings 引擎 + dot tracker UI + 隐藏结局逻辑 + 存档联动）

---

#### P1-4: 无限恐怖模板 Demo

**需求描述**：制作无限恐怖类型 Demo，展示任务/倒计时/团队信任机制。

**Demo 规格**：
- 节点数：60-100 个
- 核心数值：HP、理智、奖励点、团队信任、危险度、时间
- 必须包含：任务发布、场景搜索、团队分歧、危机事件、回归结算
- 必须包含 `choice.weight` 和 `delayedChanges` 示例
- 必须包含 `milestones` 示例（至少 3 个：存活归来 large、团灭存活 medium、发现线索 small）
- 必须包含 `endings` 示例（至少 4 个：存活回归 true、团灭 dark、背叛 neutral、隐藏 hidden）

**工作量**：10 天

---

#### P1-5: Skill 类型识别升级

**需求描述**：AI Skill 能自动识别小说类型并生成对应的 RPG 字段。

**类型识别规则**：

```
如果原作包含以下关键词/模式：
  - 修仙/修真/境界/筑基/金丹/元婴/渡劫/灵力/法宝/丹药
  → genre: "xianxia"
  → 自动生成 meta.rpg（境界/修为/灵力/道心）
  → 自动生成 milestones（突破境界 large、领悟功法 medium、首次获胜 small）
  → 自动生成 endings（true/dark/neutral/hidden）

  - 主神空间/副本/恐怖/生存/奖励点/强化
  → genre: "horror"
  → 自动生成 meta.rpg（HP/理智/奖励点/团队信任）
  → 自动生成 milestones（存活归来 large、团灭存活 medium、发现线索 small）
  → 自动生成 endings（true/dark/neutral/hidden）

  - 侦探/推理/凶手/线索/证词/密室
  → genre: "mystery"
  → 自动生成 meta.rpg（线索/推理/压力/嫌疑）
  → 自动生成 milestones（案件破解 large、关键推理 medium、发现线索 small）
  → 自动生成 endings（true/dark/neutral/hidden）
```

**验收标准**：
- 修仙素材自动识别准确率 >= 80%
- 生成的 JSON 能通过 validate.py
- 用户可覆盖 AI 的自动识别结果
- 自动生成的 milestones 和 endings 符合题材特征

**工作量**：7 天

---

#### P1-6: 调试器增强

**需求描述**：增强开发者调试面板，支持查看/修改所有状态。

**新增功能**：
- 查看所有 variables 当前值
- 修改任意 variable
- 查看/修改 inventory
- 查看/添加/删除 flags
- 查看当前节点所有选项的条件计算结果
- 查看 routes 命中情况
- 查看 milestones 触发状态和延迟队列
- 查看 endings 达成状态
- 手动触发 milestone 庆祝动画（调试用）

**工作量**：5 天

---

#### P1-7: 微信小程序技术验证

**需求描述**：建立最小微信小程序播放器，验证同一份修仙 Demo JSON 能在微信环境中稳定播放。该任务不替代 HTML 主线，Q3 可作为技术预研并行推进，Q4 进入内测版。

**MVP 范围**：
- 加载内置修仙 Demo JSON
- 渲染 `segments`、`choices` 和 `meta.rpg.primaryStats`
- 执行 `changes` 并显示变化反馈
- 支持条件选项置灰
- 使用 `wx.setStorageSync` / `wx.getStorageSync` 保存本地进度
- 禁止使用 `eval`，所有条件走安全解析器

**不做**：
- 不做登录
- 不做支付
- 不做云存储
- 不做作品市场
- 不做用户导入 JSON

**验收标准**：
- 同一份修仙 Demo JSON 可在 HTML 和小程序中播放
- 小程序端单次选择响应时间 <= 200ms
- 本地存档可保存和恢复当前节点、变量、flags、成就
- 小程序端不使用 `eval`

**工作量**：5 天

---

### 3.4 P2 需求（2027 Q1，可以做）

**重要说明**：UI V2 设计系统（Glassmorphism、Design Tokens、5 种题材主题色、VFX 特效、成就系统、存档系统）已在原型阶段完成了远超原 P2 范围的工作。当前 P2 阶段的焦点不再是"设计 UI"，而是将已有 UI V2 组件与实际 JSON 数据驱动对接。

| 编号 | 需求 | 说明 | 工作量 |
|------|------|------|--------|
| P2-1 | JSON 驱动 UI 对接 | 将 UI V2 的 Glassmorphism 组件（scene-viewport、status-bar、narrative、interactions、inventory、notifications、achievements、endings）与 JSON 引擎对接，实现真实数据驱动的渲染 | 14 天 |
| P2-2 | 悬疑/末世/宫斗模板 | 三类各一个 Demo，包含 milestones、endings、delayedChanges | 10 天 |
| P2-3 | 示例库与文档 | 每类至少一个完整 Demo + 教程 | 5 天 |
| P2-4 | 微信小程序内测版 | 作品列表、云端 JSON 加载、分享卡片、云存档评估 | 10 天 |
| P2-5 | 云存储 + 多设备同步 | 可选功能 | 14 天 |
| P2-6 | 创作者平台 | 上传/分享/收费；小程序可作为优先分发入口 | 30 天 |

**UI V2 现有组件清单（已完成原型，待 JSON 对接）**：

| 组件 | 说明 | JSON 数据源 |
|------|------|-------------|
| `scene-viewport` | 主视口容器，包含场景背景和叙事区 | `segments`、`scene` |
| `status-bar` | 顶部状态栏（Glassmorphism） | `meta.rpg.primaryStats` |
| `narrative` | 叙事文本展示区 | `segments` |
| `interactions` | 交互按钮区 | `interactions`（含 `depth`） |
| `choices` | 选项区（含 `choice.weight` 视觉） | `choices` |
| `inventory` | 背包面板 | `inventory` |
| `notifications` | Toast/通知系统 | `changes.show`、`delayedChanges` |
| `achievements` | 成就面板 | `achievements` |
| `endings` | 结局追踪 dot tracker | `endings` |
| `milestone-overlay` | 里程碑庆祝覆盖层 | `milestones` |

---

## 4. 技术约束

### 4.1 单文件 HTML 限制

- **文件大小**：含 JSON 的 HTML 应 < 5MB
- **节点数量**：现代浏览器可流畅运行 5000+ 节点
- **内存占用**：RPG 状态数据应在 100KB 以内
- **兼容性**：支持 Chrome 90+、Firefox 88+、Safari 14+、Edge 90+

### 4.2 JSON Schema 约束

- 所有新增字段必须**可选**，旧 JSON 完全兼容
- `meta.rpg` 不存在时，播放器行为与 v1.x 完全一致
- 不允许删除或修改已有字段的语义
- HTML 播放器和微信小程序必须消费同一份 JSON 剧本协议
- Skill 后续应优先生成对象化 `condition`，字符串条件只作为兼容格式

**v3.0 新增字段兼容性规则**：

| 新增字段 | 位置 | 默认行为（未设置时） | 兼容性说明 |
|----------|------|----------------------|------------|
| `choice.weight` | `choices[].weight` | 默认视为 `"minor"`，不显示任何重量标签或特殊样式 | 完全向后兼容，旧 JSON 的所有选项自动为 minor |
| `choice.weightTag` | `choices[].weightTag` | 使用 weight 对应的默认标签文本 | 可选覆盖默认标签 |
| `interaction.depth` | `interactions[].depth` | 默认视为 `"surface"`，始终显示 | 完全向后兼容，旧 JSON 的所有交互自动为 surface |
| `delayedChanges` | `node.delayedChanges` | 不存在时不执行任何延迟变化 | 完全向后兼容，延迟队列为空时无任何副作用 |
| `delayedChanges[].triggerNode` | `delayedChanges[].triggerNode` | MVP 阶段只支持 `"next"` | 数组结构，支持多条延迟变化 |
| `delayedChanges[].reason` | `delayedChanges[].reason` | 不追加任何原因文本 | 可选字段，提供时以旁白风格展示 |
| `milestones` | 顶层 `milestones` 数组 | 不存在时不触发任何里程碑 | 完全向后兼容，不影响节点推进逻辑 |
| `milestones[].celebration` | `milestones[].celebration` | 必填（仅当 milestones 存在时） | milestones 整体可选 |
| `milestones[].vfx` | `milestones[].vfx` | 使用题材默认 VFX | 可选覆盖 |
| `endings` | 顶层 `endings` 数组 | 不存在时使用默认的节点结束行为（到达无 choices 的节点即结束） | 完全向后兼容 |
| `endings[].hidden` | `endings[].hidden` | 默认 false（非隐藏） | 完全向后兼容 |
| `ending.type` | `endings[].type` | 必填（仅当 endings 存在时） | endings 整体可选 |

**向后兼容策略**：
- 所有新增字段均为顶层可选或对象内可选，不改变任何已有字段的结构
- 旧版播放器遇到未知字段时应静默忽略（`Object.keys` 遍历时跳过未知属性）
- 新版播放器读取旧版 JSON 时，所有新增系统自动降级为关闭状态

### 4.3 共享核心与小程序架构

微信小程序不直接复用单文件 HTML UI。长期架构是抽出平台无关的剧情运行核心，HTML 和小程序分别实现渲染层。

```text
core/
  ├── story-engine.js       # 节点推进、next、choices、routes
  ├── condition-engine.js   # condition 判断，不使用 eval
  ├── change-engine.js      # changes 应用和差异计算
  ├── delayed-change-engine.js  # delayedChanges 延迟队列管理（v3.0 新增）
  ├── milestone-engine.js   # milestones 触发检测与庆祝队列（v3.0 新增）
  ├── ending-engine.js      # endings 条件检测与解锁状态（v3.0 新增）
  ├── save-model.js         # 存档数据结构（含 milestones/endings 解锁状态）
  ├── validation-lite.js    # 运行时轻校验
  └── adapters/
      ├── web-adapter.js
      └── wechat-adapter.js

launcher/
  -> 调用 core
  -> 使用 DOM/CSS 渲染

miniprogram/
  -> 调用 core
  -> 使用 WXML/WXSS 渲染
```

### 4.4 HTML 代码结构

建议将单文件 HTML 拆分为源码模块，构建时打包：

```
launcher/src/
  ├── index.html          # 入口
  ├── css/
  │   ├── tokens.css      # Design Tokens（颜色、阴影、圆角、间距、字体、动画、z-index）（v3.0 新增）
  │   ├── themes/         # 题材主题色文件（v3.0 新增）
  │   │   ├── xianxia.css
  │   │   ├── horror.css
  │   │   ├── mystery.css
  │   │   ├── apocalypse.css
  │   │   └── palace.css
  │   ├── main.css        # 基础样式（含 Glassmorphism 基础）
  │   ├── rpg.css         # RPG 状态栏样式
  │   ├── milestone.css   # 里程碑庆祝覆盖层样式（v3.0 新增）
  │   ├── ending.css      # 结局 UI / dot tracker 样式（v3.0 新增）
  │   └── mobile.css      # 移动端适配
  ├── js/
  │   ├── engine.js       # 核心引擎（节点推进）
  │   ├── state.js        # 状态管理（variables/flags/inventory）
  │   ├── rpg.js          # RPG 系统（状态栏/变化反馈）
  │   ├── delayed-change.js  # 延迟变化系统（v3.0 新增）
  │   ├── milestone.js    # 里程碑系统（v3.0 新增）
  │   ├── ending.js       # 结局系统（v3.0 新增）
  │   ├── render.js       # 渲染（文本/选项/交互）
  │   ├── vfx.js          # VFX 特效引擎（转场 + 粒子 + 庆祝动画）（v3.0 新增）
  │   ├── storage.js      # 存档/读档
  │   ├── devtools.js     # 调试面板
  │   └── validation.js   # 运行时校验
  └── build.js            # 打包为单文件 HTML
```

### 4.5 性能要求

- 首次加载时间 < 3 秒（普通网络）
- 选择响应时间 < 100ms
- 状态栏更新动画 < 300ms
- 里程碑庆祝动画（large）帧率 >= 30fps
- 存档/读档 < 50ms
- 小程序端单次选择响应时间 <= 200ms
- 小程序端内置 Demo 包体可控，不影响提交审核

### 4.6 小程序合规要求

微信小程序端需要补充比 HTML 更严格的内容和合规材料：

- AI 生成内容声明
- 用户协议
- 隐私政策
- 内容免责声明
- 未成年人适龄提示
- 作品版权说明

早期 Demo 内容应保持克制，避免过度血腥、恐怖描写和敏感内容。恐怖、宫斗、末世类型进入小程序内测前需要单独做文本审查。

---

## 5. UI 设计规范

### 5.0 UI V2 设计系统总览

v3.0 的 UI 视觉标准以 UI V2 原型为准。以下为已实现的设计系统完整规范。

#### 5.0.1 Glassmorphism 毛玻璃系统

所有主要 UI 组件（状态栏、面板、抽屉、Toast 容器）采用毛玻璃（Glassmorphism）风格：

```css
/* 基础毛玻璃 */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}
```

#### 5.0.2 Design Tokens 体系（`tokens.css`）

所有视觉参数通过 CSS Custom Properties 统一管理，分为以下 Token 类别：

| Token 类别 | 说明 | 示例 |
|------------|------|------|
| 颜色（Color） | 主题色、语义色、中性色 | `--color-primary`、`--color-success`、`--color-danger` |
| 阴影（Shadow） | 卡片、浮动、玻璃阴影 | `--shadow-card`、`--shadow-float`、`--shadow-glass` |
| 圆角（Radius） | 按钮、卡片、面板 | `--radius-sm`、`--radius-md`、`--radius-lg` |
| 间距（Spacing） | 内边距、外边距、栅格 | `--spacing-xs`、`--spacing-sm`、`--spacing-md` |
| 字体（Typography） | 字族、字号、字重、行高 | `--font-body`、`--font-heading`、`--text-sm` |
| 动画（Animation） | 时长、缓动、延迟 | `--duration-fast`、`--easing-smooth` |
| Z-index | 层级管理 | `--z-base`、`--z-overlay`、`--z-modal`、`--z-milestone` |

#### 5.0.3 五种题材主题色系统

| 题材 | genre 标识 | 主色调 | 辅助色 | 背景 | 文字 |
|------|------------|--------|--------|------|------|
| 修仙 | `xianxia` | 金色 `#C8A45C` | 玉白 `#F5F0E8` | 暗金 `#1A1710` | 暖白 `#E8DCC8` |
| 无限恐怖 | `horror` | 深红 `#8B1A1A` | 血橙 `#D4644A` | 深黑 `#0D0A0A` | 灰白 `#C8C0B8` |
| 悬疑 | `mystery` | 冷蓝 `#3A5F8A` | 银灰 `#8A9FB5` | 深蓝黑 `#0A0F1A` | 淡蓝 `#C8D5E8` |
| 末日 | `apocalypse` | 军绿 `#5A6B3C` | 铁锈 `#8B7355` | 深绿黑 `#0D110A` | 暗绿白 `#C8CCB8` |
| 宫斗 | `palace` | 金粉 `#C8906C` | 绛紫 `#8B5A6B` | 深酒红 `#1A0D10` | 暖粉白 `#E8D5CC` |

主题色通过 `meta.genre` 自动切换，所有 UI 组件（状态栏、按钮、进度条、Toast、面板）自动应用对应题材的颜色方案。

#### 5.0.4 题材专属 VFX 视觉特效

**章节转场动画**：

| 题材 | 转场效果 | 实现方式 |
|------|----------|----------|
| 修仙 | 水墨晕开 | CSS radial-gradient 动画 + opacity 渐变 |
| 无限恐怖 | 画面撕裂 | CSS clip-path 动画 + transform |
| 悬疑 | 打字机效果 | JS 逐字显示 + 光标闪烁 |
| 末日 | 噪点闪烁 | CSS background-image（噪点纹理） + opacity 闪烁 |
| 宫斗 | 帷幕拉开 | CSS transform scaleY + gradient |

**题材专属粒子效果**：

| 题材 | 粒子效果 | 触发场景 |
|------|----------|----------|
| 修仙 | 灵气粒子（金色光点上浮） | 修炼场景、境界突破 |
| 无限恐怖 | 恐惧闪屏（红色闪屏 + 屏幕抖动） | 危机事件、HP 临界 |
| 悬疑 | 线索闪光（蓝白闪光点） | 发现线索、推理成功 |
| 末日 | 资源警告（黄红脉冲边框） | 资源不足、危险逼近 |
| 宫斗 | 金色闪烁（金色粒子飘落） | 权力晋升、宫廷事件 |

#### 5.0.5 成就系统

- 3 种稀有度：`common`（普通）、`rare`（稀有）、`legendary`（传说）
- 8 个分类：战斗、探索、社交、收集、成长、剧情、隐藏、速度
- 视觉差异：稀有度越高，边框越华丽，解锁时有更强的视觉反馈

#### 5.0.6 存档系统

- 8 槽位，使用 localStorage 持久化
- 每个存档包含：当前节点 ID、variables 全量快照、flags、inventory、milestones 解锁状态、endings 达成状态、timestamps
- 支持存档缩略信息预览（存档时间、当前章节、存活时长）

### 5.1 Q3 MVP 布局（对齐 UI V2 组件结构）

```
┌─────────────────────────────────────────────────┐
│  status-bar (Glassmorphism)                      │
│  [书名]      [境界：炼气三层] [修为: 12/100]     │
│  [菜单]       [灵力: ████░░] [道心: 3]          │
├─────────────────────────────────────────────────┤
│                                                 │
│  scene-viewport                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  [章节幕：第二章：宗门大比]               │    │  <- VFX 转场动画
│  ├─────────────────────────────────────────┤    │
│  │  [破庙]                                 │    │  <- 场景名
│  │                                         │    │
│  │  narrative                              │    │  <- segments 文本区
│  │  你在破庙里醒来，火堆快灭了...            │    │
│  │                                         │    │
│  ├─────────────────────────────────────────┤    │
│  │  choices                                │    │  <- 选项区
│  │  [!] 关键抉择                            │    │  <- choice.weight=critical
│  │  ┌──────────────────────────────────┐   │    │
│  │  │  替师父守住丹炉                  │   │    │  <- 高亮边框 + 呼吸动画
│  │  └──────────────────────────────────┘   │    │
│  │  ○ 等到天亮                             │    │
│  │  ○ 现在离开                             │    │
│  │  [需灵力>=20] 强行破阵                   │    │  <- 条件选项（置灰）
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│  [存档] [读档] [回退] [状态详情] [设置]         │
└─────────────────────────────────────────────────┘

notifications (浮动层):
  ┌─────────────────────────┐
  │  灵力 +10              │  <- changes.show 反馈
  │  道心 +2               │
  │  获得标记：替师父守住丹炉 │
  └─────────────────────────┘
```

### 5.2 Q4 布局（含 interactions + 深度探索 + 完整组件）

```
┌─────────────────────────────────────────────────┐
│  status-bar (Glassmorphism)                      │
│  [书名]      [境界：炼气三层] [修为: 12/100]     │
│  [菜单]       [灵力: ████░░] [道心: 3]          │
├─────────────────────────────────────────────────┤
│  scene-viewport                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  [破庙]                                 │    │
│  │                                         │    │
│  │  narrative                              │    │
│  │  你在破庙里醒来，火堆快灭了...            │    │
│  │                                         │    │
│  │  interactions                           │    │  <- 交互区
│  │  可调查：                                │    │
│  │  [环顾四周]           (surface)        │    │  <- 默认显示
│  │  [仔细翻阅]           (deep, 需感知>=3) │    │  <- 条件提示
│  │                                         │    │
│  │  choices                                │    │  <- 选项区
│  │  [!] 关键抉择                            │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │  替师父守住丹炉                  │   │    │
│  │  └──────────────────────────────────┘   │    │
│  │  [~] 支线影响                            │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │  趁机搜刮破庙                     │   │    │
│  │  └──────────────────────────────────┘   │    │
│  │  ○ 等到天亮                             │    │
│  │  ○ 现在离开                             │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  [存档] [读档] [回退] [状态详情] [背包] [成就] [结局] [设置] │
└─────────────────────────────────────────────────┘

milestone-overlay (触发时全屏覆盖):
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║       (全屏庆祝动画 + 题材专属 VFX)             ║
  ║                                               ║
  ║           【突破筑基】                          ║
  ║                                               ║
  ║   灵力在经脉中奔涌如潮...                       ║
  ║   (celebration=large, 5-8秒)                   ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝

endings tracker (存档/菜单界面):
  结局收集：3/6
  [T] [D] [N] [?] [?] [?]
  已收集    未发现
```

### 5.3 变化反馈 Toast（对齐 UI V2 notifications）

```
┌─────────────────────────┐  <- Glassmorphism 半透明背景
│  灵力 +10              │  <- 绿色，positive
│  道心 +2               │  <- 绿色，positive
│  获得标记：替师父守住丹炉 │  <- 蓝色，info
└─────────────────────────┘
```

- 位置：屏幕中央偏下
- 持续时间：2 秒
- 动画：从下往上滑入，淡出
- 背景：毛玻璃效果

### 5.4 条件提示（disabled 模式）

```
○ [需灵力>=20] 强行破阵
  灵力不足，当前 12 / 20
```

- 置灰显示
- 鼠标悬停/长按显示条件说明
- 条件满足后自动恢复正常样式

### 5.5 选择重量视觉规范

| weight | 边框样式 | 背景效果 | 标签 | 动画 |
|--------|----------|----------|------|------|
| `critical` | 主题色 2px 实线 + glow 阴影 | 主题色 10% 透明度 | "[!] 关键抉择" + 主题色标签 | 边框呼吸动画（3s） |
| `branch` | 次要色 1px 实线 | 次要色 5% 透明度 | "[~] 支线影响" + 次要色标签 | 无 |
| `minor` | 默认边框 | 无 | 无 | 无 |
| `cosmetic` | 默认边框（可选 50% 透明度） | 无 | 无 | 无 |

---

## 6. 验收标准汇总

### 6.1 Q3 MVP 验收标准

| 验收项 | 标准 | 验证方式 |
|--------|------|----------|
| RPG 状态栏 | 正确显示 4 种 primaryStats 类型 | 目视检查 + 自动化测试 |
| 选择重量 | choice.weight 4 级别正确渲染 | 目视检查 + 自动化测试 |
| 变化反馈 | 选择后显示数值变化 Toast | 目视检查 |
| 条件选项 | 不满足条件时置灰/隐藏 | 单元测试 |
| 修仙 Demo | 40-80 节点，3-5 结局，可完整游玩 | 玩家测试 |
| 校验器 | 新增 13 条校验规则（RPG-001 ~ RPG-013） | 自动化测试 |
| 兼容性 | 旧 JSON 不受影响 | 回归测试 |
| 性能 | 加载 < 3 秒，选择响应 < 100ms | 性能测试 |
| 小程序技术验证 | 同一份修仙 Demo 可在小程序端播放 | 真机测试 |

### 6.2 Q4 扩展验收标准

| 验收项 | 标准 | 验证方式 |
|--------|------|----------|
| 渐进探索 | 3 种 depth 级别有差异化显示和反馈 | 目视检查 + 自动化测试 |
| 三层后果 | 选择回响 + 即时后果 + 延迟后果三层联动 | 集成测试 |
| 成长里程碑 | 3 种庆祝级别正确触发，5 种题材 VFX 联动 | 目视检查 + 集成测试 |
| 结局数据包 | 多结局追踪、隐藏结局、dot tracker | 目视检查 + 自动化测试 |
| 背包系统 | 道具获取/消耗/条件判断 | 单元测试 |
| 无限恐怖 Demo | 60-100 节点，完整展示 P1 功能 | 玩家测试 |
| 调试器 | 可查看/修改所有状态（含 milestones/endings） | 手动测试 |

### 6.3 用户测试标准

- 5-10 名目标用户（修仙读者/作者）
- 满意度 >= 7/10
- 「数值干扰阅读体验」负评率 < 15%
- 90% 以上选择有明显文本回响
- 「选择没有分量感」负评率 < 20%（新增）
- 「成长过程缺乏仪式感」负评率 < 20%（新增）
- critical 选择的平均决策时间应显著长于 minor 选择（>2 倍），证明重量感设计有效（行为度量）
- 玩家在首次游玩后愿意重玩的比例 >= 20%（hidden 结局驱动力验证）
- surface 交互触发率 >= 80%，deep 交互触发率 >= 40%（探索深度吸引力验证）

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|----------|
| 用户验证失败（修仙 MVP 不受欢迎） | 中 | 高 | Q3 尽早做用户测试；如失败，转向纯文学模式 |
| 技术实现困难（RPG 系统过于复杂） | 低 | 高 | 坚持轻 RPG，数值最多 5 个 |
| AI 生成质量不稳定 | 中 | 中 | 13 项校验 + 人工可编辑 |
| 橙光/易次元推出类似功能 | 中 | 高 | 先发优势 + 类型深度 + 视觉系统 |
| 移动端性能问题 | 中 | 中 | Q3 做性能测试，Q1 决定 APP 方案 |
| 小程序审核风险 | 中 | 高 | 早期 Demo 内容克制，补齐协议、隐私政策和 AI 生成声明 |
| 无足够开发资源 | 高 | 高 | 开源社区贡献 + 寻找合作者 |
| UI V2 与 JSON 引擎对接复杂度高 | 中 | 中 | P2 阶段预留足够时间（14 天）专门做对接，组件已设计完毕，重点是数据绑定 |
| 里程碑 VFX 在低端设备上卡顿 | 中 | 低 | large 庆祝提供降级方案（关闭粒子、缩短动画），用户可在设置中关闭 VFX |
| 延迟后果系统增加调试复杂度 | 低 | 中 | 调试面板提供延迟队列可视化，可手动清空或触发 |

---

### 失败事件反馈设计

失败事件（突破失败、队友死亡、推理错误等）不需要专门的里程碑机制，通过以下方式处理：

1. **叙事层面的失败**：通过 `changes.feedback` 的 `tone: "danger"` 标记，让 Toast 使用红色/深红色显示
2. **数值层面的失败**：关键数值降至危险阈值（如 HP < 20%、理智 < 10%）时，通过 `primaryStats` 的 `tone: "danger"` 让状态栏数值闪烁
3. **场景层面的失败**：通过 `segments` 文本的叙事风格传递失败氛围（不需要额外 UI 组件）
4. **失败不影响里程碑系统**：milestones 只标记正向成长节点，不标记失败

---

## 8. Non-goals（明确不做什么）

- **不做复杂战斗系统**：不做回合制、技能树、装备词条、伤害公式
- **不做实时 AI 生成**：预生成 JSON + 校验，保证质量稳定
- **不做美术资源生成**：专注文字，立绘/背景由作者提供
- **不做通用游戏引擎**：不跟 Ren'Py/Ink 竞争
- **不自己做内容平台**：与橙光/易次元合作
- **不支持多人在线**：纯单人互动文游
- **不强制使用 RPG**：`meta.rpg.enabled=false` 时保持纯文学模式
- **不把 web-view 作为长期主方案**：可用于演示，但正式路线采用原生小程序播放器
- **不在 Q3 实现完整题材模板**：5 种题材主题色/VFX 在 UI V2 中已有视觉原型，但对应的 JSON 内容模板（完整的 milestones/endings/interactions 定义）放在 P1/P2
- **不自己做通用动画引擎**：VFX 效果使用 CSS + Canvas 2D 实现，不引入 Three.js/WebGL 等重型方案

---

## 9. 附录

### 9.1 术语表

| 术语 | 说明 |
|------|------|
| 节点（node） | 剧情的一个片段，包含文本、选项、交互 |
| 段落（segment） | 节点内的一段文本 |
| 选项（choice） | 玩家可做的选择，导向不同分支 |
| 选择重量（choice.weight） | 选项的重要性等级：`critical`（关键分歧）、`branch`（支线影响）、`minor`（小事）、`cosmetic`（纯对话） |
| 交互（interaction） | 节点内的可探索对象，不改变主线走向 |
| 探索深度（interaction.depth） | 交互对象的发现层级：`surface`（表面探索，默认显示）、`deep`（深度探索，需条件）、`ultimate`（终极发现，隐藏，需特殊条件） |
| 主状态值（val） | 单一核心数值，如道心、理智 |
| 变量（variables） | 自定义状态值，如修为、灵力 |
| 标记（flags） | 布尔值，记录关键决定 |
| 背包（inventory） | 道具和资源 |
| 条件（condition） | 选项或交互的解锁条件 |
| 路由（routes） | 根据条件自动判断的跳转规则 |
| 选择回响（choice echo） | 选择后立即展示的文本/数值反馈，即 `changes.show` |
| 即时后果（immediate consequence） | 进入下一节点后触发的变化，通过 `delayedChanges` 实现 |
| 延迟后果（delayed consequence） | 多步后才显现的后果，通过 routes/flags 系统实现 |
| 延迟变化（delayedChanges） | 节点级字段，数组结构，每项定义延迟到指定节点生效的变化，通过 `triggerNode` 指定目标节点 |
| 延迟原因（reason） | `delayedChanges` 中的可选字段，解释延迟后果的原因文本，以旁白风格在触发时展示 |
| 成长里程碑（milestone） | 预定义的关键成长节点，触发时产生庆祝动画和题材专属 VFX |
| 庆祝规模（celebration） | 里程碑的庆祝级别：`small`（通知条）、`medium`（覆盖层）、`large`（全屏沉浸式） |
| 结局（ending） | 预定义的故事结局，含类型、触发条件和隐藏属性 |
| 结局类型（ending.type） | 结局的性质分类：`true`（真结局）、`dark`（坏结局）、`romance`（感情结局）、`neutral`（普通结局）、`noble`（牺牲结局）、`hidden`（隐藏结局） |
| 隐藏结局（hidden ending） | 名称和描述模糊化的结局，玩家达成后解锁完整信息 |
| Glassmorphism | 毛玻璃视觉风格，使用 `backdrop-filter: blur()` 实现半透明模糊效果 |
| Design Tokens | 统一管理视觉参数的 CSS Custom Properties 体系 |
| 题材主题（theme） | 基于题材（修仙/恐怖/悬疑/末日/宫斗）的整体视觉方案，包括色彩、VFX、粒子效果等 |

### 9.2 参考文档

- `docs/ROADMAP.md` - 原路线图
- `docs/GENRE_TEMPLATES.md` - 类型模板设计
- `docs/RPG_JSON_SCHEMA_PROPOSAL.md` - JSON Schema 草案
- `docs/UI_DESIGN_V2.md` - UI V2 设计规范（Glassmorphism、Design Tokens、题材主题、VFX）
- `story-to-game-source/SKILL.md` - AI Skill 文档
- `story-to-game-source/references/json-format-spec.md` - JSON 格式规范
