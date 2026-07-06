# Story-to-Game 变更日志

## v1.3.0 — 2026-07-07

### 平台化迁移完成

Story-to-Game 从"开源工具套件"正式进化为"在线 AI 互动叙事平台"。

### 新增：Schema v1.1 扩展

- `meta.rules` — 10 项创作者自定义规则（节奏密度、选项风格、数值影响、隐藏内容、结局倾向、叙事人称、对白密度、信息不对称、时间压力、NPC 关系）
- `npcRelations` — NPC 关系网络（id / name / role / description / initialAffinity / hidden）
- `timePressure` — 时间压力系统（countdown / timeoutNode / timeoutFlag / globalDecay / warningMessage / timeoutMessage）
- `achievements.autoUnlock` — 成就自动解锁条件
- 条件引擎新增 `affinity` 条件类型：`{ affinity: { npc, op, value } }`

### 新增：SKILL.md 可玩性扩展（7 个方向）

- A. 节奏控制 — pacing 字段 + 节点密度配置
- B. 信息不对称 — hiddenInfo / knownBy / revealAfter 三层结构
- C. 数值叙事绑定 — statsNarrative 字段 + 角色成长弧光
- D. NPC 关系网络 — npcRelations + affinityChanges
- E. 时间压力 — timePressure + countdown + globalDecay
- F. 成就系统 — autoUnlock + conditionalUnlock
- G. 自定义规则层 — meta.rules + 类型推荐默认值

### 新增：前端自定义规则配置 UI

- `/instant` 页面新增可折叠规则面板
- 类型选择时自动应用推荐配置（修仙→relaxed+npcRelations，恐怖→compact+timePressure 等）
- 10 项规则全部可通过 UI 配置并传递给 AI 生成

### 新增：播放器引擎功能增强

- **NPC 关系面板**：右下角悬浮按钮打开关系面板，显示好感度进度条和角色描述
- **时间压力条**：顶部固定位置倒计时条，30% 阈值变红闪烁警告，超时自动跳转
- **自动成就检测**：每节点导航后自动扫描 `autoUnlock` 条件，满足时即时解锁
- **globalDecay**：每节点自动应用数值/好感度衰减

### 架构调整

- **播放器方案**：从"React 重写"改为"iframe 嵌入原生 JS 引擎"，保留 100% 原有功能
- **AI 多提供商**：支持硅基流动 / DeepSeek / 百炼 / OpenAI / OpenRouter，环境变量切换
- **部署双轨**：Vercel（国际）+ 国内云（腾讯云 CloudBase / 阿里云 / VPS），详见 `web/DEPLOY.md`
- **存储抽象**：local 文件系统 / Vercel Blob / S3 预留接口

### 引擎修复

- 修复 `rpg-story-loader.js` 成就/结局方法调用错误（unlock/register/discover 区分）
- 修复 `save-system.js` 缩略图为关键信息+时间文本（替代 null thumbnail）
- 修复 `rpg-core.js` applyChanges 背包实际写入逻辑
- 修复 `theme.js` 场景图相对路径问题
- 修复设置控件绑定（BGM/SFX 音量、字体大小）
- 添加 iframe postMessage 通信接口（nodeChange / stateResponse / navigateTo）

### 清理

- 删除旧版文档（JSON剧本规则文档.md、剧情游戏启动器_开发者调试版.html 等）
- 删除废弃 React 播放器组件（`components/player/*`）

---

## v1.2.0 — 2026-07-04

### 新增：核心 RPG 引擎 v2

- `rpg-core.js` — 核心状态机 + 条件引擎（6 种条件类型）+ 变更引擎
- `rpg-status-bar.js` — 状态栏渲染（primaryStats text/number/bar）
- `rpg-choice.js` — 选项渲染 + 条件置灰/隐藏 + 权重标签（critical/branch/minor/cosmetic）
- `rpg-story-loader.js` — JSON 加载 + 节点导航 + 自动路由 + 延迟变化 + 交互探索
- 条件评估：数值比较、flag 检查、组合条件（all/any）、交互完成状态
- 变更应用：变量加减、flag 管理、成就解锁、背包变更、延迟变化队列

### 新增：5 种类型主题系统

- 修仙 / 恐怖 / 悬疑 / 末世 / 宫斗，各带专属状态系统、主题色、场景图、VFX

### 引擎修复

- 修复状态栏渲染与主题切换
- 修复选项条件评估和权重显示
- 修复交互按钮点击反馈
- 修复背包面板渲染

---

## v1.1.0 — 2026-07-03

### 新增：前端页面骨架

- `web/` 目录：Next.js 14 App Router 项目初始化
- 首页 / — 产品介绍 + CTA
- 即时体验页 /instant — 文本输入 + 生成 + 预览
- 作品库页 /library — 作品卡片列表
- 播放器页 /play/[id] — 动态路由加载作品
- 3 个 API 路由：POST /api/generate、GET /api/works、GET /api/works/[id]
- 存储抽象层：Vercel Blob / 本地文件系统
- AI 客户端：SSE 流式生成，Claude/GPT-4o 双模型

---

## v1.0.0 — 2026-07-02

### 初始版本：工具套件

- `SCHEMA_v1.md` — JSON Schema v1.0 锁定
- `SKILL.md` — AI 九步工作流定义
- `validate.py` — 18 条 RPG 校验规则
- `rpg-game-ui-v2/` — 原生 HTML/CSS/JS 播放器原型
  - Glassmorphism 暗色系 UI
  - 5 种题材主题切换
  - 状态栏、背包、存档、场景系统
  - 粒子特效 + 环境效果
- `docs/GENRE_TEMPLATES.md` — 5 种类型小说玩法模板