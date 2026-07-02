# GitHub Issue Backlog

本文档是后续创建 GitHub Issues 的来源。每个阶段建议对应一个 milestone，每个条目可拆成一个 issue。

## Milestone：P0 工程基线

### Issue：源码化 `.skill` 并建立打包流程

目标：

- 将解包后的 Skill 源码作为一等源码维护。
- 保留 `.skill` 为构建产物。

任务：

- [ ] 确认 `story-to-game-source/` 内容完整。
- [ ] 增加打包脚本。
- [ ] 更新 README 中的开发说明。
- [ ] 后续 PR 禁止只提交二进制 `.skill`。

### Issue：统一 `theme` 与 `ambient` 文档口径

目标：

- 消除 JSON 规范、Skill 文档、启动器实现之间的不一致。

任务：

- [ ] 明确 `theme` 为兼容字段。
- [ ] 新剧本统一推荐使用 `ambient`。
- [ ] 更新 `JSON剧本规则文档.md`。
- [ ] 更新 `story-to-game-source/references/json-format-spec.md`。

### Issue：抽出共享剧情 core，为微信小程序做准备

目标：

- 让 HTML 播放器和微信小程序播放器复用同一套剧情推进、条件判断和状态变化逻辑。

任务：

- [ ] 梳理现有启动器中可抽离的剧情推进逻辑。
- [ ] 抽出 `story-engine`。
- [ ] 抽出 `condition-engine`，禁止使用 `eval`。
- [ ] 抽出 `change-engine`。
- [ ] 定义统一 `save-model`。
- [ ] HTML 播放器改为调用共享 core。

## Milestone：P1 RPG 状态展示 MVP

### Issue：实现 `meta.rpg.primaryStats` 状态栏

目标：

- 让启动器读取 `meta.rpg.primaryStats` 并展示关键状态。

任务：

- [ ] 定义状态栏 UI。
- [ ] 支持 `text` 类型。
- [ ] 支持 `number` 类型。
- [ ] 支持 `bar` 类型。
- [ ] 旧 JSON 保持原样。

### Issue：新增 RPG 状态详情面板

目标：

- 让玩家可以查看完整可见数值。

任务：

- [ ] 增加状态详情入口。
- [ ] 展示 `primaryStats`。
- [ ] 不展示 `hiddenStats`。
- [ ] 缺失变量时降级显示。

## Milestone：P2 变化反馈与条件提示

### Issue：实现 `changes` 差异提示

目标：

- 玩家选择后看到数值和 flag 变化。

任务：

- [ ] 在 `applyChanges` 前后记录状态快照。
- [ ] 计算 `val` 差异。
- [ ] 计算 `variables` 差异。
- [ ] 计算 `flags` 新增和移除。
- [ ] 支持 `changes.show`。
- [ ] 支持 `changes.feedback`。

### Issue：实现条件选项置灰提示

目标：

- 条件不满足时可提示原因，而不是只隐藏选项。

任务：

- [ ] 支持 `meta.rpg.conditionDisplay`。
- [ ] `hide` 保持旧行为。
- [ ] `disabled` 展示置灰选项。
- [ ] 输出简短条件说明。

## Milestone：P3 场景交互系统

### Issue：支持节点内 `interactions`

目标：

- 让场景可调查、搜索、修炼、交谈。

任务：

- [ ] 渲染 `interactions` 区域。
- [ ] 支持 `interaction.condition`。
- [ ] 支持 `interaction.result.segments`。
- [ ] 支持 `interaction.result.changes`。
- [ ] 支持执行后刷新 UI。

### Issue：支持一次性交互 `once`

目标：

- 防止重复调查刷奖励。

任务：

- [ ] 在运行状态中记录已执行 interaction。
- [ ] 存档保存 interaction 状态。
- [ ] 读档恢复 interaction 状态。
- [ ] once 执行后隐藏或标记已完成。

## Milestone：P4 背包与资源系统

### Issue：实现 `inventory` 数据结构和背包 UI

目标：

- 支持资源、消耗品、关键道具展示。

任务：

- [ ] 支持简写 inventory。
- [ ] 支持完整 inventory。
- [ ] 增加背包面板。
- [ ] 支持道具 label。

### Issue：支持道具条件和道具变化

目标：

- 支持道具获取、消耗、条件判断。

任务：

- [ ] 支持 `changes.inventory`。
- [ ] 支持 `condition.item`。
- [ ] 道具变化接入反馈提示。
- [ ] 避免非法负数。

## Milestone：P5 类型模板 v1

### Issue：实现修仙类型模板和 demo

目标：

- 支持境界、修为、灵力、道心、突破等修仙玩法。

任务：

- [ ] 定义修仙变量模板。
- [ ] 写入 Skill 修仙模板规则。
- [ ] 创建修仙 demo JSON。
- [ ] demo 通过 validate.py。

### Issue：实现无限恐怖类型模板和 demo

目标：

- 支持任务世界、倒计时、团队信任、危险度、奖励点。

任务：

- [ ] 定义无限恐怖变量模板。
- [ ] 写入 Skill 无限恐怖模板规则。
- [ ] 创建无限恐怖 demo JSON。
- [ ] demo 通过 validate.py。

## Milestone：P6 类型模板 v2

### Issue：实现悬疑推理模板

任务：

- [ ] 线索变量。
- [ ] 证词矛盾。
- [ ] 推理选项。
- [ ] 错误推断代价。

### Issue：实现末世生存模板

任务：

- [ ] 资源变量。
- [ ] 食物/水/弹药消耗。
- [ ] 庇护所安全度。
- [ ] 感染与士气。

### Issue：实现宫斗权谋模板

任务：

- [ ] 关系网变量。
- [ ] 宠信/疑心/情报。
- [ ] 派系关系。
- [ ] 利益交换。

## Milestone：P7 Skill 生成流程升级

### Issue：加入类型识别与玩法设计步骤

任务：

- [ ] 标准流程增加类型识别。
- [ ] 标准流程增加玩法设计文档。
- [ ] 快速模式增加轻玩法摘要。
- [ ] 强类型小说必须输出 `meta.genre` 和 `meta.rpg`。

## Milestone：P8 校验器增强

### Issue：validate.py 支持 RPG 字段校验

任务：

- [ ] 校验 `primaryStats` 变量引用。
- [ ] 校验 `condition.var`。
- [ ] 校验 `condition.item`。
- [ ] 校验 `interactions`。
- [ ] 校验 `inventory`。

## Milestone：P9 调试器增强与发布

### Issue：开发玩法调试面板

任务：

- [ ] 查看/修改 variables。
- [ ] 查看/修改 inventory。
- [ ] 查看 flags。
- [ ] 解释当前选项条件。
- [ ] 解释 routes 命中情况。
- [ ] 模拟进入指定结局。

## Milestone：P10 微信小程序并行集成

### Issue：建立微信小程序技术验证版

目标：

- 用同一份修仙 Demo JSON 在微信小程序端完成基础播放，验证技术路径。

任务：

- [ ] 建立最小微信小程序项目。
- [ ] 加载内置修仙 Demo JSON。
- [ ] 渲染 `segments` 和 `choices`。
- [ ] 渲染 `meta.rpg.primaryStats` 状态栏。
- [ ] 执行 `changes` 并显示变化反馈。
- [ ] 支持条件选项置灰。
- [ ] 使用微信本地存储保存进度。
- [ ] 真机验证 iOS 微信和 Android 微信。

### Issue：小程序内测版支持作品列表、云端 JSON 和分享

目标：

- 让小程序具备邀请用户试玩的基础能力。

任务：

- [ ] 支持作品列表。
- [ ] 支持云端 JSON 加载。
- [ ] 支持微信分享卡片。
- [ ] 支持 `interactions` 基础渲染。
- [ ] 支持 `inventory` 基础渲染。
- [ ] 支持修仙和无限恐怖两个 Demo。

### Issue：补齐小程序合规材料

目标：

- 为小程序提交审核和公开测试准备必要材料。

任务：

- [ ] AI 生成内容声明。
- [ ] 用户协议。
- [ ] 隐私政策。
- [ ] 内容免责声明。
- [ ] 未成年人适龄提示。
- [ ] 作品版权说明。
