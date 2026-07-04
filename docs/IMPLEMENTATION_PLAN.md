# 阶段实施计划

本文档把 `docs/ROADMAP.md` 拆成可直接执行的开发任务。后续开发建议以每个阶段一个里程碑、每个条目一个 Issue 的方式推进。

## P0：仓库与源码基线

### 目标

让仓库可维护、可审查、可持续提交。

### 任务

- [ ] 保留原项目文件，确保启动器和示例 JSON 可直接使用。
- [ ] 将 `.skill` 解包源码放入 `story-to-game-source/`。
- [ ] 增加 `.skill` 打包脚本。
- [ ] 增加示例 JSON 批量验证脚本。
- [ ] 将文档中的 `theme` / `ambient` 口径统一。
- [ ] 为后续启动器拆分建立目录规划。
- [ ] 为微信小程序并行集成预留共享 core 目录规划。
- [ ] 定义 choice.weight / milestones / endings / delayedChanges / interaction.depth 字段。
- [ ] 实现 choice.weight UI 渲染。
- [ ] 修仙 Demo 配置 milestones 和 endings。

### 交付物

- `story-to-game-source/SKILL.md`
- `story-to-game-source/references/*`
- `story-to-game-source/scripts/validate.py`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_PLAN.md`

## P1：RPG 状态展示 MVP

### 目标

先不改变现有剧情流，只新增状态栏和变量展示。

### 任务

- [ ] 支持 `meta.genre`。
- [ ] 支持 `meta.rpg.enabled`。
- [ ] 支持 `meta.rpg.primaryStats`。
- [ ] 顶部展示主状态 `val` 和 primary stats。
- [ ] 增加状态详情面板。
- [ ] 支持 `text` / `number` / `bar` 三类展示。
- [ ] 旧 JSON 未配置 `rpg` 时保持原样。

### 验收

- [ ] 原 `测试案例-成人日.json` 可正常导入与游玩。
- [ ] 新增修仙 demo 可显示境界、修为、灵力、道心。
- [ ] 缺失变量时显示为空或默认值，不抛异常。

## P2：选择反馈与条件提示

### 目标

让玩家感知选择后的数值和标记变化。

### 任务

- [ ] 在 `applyChanges` 前后计算 `val`、`variables`、`flags` 差异。
- [ ] 支持 `changes.show = true`。
- [ ] 支持 `changes.feedback` 显式提示。
- [ ] 支持不满足条件的选项置灰。
- [ ] 支持显示条件原因。
- [ ] 增加配置 `meta.rpg.conditionDisplay = hide | disabled`。

### 验收

- [ ] 选择后可弹出 `灵力 +10`、`道心 +2` 等反馈。
- [ ] 条件不足的选项不会导致死路。
- [ ] 隐藏数值不会在普通 UI 中泄露。

## P3：场景交互系统

### 目标

支持节点内的调查、搜索、修炼、交谈、使用道具等场景互动。

### 任务

- [ ] 新增 `nodes.*.interactions`。
- [ ] 支持 `interaction.id`。
- [ ] 支持 `interaction.label`。
- [ ] 支持 `interaction.once`。
- [ ] 支持 `interaction.condition`。
- [ ] 支持 `interaction.result.segments`。
- [ ] 支持 `interaction.result.changes`。
- [ ] 执行后更新当前节点 UI。
- [ ] once 交互写入本地运行状态，避免重复奖励。
- [ ] 支持 interaction.depth 三级探索。
- [ ] 实现 delayedChanges 延迟后果引擎。
- [ ] 实现里程碑庆祝 UI（三级 celebration）。
- [ ] 实现结局追踪系统（panel + dot tracker + hidden）。

### 验收

- [ ] 一个节点可包含多个 interaction。
- [ ] interaction 可改变变量和 flag。
- [ ] interaction 执行后可解锁新选项。
- [ ] 旧节点无 `interactions` 时行为不变。
- [ ] surface 交互始终可见，deep 交互显示锁定状态，ultimate 交互满足条件时显现。
- [ ] delayedChanges 在到达 triggerNode 时正确触发并显示 reason。
- [ ] 里程碑 small / medium / large 三级庆祝按配置触发。
- [ ] endings panel 和 mini dot tracker 正确显示已解锁结局，hidden 结局模糊显示。

## P4：背包与资源系统

### 目标

支持轻量资源管理和道具条件。

### 任务

- [ ] 新增顶层 `inventory`。
- [ ] 支持简写 `{ "item": 3 }`。
- [ ] 支持完整写法 `{ "item": { "label": "道具名", "count": 3 } }`。
- [ ] 支持 `changes.inventory`。
- [ ] 支持 `condition.item`。
- [ ] 增加背包面板。
- [ ] 增加道具变化提示。

### 验收

- [ ] 可获得和消耗道具。
- [ ] 道具不足时选项置灰或隐藏。
- [ ] 道具数量不会意外变成负数。

## P5：类型模板 v1

### 目标

优先支持修仙和无限恐怖，验证"类型玩法模板"的生成价值。

### 修仙任务

- [ ] 定义修仙变量模板。
- [ ] 定义修炼互动模板。
- [ ] 定义突破 routes 模板。
- [ ] 定义道心/因果选择模板。
- [ ] 创建修仙 demo。

### 无限恐怖任务

- [ ] 定义任务世界变量模板。
- [ ] 支持 mission 字段草案。
- [ ] 定义倒计时/危险度/团队信任机制。
- [ ] 定义支线奖励和回归结算模板。
- [ ] 创建无限恐怖 demo。

### 修仙 Demo 验收

- [ ] Demo 通过 validate.py（包含 v3.0 新规则 RPG-009 到 RPG-013）。
- [ ] milestones / endings / delayedChanges / choice.weight 全部配置正确。
- [ ] milestones 至少包含 1 large + 1 medium + 1 small。
- [ ] endings 至少包含 4 个（含 1 个 hidden）。
- [ ] critical 选择配置了 delayedChanges。
- [ ] 至少 1 个三级探索交互示例。

## P6：类型模板 v2

### 目标

扩展悬疑、末世、宫斗/权谋三类。

### 任务

- [ ] 悬疑：线索、证词、推理、误判机制。
- [ ] 末世：食物、水、弹药、庇护所、感染机制。
- [ ] 宫斗：宠信、疑心、情报、派系关系机制。
- [ ] 分别创建 demo。

## P7：Skill 生成流程升级

### 目标

让 AI 能根据小说类型自动选择玩法模板。

### 任务

- [ ] 在 `SKILL.md` 增加类型识别规则。
- [ ] 在快速模式中增加轻玩法摘要。
- [ ] 在标准模式中增加玩法设计文档。
- [ ] 强类型小说必须生成 `meta.genre`。
- [ ] 强类型小说必须生成 `meta.rpg`。
- [ ] 强类型小说至少生成 3 个互动节点。
- [ ] 强类型小说至少生成 1 个条件选项和 1 个 routes 节点。

## P8：校验器增强

### 目标

让 `validate.py` 能检查 RPG 字段、交互系统和类型模板。

### 任务

- [ ] 检查 `primaryStats` 引用变量存在。
- [ ] 检查 `changes.set` 引用变量。
- [ ] 检查 `condition.var` 引用变量。
- [ ] 检查 `condition.item` 引用道具。
- [ ] 检查 `changes.inventory` 不产生非法负数。
- [ ] 检查 interaction id 唯一。
- [ ] 检查 once interaction 不承担唯一主线出口。
- [ ] 增加类型模板检查。

## P9：调试器增强与发布

### 目标

让作者可以调试数值、道具、条件、routes 和结局路径。

### 任务

- [ ] 调试面板展示所有 variables。
- [ ] 调试面板允许修改 variables。
- [ ] 调试面板展示 inventory。
- [ ] 调试面板允许添加/删除道具。
- [ ] 调试面板解释当前选项条件。
- [ ] 调试面板解释 routes 命中结果。
- [ ] 一键模拟进入指定结局。
- [ ] 增加类型 demo 示例库。

## P10：微信小程序并行集成

### 目标

让同一份 JSON 剧本可以同时在 HTML 播放器和微信小程序播放器中运行。小程序端优先承担移动端传播、微信分享和未来商业化入口。

### Q3 技术验证任务

- [ ] 抽出 `story-engine`。
- [ ] 抽出 `condition-engine`，禁止使用 `eval`。
- [ ] 抽出 `change-engine`。
- [ ] 定义统一存档结构 `save-model`。
- [ ] 建立最小微信小程序项目。
- [ ] 小程序加载内置修仙 Demo JSON。
- [ ] 小程序渲染正文、选项、RPG 状态栏。
- [ ] 小程序支持变化反馈和条件置灰。
- [ ] 小程序支持本地存档。

### Q4 内测任务

- [ ] 小程序支持作品列表。
- [ ] 小程序支持云端 JSON 加载。
- [ ] 小程序支持微信分享卡片。
- [ ] 小程序支持 `interactions` 基础渲染。
- [ ] 小程序支持 `inventory` 基础渲染。
- [ ] 小程序支持修仙和无限恐怖两个 Demo。

### 验收

- [ ] 同一份修仙 Demo JSON 可在 HTML 和小程序播放。
- [ ] 小程序端单次选择响应时间 ≤ 200ms。
- [ ] 小程序端不使用 `eval`。
- [ ] 小程序端可保存和恢复当前进度。
- [ ] 小程序端内容符合审核要求。

## 推荐开发顺序

```text
1. 工程基线
2. RPG 状态栏
3. 变化反馈
4. 条件提示
5. 修仙 demo
6. 共享剧情 core
7. 微信小程序技术验证
8. 场景 interactions
9. 无限恐怖 demo
10. 背包 inventory
11. Skill 类型模板
12. validate.py 与调试器增强
```
