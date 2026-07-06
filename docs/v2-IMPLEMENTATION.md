# Story-to-Game 全栈实施方案

**日期**：2026-07-06
**版本**：v5.0（Next.js 全栈版）
**架构**：Next.js 14 App Router + API Routes + JSON 存储
**基于**：v2-PRD.md + v2-ROADMAP.md + SCHEMA_v1.md + SKILL.md

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
│  │  │  page.tsx│  │ instant/ │  │ create/  │  library/ │ │
│  │  │  首页    │  │ 即时体验  │  │ 创作者页  │  作品库   │ │
│  │  │          │  │ page.tsx  │  │ page.tsx │  page.tsx │ │
│  │  └─────────┘  └───────────┘  └──────────┘           │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │   play/[id]/page.tsx                        │   │ │
│  │  │   RPG 播放器（React 组件化迁移）              │   │ │
│  │  │   RPGCore.ts / RPGStatusBar.tsx /            │   │ │
│  │  │   RPGChoiceRenderer.tsx / RPGStoryLoader.ts  │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 API Routes 层                       │ │
│  │                                                     │ │
│  │  POST /api/generate      → 流式 SSE 返回生成进度    │ │
│  │  GET  /api/works         → 作品列表（扫描存储）      │ │
│  │  GET  /api/works/[id]    → 单个作品完整 JSON        │ │
│  │                                                     │ │
│  │  lib/ai-service.ts       → AI 调用封装             │ │
│  │  lib/storage.ts          → 存储封装（Blob/本地）    │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              存储层                                  │ │
│  │                                                     │ │
│  │  生产：Vercel Blob Storage                          │ │
│  │  开发：本地 files/ 目录                              │ │
│  │  {uuid}.json → 完整游戏 JSON                        │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            ┌──────────┐   ┌──────────┐
            │  Claude  │   │ GPT-4o   │
            │ 3.5 Sonnet│   │ (fallback)│
            └──────────┘   └──────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 框架 | Next.js 14 App Router | 全栈一体，API Routes 内聚，SSR/SSG 灵活 |
| 语言 | TypeScript | 类型安全，AI 输出 JSON 可强约束 |
| 样式 | Tailwind CSS + Shadcn/ui | 原子化 CSS，组件库即装即用，无需维护 UI 库 |
| AI | Claude 3.5 Sonnet / GPT-4o | Claude 长上下文优势 + GPT-4o 兜底 |
| 存储 | Vercel Blob（生产）/ files/（开发） | 零配置对象存储，开发环境回退本地文件 |
| 部署 | Vercel（主）+ 备案域名 | 自动 CI/CD，Edge Network 国内加速 |

---

## 3. 项目结构

```
app/
  page.tsx                 # 首页 Landing
  layout.tsx               # 根布局（字体、全局 Provider）
  globals.css              # Tailwind + Design Tokens
  instant/
    page.tsx               # 即时体验页（左输入右预览）
  create/
    page.tsx               # 创作者页（完整九步工作台）
  library/
    page.tsx               # 作品库页（卡片列表）
  play/
    [id]/
      page.tsx             # 播放器页（动态路由）
  api/
    generate/
      route.ts             # POST：AI 生成 + SSE 流式进度
    works/
      route.ts             # GET：作品列表
      [id]/
        route.ts           # GET：单个作品完整 JSON
components/
  ui/                      # Shadcn/ui 组件（Button、Card、Progress 等）
  player/                  # RPG 播放器组件（从 rpg-game-ui-v2 迁移）
    RPGCore.ts             # 核心状态机与游戏逻辑
    RPGStatusBar.tsx       # 状态栏组件（血条、灵力等）
    RPGChoiceRenderer.tsx  # 选项渲染组件
    RPGStoryLoader.ts      # JSON 加载与校验
  landing/                 # 首页专属组件
    HeroSection.tsx
    FeatureGrid.tsx
    MiniDemo.tsx
  creator/                 # 创作者页组件
    TextInputPanel.tsx
    ProgressTracker.tsx
    PreviewPanel.tsx
  library/                 # 作品库组件
    WorkCard.tsx
    WorkGrid.tsx
lib/
  utils.ts                 # cn() 等工具函数
  ai-service.ts            # AI 调用封装（Claude/GPT API）
  storage.ts               # 存储封装（Vercel Blob / 本地文件）
  validate.ts              # validate.py 规则 TypeScript 移植
styles/
  globals.css              # Tailwind directives + CSS Variables（Design Tokens）
public/
  themes/                  # 5 种题材主题 CSS
    xianxia.css
    horror.css
    mystery.css
    palace.css
    apocalypse.css
next.config.js
tailwind.config.ts
components.json            # Shadcn/ui 配置
```

---

## 4. API 设计

### 4.1 POST /api/generate

接收小说文本 + 类型参数，调用 AI 执行 SKILL.md 九步工作流，流式返回 SSE 进度，最终返回作品信息。

**请求体**：

```json
{
  "text": "小说全文或大纲文本...",
  "genre": "xianxia",
  "title": "青炉夜火",
  "mode": "standard",
  "options": {
    "quick": false,
    "forceStandard": false
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 小说全文、大纲或片段 |
| `genre` | string | 否 | 类型标识：`literary` / `xianxia` / `horror` / `mystery` / `apocalypse` / `palace` / `custom` |
| `title` | string | 否 | 作品名称（不填则 AI 自动生成） |
| `mode` | string | 否 | `standard`（标准九步流程）或 `quick`（快速模式，<500字素材自动触发） |
| `options.quick` | boolean | 否 | 强制快速模式 |
| `options.forceStandard` | boolean | 否 | 强制标准流程（即使文本很短） |

**SSE 流式响应**：

```
event: step_complete
data: {"step": 1, "name": "原作摄入与风格指纹提取", "status": "completed"}

event: step_complete
data: {"step": 2, "name": "结构拆解与状态系统设计", "status": "completed"}

event: step_complete
data: {"step": 3, "name": "分段写作（第 1/5 章）", "status": "in_progress", "chapter": 1, "totalChapters": 5}

...

event: generation_complete
data: {"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "title": "青炉夜火", "nodeCount": 350}
```

**快速模式步骤合并**：

| SSE 步骤 | 合并的 SKILL.md 步骤 | name |
|----------|---------------------|------|
| 1 | Step 1 + Step 2 | 原作摄入与风格指纹提取 |
| 2 | Step 3 + Step 4 | 结构拆解与状态系统设计 |
| 3 | Step 5-7 | 分段写作（按章节推进） |
| 4 | Step 8 | 连通性验证与 JSON 输出 |

**最终响应**（最后一个 SSE 事件）：

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "青炉夜火",
  "downloadUrl": "/api/works/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed"
}
```

**处理流程**：

1. 生成 UUID 作为作品 ID
2. 根据 `mode` 选择标准流程或快速模式
3. 创建进度状态（内存 Map，key 为 id）
4. 启动 AI 生成工作流（异步，不阻塞响应）
5. 前端通过 SSE 连接接收实时进度
6. 生成完成后保存到存储（Blob 或本地 files/）
7. SSE 推送 `generation_complete` 事件

### 4.2 GET /api/works

扫描存储，列出所有作品。

**响应**：

```json
{
  "works": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "青炉夜火",
      "genre": "xianxia",
      "description": "修仙题材互动文游",
      "nodeCount": 350,
      "createdAt": "2026-07-06T10:30:00Z"
    }
  ]
}
```

**实现**：调用 `lib/storage.ts` 的 `listWorks()`，遍历存储中的 JSON 文件，读取每个文件的 `meta` 字段提取 `title`、`genre`、`description`，统计 `nodes` 数量，读取文件修改时间作为 `createdAt`。

### 4.3 GET /api/works/[id]

读取指定作品完整 JSON。

**响应**：直接返回存储中 `{id}.json` 的完整内容（`Content-Type: application/json`）。

**错误处理**：
- 404：作品不存在
- 500：文件读取失败

### 4.4 API Route 实现要点

```typescript
// app/api/generate/route.ts
import { NextRequest } from 'next/server';
import { generateGame } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  const { text, genre, title, mode } = await req.json();
  const id = crypto.randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await generateGame({ text, genre, title, mode, id, onProgress: send });
      } catch (err) {
        send('error', { message: err.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

## 5. AI 生成服务

### 5.1 服务位置

AI 生成逻辑位于 `lib/ai-service.ts`，由 `app/api/generate/route.ts` 调用。

### 5.2 标准流程（九步工作流，快速模式合并）

```
输入：小说文本 + genre 参数
  │
  ▼
┌─────────────────────────────────────────┐
│ 阶段一：分析与规划（Step 1-2 合并）        │
│                                         │
│  Step 1: 原作摄入与记忆索引构建           │
│    → 骨架层、人物层、场景层、文体层         │
│    → 节奏回归校验                         │
│                                         │
│  Step 2: 风格指纹提取                     │
│    → 叙述温度、对白风格、节奏型、视角转换    │
│    → 原作禁区                             │
│                                         │
│  → SSE 推送: step 1 完成                 │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 阶段二：系统设计（Step 3-4 合并）          │
│                                         │
│  Step 3: 结构拆解与分支点识别             │
│    → 节拍序列、分支点标记                  │
│    → 分支拓扑图、汇合点                    │
│    → 分支文学大纲                         │
│                                         │
│  Step 4: 状态系统与结局矩阵设计            │
│    → val（主状态值）、variables、flags     │
│    → 结局矩阵（true/neutral/dark/hidden）  │
│    → 成就列表                             │
│                                         │
│  → SSE 推送: step 2 完成                 │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 阶段三：内容生成（Step 5-7）              │
│                                         │
│  按章节分批调用 AI，每章生成节点 JSON：     │
│    → 章节设计文档（次级记忆）               │
│    → 节点写作（segments/choices/changes）  │
│    → 章节边界合并                          │
│    → 每章完成后 SSE 推送进度               │
│                                         │
│  >100 节点必须分批                        │
│  每批 50-100 节点                         │
│                                         │
│  → SSE 推送: step 3 进行中（含章节进度）   │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 阶段四：验证与输出（Step 8）               │
│                                         │
│  Step 8: 连通性验证                       │
│    → 运行 validate.ts 规则（RPG-001~018）  │
│    → 节点可达性、引用完整性、变量一致性      │
│    → 无死胡同、结局可达、progress 单调     │
│    → 致命错误自动修复（最多重试 2 次）      │
│                                         │
│  → SSE 推送: step 4 完成                 │
└─────────────────────────────────────────┘
  │
  ▼
合并输出完整 JSON → 保存 storage → 返回结果
```

### 5.3 快速模式

当文本 < 500 字或用户指定 `mode: "quick"` 时进入快速模式：

```
输入：短文本（<500字）
  │
  ▼
内部生成「创作摘要」（200字内，不展示）
  → 标题 + 视角 + 核心张力 + 章节切分 + 结局方向
  → SSE 推送: "快速模式启动"
  │
  ▼
AI 一次性生成完整 JSON
  → 40-80 节点 / 3-5 结局 / 5-10 成就
  → 一次性落盘，不分批
  → SSE 推送: "JSON 生成中..."
  │
  ▼
运行 validate.ts 校验
  → 致命错误修复
  → SSE 推送: "校验完成"
  │
  ▼
保存 storage → 返回结果
```

### 5.4 AI 调用策略

| 策略 | 说明 |
|------|------|
| 主模型 | Claude 3.5 Sonnet（长上下文优势，适合中长篇小说） |
| 备选模型 | GPT-4o（兜底） |
| 切换条件 | Claude API 超时 / 限流 / 返回错误时自动切换 |
| 格式保证 | 使用 function calling / structured output 强制 JSON 输出格式 |
| Prompt 工程 | 每步注入 SKILL.md 对应步骤的参考文档 |
| 上下文管理 | 中间结果缓存在服务端内存，跨步骤携带 |
| 重试策略 | 单步最多重试 2 次，失败后标记该步骤为 warning 并继续 |
| Token 预算 | 按文本体量自动估算总 token，避免超限 |

### 5.5 Function Calling JSON 格式约束

AI 输出的每一步中间结果和最终 JSON 均通过 function calling / structured output 约束格式：

```typescript
// lib/ai-service.ts 中定义的工具 schema
const tools = [
  {
    name: "output_step_result",
    parameters: {
      type: "object",
      properties: {
        step: { type: "integer" },
        type: { type: "string", enum: ["index", "style", "structure", "system", "nodes", "validation"] },
        data: { type: "object" }
      },
      required: ["step", "type", "data"]
    }
  },
  {
    name: "output_final_json",
    parameters: {
      type: "object",
      properties: {
        meta: { type: "object" },
        startNodeId: { type: "string" },
        variables: { type: "object" },
        flags: { type: "array", items: { type: "string" } },
        achievements: { type: "object" },
        nodes: { type: "object" }
        // ... 完整 Schema v1.0 字段
      },
      required: ["meta", "startNodeId", "nodes"]
    }
  }
];
```

---

## 6. 存储层设计

### 6.1 存储封装 `lib/storage.ts`

```typescript
interface StorageAdapter {
  saveWork(id: string, data: object): Promise<void>;
  loadWork(id: string): Promise<object | null>;
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
ANTHROPIC_API_KEY=sk-ant-...
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
| Instant Preview | `/instant` | `app/instant/page.tsx` | 即时体验页，左输入右预览 |
| Creator | `/create` | `app/create/page.tsx` | 创作者页，完整生成 + 预览 |
| Library | `/library` | `app/library/page.tsx` | 作品库，浏览所有已生成作品 |
| Player | `/play/[id]` | `app/play/[id]/page.tsx` | RPG 播放器，动态加载作品 |

### 7.2 首页（Landing）

```
┌──────────────────────────────────────────────┐
│              Story-to-Game                     │
│   小说 → AI 改编 → 可游玩的互动文游             │
│                                                │
│   [ 立即体验 ]  [ 创作作品 ]  [ 作品库 ]         │
│                                                │
│   ┌─────────────────────────────────────────┐  │
│   │         RPG 播放器迷你 Demo               │  │
│   │         （加载内置修仙片段）               │  │
│   └─────────────────────────────────────────┘  │
│                                                │
│   特性介绍：类型模板 / 轻 RPG / 单文件部署        │
└──────────────────────────────────────────────┘
```

技术实现：
- 使用 Shadcn/ui `Button`、`Card` 组件
- 迷你 Demo 使用 `components/player/RPGCore.ts` 加载内置 JSON
- 响应式：移动端堆叠布局

### 7.3 即时体验页（Instant Preview）

左半屏文本输入 + 右半屏播放器实时预览：

```
┌──────────────────────┬───────────────────────┐
│   文本输入区            │    RPG 播放器预览       │
│                       │                       │
│  ┌─────────────────┐  │  ┌─────────────────┐  │
│  │ 文本框            │  │  │ 播放器画面       │  │
│  │                  │  │  │                 │  │
│  │ 粘贴小说片段...    │  │  │ 场景描写...      │  │
│  │                  │  │  │                 │  │
│  └─────────────────┘  │  │ ○ 选项 A        │  │
│                       │  │ ○ 选项 B        │  │
│  类型: [修仙 ▼]        │  │                 │  │
│                       │  │                 │  │
│  [快速生成]            │  └─────────────────┘  │
│                       │                       │
│  进度: Step 2/4 完成    │  状态栏: 灵力 ████░░  │
│  ████████░░░░ 60%     │                       │
└──────────────────────┴───────────────────────┘
```

**交互流程**：
1. 用户粘贴文本（建议 < 500 字）
2. 选择类型（默认 `literary`）
3. 点击「快速生成」→ 调用 `POST /api/generate`（`mode: "quick"`）
4. 通过 SSE 展示进度条（`EventSource` API）
5. 生成完成后，右侧播放器自动加载 JSON 并开始播放

**技术实现**：
- 使用 `useState` + `useEffect` 管理 SSE 连接
- `EventSource` 或 `fetch` + `ReadableStream` 读取 SSE
- 右侧播放器使用 `components/player/RPGCore.ts` 初始化

### 7.4 创作者页（Creator）

完整的创作工作台：

```
┌──────────────────────────────────────────────────┐
│  创作者工作台                                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 步骤 1: 文本输入                                 │ │
│  │                                                │ │
│  │ [粘贴小说全文] 或 [上传 .txt 文件]               │ │
│  │ 类型: [修仙 ▼]  标题: [________]               │ │
│  │ 模式: ○ 标准（九步流程）  ○ 快速                 │ │
│  │                                                │ │
│  │ 文本预览字数: 12,340 字  预估节点: ~430         │ │
│  │ [开始生成]                                       │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 生成进度                                        │ │
│  │                                                │ │
│  │ ✅ 原作摄入与风格指纹提取                        │ │
│  │ ✅ 结构拆解与状态系统设计                        │ │
│  │ 🔄 分段写作（第 3/8 章）                        │ │
│  │ ⏳ 连通性验证                                    │ │
│  │                                                │ │
│  │ ████████████░░░░░░░░ 65%                       │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 预览面板（生成完成后可用）                        │ │
│  │                                                │ │
│  │ [在播放器中预览]  [下载 JSON]  [分享链接]       │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**技术实现**：
- Shadcn/ui `Progress`、`Badge`、`Accordion` 组件
- 文件上传使用原生 `<input type="file">` + FileReader
- 字数统计实时计算
- SSE 进度通过 `useEffect` 监听，更新本地状态

### 7.5 作品库页（Library）

```
┌──────────────────────────────────────────────────┐
│  作品库                                    [刷新]   │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 青炉夜火   │ │ 七日医院   │ │ 深宫诡局   │          │
│  │ 修仙       │ │ 无限恐怖   │ │ 宫斗       │          │
│  │ 350 节点   │ │ 280 节点   │ │ 420 节点   │          │
│  │ [开始游玩] │ │ [开始游玩] │ │ [开始游玩] │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  ┌──────────┐ ┌──────────┐                        │
│  │ ...       │ │ ...       │                        │
│  └──────────┘ └──────────┘                        │
└──────────────────────────────────────────────────┘
```

**数据来源**：`GET /api/works` 返回作品列表（Server Component 或 Client `useEffect`）。

**播放器集成**：点击「开始游玩」→ 路由跳转到 `/play/{id}` → 播放器页通过 `GET /api/works/[id]` 获取 JSON → `RPGCore.ts` 加载并播放。

### 7.6 播放器页（/play/[id]）

**迁移自 `rpg-game-ui-v2`**：

```typescript
// app/play/[id]/page.tsx
import { RPGPlayer } from '@/components/player/RPGPlayer';

export default async function PlayPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/works/${params.id}`);
  if (!res.ok) return <div>作品不存在</div>;
  const storyData = await res.json();

  return <RPGPlayer storyData={storyData} />;
}
```

**组件拆分**：

| 原 rpg-game-ui-v2 | 新 React 组件 | 文件 |
|-------------------|--------------|------|
| 游戏主循环 | `RPGCore.ts` | `components/player/RPGCore.ts` |
| 状态栏渲染 | `RPGStatusBar.tsx` | `components/player/RPGStatusBar.tsx` |
| 选项渲染 | `RPGChoiceRenderer.tsx` | `components/player/RPGChoiceRenderer.tsx` |
| JSON 加载 | `RPGStoryLoader.ts` | `components/player/RPGStoryLoader.ts` |
| 主播放器 | `RPGPlayer.tsx`（组合以上） | `components/player/RPGPlayer.tsx` |

**状态管理**：使用 React `useState` + `useReducer` 管理游戏状态（currentNode、stats、flags、history）。

---

## 8. 阶段划分（8 个阶段）

### 阶段一：Next.js 项目脚手架 + Tailwind + Shadcn/ui

**目标**：可运行的 Next.js 项目，基础页面可访问

**任务**：
- 初始化 Next.js 14 项目（`create-next-app`）
- 配置 TypeScript + Tailwind CSS
- 初始化 Shadcn/ui（`npx shadcn-ui@latest init`）
- 安装基础组件：`button`、`card`、`progress`、`badge`、`textarea`、`select`
- 配置 `app/layout.tsx`（字体、全局样式、Design Tokens CSS Variables）
- 创建空壳页面：`/`、`/instant`、`/create`、`/library`、`/play/[id]`
- 配置 `next.config.js`（output 模式、环境变量）
- 初始化 Git 仓库，首次提交

**交付物**：`npm run dev` 可启动，五个页面均可访问

**风险检查点**：Node.js 版本、Shadcn/ui 与 Next.js 14 兼容性

---

### 阶段二：API Routes 骨架

**目标**：三个 API 端点可用，存储层可读写

**任务**：
- 实现 `app/api/generate/route.ts`
  - 接收 POST 请求，解析参数
  - 返回 SSE 流式响应骨架（模拟进度推送）
  - 生成 UUID，返回 `{id, title, status}`
- 实现 `app/api/works/route.ts`
  - 调用 `lib/storage.ts` 扫描存储
  - 返回作品列表 JSON
- 实现 `app/api/works/[id]/route.ts`
  - 读取指定 JSON 文件
  - 404/500 错误处理
- 实现 `lib/storage.ts`
  - `LocalStorage` 适配器（开发环境）
  - `BlobStorage` 适配器（生产环境，预留接口）
  - 环境变量自动切换
- 创建 `files/` 目录，放入测试 JSON
- 使用 curl 测试三个端点

**交付物**：API 可通过 curl / 浏览器测试，文件读写正常

**风险检查点**：Vercel Blob 本地测试方式、SSE 在 Next.js 中的正确实现

---

### 阶段三：AI 生成服务集成

**目标**：AI 能生成符合 Schema v1.0 的游戏 JSON

**任务**：
- 实现 `lib/ai-service.ts`
  - 封装 Claude 3.5 Sonnet API 调用（`@anthropic-ai/sdk`）
  - 封装 GPT-4o API 调用（`openai`）
  - fallback 逻辑（Claude 失败自动切换 GPT-4o）
  - function calling / structured output 格式约束
- 实现快速模式生成工作流
  - 内部生成创作摘要
  - AI 一次性输出完整 JSON
  - 格式校验
- 移植 `validate.py` 到 `lib/validate.ts`
  - RPG-001 ~ RPG-018 规则 TypeScript 实现
  - 致命错误修复逻辑
- 实现 SSE 进度推送（与阶段二的骨架对接）
- 中间结果缓存在内存 Map 中

**交付物**：输入短文本 → 输出合规 JSON（可通过 validate.ts）

**风险检查点**：
- Claude/GPT-4o 输出格式稳定性（function calling 是否可靠）
- 长文本超 token 限制的处理
- 快速模式生成质量（是否符合最高创作原则）

---

### 阶段四：首页 + 即时体验页

**目标**：用户可打开网页，粘贴短文本，快速生成并预览

**任务**：
- 首页 `app/page.tsx`（Landing）
  - 产品介绍文案
  - 导航到三个子页面（Shadcn/ui Button）
  - 迷你播放器 Demo（内置一段修仙片段 JSON）
- 即时体验页 `app/instant/page.tsx`
  - 左半屏文本输入区（Shadcn/ui Textarea）
  - 右半屏播放器预览区（RPGPlayer 组件）
  - 类型选择下拉框（Shadcn/ui Select）
  - 快速生成按钮 + 进度条（Shadcn/ui Progress + Badge）
  - SSE 进度监听（EventSource）
  - 生成完成后自动加载播放器
- 响应式适配（移动端上下布局，Tailwind `md:grid-cols-2`）
- 全局导航栏（`app/layout.tsx` 或独立 Navbar 组件）

**交付物**：可访问的网页，用户可粘贴文本 → 生成 → 预览

**风险检查点**：移动端体验、SSE 连接稳定性、React 状态与播放器同步

---

### 阶段五：创作者页

**目标**：完整的创作工作台，支持标准九步流程

**任务**：
- 创作者页 `app/create/page.tsx`
  - 文本输入区（支持粘贴和文件上传 `<input type="file">`）
  - 类型 / 标题 / 模式选择（Shadcn/ui Select + Input + RadioGroup）
  - 字数统计和预估节点数（实时计算）
  - 生成进度面板（步骤可视化，Shadcn/ui Accordion + Progress）
  - SSE 进度监听
  - 预览面板（嵌入 RPGPlayer 组件）
  - 下载 JSON 按钮
- 实现标准流程生成工作流（`lib/ai-service.ts` 扩展）
  - Step 1-2：索引 + 风格 → 缓存中间结果
  - Step 3-4：结构 + 系统设计 → 生成分支拓扑和数值体系
  - Step 5-7：按章节分批调用 AI → 逐章生成节点 JSON
  - Step 8：运行 validate.ts → 合并输出完整 JSON
- 每步 SSE 进度推送
- 上下文管理（中间结果跨步骤携带）

**交付物**：输入中长篇文本 → 完整九步生成 → 预览可玩

**风险检查点**：
- 中长篇小说分批生成的上下文连续性
- Token 消耗量与成本
- 生成耗时（中长篇可能需要 3-5 分钟）

---

### 阶段六：作品库 + 播放器集成

**目标**：浏览所有作品，点击即可游玩

**任务**：
- 作品库页 `app/library/page.tsx`
  - 作品卡片列表（从 `GET /api/works` 获取）
  - 每张卡片显示：标题、类型、节点数、简介（Shadcn/ui Card）
  - 点击卡片 → 路由跳转到 `/play/[id]`
  - 空状态提示
  - 刷新按钮
- 播放器页 `app/play/[id]/page.tsx`
  - Server Component 获取 JSON（`fetch`）
  - 加载状态（Shadcn/ui Skeleton）
  - 加载失败处理
  - RPGPlayer 组件渲染
- RPG 组件迁移（`rpg-game-ui-v2` → React）
  - `RPGCore.ts`：将原生 JS 游戏循环改为 React `useReducer`
  - `RPGStatusBar.tsx`：CSS 变量驱动的状态条
  - `RPGChoiceRenderer.tsx`：选项按钮 + 条件渲染
  - `RPGStoryLoader.ts`：JSON 校验与主题加载
  - `RPGPlayer.tsx`：组合组件，管理游戏状态
- 全站导航栏（四个页面间的导航）

**交付物**：完整的浏览 → 游玩闭环

**风险检查点**：大型 JSON 加载性能（>1000 节点）、React 状态机与原有 JS 引擎行为一致性

---

### 阶段七：RPG 组件完善 + SKILL.md 扩展升级

**目标**：AI 生成服务支持完整的 RPG Schema（状态系统、里程碑、结局、交互等）

**任务**：
- RPG 组件完善
  - 主题 CSS 动态加载（`public/themes/*.css`）
  - 成就解锁弹窗
  - 结局画面渲染
  - 延迟效果（`delayedChanges`）动画
  - 交互探索（`interactions`）UI
- 生成服务集成 `GENRE_TEMPLATES.md`（5 种类型模板）
  - AI prompt 注入类型专属模板
  - 修仙：境界体系 / 无限恐怖：任务系统 / 等
- 生成 `meta.rpg` 完整配置
  - `primaryStats`（text/number/bar）
  - `conditionDisplay` 策略
  - `hiddenStats`
- 生成 `milestones`（至少 3 个：small + medium + large）
- 生成 `endings`（至少 4 个：true + dark + neutral + hidden）
- 生成 `delayedChanges`（关键选择的延迟后果）
- 生成 `choice.weight` 标注（critical/branch/minor/cosmetic）
- 生成 `interactions`（场景探索交互，含 depth 分级）
- validate.ts 集成增强（RPG 全部 18 条规则）
- Function calling schema 更新（包含所有 RPG 扩展字段）

**交付物**：AI 生成的 JSON 包含完整 RPG 系统，通过全部校验，播放器完整渲染

**风险检查点**：
- AI 输出的 RPG 数值是否合理（平衡性）
- milestones/endings 的条件逻辑是否自洽
- React 组件性能（频繁状态更新）

---

### 阶段八：修仙 Demo 生成测试

**目标**：用 AI 生成服务实际生成一个可玩的修仙 Demo

**任务**：
- 准备修仙小说素材（约 1-2 万字）
- 调用标准流程生成完整修仙 JSON
- 验证生成质量：
  - 节点数 200-400
  - 结局数 4-5（含 hidden）
  - milestones 3 个以上
  - RPG 状态系统完整
  - 通过 validate.ts 全部规则
- 播放器加载并完整游玩测试
- 多路线游玩（至少 3 条不同路线）
- 修复发现的问题
- 部署到 Vercel 并验证

**交付物**：通过 AI 真实生成的可完整游玩修仙 Demo，线上可访问

**风险检查点**：
- AI 生成的文本质量是否达到 SKILL.md 最高创作原则标准
- 分支的因果逻辑是否自洽
- 数值平衡是否需要人工微调
- Vercel 部署后 Blob Storage / API Routes 正常工作

---

## 9. 依赖关系图

```
阶段一：Next.js 项目脚手架 + Tailwind + Shadcn/ui
  │
  ├── 阶段二：API Routes 骨架（generate/works/works/:id）
  │     │
  │     ├── 阶段三：AI 生成服务集成
  │     │     │
  │     │     ├── 阶段四：首页 + 即时体验页
  │     │     │     │
  │     │     │     └── 阶段五：创作者页
  │     │     │           │
  │     │     │           └── 阶段六：作品库 + 播放器集成
  │     │     │
  │     │     └── 阶段七：RPG 组件迁移 + SKILL.md 扩展升级
  │     │           │
  │     │           └── 阶段八：修仙 Demo 生成测试
  │     │
  │     └── （阶段四、六可与三并行：前端页面骨架可先开发）
```

**关键路径**：阶段一 → 阶段二 → 阶段三 → 阶段五 → 阶段七 → 阶段八

**可并行路径**：阶段四可与阶段三并行；阶段六可与阶段五并行

---

## 10. MVP 分层定义

### 全栈 MVP 必须（阶段 1-5 交付）
- Next.js 14 项目脚手架 + Tailwind + Shadcn/ui
- API Routes 三个端点（generate/works/works/:id）
- AI 快速模式生成（短文本 → JSON）
- AI 标准模式生成（中长篇 → JSON）
- SSE 流式进度推送
- 首页 + 即时体验页 + 创作者页
- 播放器从 API 加载 JSON（基础渲染）
- validate.ts 校验集成

### 全栈 MVP 应该 / Stretch Goal（阶段 6-7 交付）
- 作品库页
- RPG 组件完整迁移（状态栏、选项、主题）
- RPG 扩展完整支持（milestones / endings / interactions / delayedChanges）
- 5 种类型模板集成
- 主题 CSS 动态切换

### 后续迭代（阶段 8 交付）
- 修仙 Demo 真实生成验证
- Vercel 生产部署验证
- 全流程内测

---

## 11. 每阶段检查清单

每个阶段结束，确认：

```
□ 本阶段任务是否完成？
□ API 是否可测试（后端阶段）？
□ 页面是否可访问（前端阶段）？
□ AI 生成质量是否达标（AI 阶段）？
□ 是否有阻塞问题需要处理？
□ 下阶段计划是否需要调整？
□ 代码是否已提交并推送？
□ 文档是否已更新？
```

---

## 12. 关键决策点

| 决策 | 选项 | 建议 |
|------|------|------|
| Claude API 不可用？ | 仅用 GPT-4o / 等待恢复 | 仅用 GPT-4o，快速模式质量足够 |
| AI 输出 JSON 格式不稳定？ | 增加重试 + 后处理脚本 / 切换模型 | 先重试 2 次，再后处理修复，最后切换 |
| Vercel Blob 额度不足？ | 迁移到 AWS S3 / 数据库 | 视规模决定，初期 Blob 免费额度足够 |
| 生成耗时过长？ | 增加预估提示 / 分步预览 | 显示预估时间和每步进度，阶段五加入分步预览 |
| 需要服务端状态持久化？ | Redis / Upstash / 内存 | 初期内存 Map 足够，后续可接入 Upstash Redis |
| 国内访问速度？ | 备案域名 + Vercel Edge / Cloudflare | 备案域名解析到 Vercel，Edge Network 自动加速 |

---

## 13. 部署方案

### 13.1 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel --prod
```

- 自动 CI/CD：Git push → Vercel 自动构建部署
- 环境变量在 Vercel Dashboard → Project Settings → Environment Variables 配置
- 必要变量：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`BLOB_READ_WRITE_TOKEN`

### 13.2 国内访问优化

- 备案域名 CNAME 到 `cname.vercel-dns.com`
- Vercel Edge Network 自动选择最优节点
- 静态资源（`public/`）自动 CDN 加速

### 13.3 开发 vs 生产

| 环境 | 存储 | AI API |
|------|------|--------|
| 开发（`npm run dev`） | 本地 `./files/` | 真实 API（注意成本） |
| 预览（Preview Deployment） | Vercel Blob | 真实 API |
| 生产（Production） | Vercel Blob | 真实 API |

---

## 14. 未来方向（本期不实施，仅记录）

| 方向 | 说明 | 优先级 |
|------|------|--------|
| 微信小程序 | 基于同一份 JSON 协议开发小程序播放器，作为移动端入口 | P1（Q4） |
| 用户系统 | 创作者账号、作品管理、游玩存档云端同步 | P2（2027 Q1） |
| 多人协作 | 多人共创一部作品 | P3（远期） |
| AI 图片生成 | 为每个场景节点自动生成配图 | P2 |

---

## 15. 当前已完成状态（2026-07-06 基线）

### 已完成

- Schema v1.0 锁定（`docs/SCHEMA_v1.md`，897 行）
- 5 种类型小说玩法模板（`docs/GENRE_TEMPLATES.md`，887 行）
- validate.py 18 条 RPG 校验规则（RPG-001 ~ RPG-018）
- SKILL.md 九步工作流定义（含快速模式）
- rpg-game-ui-v2 前端架构（原生 HTML/CSS/JS）
- v4.0 实施方案（Flask 版，作为需求参考）

### 待开始

本实施方案的全部 8 个阶段（Next.js 全栈版）。

---

> 本文档为 Story-to-Game 全栈实施方案（Next.js 版），采用「Next.js App Router + API Routes + Vercel Blob 存储」架构，将 AI 生成能力产品化。保留所有工程原则（向后兼容、先 schema 后 UI、双端同源 JSON 协议等），删除数据库、用户系统、权限管理、商业化等非核心内容。实际执行中可根据 AI 生成质量和用户反馈灵活调整。
