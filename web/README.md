# Story-to-Game Web 前端

> Next.js 14 App Router + TypeScript + Tailwind CSS + Shadcn/ui

---

## 快速开始

```bash
# 安装依赖（国内镜像）
npm install --registry=https://registry.npmmirror.com

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填写 AI API Key

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

---

## 环境变量

```bash
# AI 提供商（5选1，通过 PROVIDER 切换）
PROVIDER=openai              # openai / siliconflow / deepseek / bailian / openrouter
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：Vercel Blob（不配置则回退本地文件）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 各提供商配置示例

```bash
# 硅基流动（推荐，国内便宜）
PROVIDER=siliconflow
SILICONFLOW_API_KEY=sk-...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# DeepSeek
PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 百炼（阿里云）
PROVIDER=bailian
BAILIAN_API_KEY=sk-...
BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# OpenAI
PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# OpenRouter
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 项目结构

```
app/
  page.tsx              # 首页 Landing
  layout.tsx            # 根布局（Navbar + Footer + 字体）
  globals.css           # Tailwind + CSS Variables
  instant/
    page.tsx            # 即时体验页（文本输入 + 规则配置 + 生成）
  library/
    page.tsx            # 作品库（卡片列表 + 分类筛选 + 删除）
  play/
    [id]/
      page.tsx          # 播放器页（iframe 嵌入原生引擎）
  api/
    generate/
      route.ts          # POST：SSE 流式 AI 生成
    works/
      route.ts          # GET：作品列表 / POST：保存作品
      [id]/
        route.ts        # GET：单个作品完整 JSON

lib/
  utils.ts              # cn() 等工具函数
  ai-client.ts          # AI 多提供商客户端
  storage.ts            # 存储抽象层（Blob / 本地文件）

types/
  index.ts              # TypeScript 类型定义（Schema v1.1）

components/
  ui/                   # Shadcn/ui 组件
  landing/              # 首页组件
  library/              # 作品库组件

public/
  player/               # 原生 JS 播放器（iframe 加载）
    js/                 # 引擎脚本
    css/                # 样式
    assets/             # 场景图等资源
    pages/
      game-main.html    # 播放器入口
```

---

## 关键设计决策

### 播放器：iframe 嵌入而非 React 重写

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

**原因**：
- 原生 JS 引擎功能完整（状态栏、条件选项、延迟变化、交互探索、背包、存档、成就、VFX、音频、NPC 关系、时间压力）
- React 重写会丢失 70% 功能，开发周期不可控
- iframe 通过 `postMessage` 与父页面通信
- 播放器引擎可独立迭代，不影响 Next.js 前端

### 存储：抽象适配层

```typescript
// lib/storage.ts
export const storage = process.env.VERCEL_BLOB_TOKEN
  ? new BlobStorage()      // 生产：Vercel Blob
  : new LocalStorage();    // 开发：本地 ./files/ 目录
```

**原因**：
- 开发环境无需配置 Vercel Blob，零成本启动
- 生产环境自动切换 Blob，零代码改动
- 国内部署可扩展为 S3/OSS 适配器

---

## 开发指南

### 添加新页面

```bash
# 在 app/ 下创建新目录
mkdir app/new-page
touch app/new-page/page.tsx
```

### 添加 API 路由

```bash
# 在 app/api/ 下创建新目录
mkdir app/api/new-route
touch app/api/new-route/route.ts
```

### 添加 Shadcn/ui 组件

```bash
npx shadcn add button card progress
```

### 播放器引擎开发

播放器引擎位于 `public/player/`，是独立的原生 JS 项目：

```bash
# 直接打开播放器页面进行调试
open public/player/pages/game-main.html

# 或使用本地服务器
npx serve public/player/pages
```

引擎文件：
- `js/rpg-core.js` — 核心状态机 + 条件引擎 + 变更引擎
- `js/rpg-story-loader.js` — JSON 加载 + 节点导航
- `js/ui.js` — UI 控制器
- `js/theme.js` — 主题切换

修改引擎后刷新 `/play/[id]` 页面即可生效（iframe 会重新加载）。

---

## 部署

详见 [DEPLOY.md](DEPLOY.md)。

### Vercel（推荐，国际）

```bash
npm i -g vercel
vercel --prod
```

### 腾讯云 CloudBase（国内免费）

```bash
# 1. 登录 CloudBase
npx @cloudbase/cli login

# 2. 构建静态输出
npm run build

# 3. 部署
npx @cloudbase/cli hosting:deploy .next/static
```

### VPS（国内）

```bash
# 构建 standalone 输出
npm run build

# 启动
node .next/standalone/server.js
```

---

## 类型定义

核心类型位于 `types/index.ts`，与 Schema v1.1 对应：

```typescript
export interface StoryScript {
  meta: Meta;
  startNodeId: string;
  variables: Record<string, number | string | boolean>;
  flags: string[];
  achievements: Record<string, AchievementDef>;
  inventory?: InventoryConfig;
  milestones: Milestone[];
  endings: Ending[];
  mission?: MissionConfig;
  nodes: Record<string, StoryNode>;
  npcRelations?: NPCRelations[];
  timePressure?: TimePressure;
}

export interface CreatorRules {
  pacing?: 'compact' | 'balanced' | 'relaxed';
  choiceStyle?: 'direct' | 'inner_monologue' | 'action';
  statImpact?: 'light' | 'medium' | 'heavy';
  hiddenContentRatio?: 'low' | 'medium' | 'high';
  endingBias?: 'heavy' | 'balanced' | 'dark' | 'random';
  narrativePerson?: 'first' | 'second';
  dialogueDensity?: 'low' | 'medium' | 'high';
  informationAsymmetry?: boolean;
  timePressure?: boolean;
  npcRelations?: boolean;
}
```

---

## 注意事项

1. **AI API 成本**：开发环境调用真实 API，注意控制测试频率
2. **Vercel Blob**：本地开发可不配置，自动回退本地文件
3. **iframe 通信**：如需扩展 postMessage 接口，同步修改 `js/rpg-story-loader.js` 和 `app/play/[id]/page.tsx`
4. **类型模板**：新增类型需在 `types/index.ts`、`lib/ai-client.ts` 和 `public/player/js/` 中同步更新
