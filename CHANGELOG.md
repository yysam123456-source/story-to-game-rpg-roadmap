# 变更日志

本文档记录 Story-to-Game 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 计划
- i18n 支持（多语言剧本）
- 补充 SCHEMA_v1.md 的更多示例
- 为所有 5 种类型模板补充完整示例 JSON

---

## [1.1.0] - 2026-07-04

### 新增
- `GENRE_TEMPLATES.md`：为修仙类型补充完整示例 JSON
- `step4-system.md`：新增第六节"RPG 扩展状态系统设计"

### 改进
- `GENRE_TEMPLATES.md`：补充 `choice.weightTag` 和 `importantFlag` 说明
- `GENRE_TEMPLATES.md`：补充 `candidateEndings` 结局检测方式说明
- `JSON剧本规则文档.md`：补充 `candidateEndings` 字段说明
- `JSON剧本规则文档.md`：补充 `weight`、`weightTag`、`weightHint` 字段到 choices 字段表
- `json-format-spec.md`：补充顶层结构的可选字段（`flags`、`inventory`、`milestones`、`endings`、`mission`）
- `json-format-spec.md`：补充节点结构的可选字段（`candidateEndings`、`interactions`、`delayedChanges`）
- `step4-system.md`：补充 `importantFlag`、`weightTag`、`candidateEndings` 字段说明
- `README.md`：新增变更日志部分

### 修复
- `validate.py`：修正 13 条 RPG 校验规则编号与 `SCHEMA_v1.md` 完全对齐（RPG-001~013）

### 验证
- ✅ `validate.py` 的 13 条 RPG 校验规则全部通过测试
- ✅ 文档一致性检查通过（`choice.weightTag`、`importantFlag`、`candidateEndings` 在所有相关文档中均有说明）

---

## [1.0.0] - 2026-07-03

### 新增
- `SCHEMA_v1.md`：锁定 RPG JSON Schema v1.0 正式定义（897 行）
- `GENRE_TEMPLATES.md`：5 种类型小说玩法模板（修仙/无限流/悬疑/末世/宫斗）
- `RPG_JSON_SCHEMA_PROPOSAL.md`：RPG 化 JSON 扩展提案（771 行）
- `WECHAT_MINIPROGRAM_INTEGRATION.md`：微信小程序并行集成方案
- `v2-PRD.md`：产品需求文档 v3.0
- `v2-IMPLEMENTATION.md`：阶段划分与交付标准
- `v2-ROADMAP.md`：季度迭代路线图

### 改进
- `json-format-spec.md`：更新为包含 RPG 扩展的完整 JSON 格式速查手册
- `step4-system.md`：补充 RPG 状态系统设计指导
- `validate.py`：实现 13 条 RPG 校验规则（RPG-001~013）

### 文档
- 系统性对齐 `SCHEMA_v1.md` 与 `GENRE_TEMPLATES.md`
- 系统性对齐 `json-format-spec.md` 与 `SCHEMA_v1.md`
- 创建 `ALIGNMENT_REPORT.md` 记录对齐分析结果

---

## [0.9.0] - 2026-06-XX

### 初始版本
- `剧情游戏启动器.html`：分支剧情游戏启动器（单文件）
- `SKILL.md`：Story-to-Game AI 技能定义（九步工作流）
- `step1-ingestion.md` ~ `step6-validation.md`：AI 技能细分规则文档
- `validate.py`：JSON 自动验证脚本（基础 13 项检查）
- `JSON剧本规则文档.md`：面向内容创作者的 JSON 写作规范

---

**版本说明**：
- **v1.0**：基础文学模式 + RPG 扩展提案
- **v1.1**：系统性对齐完善（文档一致性 + 校验规则修正）
- **v2.0**：计划版本（i18n 支持 + 更多示例 + 播放器 RPG 功能实现）
