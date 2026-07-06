# Story-to-Game v3.0 开发实施计划

**日期**：2026-07-04
**版本**：v3.0
**基于**：v2-PRD.md + v2-ROADMAP.md

---

## 1. 实施原则

```
1. 向后兼容：所有新功能必须可选，旧 JSON 完全不受影响
2. 先 schema 后 UI：JSON 字段定义必须先稳定，再开发渲染
3. 开发内容并行：引擎开发和内容撰写可以并行，但联调需要串行
4. 双端同源：HTML 和微信小程序共享 JSON 协议与剧情 core，UI 分端实现
5. 每阶段有交付：每阶段结束必须有可演示的进度
6. 风险早发现：Schema 评审必须完成，核心 UI 联调必须验证通过
```

---

## 2. 依赖关系图

```
P0-1 meta.rpg schema
  ├── P0-1.5 choice.weight schema
  │     ├── P0-2.5 choice.weight UI（与P0-2并行）
  │     └── P0-6 修仙Demo
  ├── P0-2 顶部状态栏 UI
  │     ├── P0-3 状态详情抽屉
  │     └── P0-6 修仙 Demo（内容依赖 schema，开发依赖 UI）
  ├── P0-2.5 milestone基础框架
  │     └── P0-6 修仙Demo
  ├── P0-4 变化反馈 Toast
  │     └── P0-6 修仙 Demo
  ├── P0-5 条件选项置灰
  │     └── P0-6 修仙 Demo
  └── P0-7 validate.py 增强
        └── P0-6 修仙 Demo

P0-6 修仙 Demo
  └── Q3 用户测试

Core 抽离
  ├── story-engine
  ├── condition-engine
  ├── change-engine
  ├── save-model
  ├── HTML 播放器适配
  └── 微信小程序技术验证

P1-1 interactions
  ├── P1-1.5 interaction.depth（渐进探索）
  │     ├── P1-2.5 delayedChanges（三层后果）
  │     └── P1-3 milestone庆祝UI
  │           └── P1-3.5 endings数据包
  ├── P1-2 inventory
  └── P1-3 无限恐怖 Demo

P1-4 Skill 类型识别
  └── P1-3 无限恐怖 Demo
```

**关键路径**：P0-1 → P0-2 → P0-2.5 → P0-4 → P0-6 → 用户测试

**小程序并行路径**：Core 抽离 → 小程序加载内置 Demo → 状态栏/变化反馈/存档 → Q3 技术验证

---

## 2.5 MVP 分层定义

基于 PRD 和 Schema 的 MVP 必须支持列表，按优先级分为两层：

### Q3 MVP 必须（6 项）
- `meta.genre` 和 `meta.rpg.enabled`
- `meta.rpg.primaryStats`（text/number/bar）
- `changes.show` 变化反馈
- 条件选项置灰/隐藏（conditionDisplay）
- `choice.weight`（critical/branch 识别和视觉差异化）
- validate.py RPG-001 到 RPG-018

### Q3 MVP 应该 / Stretch Goal（2 项）
- `milestones` 基础支持（small/medium 庆祝，不含 large VFX）
- `endings` 基础定义（结局列表展示 + hidden 机制，不含 dot tracker）

### Q4 必须（6 项）
- `interactions` + `interaction.depth`
- `inventory` + `changes.inventory`
- `delayedChanges`（triggerNode: "next"）
- `milestones.large` 庆祝 + 题材 VFX
- `endings` 完整 UI（dot tracker + 回顾）
- `condition.interaction` 前置依赖

---

## 2.5 当前进度（2026-07-04 更新）

### ✅ 阶段一：Schema 定义（已完成并锁定）

**完成时间**：2026-07-04  
**交付物**：
- `docs/SCHEMA_v1.md`（897 行）：锁定 RPG JSON Schema v1.0 正式定义
- `docs/GENRE_TEMPLATES.md`（887 行）：5 种类型小说玩法模板
- `story-to-game-source/scripts/validate.py`：18 条 RPG 校验规则（RPG-001~018）

**已完成任务**：
- [x] P0-1: 定义 `meta.rpg` 完整 schema
- [x] P0-1.5: 定义 `choice.weight`、`milestones`、`endings`、`delayedChanges`、`interaction.depth` 字段
- [x] P0-1.5: 定义 `condition.interaction` 前置交互条件
- [x] P0-1.5: 定义 `candidateEndings` 节点字段
- [x] 统一 `genre` 枚举值
- [x] 补充 `choice.weightTag`、`importantFlag`、`candidateEndings` 说明
- [x] P0-7: validate.py 增强（RPG-001 到 RPG-018）

**下一步**：进入阶段二（核心引擎开发）

---

## 3. 阶段划分

### 阶段一：Schema 定义与评审

**目标**：✅ 已完成 — 锁定 JSON Schema，确保所有字段定义清晰

**任务**：
- P0-1: 定义 `meta.rpg` 完整 schema
- P0-1.5: 定义 `choice.weight`、`milestones`、`endings`、`delayedChanges`、`interaction.depth` 字段
- P0-1.5: 定义 `condition.interaction` 前置交互条件
- P0-1.5: 定义 `candidateEndings` 节点字段
- 统一 `genre` 枚举值

**交付物**：Schema 文档通过评审

**风险检查点**：如果 schema 评审不通过，需在此阶段修正

---

### 阶段二：核心引擎开发

**目标**：实现状态栏、变化反馈、条件选项、选择重量

**任务**：
- P0-2: 实现 `meta.rpg` 解析器
- P0-2: 实现顶部状态栏组件（text/number/bar）
- P0-2: 状态栏样式（暗色/亮色主题适配、Glassmorphism）
- P0-2.5: 实现 `choice.weight` UI（critical/branch/minor/cosmetic 视觉差异化）
- P0-2.5: 实现 `weightHint` 悬停/长按提示
- P0-3: 实现状态详情抽屉
- P0-4: 实现 `changes` 变化计算引擎和 Toast 组件
- P0-5: 实现字符串 condition 解析（向后兼容）
- P0-5: 实现对象 condition 解析（all/any/var/flag/item/interaction）
- P0-5: 实现 `conditionDisplay`（hide/disabled）
- P0-7: validate.py 增强（RPG-001 到 RPG-018）
- Core 抽离：抽出 `story-engine`、`condition-engine`、`change-engine`、`save-model`

**交付物**：播放器可显示状态栏、变化反馈、条件选项、选择重量

**风险检查点**：bar 类型渲染性能、移动端适配

---

### 阶段三：修仙 Demo 与联调

**目标**：制作可玩的修仙 Demo，验证核心玩法假设

**内容任务**：
- 确定修仙 Demo 故事大纲（主角、关键选择、结局方向）
- 列出修仙 Demo 需要的所有数值
- 撰写修仙 Demo 节点（40-50 节点，聚焦核心验证）
- 配置 `meta.rpg`（primaryStats、hiddenStats）
- 为关键选择配置 `changes` 和 `show`
- 配置 `choice.weight` 示例
- 配置 milestones（至少 3 个：1 large + 1 medium + 1 small）
- 配置 endings（至少 4 个：true/dark/neutral/hidden）
- 配置 delayedChanges（每个 critical 选择配 1 个）

**开发任务**：
- 用 validate.py 校验 Demo JSON
- 播放器加载修仙 Demo 联调
- 测试状态栏、变化反馈、条件选项、选择重量
- 测试 milestone 触发、delayedChanges 执行

**交付物**：可完整游玩的修仙 Demo

**风险检查点**：数值平衡、文本质量

---

### 阶段四：测试与迭代

**目标**：内部测试 + 用户测试 + 迭代修复

**任务**：
- 完整游玩修仙 Demo（多路线）
- 记录 bug 和体验问题
- 移动端测试（iOS Safari + Android Chrome）
- 用户测试（5-10 名目标用户）
- 收集反馈并迭代修复

**交付物**：用户测试报告、修复后的 Demo

---

### 阶段五：发布准备

**目标**：GitHub Release + 社区建设

**任务**：
- 制作演示视频和图文
- 更新 GitHub README
- 发布 GitHub Release v0.2
- 社区运营（B站、小红书、V2EX、知乎、NGA）
- 撰写复盘报告

**交付物**：Release 包、演示视频、社区反馈

---

### 阶段六：Q4 扩展（场景交互 + 无限恐怖）

**目标**：增加互动深度，扩展类型覆盖

**任务**：
- P1-1: `interactions` 字段 + UI
- P1-1.5: `interaction.depth` 三级探索
- P1-1.5: `interaction.hint` 字段
- P1-2: `inventory` 字段 + 背包 UI
- P1-2.5: `delayedChanges` 延迟后果引擎
- P1-3: `milestones` 庆祝 UI（small/medium/large + VFX）
- P1-3.5: `endings` 数据包 + dot tracker + hidden 结局
- P1-4: 无限恐怖 Demo
- P1-5: Skill 类型识别升级
- P1-6: 调试器增强

---

### 阶段七：Q1 扩展（类型扩展 + 小程序）

**目标**：覆盖更多类型，建立小程序分发渠道

**任务**：
- 悬疑 Demo
- 末世 Demo
- 宫斗 Demo
- 示例库整理
- 小程序内测版（作品列表、云端 JSON、分享）

---

### 阶段八：平台化探索

**目标**：探索商业化路径

**任务**：
- 商业化方案设计
- 创作者平台评估
- 与橙光/易次元合作评估
- OpenCore + 捐赠模式

---

## 4. 每阶段检查清单

每个阶段结束，确认：

```
□ 本阶段任务是否完成？
□ 是否有阻塞问题需要处理？
□ 下阶段计划是否需要调整？
□ 代码是否已提交并推送？
□ 文档是否已更新？
```

---

## 5. 关键决策点

| 决策 | 选项 | 建议 |
|------|------|------|
| 开发资源不足？ | 缩减 Demo 规模至 30 节点，将 milestones/endings 推迟到 Q4 | 先确保核心 P0-1 到 P0-5 完成 |
| Schema 是否锁定？ | 锁定 / 继续调整 | 锁定，进入开发 |
| milestone 基础框架是否纳入 Q3 MVP？ | 纳入 / 延后 | 纳入至少 small+medium |
| Demo 是否可玩？ | 可玩 / 延期 | 延期不超过 1 周 |
| 用户反馈是否达标？ | 达标 / 不达标 | 不达标则执行 Plan B |
| 小程序技术路径是否成立？ | 成立 / 暂缓 | 同一份 JSON 能否稳定播放 |
| large 里程碑的 VFX 复杂度？ | 全题材 VFX / 先做修仙 | 先做修仙，验证后扩展 |
| hidden 结局的数量和复杂度？ | 每类型 1 个 / 每类型 2 个 | 每类型 1 个 hidden |
| 是否进入小程序公开测试？ | 是 / 否 | 取决于 Q3/Q4 用户数据 |
| 商业化方向？ | 平台 / 合作 / 捐赠 | 根据用户规模决定 |

---

> 本开发计划基于 v2-PRD 和 v2-ROADMAP，是可直接执行的阶段级别任务分解。v3.0 整合了 choice.weight 权重系统、milestone 里程碑框架、endings 多结局系统、delayedChanges 延迟后果机制、interaction.depth 渐进探索等新玩法机制。实际执行中可根据用户反馈灵活调整。
