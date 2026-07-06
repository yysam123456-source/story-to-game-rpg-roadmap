# Story-to-Game v2.0 平台版产品需求文档（PRD）

**日期**：2026-07-06
**版本**：v2.0（Next.js 平台版）
**状态**：草案 -> 待评审
**基于**：PRD v1.0 + 架构升级方向（Next.js App Router + Vercel Serverless + JSON 文件存储）

---

## 1. 产品定位

Story-to-Game 不是通用游戏引擎，不是纯 AI 聊天工具，也不是 UGC 内容平台。它的独特定位是：

> **「小说/剧本 -> AI 高质量改编 -> 单文件可部署互动文游」**

在 v2.0 平台版中，这个定位升级为：

> **「类型小说（修仙/无限流/悬疑/末世/宫斗）专属轻 RPG 互动文游在线平台 -- 粘贴小说，即刻游玩」**

平台版的核心产品形态是：**打开网页 -> 粘贴/上传小说 -> AI 生成 -> 即时游玩预览**。三层架构分别服务引流、创作和分发：

- **引流层**：即时体验 -- 粘贴小说片段 -> AI 生成 -> 即时游玩，零门槛转化
- **创作层**：上传完整小说 -> AI 生成完整 JSON -> 预览/下载，面向创作者
- **分发层**：作品库浏览 -> 点击即玩，面向玩家

### 1.1 与竞品的差异化

| 维度 | Story-to-Game v2.0 | Ink/Inky | Twine | AI Dungeon | 橙光/易次元 |
|------|---------------------|----------|-------|------------|-------------|
| 目标用户 | 网文作者、类型小说读者、路人玩家 | 游戏叙事设计师 | 短篇故事作者 | 普通玩家 | UGC 创作者 |
| AI 改编 | 全流程 AI + 人工可编辑 | 无 | 无 | 实时生成（不稳定） | 无 |
| 文学保真 | 风格指纹 + 13 项校验 | 取决于作者 | 取决于作者 | 不稳定 | 取决于作者 |
| RPG 数值 | 轻 RPG（服务叙事） | 需手写 | 需手写 | 无 | 无 |
| 类型深度 | 5 种类型专属模板 + 主题色/VFX | 无 | 无 | 通用 | 浅层 |
| 视觉系统 | Glassmorphism + Design Tokens + 题材主题 | 取决于作者 | 取决于作者 | 无 | 平台统一 |
| 部署方式 | 在线平台 + 单文件 HTML 导出 | 需集成 | HTML | 需联网 | 平台内 |
| 体验门槛 | 粘贴小说 -> 即时游玩 | 需学习工具 | 需学习工具 | 需联网 | 需注册 |
| 移动端入口 | 响应式 Web + 微信小程序（未来分发渠道） | 需自行开发 | 基础移动 Web | APP | APP/小程序 |

### 1.2 核心假设（必须验证）

1. **修仙小说的「境界体系」天然适合 RPG 数值化**，且目标用户（修仙读者）对此有明确期待
2. **轻 RPG 不会压过文学性**，只要数值变化先有文本回响、再有数值展示
3. **Next.js 全栈 + Vercel Serverless + JSON 文件存储能承载完整产品体验**，无需传统数据库和用户系统
4. **AI 能稳定生成符合类型模板的 JSON**，人工可编辑作为兜底
5. **「粘贴 -> 即时游玩」的极低门槛能带来有效转化**，路人用户无需注册即可体验产品价值
6. **选择有重量感能提升沉浸感**：当玩家在做选择前能感知到选项的重要性时，决策过程的紧张感和参与度显著提升
7. **成长里程碑仪式感增加留存**：数值突破伴随视觉庆祝动画和题材专属 VFX，比纯数字跳动更能让玩家感受到成长的意义

---

## 2. 目标用户

### 2.1 用户画像

| 优先级 | 用户类型 | 规模 | 核心需求 | 痛点 |
|--------|----------|------|----------|------|
| P0 | 修仙网文作者 | 20 万+ | 增加读者粘性、探索互动改编 | 不懂编程、没时间学复杂工具 |
| P0 | 修仙文游玩家 | 500 万+ | 深度互动、RPG 元素、重玩价值 | 现有平台作品互动深度不足 |
| P0 | 路人用户（引流层） | -- | 粘贴一段小说 -> 立刻看到游戏效果 | 不想注册、不想学工具、只想体验 |
| P1 | 无限流爱好者 | 100 万+ | 任务/副本/团队信任机制 | 无专属互动模板 |
| P1 | 教育工作者 | 10 万+ | 创新教学工具、离线部署 | 技术门槛高 |
| P2 | 独立开发者 | 5 万+ | 快速原型、叙事系统 | Ink 学习曲线陡 |
| P2 | 同人创作者 | 50 万+ | 零编程制作同人互动文游 | 没有合适的工具 |

### 2.2 Kano 需求分析

| 需求 | 类型 | 说明 |
|------|------|------|
| AI 自动改编 | 必备 | 没有这个功能，目标用户不会用 |
| 文学质量保真 | 必备 | 改编后风格漂移，用户会弃用 |
| 即时体验（粘贴即玩） | 必备 | 平台版核心体验，零门槛引流 |
| 单文件 HTML 导出 | 期望 | 创作者下载后可独立部署 |
| 轻 RPG 系统 | 魅力（修仙用户） | 有则惊喜，没有也能接受（纯文学模式） |
| 选择重量感 | 魅力 | 让选择有"分量"，提升决策沉浸感 |
| 类型专属模板 | 魅力 | 修仙模板是核心差异化 |
| 视觉主题系统 | 魅力 | 毛玻璃/题材主题色/VFX 增强视觉辨识度 |
| 成长仪式感 | 魅力 | 里程碑庆祝动画增加成就感 |
| 移动端体验 | 期望 | 手机游玩是刚需 |
| 作品库浏览 | 期望 | 玩家可以发现和体验不同作品 |

---

## 3. 产品架构

### 3.1 整体架构：Next.js 全栈 + Vercel Serverless + JSON 文件存储

```text
浏览器（用户）
  |
  v
Next.js App Router（全栈应用）
  |-- app/                     # App Router 路由
  |   |-- page.tsx             # 首页 / - 品牌展示 + CTA + 热门作品
  |   |-- instant/page.tsx     # 即时体验 /instant - 左屏文本输入 + 右屏播放器预览
  |   |-- create/page.tsx      # 创作者页 /create - 三步流程：输入 -> 生成中 -> 预览
  |   |-- library/page.tsx     # 作品库 /library - 网格列表 + 分类筛选
  |   |-- play/[id]/page.tsx   # 播放器 /play/[id] - 加载云端 JSON 游玩
  |   |-- layout.tsx           # 根布局（主题/字体/全局状态）
  |   |-- globals.css          # 全局样式 + Tailwind
  |
  |-- components/              # React 组件
  |   |-- ui/                  # Shadcn/ui 组件
  |   |-- player/              # RPG 播放器组件（从 rpg-game-ui-v2/ 迁移）
  |   |-- landing/             # 首页组件
  |   |-- instant/             # 即时体验页组件
  |   |-- create/              # 创作页组件
  |   |-- library/             # 作品库组件
  |   +-- shared/              # 共享组件
  |
  |-- lib/                     # 工具函数/类型定义
  |   |-- types.ts             # TypeScript 类型定义
  |   |-- utils.ts             # 通用工具函数
  |   +-- storage.ts           # 存储抽象层（本地/Vercel Blob）
  |
  |-- app/api/                 # API Routes（Serverless Functions）
  |   |-- generate/route.ts    # POST /api/generate - AI 生成 JSON
  |   |-- works/route.ts       # GET /api/works - 作品列表
  |   +-- works/[id]/route.ts  # GET /api/works/[id] - 单个作品
  |
  |-- public/                  # 静态资源
  |   +-- assets/              # 图片/字体等
  |
  v
AI 代理层（API Routes 内）
  |-- 构造 AI Prompt（含类型模板、JSON Schema 约束、文学保真规则）
  |-- 调用 Claude/GPT API（通过环境变量配置 API Key）
  |-- 解析 AI 返回的 JSON，运行 validate 校验
  |
  v
存储层
  |-- 开发环境：本地 files/ 目录（Git 忽略）
  |-- 生产环境：Vercel Blob Storage
```

### 3.2 三层产品形态

```text
+---------------------------------------------------------+
|  引流层（即时体验）                                      |
|  打开网页 -> 粘贴小说片段 -> AI 生成 -> 即时游玩          |
|  无需注册，零门槛，目标：让用户 30 秒内体验到产品价值     |
+---------------------------------------------------------+
|  创作层（完整创作）                                      |
|  上传完整小说 -> 选择类型模板 -> AI 生成完整 JSON         |
|  -> 预览游玩 -> 下载单文件 HTML（含内嵌 JSON）            |
|  面向网文作者和同人创作者                                 |
+---------------------------------------------------------+
|  分发层（作品库）                                        |
|  作品列表（封面 + 标题 + 类型标签 + 简介）               |
|  -> 点击 -> 播放器页加载 JSON -> 即时游玩                 |
|  面向玩家，发现和体验不同作品                             |
+---------------------------------------------------------+
```

### 3.3 端到端用户链路

**引流链路（即时体验）**：
```
1. 用户打开网站首页 /
2. 看到输入框："粘贴一段小说，即刻变成互动游戏"
3. 用户粘贴一段修仙小说片段（500-2000 字）
4. 选择类型（可选，AI 也可自动识别）
5. 点击"生成"
6. 前端 POST /api/generate，发送文本和参数
7. 后端调用 AI 生成 JSON，保存到存储层
8. 返回作品 ID
9. 前端跳转到 /play/{uuid}
10. 播放器通过 GET /api/works/{uuid} 获取 JSON
11. RPG 播放器加载 JSON，用户即刻游玩
```

**创作链路（完整创作）**：
```
1. 用户点击"创作"入口，进入 /create
2. 输入/粘贴/上传完整小说文本
3. 选择类型模板（修仙/无限恐怖/悬疑/末世/宫斗）或由 AI 自动识别
4. 可选：填写标题、作者、简介
5. 点击"生成"
6. 前端 POST /api/generate
7. 后端 AI 生成完整 JSON（含所有 RPG 字段）
8. 返回作品 ID
9. 跳转到预览页 /play/{uuid}，用户可游玩验证
10. 提供"下载 HTML"按钮，生成含内嵌 JSON 的单文件 HTML
```

**分发链路（作品库）**：
```
1. 用户点击"作品库"入口，进入 /library
2. 前端 GET /api/works 获取作品列表
3. 展示作品卡片（封面 + 标题 + 类型标签 + 简介）
4. 用户点击某个作品
5. 跳转到 /play/{uuid}
6. 播放器通过 GET /api/works/{uuid} 获取 JSON
7. 播放器加载，用户开始游玩
```

---

## 4. API 接口设计

### 4.1 POST /api/generate

**功能**：接收小说文本和生成参数，调用 AI 生成 RPG JSON，保存到存储层。

**请求**：
```json
{
  "text": "小说文本内容...",
  "title": "青炉夜火",
  "author": "山音",
  "genre": "xianxia",
  "description": "修仙题材互动文游",
  "mode": "preview"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 小说原文（片段或完整） |
| `title` | string | 否 | 作品标题，缺失时由 AI 从文本推断 |
| `author` | string | 否 | 作者名，缺失时为空 |
| `genre` | string | 否 | 类型标识，缺失时 AI 自动识别 |
| `description` | string | 否 | 简介，缺失时由 AI 生成 |
| `mode` | string | 否 | `"preview"`（即时体验，生成简化版）或 `"full"`（完整创作） |

**响应**（成功）：
```json
{
  "success": true,
  "id": "a1b2c3d4",
  "title": "青炉夜火",
  "genre": "xianxia"
}
```

**响应**（生成失败）：
```json
{
  "success": false,
  "error": "AI generation failed",
  "message": "生成失败，请检查小说内容后重试"
}
```

**后端行为**：
1. 接收文本和参数
2. 构造 AI Prompt（含类型模板、JSON Schema 约束、文学保真规则）
3. 通过 API Route 代理调用 Claude/GPT API
4. 解析 AI 返回的 JSON，运行 `validate` 校验
5. 校验通过：保存到存储层（开发环境 files/ 目录，生产环境 Vercel Blob），返回作品 ID
6. 校验失败：返回错误信息，前端提示用户

**JSON 文件命名**：使用 UUID 作为文件名（如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890.json`），响应中返回短 ID（前 8 位）。

**AI Prompt 构造要点**：
- 注入 `SCHEMA_v1.md` 的完整 Schema 约束
- 注入对应类型模板（`GENRE_TEMPLATES.md` 中的修仙/无限恐怖/悬疑/末世/宫斗规则）
- 注入文学保真规则（风格指纹 + 13 项校验）
- `mode=preview` 时生成简化版 JSON（节点数控制在 10-20 个，不含 milestones/endings 的完整定义）
- `mode=full` 时生成完整版 JSON（含所有 RPG 字段、milestones、endings、delayedChanges 等）

### 4.2 GET /api/works

**功能**：列出存储层中所有作品。

**响应**：
```json
{
  "works": [
    {
      "id": "a1b2c3d4",
      "title": "青炉夜火",
      "genre": "xianxia",
      "description": "修仙题材互动文游",
      "author": "山音",
      "createdAt": "2026-07-06T10:30:00Z",
      "nodeCount": 65,
      "endingCount": 4
    },
    {
      "id": "e5f6g7h8",
      "title": "主神空间：第一次任务",
      "genre": "horror",
      "description": "无限恐怖类型互动文游",
      "author": "",
      "createdAt": "2026-07-06T11:15:00Z",
      "nodeCount": 80,
      "endingCount": 5
    }
  ]
}
```

**后端行为**：
1. 扫描存储层中所有 `.json` 文件
2. 读取每个 JSON 的 `meta` 字段提取标题、类型、作者、描述
3. 统计节点数和结局数
4. 按创建时间倒序返回

### 4.3 GET /api/works/[id]

**功能**：返回指定作品的完整 JSON 内容。

**响应**：
```json
{
  "success": true,
  "data": {
    "meta": { ... },
    "startNodeId": "node_start",
    "variables": { ... },
    "nodes": { ... }
  }
}
```

**响应**（作品不存在）：
```json
{
  "success": false,
  "error": "Work not found"
}
```

**后端行为**：
1. 根据短 ID 匹配存储层中的 JSON 文件
2. 读取并返回完整 JSON 内容
3. 文件不存在时返回 404

---

## 5. 核心功能需求

### 5.0 功能分层

```
Layer 0: 平台服务（v2.0 新增）
  - Next.js API Routes（POST /api/generate, GET /api/works, GET /api/works/[id]）
  - JSON 文件存储（开发环境本地 files/ 目录，生产环境 Vercel Blob Storage）
  - AI Prompt 构造与代理调用

Layer 1: 叙事引擎（从 rpg-game-ui-v2/ 迁移为 React 组件）
  - 节点/段落/选项/分支/结局
  - 状态变量/标记/成就
  - RPG 播放器加载 JSON 游玩

Layer 2: 轻 RPG 系统
  - 数值可视化（状态栏）
  - 变化反馈（选择后展示）
  - 条件选项（置灰/提示）
  - 类型专属数值（修仙：境界/修为/灵力/道心）
  - 选择重量提示（choice.weight）

Layer 3: 场景互动与深度玩法
  - 节点内可探索交互（渐进探索系统）
  - 背包/资源系统
  - 任务/倒计时机制
  - 三层后果系统（delayedChanges）
  - 成长里程碑系统（milestones）
  - 完整结局数据包（endings）

Layer 4: 视觉设计系统（UI V2，已实现原型）
  - Glassmorphism 毛玻璃组件系统
  - 5 种题材主题色（修仙金/恐怖红/悬疑蓝/末日绿/宫斗粉）
  - Design Tokens 体系（Tailwind 配置 + CSS 变量）
  - 题材专属 VFX（转场动画 + 粒子效果）
  - 成就系统（3 种稀有度，8 个分类）
  - 存档系统（8 槽位 localStorage）

Layer 5: 类型模板生态
  - 修仙/无限流/悬疑/末世/宫斗模板
  - AI Skill 自动生成类型适配 JSON
  - 示例库与教程

Future: 微信小程序作为未来分发渠道
```

### 5.1 P0 需求（必须做）

以下需求按优先级排序。

#### P0-0: Next.js 全栈项目搭建

**需求描述**：搭建平台版核心全栈项目，提供 AI 生成和作品管理能力。

**技术选型**：
- 框架：Next.js 14 App Router
- 语言：TypeScript
- 样式：Tailwind CSS + Shadcn/ui
- 部署：Vercel（主部署），国内备案域名指向 Vercel
- AI 调用：通过 API Routes 代理调用 Claude/GPT API

**项目规格**：
- 仅 3 个 API 接口：`POST /api/generate`、`GET /api/works`、`GET /api/works/[id]`
- 无数据库，JSON 文件保存在开发环境 `files/` 目录或生产环境 Vercel Blob
- 无用户系统，无登录/注册
- AI 调用封装为独立模块，支持切换不同 AI Provider（通过环境变量）
- 内置 `validate` 校验，生成的 JSON 必须通过 Schema 校验
- 播放器组件从 `rpg-game-ui-v2/` 迁移为 React 组件

**验收标准**：
- 3 个接口均可正常调用
- AI 生成的 JSON 保存到存储层
- 生成的 JSON 通过 `validate` 校验
- 服务启动和部署简单（`npm run dev` / `vercel deploy`）

---

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
| `enabled` | boolean | 否 | 是否启用 RPG 模式，默认 `false`，缺失时按 `false` 处理 |
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

**UI 规范**：

```
+-------------------------------------------------+
|  你要怎么做？                                    |
|                                                 |
|  [!] 关键抉择                                    |  <- critical: 特殊图标 + 标签
|  +--------------------------------------+       |
|  |  替师父守住丹炉，放弃大比              |  <- 边框高亮 + 呼吸动画
|  +--------------------------------------+       |
|                                                 |
|  [~] 支线影响                                    |  <- branch: 分支图标 + 标签
|  +--------------------------------------+       |
|  |  参加大比，让丹炉自生自灭              |  <- 边框强调
|  +--------------------------------------+       |
|                                                 |
|  o 先去吃个饭                                   |  <- minor: 默认样式
|                                                 |
+-------------------------------------------------+
```

**视觉差异化规则**：

| weight | 边框 | 背景 | 图标 | 标签 | 动画 |
|--------|------|------|------|------|------|
| `critical` | 主题色高亮边框 (2px) | 主题色 10% 透明度底色 | 叹号/闪电 | "关键抉择"标签 | 边框呼吸动画（3s 循环） |
| `branch` | 次要强调色边框 (1px) | 次要色 5% 透明度底色 | 分支图标 | "支线影响"标签 | 无 |
| `minor` | 默认边框 | 无 | 无 | 无 | 无 |
| `cosmetic` | 默认边框（可选淡化） | 无 | 无 | 无 | 无 |

**主题色联动**：`critical` 的高亮颜色应使用当前题材主题色（修仙=金色、恐怖=深红、悬疑=冷蓝、末日=军绿、宫斗=金粉）。

#### Tailwind 规格

**critical 选择**：
```tsx
// React + Tailwind 示例
<button className="
  border-2 border-[var(--brand-color)]
  shadow-[0_0_12px_var(--brand-glow)]
  animate-pulse-glow
  relative
">
  替师父守住丹炉，放弃大比
</button>

// CSS 变量在 globals.css 中定义
// @keyframes pulseGlow { ... }
```

**branch 选择**：
```tsx
<button className="border-l-4 border-[var(--brand-color)]">
  参加大比，让丹炉自生自灭
</button>
```

**移动端适配**（用背景色替代 hover，避免 hover-only 交互）：
```tsx
// Tailwind 响应式
<button className="md:hover:bg-brand/10 bg-gradient-to-br from-brand/10 to-transparent">
</button>
```

**主题色映射**：`var(--brand-color)` 和 `var(--brand-glow)` 随 `meta.genre` 自动切换，通过 CSS 变量或 Tailwind 的 `data-genre` 属性驱动。

**验收标准**：
- 4 种 weight 级别都有对应视觉样式
- `weight` 未设置时默认为 `minor`，不影响旧 JSON
- `critical` 选项有呼吸动画，在移动端不造成性能问题
- 主题色随 `meta.genre` 自动切换
- 标签文本可被 `weightTag` 自定义覆盖

---

#### P0-2: 播放器顶部状态栏 UI

**需求描述**：在播放器（/play/[id]）顶部增加 RPG 状态栏，展示 `primaryStats`。播放器组件从 `rpg-game-ui-v2/` 迁移为 React 组件。

**UI 规范**（对齐 UI V2 组件结构）：

```
+-------------------------------------------------+
|  status-bar (Glassmorphism 半透明底栏)           |
|  +------------------------------------------+  |
|  |  [书名]     [境界：炼气三层] [修为: 12/100] |  |
|  |  [菜单]      [灵力: ████░░] [道心: 3]     |  |
|  +------------------------------------------+  |
+-------------------------------------------------+
```

**设计约束**：
- 高度不超过 60px
- 背景：Glassmorphism 毛玻璃效果（`backdrop-filter: blur(12px)`），跟随题材主题色
- 支持暗色/亮色主题（跟随播放器主题）
- 数值条使用 Tailwind 自定义类或 CSS 变量 `--bar-height`、`--bar-radius`、`--bar-fill-color`
- 移动端：横向滚动或折叠为图标

**技术实现**：
- React 播放器组件从 API 或本地加载 JSON
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

---

#### P0-3: 状态详情抽屉

**需求描述**：点击状态栏或「状态详情」按钮，展开抽屉展示所有 `variables`（包括隐藏数值）。

**UI 规范**：
- 右侧滑出抽屉（Glassmorphism 风格）
- 显示所有变量名、当前值、类型
- 隐藏数值标记为「隐藏」
- 支持搜索/筛选

**技术实现**：使用 Shadcn/ui 的 Sheet 组件作为抽屉基础，自定义 Glassmorphism 风格。

**验收标准**：
- 抽屉展开/收起动画流畅
- 显示所有 variables
- 隐藏数值有视觉区分

---

#### P0-4: `changes` 变化反馈

**需求描述**：玩家做出选择后，系统计算 `changes` 前后的差异，并以 toast/弹窗形式展示。

**`changes` 扩展定义**：

```json
{
  "changes": {
    "val": 5,
    "set": {
      "cultivation": 10,
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
- 技术实现：使用 Shadcn/ui 的 Toast/Sonner 组件，自定义样式

**验收标准**：
- `show=true` 时正确显示所有变化
- `show=false` 时不显示
- 旧 JSON（无 `show`）保持旧行为
- 动画流畅，不遮挡选项

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

---

#### P0-6: 修仙 Demo 内容

**需求描述**：制作一个完整的修仙 Demo，展示所有 P0 功能。

**Demo 规格**：
- 节点数：40-80 个
- 结局数：3-5 个
- 核心数值：境界、修为、灵力、道心
- 必须包含：修炼、突破、因果选择、境界反馈
- 必须包含 `choice.weight` 示例（至少 2 个 critical、3 个 branch）
- 必须通过 `validate` 校验

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

**注意**：这个任务可以和开发并行，但需要等 P0-1 到 P0-5 完成后才能最终联调。

---

#### P0-7: `validate` 增强

**需求描述**：校验器需要支持新的 RPG 字段校验。

**校验规则**：详见 [`SCHEMA_v1.md`](./SCHEMA_v1.md)（RPG-001 到 RPG-018），覆盖 primaryStats、weight、depth、milestones、endings、delayedChanges、condition 引用等维度。

**技术实现**：校验器作为 TypeScript 模块，可被 API Routes 和前端同时调用。

**验收标准**：
- 所有新增规则正确执行
- 旧 JSON 不受影响
- 错误信息清晰，包含具体节点 ID

---

#### P0-8: 引流层 -- 即时体验页（`/instant`）

**需求描述**：平台版核心引流入口，用户打开页面后可直接粘贴小说片段，AI 生成简化版 JSON 后即刻游玩。

**页面结构**：
```
+-------------------------------------------------+
|  Story-to-Game                                   |
|  "把你的小说变成互动游戏"                          |
+-------------------------------------------------+
|                                                  |
|  [粘贴一段小说，即刻变成互动游戏]                    |  <- 大输入框（textarea）
|                                                  |
|  类型：[修仙] [恐怖] [悬疑] [末世] [宫斗] [自动]     |  <- 类型选择
|                                                  |
|  [  立即体验  ]                                   |  <- 主 CTA 按钮
|                                                  |
|  --- 或 ---                                      |
|                                                  |
|  [  上传完整小说，生成完整游戏  ]                    |  <- 次要 CTA，跳转创作层
|                                                  |
+-------------------------------------------------+
|  [作品库]  [关于]  [GitHub]                       |  <- 底部导航
+-------------------------------------------------+
```

**交互流程**：
1. 用户在输入框中粘贴文本（至少 200 字）
2. 可选择类型，也可留空让 AI 自动识别
3. 点击"立即体验"
4. 前端显示生成进度动画
5. 调用 `POST /api/generate`（mode=preview）
6. 生成完成后自动跳转到 `/play/{uuid}`
7. 播放器加载 JSON，用户即刻游玩

**技术实现**：使用 Shadcn/ui 的 Textarea、Badge、Button 组件，React state 管理表单和 loading 状态。

**验收标准**：
- 首页加载时间 < 2 秒
- 输入框交互流畅
- 生成过程有明确进度反馈（loading 动画 + 文字提示）
- 生成成功后 1 秒内跳转到播放器
- 移动端体验良好

---

#### P0-9: 播放器 API 集成（`/play/[id]`）

**需求描述**：播放器（/play/[id]）支持从 API 加载 JSON，而非仅内嵌本地 JSON。

**实现方式**：
- 播放器 URL 格式：`/play/{uuid}`
- 页面加载时，React 播放器组件调用 `GET /api/works/{uuid}` 获取 JSON
- 获取成功后加载游玩
- 获取失败时显示错误页面，提供返回首页按钮
- 仍支持本地 JSON 加载（向后兼容离线场景）
- 使用 Next.js 的 `useParams` 获取 `id`，`useEffect` 加载数据

**验收标准**：
- 通过 URL 参数加载远程 JSON 成功
- 网络错误时友好提示
- 本地 JSON 加载方式不受影响

---

### 5.2 P1 需求（应该做）

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

---

#### P1-1.5: 渐进探索系统（`interaction.depth`）

**需求描述**：探索应有渐进回报，不同深度的探索提供差异化内容和反馈。

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

**验收标准**：
- 3 种 depth 级别有对应显示逻辑和视觉样式
- `surface` 始终显示，无需条件
- `deep` 有条件时高亮提示，不满足时显示条件要求
- `ultimate` 不满足条件时完全隐藏（不显示按钮），满足条件后以特殊动画出现
- `depth` 未设置时默认为 `surface`，不影响旧 JSON

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
  1. 立即执行 A 的 changes（第一层：选择回响）-> Toast 显示
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

---

#### P1-3: 成长里程碑系统（`milestones`）

**需求描述**：成长不应只是数字变化，应有仪式感。当玩家达成关键成长节点时，触发全屏庆祝动画和题材专属 VFX。

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

**检测优先级规则**：先检测 milestones（成长节点优先展示），再检测 endings。

**题材专属 VFX 映射**：

| genre | `small` VFX | `medium` VFX | `large` VFX |
|-------|-------------|--------------|------------|
| `xianxia` | 灵气微光 | 功法领悟（符文浮现） | 境界突破（金光冲天 + 水墨晕开） |
| `horror` | 生存闪光 | 线索发现（恐惧闪屏） | 存活归来（画面撕裂重组） |
| `mystery` | 线索微闪 | 推理成功（打字机效果） | 案件破解（线索聚合爆发） |
| `apocalypse` | 资源提示 | 避难所升级（警告闪光） | 幸存者集结（噪点闪烁 + 光芒） |
| `palace` | 金色微光 | 权力晋升（帷幕微动） | 登顶（帷幕拉开 + 金色粒子） |

**验收标准**：
- 3 种庆祝级别都有对应视觉效果
- 5 种题材主题的 VFX 正确联动
- `once=true` 的里程碑只触发一次
- 里程碑触发时不丢失当前游戏状态
- 移动端 large 庆祝动画不卡顿
- 里程碑未定义时，旧 JSON 完全不受影响

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
| `type` | string | 是 | 结局类型 |
| `condition` | object/string | 是 | 触发条件，复用 condition 系统 |
| `hidden` | boolean | 否 | 是否为隐藏结局（默认 false） |

**结局类型**：

| type | 含义 | 色调 |
|------|------|------|
| `true` | 真结局 / 最佳结局 | 金色 |
| `dark` | 坏结局 / 黑暗结局 | 深红 |
| `romance` | 感情结局 | 粉色 |
| `neutral` | 普通结局 / 平凡结局 | 灰色 |
| `noble` | 牺牲结局 / 壮烈结局 | 银白 |
| `hidden` | 隐藏结局 / 彩蛋结局 | 特殊渐变 |

**结局检测时机**：在特定节点上通过 `candidateEndings: ["ascension", "demon_path"]` 显式声明该节点是"结局候选节点"，只有到达结局候选节点时，才检测声明的 endings.condition。

**结局追踪 UI（mini dot tracker）**：
```
结局收集：3/6

  [T] [D] [N] [?] [?] [?]
  已收集    未发现
```

**验收标准**：
- 所有结局类型有对应视觉样式
- 隐藏结局正确显示为模糊状态，达成后解锁
- 结局 dot tracker 正确显示收集进度
- 结局解锁状态正确持久化到存档
- `endings` 未定义时，旧 JSON 使用默认的节点结束行为

---

#### P1-4: 无限恐怖模板 Demo

**需求描述**：制作无限恐怖类型 Demo，展示任务/倒计时/团队信任机制。

**Demo 规格**：
- 节点数：60-100 个
- 核心数值：HP、理智、奖励点、团队信任、危险度、时间
- 必须包含：任务发布、场景搜索、团队分歧、危机事件、回归结算
- 必须包含 `choice.weight` 和 `delayedChanges` 示例
- 必须包含 `milestones` 示例（至少 3 个）
- 必须包含 `endings` 示例（至少 4 个）

---

#### P1-5: AI Skill 类型识别升级

**需求描述**：AI 生成接口能自动识别小说类型并生成对应的 RPG 字段。

**类型识别规则**：

```
如果原作包含以下关键词/模式：
  - 修仙/修真/境界/筑基/金丹/元婴/渡劫/灵力/法宝/丹药
  -> genre: "xianxia"
  -> 自动生成 meta.rpg（境界/修为/灵力/道心）
  -> 自动生成 milestones（突破境界 large、领悟功法 medium、首次获胜 small）
  -> 自动生成 endings（true/dark/neutral/hidden）

  - 主神空间/副本/恐怖/生存/奖励点/强化
  -> genre: "horror"
  -> 自动生成 meta.rpg（HP/理智/奖励点/团队信任）
  -> 自动生成 milestones（存活归来 large、团灭存活 medium、发现线索 small）
  -> 自动生成 endings（true/dark/neutral/hidden）

  - 侦探/推理/凶手/线索/证词/密室
  -> genre: "mystery"
  -> 自动生成 meta.rpg（线索/推理/压力/嫌疑）
  -> 自动生成 milestones（案件破解 large、关键推理 medium、发现线索 small）
  -> 自动生成 endings（true/dark/neutral/hidden）

  - 末世/丧尸/避难所/废土/资源
  -> genre: "apocalypse"
  -> 自动生成 meta.rpg（食物/药品/安全度/士气）

  - 宫廷/妃嫔/皇帝/选秀/权谋
  -> genre: "palace"
  -> 自动生成 meta.rpg（好感度/声望/危机值）
```

**验收标准**：
- 修仙素材自动识别准确率 >= 80%
- 生成的 JSON 能通过 validate
- `mode=preview` 生成简化版（10-20 节点），`mode=full` 生成完整版
- 用户可覆盖 AI 的自动识别结果

---

#### P1-6: 创作层 -- 完整创作页（`/create`）

**需求描述**：面向创作者的完整生成页面，支持上传完整小说、自定义参数、预览和下载。

**页面结构**：
```
+-------------------------------------------------+
|  创作工坊                                         |
+-------------------------------------------------+
|  作品标题：[____________]                          |
|  作者：[____________]                             |
|  类型：[修仙 v]                                   |
|                                                  |
|  小说文本：                                       |
|  +------------------------------------------+   |
|  |                                          |   |  <- 大文本框，支持粘贴和上传
|  |  （支持粘贴或拖拽上传 .txt 文件）            |   |
|  |                                          |   |
|  |                                          |   |
|  +------------------------------------------+   |
|                                                  |
|  高级选项（展开）：                                |
|  [ ] 生成完整 RPG 字段（milestones/endings）      |
|  [ ] 启用渐进探索系统（interactions + depth）      |
|  [ ] 启用背包系统（inventory）                     |
|                                                  |
|  [  生成游戏  ]                                   |
+-------------------------------------------------+
```

**生成完成后**：
- 自动跳转到预览页（/play/{uuid}）
- 提供「下载 HTML」按钮（生成含内嵌 JSON 的单文件 HTML）
- 提供「重新生成」按钮
- 提供「返回创作」按钮

**验收标准**：
- 支持粘贴和文件上传两种输入方式
- 高级选项可展开/折叠
- 生成完整版 JSON（含所有 RPG 字段）
- 下载功能生成可独立运行的单文件 HTML

---

#### P1-7: 分发层 -- 作品库页（`/library`）

**需求描述**：展示所有已生成作品，玩家可浏览和点击即玩。

**页面结构**：
```
+-------------------------------------------------+
|  作品库                                          |
+-------------------------------------------------+
|  筛选：[全部] [修仙] [恐怖] [悬疑] [末世] [宫斗]    |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | [封面]   |  | [封面]   |  | [封面]   |        |
|  | 青炉夜火  |  | 主神空间  |  | ...      |        |
|  | 修仙     |  | 恐怖     |  |          |        |
|  | 65 节点  |  | 80 节点  |  |          |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
+-------------------------------------------------+
```

**实现方式**：
- 前端调用 `GET /api/works` 获取作品列表
- 按类型筛选（前端过滤即可）
- 按创建时间倒序排列
- 点击作品卡片跳转到 `/play/{uuid}`
- 使用 Shadcn/ui 的 Card、Badge、Skeleton 组件

**验收标准**：
- 作品列表正确展示
- 类型筛选功能正常
- 点击跳转流畅
- 空作品库时显示引导信息

---

#### P1-8: 调试器增强

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

**技术实现**：作为 React 组件 `DevToolsPanel`，在播放器页面通过快捷键（如 `Ctrl+Shift+D`）或 URL 参数 `?debug=1` 触发显示。

---

### 5.3 P2 需求（可以做）

**重要说明**：UI V2 设计系统（Glassmorphism、Design Tokens、5 种题材主题色、VFX 特效、成就系统、存档系统）已在原型阶段完成了远超原 P2 范围的工作。当前 P2 阶段的焦点不再是"设计 UI"，而是将已有 UI V2 的视觉规范与 Next.js + Tailwind + Shadcn/ui 组件体系对接，并实现真实数据驱动的渲染。

| 编号 | 需求 | 说明 |
|------|------|------|
| P2-1 | JSON 驱动 UI 对接 | 将 UI V2 的 Glassmorphism 视觉规范迁移到 Tailwind + CSS 变量，实现真实数据驱动的 React 组件渲染 |
| P2-2 | 悬疑/末世/宫斗模板 | 三类各一个 Demo，包含 milestones、endings、delayedChanges |
| P2-3 | 示例库与文档 | 每类至少一个完整 Demo + 教程 |
| P2-4 | 下载功能增强 | 单文件 HTML 导出（含内嵌 JSON），支持自定义封面和主题 |

**UI V2 现有组件清单（已完成原型，待迁移为 React 组件）**：

| 组件 | 说明 | JSON 数据源 |
|------|------|-------------|
| `SceneViewport` | 主视口容器，包含场景背景和叙事区 | `segments`、`scene` |
| `StatusBar` | 顶部状态栏（Glassmorphism） | `meta.rpg.primaryStats` |
| `Narrative` | 叙事文本展示区 | `segments` |
| `Interactions` | 交互按钮区 | `interactions`（含 `depth`） |
| `Choices` | 选项区（含 `choice.weight` 视觉） | `choices` |
| `Inventory` | 背包面板 | `inventory` |
| `Notifications` | Toast/通知系统 | `changes.show`、`delayedChanges` |
| `Achievements` | 成就面板 | `achievements` |
| `Endings` | 结局追踪 dot tracker | `endings` |
| `MilestoneOverlay` | 里程碑庆祝覆盖层 | `milestones` |

---

## 6. 技术约束

### 6.1 前端技术约束

**框架**：Next.js 14 App Router + TypeScript

**样式**：Tailwind CSS + Shadcn/ui 组件库

**浏览器兼容性**：支持 Chrome 90+、Firefox 88+、Safari 14+、Edge 90+

**移动端**：响应式布局，支持主流移动浏览器

**节点数量**：现代浏览器可流畅运行 5000+ 节点

**内存占用**：RPG 状态数据应在 100KB 以内

**播放器架构**：将 `rpg-game-ui-v2/` 的 HTML/CSS/JS 组件迁移为 React 组件，集成到 Next.js App Router 中。保留原有 CSS 视觉规范（Glassmorphism、Design Tokens、主题色系统），迁移为 Tailwind 工具类 + CSS 变量体系。

### 6.2 后端技术约束

**框架**：Next.js API Routes（Serverless Functions），不单独搭建后端服务

**AI 调用**：通过 API Routes 代理调用 Claude/GPT API，API Key 通过 Vercel 环境变量配置

**存储**：
- 开发环境：JSON 文件存储在项目根目录 `files/` 下（Git 忽略）
- 生产环境：Vercel Blob Storage
- 存储抽象层 `lib/storage.ts` 统一封装，自动根据环境切换

**用户系统**：不做用户注册/登录

**接口数量**：仅 3 个接口（POST /api/generate, GET /api/works, GET /api/works/[id]）

**部署**：Vercel（主部署），国内备案域名指向 Vercel

### 6.3 JSON Schema 约束

- 所有新增字段必须**可选**，旧 JSON 完全兼容
- `meta.rpg` 不存在时，播放器行为与 v1.x 完全一致
- 不允许删除或修改已有字段的语义
- Skill 后续应优先生成对象化 `condition`，字符串条件只作为兼容格式

**v2.0 新增字段兼容性规则**：

| 新增字段 | 位置 | 默认行为（未设置时） | 兼容性说明 |
|----------|------|----------------------|------------|
| `choice.weight` | `choices[].weight` | 默认视为 `"minor"` | 完全向后兼容 |
| `choice.weightTag` | `choices[].weightTag` | 使用 weight 对应的默认标签 | 可选覆盖 |
| `interaction.depth` | `interactions[].depth` | 默认视为 `"surface"` | 完全向后兼容 |
| `delayedChanges` | `node.delayedChanges` | 不存在时不执行任何延迟变化 | 完全向后兼容 |
| `milestones` | 顶层 `milestones` 数组 | 不存在时不触发任何里程碑 | 完全向后兼容 |
| `endings` | 顶层 `endings` 数组 | 不存在时使用默认的节点结束行为 | 完全向后兼容 |

**向后兼容策略**：
- 所有新增字段均为顶层可选或对象内可选，不改变任何已有字段的结构
- 旧版播放器遇到未知字段时应静默忽略
- 新版播放器读取旧版 JSON 时，所有新增系统自动降级为关闭状态

### 6.4 项目代码结构

```
story-to-game/
  |-- app/                              # Next.js App Router
  |   |-- page.tsx                      # 首页 / - 品牌展示 + CTA + 热门作品
  |   |-- instant/
  |   |   +-- page.tsx                  # 即时体验 /instant
  |   |-- create/
  |   |   +-- page.tsx                  # 创作者页 /create
  |   |-- library/
  |   |   +-- page.tsx                  # 作品库 /library
  |   |-- play/
  |   |   +-- [id]/
  |   |       +-- page.tsx              # 播放器 /play/[id]
  |   |-- layout.tsx                    # 根布局
  |   |-- globals.css                   # 全局样式 + Tailwind + CSS 变量
  |   |
  |   |-- api/
  |   |   |-- generate/
  |   |   |   +-- route.ts              # POST /api/generate
  |   |   |-- works/
  |   |   |   +-- route.ts              # GET /api/works
  |   |   +-- works/[id]/
  |   |       +-- route.ts              # GET /api/works/[id]
  |
  |-- components/                       # React 组件
  |   |-- ui/                           # Shadcn/ui 组件（自动安装）
  |   |-- player/                       # RPG 播放器组件（从 rpg-game-ui-v2/ 迁移）
  |   |   |-- SceneViewport.tsx
  |   |   |-- StatusBar.tsx
  |   |   |-- Narrative.tsx
  |   |   |-- Interactions.tsx
  |   |   |-- Choices.tsx
  |   |   |-- Inventory.tsx
  |   |   |-- Notifications.tsx
  |   |   |-- Achievements.tsx
  |   |   |-- Endings.tsx
  |   |   |-- MilestoneOverlay.tsx
  |   |   |-- RPGStoryLoader.tsx        # JSON 加载器（API + 本地）
  |   |   |-- GameEngine.tsx            # 核心引擎（节点推进）
  |   |   |-- GameState.tsx             # 状态管理（React Context）
  |   |   |-- DevToolsPanel.tsx         # 调试面板
  |   |   +-- index.ts                  # 播放器导出
  |   |
  |   |-- landing/                      # 首页组件
  |   |-- instant/                      # 即时体验页组件
  |   |-- create/                       # 创作页组件
  |   |-- library/                      # 作品库组件
  |   +-- shared/                       # 共享组件
  |
  |-- lib/                              # 工具函数/类型定义
  |   |-- types.ts                      # TypeScript 类型定义（JSON Schema 对应）
  |   |-- utils.ts                      # 通用工具函数
  |   |-- storage.ts                    # 存储抽象层（本地/Vercel Blob）
  |   |-- validate.ts                   # JSON 校验器（TypeScript 模块）
  |   |-- ai/
  |   |   |-- generator.ts              # AI 调用封装
  |   |   |-- prompts/
  |   |   |   |-- base.ts               # 基础 Prompt 模板
  |   |   |   |-- xianxia.ts            # 修仙类型 Prompt
  |   |   |   |-- horror.ts             # 恐怖类型 Prompt
  |   |   |   |-- mystery.ts            # 悬疑类型 Prompt
  |   |   |   |-- apocalypse.ts         # 末世类型 Prompt
  |   |   |   +-- palace.ts             # 宫斗类型 Prompt
  |   |   +-- provider.ts               # AI Provider 切换（Claude/GPT）
  |
  |-- public/                           # 静态资源
  |   +-- assets/                       # 图片/字体等
  |
  |-- files/                            # 开发环境 JSON 存储（Git 忽略）
  |   +-- {uuid}.json                   # AI 生成的完整 RPG JSON 剧本
  |
  |-- tailwind.config.ts                # Tailwind 配置（含 Design Tokens）
  |-- components.json                   # Shadcn/ui 配置
  |-- next.config.js                    # Next.js 配置
  |-- vercel.json                       # Vercel 配置
  +-- package.json
```

### 6.5 性能要求

- 首页加载时间 < 2 秒
- AI 生成响应时间（preview 模式）< 30 秒
- AI 生成响应时间（full 模式）< 120 秒
- 播放器加载 JSON < 1 秒
- 选择响应时间 < 100ms
- 状态栏更新动画 < 300ms
- 里程碑庆祝动画（large）帧率 >= 30fps
- 存档/读档 < 50ms

---

## 7. UI 设计规范

### 7.0 UI V2 设计系统总览

v2.0 的 UI 视觉标准沿用 UI V2 原型，迁移到 Next.js + Tailwind + Shadcn/ui 组件体系。以下为完整规范。

#### 7.0.1 Glassmorphism 毛玻璃系统

所有主要 UI 组件（状态栏、面板、抽屉、Toast 容器）采用毛玻璃（Glassmorphism）风格：

```tsx
// Tailwind + CSS 变量实现
<div className="
  bg-[var(--glass-bg)]
  backdrop-blur-[var(--glass-blur)]
  border border-[var(--glass-border)]
  rounded-[var(--radius-lg)]
  shadow-[var(--shadow-glass)]
">
</div>
```

#### 7.0.2 Design Tokens 体系（Tailwind 配置 + CSS 变量）

| Token 类别 | 说明 | 示例 |
|------------|------|------|
| 颜色（Color） | 主题色、语义色、中性色 | `--color-primary`、`--color-success` |
| 阴影（Shadow） | 卡片、浮动、玻璃阴影 | `--shadow-card`、`--shadow-glass` |
| 圆角（Radius） | 按钮、卡片、面板 | `--radius-sm`、`--radius-md` |
| 间距（Spacing） | 内边距、外边距、栅格 | `--spacing-xs`、`--spacing-sm` |
| 字体（Typography） | 字族、字号、字重、行高 | `--font-body`、`--text-sm` |
| 动画（Animation） | 时长、缓动、延迟 | `--duration-fast`、`--easing-smooth` |
| Z-index | 层级管理 | `--z-base`、`--z-modal` |

#### 7.0.3 五种题材主题色系统

| 题材 | genre 标识 | 主色调 | 辅助色 | 背景 | 文字 |
|------|------------|--------|--------|------|------|
| 修仙 | `xianxia` | 金色 `#C8A45C` | 玉白 `#F5F0E8` | 暗金 `#1A1710` | 暖白 `#E8DCC8` |
| 无限恐怖 | `horror` | 深红 `#8B1A1A` | 血橙 `#D4644A` | 深黑 `#0D0A0A` | 灰白 `#C8C0B8` |
| 悬疑 | `mystery` | 冷蓝 `#3A5F8A` | 银灰 `#8A9FB5` | 深蓝黑 `#0A0F1A` | 淡蓝 `#C8D5E8` |
| 末日 | `apocalypse` | 军绿 `#5A6B3C` | 铁锈 `#8B7355` | 深绿黑 `#0D110A` | 暗绿白 `#C8CCB8` |
| 宫斗 | `palace` | 金粉 `#C8906C` | 绛紫 `#8B5A6B` | 深酒红 `#1A0D10` | 暖粉白 `#E8D5CC` |

主题色通过 `data-genre` 属性或 React Context 切换，CSS 变量动态更新。

#### 7.0.4 题材专属 VFX 视觉特效

**章节转场动画**：

| 题材 | 转场效果 | 实现方式 |
|------|----------|----------|
| 修仙 | 水墨晕开 | CSS radial-gradient 动画 + opacity 渐变 |
| 无限恐怖 | 画面撕裂 | CSS clip-path 动画 + transform |
| 悬疑 | 打字机效果 | JS 逐字显示 + 光标闪烁 |
| 末日 | 噪点闪烁 | CSS background-image + opacity 闪烁 |
| 宫斗 | 帷幕拉开 | CSS transform scaleY + gradient |

**题材专属粒子效果**：

| 题材 | 粒子效果 | 触发场景 |
|------|----------|----------|
| 修仙 | 灵气粒子（金色光点上浮） | 修炼场景、境界突破 |
| 无限恐怖 | 恐惧闪屏（红色闪屏 + 屏幕抖动） | 危机事件、HP 临界 |
| 悬疑 | 线索闪光（蓝白闪光点） | 发现线索、推理成功 |
| 末日 | 资源警告（黄红脉冲边框） | 资源不足、危险逼近 |
| 宫斗 | 金色闪烁（金色粒子飘落） | 权力晋升、宫廷事件 |

#### 7.0.5 成就系统

- 3 种稀有度：`common`（普通）、`rare`（稀有）、`legendary`（传说）
- 8 个分类：战斗、探索、社交、收集、成长、剧情、隐藏、速度
- 视觉差异：稀有度越高，边框越华丽

#### 7.0.6 存档系统

- 8 槽位，使用 localStorage 持久化
- 每个存档包含：当前节点 ID、variables 全量快照、flags、inventory、milestones 解锁状态、endings 达成状态、timestamps

### 7.1 播放器布局（对齐 UI V2 组件结构）

```
+-------------------------------------------------+
|  status-bar (Glassmorphism)                      |
|  [书名]      [境界：炼气三层] [修为: 12/100]     |
|  [菜单]       [灵力: ████░░] [道心: 3]          |
+-------------------------------------------------+
|                                                  |
|  scene-viewport                                  |
|  +------------------------------------------+   |
|  |  [章节幕：第二章：宗门大比]               |   |  <- VFX 转场动画
|  +------------------------------------------+   |
|  |  [破庙]                                 |   |
|  |                                         |   |
|  |  narrative                              |   |  <- segments 文本区
|  |  你在破庙里醒来，火堆快灭了...            |   |
|  |                                         |   |
|  +------------------------------------------+   |
|  |  choices                                |   |  <- 选项区
|  |  [!] 关键抉择                            |   |
|  |  +----------------------------------+   |   |
|  |  |  替师父守住丹炉                  |   |   |
|  |  +----------------------------------+   |   |
|  |  o 等到天亮                             |   |
|  |  o 现在离开                             |   |
|  |  [需灵力>=20] 强行破阵                   |   |
|  |                                         |   |
|  +------------------------------------------+   |
|                                                  |
+-------------------------------------------------+
|  [存档] [读档] [回退] [状态详情] [设置]           |
+-------------------------------------------------+

notifications (浮动层):
  +-------------------------+
  |  灵力 +10              |
  |  道心 +2               |
  |  获得标记：替师父守住丹炉 |
  +-------------------------+
```

### 7.2 扩展布局（含 interactions + 深度探索 + 完整组件）

```
+-------------------------------------------------+
|  status-bar (Glassmorphism)                      |
|  [书名]      [境界：炼气三层] [修为: 12/100]     |
|  [菜单]       [灵力: ████░░] [道心: 3]          |
+-------------------------------------------------+
|  scene-viewport                                  |
|  +------------------------------------------+   |
|  |  [破庙]                                 |   |
|  |                                         |   |
|  |  narrative                              |   |
|  |  你在破庙里醒来，火堆快灭了...            |   |
|  |                                         |   |
|  |  interactions                           |   |  <- 交互区
|  |  可调查：                                |   |
|  |  [环顾四周]           (surface)        |   |
|  |  [仔细翻阅]           (deep, 需感知>=3) |   |
|  |                                         |   |
|  |  choices                                |   |
|  |  [!] 关键抉择                            |   |
|  |  +----------------------------------+   |   |
|  |  |  替师父守住丹炉                  |   |   |
|  |  +----------------------------------+   |   |
|  |  [~] 支线影响                            |   |
|  |  +----------------------------------+   |   |
|  |  |  趁机搜刮破庙                     |   |   |
|  |  +----------------------------------+   |   |
|  |  o 等到天亮                             |   |
|  |                                         |   |
|  +------------------------------------------+   |
+-------------------------------------------------+
|  [存档] [读档] [回退] [状态详情] [背包] [成就] [结局] [设置] |
+-------------------------------------------------+

milestone-overlay (触发时全屏覆盖):
  +===============================================+
  |                                               |
  |       (全屏庆祝动画 + 题材专属 VFX)             |
  |                                               |
  |           【突破筑基】                          |
  |                                               |
  |   灵力在经脉中奔涌如潮...                       |
  |   (celebration=large, 5-8秒)                   |
  |                                               |
  +===============================================+
```

---

## 8. 验收标准汇总

### 8.1 平台版 MVP 验收标准

| 验收项 | 标准 | 验证方式 |
|--------|------|----------|
| API 服务 | 3 个接口正常工作 | 接口测试 |
| 即时体验 | 粘贴小说 -> 30 秒内可游玩 | 端到端测试 |
| 播放器 API 加载 | 通过 URL 参数加载远程 JSON | 功能测试 |
| RPG 状态栏 | 正确显示 4 种 primaryStats 类型 | 目视检查 + 自动化测试 |
| 选择重量 | choice.weight 4 级别正确渲染 | 目视检查 + 自动化测试 |
| 变化反馈 | 选择后显示数值变化 Toast | 目视检查 |
| 条件选项 | 不满足条件时置灰/隐藏 | 单元测试 |
| 修仙 Demo | 40-80 节点，3-5 结局，可完整游玩 | 玩家测试 |
| 校验器 | 新增校验规则正确执行 | 自动化测试 |
| 兼容性 | 旧 JSON 不受影响 | 回归测试 |

### 8.2 扩展验收标准

| 验收项 | 标准 | 验证方式 |
|--------|------|----------|
| 渐进探索 | 3 种 depth 级别有差异化显示和反馈 | 目视检查 + 自动化测试 |
| 三层后果 | 选择回响 + 即时后果 + 延迟后果三层联动 | 集成测试 |
| 成长里程碑 | 3 种庆祝级别正确触发，5 种题材 VFX 联动 | 目视检查 + 集成测试 |
| 结局数据包 | 多结局追踪、隐藏结局、dot tracker | 目视检查 + 自动化测试 |
| 背包系统 | 道具获取/消耗/条件判断 | 单元测试 |
| 创作页 | 上传小说 -> 生成完整 JSON -> 预览/下载 | 端到端测试 |
| 作品库 | 作品列表展示、筛选、点击即玩 | 端到端测试 |
| 无限恐怖 Demo | 60-100 节点，完整展示 P1 功能 | 玩家测试 |
| 调试器 | 可查看/修改所有状态 | 手动测试 |

### 8.3 用户测试标准

- 5-10 名目标用户（修仙读者/作者）
- 满意度 >= 7/10
- 「数值干扰阅读体验」负评率 < 15%
- 90% 以上选择有明显文本回响
- 「选择没有分量感」负评率 < 20%
- 「成长过程缺乏仪式感」负评率 < 20%
- critical 选择的平均决策时间应显著长于 minor 选择（>2 倍）
- 玩家在首次游玩后愿意重玩的比例 >= 20%
- 即时体验（引流层）转化率（粘贴 -> 游玩）>= 60%

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|----------|
| AI 生成质量不稳定 | 中 | 中 | 13 项校验 + validate + 人工可编辑 + prompt 持续优化 |
| AI 生成耗时过长影响即时体验 | 中 | 高 | preview 模式生成简化版（10-20 节点）；前端 loading 动画缓解等待焦虑 |
| 橙光/易次元推出类似功能 | 中 | 高 | 先发优势 + 类型深度 + 视觉系统 + 零门槛体验 |
| Vercel Blob 存储成本 | 低 | 中 | 作品上限控制 + 定期清理策略 + UUID 命名 |
| 移动端性能问题 | 中 | 中 | 做性能测试，优化关键路径 |
| 无足够开发资源 | 高 | 高 | 开源社区贡献 + 寻找合作者 |
| rpg-game-ui-v2 迁移为 React 组件复杂度高 | 中 | 中 | 分阶段迁移：先核心引擎，再视觉组件 |
| 里程碑 VFX 在低端设备上卡顿 | 中 | 低 | large 庆祝提供降级方案，用户可在设置中关闭 VFX |
| 延迟后果系统增加调试复杂度 | 低 | 中 | 调试面板提供延迟队列可视化 |
| Vercel Serverless 函数冷启动延迟 | 中 | 中 | 使用 Edge Runtime（如支持）；前端 loading 动画缓解 |

---

### 失败事件反馈设计

失败事件（突破失败、队友死亡、推理错误等）通过以下方式处理：

1. **叙事层面的失败**：通过 `changes.feedback` 的 `tone: "danger"` 标记
2. **数值层面的失败**：关键数值降至危险阈值时，状态栏数值闪烁
3. **场景层面的失败**：通过 `segments` 文本的叙事风格传递
4. **失败不影响里程碑系统**：milestones 只标记正向成长节点

---

## 10. Non-goals（明确不做什么）

- **不做用户注册/登录系统**：平台版无需账号体系，降低使用门槛
- **不做后台管理系统**：存储层即存储，无需 CMS
- **不做数据库**：JSON 文件存储（本地/Vercel Blob），简单可靠
- **不做复杂战斗系统**：不做回合制、技能树、装备词条、伤害公式
- **不做实时 AI 生成**：预生成 JSON + 校验，保证质量稳定
- **不做美术资源生成**：专注文字，立绘/背景由作者提供
- **不做通用游戏引擎**：不跟 Ren'Py/Ink 竞争
- **不支持多人在线**：纯单人互动文游
- **不强制使用 RPG**：`meta.rpg.enabled=false` 时保持纯文学模式
- **不做商业化功能**：专注产品体验，商业化后议
- **不优先实现完整题材模板**：5 种题材主题色/VFX 在 UI V2 中已有视觉原型，JSON 内容模板放在 P1/P2
- **不自己做通用动画引擎**：VFX 效果使用 CSS + Canvas 2D 实现
- **不做独立后端服务**：AI 生成和作品管理全部通过 Next.js API Routes 实现

---

## 11. 附录

### 11.1 类型模板系统

类型模板是 Story-to-Game 的核心差异化能力。详细的类型模板定义参见 [`docs/GENRE_TEMPLATES.md`](./GENRE_TEMPLATES.md)。

**支持的类型**：

| 类型 | genre 标识 | 核心体验 |
|------|------------|----------|
| 修仙 | `xianxia` | 境界成长、灵力资源、功法选择、机缘探索、因果/道心 |
| 无限恐怖 | `horror` | 任务副本、生存资源、团队信任、奖励点、恐怖氛围 |
| 悬疑 | `mystery` | 线索收集、推理、压力管理、嫌疑人关系 |
| 末世 | `apocalypse` | 资源管理、避难所建设、团队管理、生存压力 |
| 宫斗 | `palace` | 好感度经营、声望博弈、权力晋升、危机管理 |

### 11.2 术语表

| 术语 | 说明 |
|------|------|
| 节点（node） | 剧情的一个片段，包含文本、选项、交互 |
| 段落（segment） | 节点内的一段文本 |
| 选项（choice） | 玩家可做的选择，导向不同分支 |
| 选择重量（choice.weight） | 选项的重要性等级 |
| 交互（interaction） | 节点内的可探索对象 |
| 探索深度（interaction.depth） | 交互对象的发现层级 |
| 主状态值（val） | 单一核心数值，如道心、理智 |
| 变量（variables） | 自定义状态值 |
| 标记（flags） | 布尔值，记录关键决定 |
| 背包（inventory） | 道具和资源 |
| 条件（condition） | 选项或交互的解锁条件 |
| 路由（routes） | 根据条件自动判断的跳转规则 |
| 选择回响（choice echo） | 选择后立即展示的文本/数值反馈 |
| 即时后果（immediate consequence） | 进入下一节点后触发的变化 |
| 延迟变化（delayedChanges） | 延迟到指定节点生效的变化 |
| 成长里程碑（milestone） | 预定义的关键成长节点 |
| 庆祝规模（celebration） | 里程碑的庆祝级别 |
| 结局（ending） | 预定义的故事结局 |
| Glassmorphism | 毛玻璃视觉风格 |
| Design Tokens | CSS Custom Properties 体系 |
| 题材主题（theme） | 基于题材的整体视觉方案 |
| RPGStoryLoader | 播放器的 JSON 加载器，支持 API 和本地加载 |

### 11.3 参考文档

- [`docs/SCHEMA_v1.md`](./SCHEMA_v1.md) - JSON Schema v1.0（已锁定，含完整字段定义和校验规则 RPG-001 ~ RPG-018）
- [`docs/GENRE_TEMPLATES.md`](./GENRE_TEMPLATES.md) - 类型模板设计（修仙/无限恐怖/悬疑/末世/宫斗）
- [`docs/v2-ROADMAP.md`](./v2-ROADMAP.md) - 路线图
- [`docs/v2-IMPLEMENTATION.md`](./v2-IMPLEMENTATION.md) - 实现细节
- `rpg-game-ui-v2/` - 播放器前端源码（v1.x 原型，v2.0 迁移为 React 组件）
