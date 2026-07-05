# 开发清单

本文档记录各阶段的核心任务，作为开发时的参考清单。

## 阶段一：Schema 定义

- [x] 定义 `meta.rpg` 完整 schema（已完成：SCHEMA_v1.md）
- [x] 定义 `choice.weight` 字段（已完成：SCHEMA_v1.md §6.5）
- [x] 定义 `interaction.depth` 字段（已完成：SCHEMA_v1.md §7）
- [x] 定义 `milestones` 顶层结构（已完成：SCHEMA_v1.md §9）
- [x] 定义 `endings` 顶层结构（已完成：SCHEMA_v1.md §10）
- [x] 定义 `delayedChanges` 字段（已完成：SCHEMA_v1.md §8）
- [x] 定义 `condition.interaction` 前置交互条件（已完成：SCHEMA_v1.md §13.2）
- [x] 定义 `candidateEndings` 节点字段（已完成：SCHEMA_v1.md §11）
- [x] 定义 `interaction.hint` 字段（已完成：SCHEMA_v1.md §7）
- [x] 统一 `genre` 枚举值（已完成：SCHEMA_v1.md §2）
- [x] 补充 `choice.weightTag` 说明（已完成：GENRE_TEMPLATES.md §通用规则）
- [x] 补充 `importantFlag` 说明（已完成：GENRE_TEMPLATES.md §通用规则）
- [x] 补充 `candidateEndings` 说明（已完成：GENRE_TEMPLATES.md §修仙类型）

## 阶段二：核心引擎

- [ ] 实现 `meta.rpg` 解析器
- [ ] 实现状态栏组件（text/number/bar）
- [ ] 实现 `choice.weight` UI（4 种视觉差异）
- [ ] 实现状态详情抽屉
- [ ] 实现 `changes` 变化计算 + Toast
- [ ] 实现 condition 解析（字符串 + 对象）
- [ ] 实现 `conditionDisplay`（hide/disabled）
- [ ] validate.py 增强（RPG-001 到 RPG-013）
- [ ] Core 抽离（story/condition/change/save-model）

## 阶段三：修仙 Demo

- [ ] 撰写修仙 Demo（40-50 节点）
- [ ] 配置 milestones（1 large + 1 medium + 1 small）
- [ ] 配置 endings（4 个，含 hidden）
- [ ] 配置 delayedChanges
- [ ] 配置 choice.weight 示例
- [ ] validate.py 校验通过
- [ ] 播放器联调

## 阶段四：测试与发布

- [ ] 内部测试（多路线游玩）
- [ ] 用户测试（5-10 人）
- [ ] 迭代修复
- [ ] GitHub Release v0.2
- [ ] 演示视频和图文

## 阶段五：Q4 扩展

- [ ] interactions 系统 + interaction.depth
- [ ] inventory 系统
- [ ] delayedChanges 引擎
- [ ] milestones 庆祝 UI + VFX
- [ ] endings 数据包 + dot tracker
- [ ] 无限恐怖 Demo
- [ ] Skill 类型识别升级
- [ ] 调试器增强

## 阶段六：小程序与类型扩展

- [ ] 小程序内测版
- [ ] 悬疑/末世/宫斗 Demo
- [ ] 示例库整理
