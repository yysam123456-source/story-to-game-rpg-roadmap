# Story-to-Game 全栈实施方案

**日期**：2026-07-07
**版本**：v5.1（平台化 MVP 阶段）
**架构**：Next.js 14 App Router + iframe 原生引擎 + 多提供商 AI
**基于**：v2-PRD.md + v2-ROADMAP.md + SCHEMA_v1.1.md + SKILL.md

---

## 1. 实施原则

```
1. 向后兼容：所有新功能必须可选，旧 JSON 完全不受影响
2. 先 schema 后 UI：JSON 字段定义必须先稳定，再开发渲染
3. 开发内容并行：引擎开发和内容撰写可以并行，但联调需要串行
4. 双端同源 JSON 协议：HTML 播放器与 API 接口共享同一份 JSON Schema
5. 每阶段有交付：每阶段结束必须有可演示的进度
6. 风险早发现：Schema 评审必须完成，核心 UI 联调必须验证通过
7. 轻量优先：不引入数据库和用户系统，JSON 文件即存储
8. AI 驱动：核心内容生成通过 AI 服务完成，人工可编辑作为兜底
9. iframe 保功能：播放器采用 iframe 嵌入原生引擎，保留 100% 原有功能
```

---

## 2. 系统架构

### 2.1 架构总览

```
┌──────────────────────────────────────────────────────────┐
│                Next.js 14 App Router（全栈）               │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    前端页面层                        │ │
│  │                                                     │ │
│  │  ┌─────────┐  ┌───────────┐  ┌──────────┐          │ │
│  │  │  page.tsx│  │ instant/ │  │ library/ │          │ │
│  │  │  首页    │  │ 即时体验  │  │ 作品库   │          │ │
│  │  │          │  │ page.tsx  │  │ page.tsx │          │ │
│  │  └─────────┘  └───────────┘  └──────────┘          │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │   play/[id]/page.tsx                        │   │ │
│  │  │   iframe 嵌入原生 JS 播放器                 │   │ │
│  │  │   src="/player/pages/game-main.html?story=ID"│   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 API Routes 层                       │ │
│  │                                                     │ │
│  │  POST /api/generate      → 流式 SSE 返回生成进度    │ │
│  │  POST /api/works         → 保存作品（JSON 导入）    │ │
│  │  GET  /api/works         → 作品列表（扫描存储）      │ │
│  │  GET  /api/works/[id]    → 单个作品完整 JSON        │ │
│  │                                                     │ │
│  │  lib/ai-client.ts        → AI 多提供商客户端       │ │
│  │  lib/storage.ts          → 存储封装（Blob/本地）    │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              存储层                                  │ │
│  │                                                     │ │
│  │  生产：Vercel Blob Storage                          │ │
│  │  开发：本地 files/ 目录                              │ │
│  │  国内：阿里云 OSS / 腾讯云 COS（预留）               │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 硅基流动 │ │ DeepSeek │ │  百炼    │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
        ┌──────────┐ ┌──────────┐
        │  OpenAI  │ │OpenRouter│
        └──────────┘ └──────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 框架 | Next.js 14 App Router | 全栈一体，API Routes 内聚，SSR/SSG 灵活 |
| 语言 | TypeScript | 类型安全，AI 输出 JSON 可强约束 |
| 样式 | Tailwind CSS + Shadcn/ui | 原子化 CSS，组件库即装即用，无需维护 UI 库 |
| AI | 硅基流动 / DeepSeek / 百炼 / OpenAI / OpenRouter | 多提供商比价，国内免费额度优先，OpenAI 兼容格式 |
| 存储 | Vercel Blob（国际）/ 本地 files/（开发）/ S3（国内预留） | 零配置对象存储，开发环境回退本地文件，国内预留 S3 接口 |
| 部署 | Vercel（国际主）+ 腾讯云 CloudBase / VPS（国内） | 自动 CI/CD，Edge Network 国内加速，国内免费方案兜底 |
| 播放器 | iframe 嵌入原生 JS 引擎 | 保留 100% 原有功能，postMessage 与父页面通信 |

---

## 3. 项目结构

```
web/
  app/
    page.tsx                 # 首页 Landing
    layout.tsx               # 根布局（字体、全局 Provider、Navbar + Footer）
    globals.css              # Tailwind + Design Tokens
    instant/
      page.tsx               # 即时体验页（文本输入 + 规则配置 + 生成）
    library/
      page.tsx               # 作品库页（卡片列表 + 分类筛选 + 删除）
    play/
      [id]/
        page.tsx             # 播放器页（iframe 嵌入 game-main.html）
    api/
      generate/
        route.ts             # POST：AI 生成 + SSE 流式进度
      works/
        route.ts             # GET：作品列表 / POST：保存作品
        [id]/
          route.ts           # GET：单个作品完整 JSON
  lib/
    utils.ts                 # cn() 等工具函数
    ai-client.ts             # AI 多提供商客户端（5 家预设）
    storage.ts               # 存储封装（Vercel Blob / 本地文件）
  types/
    index.ts                 # TypeScript 类型定义（Schema v1.1）
  components/
    ui/                      # Shadcn/ui 组件
    landing/                 # 首页专属组件
    library/                 # 作品库组件
  public/
    player/                  # 原生 JS 播放器（iframe 加载）
      js/
        rpg-core.js          # 核心状态机 + 条件引擎 + 变更引擎
        rpg-story-loader.js  # JSON 加载 + 节点导航 + 延迟变化 + 时间压力
        rpg-status-bar.js    # 状态栏渲染
        rpg-choice.js        # 选项渲染 + 条件置灰 + 权重标签
        ui.js                # UI 控制器 + 菜单 + 背包 + 设置 + NPC 关系
        theme.js             # 主题切换 + 场景图加载
        vfx.js               # 粒子特效 + 环境效果
        state.js             # 游戏状态管理
        save-system.js       # 存档系统
        achievement-system.js # 成就系统
        audio-system.js      # 音效 + BGM
      css/
        main.css              # 主样式
        components/           # 组件样式
          rpg-extensions.css  # RPG 面板 + 时间压力 + NPC 关系
      assets/
        images/scenes/        # 5 种题材场景图
      pages/
        game-main.html        # 播放器入口（iframe 加载）
  DEPLOY.md                  # 部署指南（3 种方案）
  next.config.mjs            # Standalone 输出 + webpack external
  tailwind.config.ts
  components.json            # Shadcn/ui 配置
```

**关键决策**：播放器不采用 React 重写方案，而是 iframe 嵌入 `public/player/pages/game-main.html`。原因：
- 原生 JS 引擎功能完整（状态栏、条件选项、延迟变化、交互探索、背包、存档、成就、VFX、音频）
- React 重写会丢失 70% 功能，开发周期不可控
- iframe 通过 `postMessage` 与父页面通信（nodeChange / stateResponse / navigateTo）
- 播放器引擎可独立迭代，不影响 Next.js 前端

---

## 4. API 设计

### 4.1 POST /api/generate

接收小说文本 + 类型参数 + 自定义规则，调用 AI 生成 JSON，流式返回 SSE 进度。

**请求体**：

```json
{
  "text": "小说全文或大纲文本...",
  "genre": "xianxia",
  "title": "青炉夜火",
  "enableRPG": true,
  "rules": {
    "pacing": "relaxed",
    "choiceStyle": "direct",
    "statImpact": "medium",
    "hiddenContentRatio": "high",
    "endingBias": "balanced",
    "narrativePerson": "second",
    "dialogueDensity": "medium",
    "informationAsymmetry": false,
    "timePressure": false,
    "npcRelations": true
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 小说全文、大纲或片段 |
| `genre` | string | 否 | 类型标识：`xianxia` / `horror` / `mystery` / `apocalypse` / `palace` / `general` |
| `title` | string | 否 | 作品名称（不填则 AI 自动生成） |
| `enableRPG` | boolean | 否 | 是否启用 RPG 数值系统 |
| `rules` | object | 否 | 创作者自定义规则（10 项），见 types/index.ts |

**SSE 流式响应**：

```
data: {"type":"start"}

data: {"type":"chunk","content":"..."}

data: {"type":"complete","id":"a1b2c3d4"}
```

### 4.2 POST /api/works

保存作品（JSON 导入或 AI 生成后的保存）。

**请求体**：

```json
{
  "script": { /* 完整 StoryScript JSON */ }
}
```

**响应**：

```json
{
  "success": true,
  "data": { "id": "uuid", "title": "..." }
}
```

### 4.3 GET /api/works

扫描存储，列出所有作品。

**响应**：

```json
{
  "success": true,
  "data": [
    { "id": "...", "title": "...", "genre": "...", "description": "...", "nodeCount": 42, "createdAt": "..." }
  ]
}
```

### 4.4 GET /api/works/[id]

读取指定作品完整 JSON。

**查询参数**：
- `format=script` — 返回适配播放器的简化格式

**响应**：直接返回存储中 `{id}.json` 的完整内容（`Content-Type: application/json`）。

---

## 5. AI 生成服务

### 5.1 服务位置

AI 生成逻辑位于 `lib/ai-client.ts`，由 `app/api/generate/route.ts` 调用。

### 5.2 多提供商配置

| 提供商 | 环境变量 | 说明 |
|--------|----------|------|
| 硅基流动 | `SILICONFLOW_API_KEY` + `SILICONFLOW_BASE_URL` | 国内便宜 API，推荐 |
| DeepSeek | `DEEPSEEK_API_KEY` + `DEEPSEEK_BASE_URL` | 国内便宜 API |
| 百炼 | `BAILIAN_API_KEY` + `BAILIAN_BASE_URL` | 阿里云 |
| OpenAI | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | 国际 |
| OpenRouter | `OPENROUTER_API_KEY` + `OPENROUTER_BASE_URL` | 聚合平台 |

通过 `PROVIDER` 环境变量切换，所有提供商使用 OpenAI 兼容 API 格式。

### 5.3 快速模式流程

```
输入：短文本（<500字）+ genre + rules
  │
  ▼
构建 system prompt（注入 genre 模板 + rules 描述）
构建 user prompt（注入 rules 特殊要求：如 timePressure 则要求加入倒计时）
  │
  ▼
调用 AI API（SSE 流式）
  → 40-80 节点 / 3-5 结局 / 5-10 成就
  → 一次性落盘，不分批
  │
  ▼
保存 storage → 返回作品 ID
```

### 5.4 Rules 参数对 AI Prompt 的影响

| rules 字段 | Prompt 注入内容 |
|------------|-----------------|
| `pacing` | 每 X 句一个选择的节奏要求 |
| `choiceStyle` | 选项风格：直接台词 / 内心独白 / 行动描述 |
| `statImpact` | 数值变动幅度：轻度微调 / 中度影响 / 重度决定生死 |
| `hiddenContentRatio` | 隐藏分支比例 |
| `endingBias` | 结局倾向：HE 偏多 / 均衡 / BE 偏多 / 随机 |
| `narrativePerson` | 第一人称"我" / 第二人称"你" |
| `dialogueDensity` | 对白密度：低（重叙述）/ 中 / 高（重对话） |
| `informationAsymmetry` | 要求设计信息不对称（角色知道但玩家不知道） |
| `timePressure` | 要求加入时间压力机制（倒计时/时限节点） |
| `npcRelations` | 要求设计 NPC 关系网络（至少 3 个有名字的角色，带好感度变化） |

---

## 6. 存储层设计

### 6.1 存储封装 `lib/storage.ts`

```typescript
interface StorageAdapter {
  saveWork(id: string, meta: WorkMeta, script: StoryScript): Promise<void>;
  getWorkMeta(id: string): Promise<WorkMeta | null>;
  getWorkScript(id: string): Promise<StoryScript | null>;
  listWorks(): Promise<WorkMeta[]>;
  deleteWork(id: string): Promise<void>;
}

// 生产环境：Vercel Blob
class BlobStorage implements StorageAdapter { ... }

// 开发环境：本地文件系统
class LocalStorage implements StorageAdapter {
  private dir = './files/';
  // fs.promises 读写
}

export const storage = process.env.VERCEL_BLOB_TOKEN
  ? new BlobStorage()
  : new LocalStorage();
```

### 6.2 Vercel Blob 配置

```bash
# .env.local（开发，不提交）
OPENAI_API_KEY=sk-...
PROVIDER=openai
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# vercel.json（生产环境变量在 Vercel Dashboard 配置）
```

### 6.3 本地开发回退

开发环境下，若未配置 `BLOB_READ_WRITE_TOKEN`，自动回退到 `./files/` 目录读写 JSON。该目录加入 `.gitignore`。

---

## 7. 前端设计

### 7.1 页面架构

| 页面 | 路由 | 文件 | 功能 |
|------|------|------|------|
| Landing | `/` | `app/page.tsx` | 首页，产品介绍 + 快速入口 |
| Instant Preview | `/instant` | `app/instant/page.tsx` | 即时体验页，文本输入 + 规则配置 + 生成 |
| Library | `/library` | `app/library/page.tsx` | 作品库，浏览所有已生成作品 |
| Player | `/play/[id]` | `app/play/[id]/page.tsx` | iframe 嵌入原生播放器 |

### 7.2 即时体验页（/instant）

```
┌──────────────────────────────────────────────────┐
│  即时体验                                          │
│  粘贴小说文本让 AI 生成游戏，或导入已有的 JSON 剧本  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 拖拽 JSON 导入区域                             │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  作品标题：[________]                              │
│                                                    │
│  选择类型：                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 修仙 │ │ 恐怖 │ │ 悬疑 │ │ 末世 │ │ 宫斗 │   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
│                                                    │
│  [✓] 启用 RPG 数值系统                             │
│                                                    │
│  ▼ 自定义游戏规则（可选，展开配置）                 │
│  ┌──────────────────────────────────────────────┐ │
│  │ 节奏密度：[紧凑] [适中] [舒缓]                  │ │
│  │ 选项风格：[直接台词] [内心独白] [行动描述]      │ │
│  │ 数值影响：[轻度] [中度] [重度]                  │ │
│  │ ...（共 10 项规则）                            │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [文本输入框]                                       │
│                                                    │
│  [✨ 开始生成]                                     │
│  进度：正在生成剧本...                             │
└──────────────────────────────────────────────────┘
```

**交互流程**：
1. 用户粘贴文本（建议 < 500 字）
2. 选择类型（默认 `general`）
3. 展开规则面板，调整自定义规则（可选）
4. 点击「开始生成」→ 调用 `POST /api/generate`（携带 rules）
5. 通过 SSE 展示进度
6. 生成完成后自动跳转到 `/play/{id}`

### 7.3 播放器页（/play/[id]）

```tsx
// app/play/[id]/page.tsx
export default function PlayPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-[calc(100vh-64px)] bg-[#0a0a0c]">
      <iframe
        src={`/player/pages/game-main.html?story=${params.id}`}
        className="w-full h-full border-0"
      />
    </div>
  );
}
```

**iframe 播放器自动加载流程**：
1. `game-main.html` 解析 URL 参数 `?story=work_id`
2. 调用 `fetch('/api/works/' + work_id + '?format=script')`
3. 获取 JSON 后初始化 RPG 引擎
4. 自动检测 `meta.rpg.enabled` 启用/禁用 RPG 面板
5. 渲染状态栏、叙事文本、选项、交互按钮

**postMessage 通信**：
- 父页面 → iframe：`navigateTo`、`saveState`
- iframe → 父页面：`nodeChange`、`stateResponse`、`achievementUnlock`

---

## 8. 阶段划分（8 个阶段）

### 阶段状态总览

| 阶段 | 名称 | 状态 |
|------|------|------|
| 阶段一 | Next.js 项目脚手架 + Tailwind + Shadcn/ui | ✅ 完成 |
| 阶段二 | API Routes 骨架 + 存储层 | ✅ 完成 |
| 阶段三 | AI 生成服务集成（多提供商） | ✅ 完成 |
| 阶段四 | 首页 + 即时体验页 + 规则配置 UI | ✅ 完成 |
| 阶段五 | 作品库 + iframe 播放器嵌入 | ✅ 完成 |
| 阶段六 | RPG 引擎功能增强（NPC/时间压力/自动成就） | ✅ 完成 |
| 阶段七 | Schema v1.1 + SKILL.md 扩展 | ✅ 完成 |
| 阶段八 | 修仙 Demo 生成测试 | ⏳ 待验证 |

### 阶段一：Next.js 项目脚手架

**状态**：✅ 完成

**交付物**：`npm run dev` 可启动，五个页面均可访问

---

### 阶段二：API Routes 骨架 + 存储层

**状态**：✅ 完成

**交付物**：API 可通过 curl / 浏览器测试，文件读写正常

---

### 阶段三：AI 生成服务集成（多提供商）

**状态**：✅ 完成

**交付物**：输入短文本 → 输出合规 JSON

- 实现 `lib/ai-client.ts`：5 家提供商预设，环境变量切换
- SSE 流式进度推送
- rules 参数注入 system/user prompt

---

### 阶段四：首页 + 即时体验页 + 规则配置 UI

**状态**：✅ 完成

**交付物**：可访问的网页，用户可粘贴文本 → 配置规则 → 生成 → 预览

- 首页 Landing 完成（hero、features、CTA）
- 即时体验页完成（文本输入、类型选择、规则配置面板、SSE 进度）
- 规则面板：10 项规则全部可配置，类型自动应用推荐配置

---

### 阶段五：作品库 + iframe 播放器嵌入

**状态**：✅ 完成

**交付物**：完整的浏览 → 游玩闭环

- 作品库页：卡片列表、分类筛选、删除、空状态
- 播放器页：iframe 嵌入 `game-main.html`
- iframe 自动从 URL 参数加载作品 JSON
- postMessage 通信接口

---

### 阶段六：RPG 引擎功能增强

**状态**：✅ 完成

**交付物**：NPC 关系、时间压力、自动成就检测全部可用

- NPC 关系面板：右下角悬浮按钮，好感度进度条，角色描述
- 时间压力条：顶部倒计时，30% 阈值警告，超时自动跳转
- 自动成就检测：每节点导航后扫描 autoUnlock 条件
- globalDecay：每节点自动应用数值/好感度衰减

---

### 阶段七：Schema v1.1 + SKILL.md 扩展

**状态**：✅ 完成

**交付物**：Schema 定稿，SKILL.md 7 大可玩性方向全部写入

- Schema v1.1：meta.rules、npcRelations、timePressure、autoUnlock
- TypeScript 类型定义更新
- SKILL.md 扩展：A-G 7 个章节

---

### 阶段八：修仙 Demo 生成测试

**状态**：⏳ 待验证

**目标**：用 AI 生成服务实际生成一个可玩的修仙 Demo

**任务**：
- 准备修仙小说素材（约 1-2 万字）
- 调用标准流程生成完整修仙 JSON
- 验证生成质量：节点数 40-80、结局数 3-5、成就数 5-10
- RPG 状态系统完整、NPC 关系可用、时间压力可选
- 通过 validate.py 全部规则
- 播放器加载并完整游玩测试
- 多路线游玩（至少 3 条不同路线）
- 部署到 Vercel 并验证

**交付物**：通过 AI 真实生成的可完整游玩修仙 Demo，线上可访问

---

## 9. 依赖关系图

```
阶段一：Next.js 项目脚手架 + Tailwind + Shadcn/ui
  │
  ├── 阶段二：API Routes 骨架 + 存储层
  │     │
  │     ├── 阶段三：AI 生成服务集成
  │     │     │
  │     │     ├── 阶段四：首页 + 即时体验页 + 规则配置
  │     │     │     │
  │     │     │     └── 阶段五：作品库 + iframe 播放器
  │     │     │
  │     │     └── 阶段六：RPG 引擎功能增强
  │     │           │
  │     │           └── 阶段七：Schema v1.1 + SKILL.md 扩展
  │     │                 │
  │     │                 └── 阶段八：修仙 Demo 生成测试
```

**关键路径**：阶段一 → 阶段二 → 阶段三 → 阶段四 → 阶段五 → 阶段六 → 阶段七 → 阶段八

---

## 10. MVP 分层定义

### 全栈 MVP 必须（阶段 1-5 交付）

- ✅ Next.js 14 项目脚手架 + Tailwind + Shadcn/ui
- ✅ API Routes 三个端点（generate/works/works/:id）
- ✅ AI 快速模式生成（短文本 → JSON）
- ✅ SSE 流式进度推送
- ✅ 首页 + 即时体验页 + 规则配置 UI
- ✅ 作品库页
- ✅ iframe 播放器嵌入（从 API 加载 JSON）
- ✅ 多提供商 AI 客户端

### 全栈 MVP 应该 / Stretch Goal（阶段 6-7 交付）

- ✅ NPC 关系面板
- ✅ 时间压力倒计时
- ✅ 自动成就检测
- ✅ Schema v1.1 扩展
- ✅ SKILL.md 7 大可玩性方向
- ✅ 部署方案（Vercel / CloudBase / VPS）

### 后续迭代（阶段 8 交付）

- ⏳ 修仙 Demo 真实生成验证
- ⏳ 全流程内测

---

## 11. 关键决策点

| 决策 | 选项 | 实际选择 | 理由 |
|------|------|----------|------|
| 播放器方案 | React 重写 / iframe 嵌入 | iframe 嵌入 | 保留 100% 原有功能，避免重写丢失 70% 功能 |
| AI 提供商 | 单一 OpenAI / 多提供商 | 多提供商 | 国内便宜 API 优先，OpenAI 兜底，比价降低成本 |
| 部署方案 | 仅 Vercel / 双轨 | 双轨 | Vercel（国际）+ 国内云（CloudBase/VPS） |
| 存储方案 | 仅 Blob / 抽象适配 | 抽象适配 | local（开发）/ Blob（国际）/ S3（国内预留） |
| 用户系统 | 有 / 无 | 无 | 轻量优先，按需后期引入微信授权 |

---

## 12. 部署方案

详见 `web/DEPLOY.md`。

### 12.1 Vercel 部署

```bash
npm i -g vercel
vercel --prod
```

### 12.2 国内访问优化

- 备案域名 CNAME 到 `cname.vercel-dns.com`
- Vercel Edge Network 自动选择最优节点
- 静态资源（`public/`）自动 CDN 加速

### 12.3 开发 vs 生产

| 环境 | 存储 | AI API |
|------|------|--------|
| 开发（`npm run dev`） | 本地 `./files/` | 真实 API（注意成本） |
| 预览（Preview Deployment） | Vercel Blob | 真实 API |
| 生产（Production） | Vercel Blob | 真实 API |

---

## 13. 当前已完成状态（2026-07-07 基线）

### 已完成

- ✅ Schema v1.1 锁定（`docs/SCHEMA_v1.1.md`，含 meta.rules / npcRelations / timePressure / autoUnlock）
- ✅ Schema v1.0 兼容保留（`docs/SCHEMA_v1.md`）
- ✅ 5 种类型小说玩法模板（`docs/GENRE_TEMPLATES.md`）
- ✅ validate.py 18 条 RPG 校验规则（RPG-001 ~ RPG-018）
- ✅ SKILL.md 九步工作流 + 7 大可玩性方向扩展（A-G）
- ✅ rpg-game-ui-v2 前端架构（原生 HTML/CSS/JS）
- ✅ Next.js 14 全栈项目（`web/` 目录）
- ✅ API Routes（generate / works / works/:id）
- ✅ AI 多提供商客户端（5 家预设）
- ✅ 存储抽象层（local / Vercel Blob / S3 预留）
- ✅ iframe 播放器嵌入方案（`web/public/player/`）
- ✅ NPC 关系面板、时间压力、自动成就检测
- ✅ 前端规则配置 UI（`/instant` 页面）
- ✅ 部署方案（Vercel / CloudBase / VPS）

### 待验证

- ⏳ 修仙 Demo AI 真实生成质量
- ⏳ 50+ 次生成请求，用户满意度 >= 70%

---

> 本文档为 Story-to-Game 全栈实施方案（Next.js + iframe 原生引擎版），采用「Next.js App Router + API Routes + iframe 播放器 + 多提供商 AI + 抽象存储」架构，将 AI 生成能力产品化。保留所有工程原则（向后兼容、先 schema 后 UI、双端同源 JSON 协议等），删除数据库、用户系统、权限管理、商业化等非核心内容。实际执行中可根据 AI 生成质量和用户反馈灵活调整。
