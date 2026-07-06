# Story-to-Game

> **在线 AI 互动叙事平台** —— 粘贴小说，AI 自动生成分支剧情游戏，即时游玩。

[![GitHub](https://img.shields.io/badge/GitHub-story--to--game--rpg--roadmap-blue)](https://github.com/yysam123456-source/story-to-game-rpg-roadmap)

---

## 项目简介

Story-to-Game 是一个**零门槛**的 AI 互动叙事创作平台：

1. **粘贴小说文本**（片段或全文）
2. **选择类型**（修仙 / 恐怖 / 悬疑 / 末世 / 宫斗 / 通用）
3. **自定义游戏规则**（节奏密度、数值影响、隐藏内容、NPC 关系、时间压力等）
4. **AI 自动生成**符合 Schema v1.1 的分支剧情 JSON 剧本
5. **即时在浏览器中游玩** —— 状态栏、条件选项、成就系统、NPC 关系、时间压力全部可用

**核心转变**：从"下载 HTML → 手写 JSON → 本地运行"的开发者工具，进化为"粘贴小说 → AI 生成 → 即时游玩"的在线平台。

---

## 功能亮点

| 功能 | 说明 |
|------|------|
| **AI 剧本生成** | 粘贴小说文本，SSE 流式生成 40-80 节点、3-5 结局的完整分支剧情 |
| **自定义规则** | 10 项创作者规则：节奏密度、选项风格、数值影响、隐藏内容、结局倾向、人称、对白密度、信息不对称、时间压力、NPC 关系 |
| **类型模板** | 6 种类型专属状态系统与主题（修仙·境界修为 / 恐怖·理智生存 / 悬疑·线索推理 / 末世·资源人性 / 宫斗·宠爱权谋 / 通用） |
| **RPG 引擎** | 条件选项（6 种条件类型）、数值变化反馈、NPC 好感度、时间压力倒计时、自动成就检测 |
| **场景系统** | 场景切换动画、5 种题材专属场景图、节点级背景覆盖 |
| **存档系统** | 多档位存档、游玩时长追踪、关键信息摘要 |
| **成就系统** | 自动解锁（条件达成）+ 手动触发，含稀有度分级 |
| **背包系统** | 分类筛选、数量堆叠、物品获取/消耗反馈 |
| **视觉设计** | Glassmorphism 暗色系 + 5 种题材实时切换 + 粒子特效（可关闭） |
| **iframe 播放器** | 原生 JS 引擎 100% 功能保留，iframe 嵌入 Next.js 页面 |

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层（Next.js 14 App Router）            │
│  ├─ 首页 /                    — 产品介绍 + CTA               │
│  ├─ 即时体验 /instant         — 粘贴 → 生成 → 游玩           │
│  ├─ 作品库 /library           — 卡片列表 + 分类筛选           │
│  └─ 播放器 /play/[id]         — iframe 嵌入原生引擎          │
├─────────────────────────────────────────────────────────────┤
│                    API 层（Next.js Route Handlers）          │
│  ├─ POST /api/generate        — SSE 流式 AI 生成             │
│  ├─ POST /api/works           — 保存作品                     │
│  ├─ GET  /api/works           — 作品列表                     │
│  └─ GET  /api/works/[id]      — 获取单个作品 JSON            │
├─────────────────────────────────────────────────────────────┤
│                    AI 层（多提供商）                          │
│  ├─ 硅基流动 / DeepSeek / 百炼 / OpenAI / OpenRouter         │
│  └─ 环境变量配置切换，OpenAI 兼容 API 格式                   │
├─────────────────────────────────────────────────────────────┤
│                    存储层（抽象适配）                          │
│  ├─ Vercel Blob（国际部署）                                  │
│  ├─ 本地文件系统（开发环境）                                  │
│  └─ 阿里云 OSS / 腾讯云 COS（国内部署预留）                   │
└─────────────────────────────────────────────────────────────┘
```

**技术栈**：Next.js 14 App Router + TypeScript + Tailwind CSS + Shadcn/ui，部署支持 Vercel / 国内云双轨。

### 播放器引擎（iframe 方案）

```
public/player/
  js/
    rpg-core.js          # 核心状态机 + 条件引擎 + 变更引擎
    rpg-story-loader.js  # JSON 加载 + 节点导航 + 延迟变化 + 时间压力
    rpg-status-bar.js    # 状态栏渲染（primaryStats）
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
  pages/
    game-main.html        # 播放器入口（iframe 加载）
```

**关键决策**：播放器采用 **iframe 嵌入原生 JS 引擎**（方案 A），而非 React 重写。保留 100% 原有功能，通过 `postMessage` 与父页面通信。

---

## 目录结构

```
story-to-game-rpg-roadmap/
├── web/                          # Next.js 全栈项目
│   ├── app/                      # App Router 页面
│   │   ├── page.tsx              # 首页
│   │   ├── layout.tsx            # 根布局
│   │   ├── instant/page.tsx      # 即时体验页（含规则配置）
│   │   ├── library/page.tsx      # 作品库
│   │   ├── play/[id]/page.tsx    # 播放器页（iframe 嵌入）
│   │   └── api/                  # API 路由
│   │       ├── generate/route.ts # SSE 流式生成
│   │       ├── works/route.ts    # 作品列表/保存
│   │       └── works/[id]/route.ts # 获取单个作品
│   ├── lib/                      # 服务端逻辑
│   │   ├── ai-client.ts          # AI 多提供商客户端
│   │   └── storage.ts            # 存储抽象层
│   ├── types/index.ts            # TypeScript 类型定义（Schema v1.1）
│   ├── public/player/            # 原生 JS 播放器（iframe 加载）
│   ├── DEPLOY.md                 # 部署指南
│   └── README.md                 # 前端开发指南
│
├── docs/                         # 项目文档
│   ├── SCHEMA_v1.1.md            # JSON Schema v1.1（当前版本）
│   ├── SCHEMA_v1.md              # JSON Schema v1.0（兼容）
│   ├── v2-ROADMAP.md             # 平台化路线图
│   ├── v2-IMPLEMENTATION.md      # 全栈实施方案
│   ├── v2-PRD.md                 # 产品需求文档
│   ├── DEPLOY.md                 # 部署方案汇总
│   └── PRODUCT-REFORM-PLAN.md    # 产品改革方案
│
├── story-to-game-source/         # AI 生成提示工程
│   ├── SKILL.md                  # AI Skill 主文档（含9步工作流 + 7大可玩性方向）
│   └── references/               # 各步骤参考文档
│
├── rpg-game-ui-v2/               # 原生播放器原型（已迁移至 web/public/player/）
│
├── README.md                     # 本文件（项目总览）
├── CHANGELOG.md                  # 变更日志
└── validate.py                   # JSON 剧本校验器（18条规则）
```

---

## 快速开始

### 开发环境

```bash
# 1. 克隆仓库
git clone https://github.com/yysam123456-source/story-to-game-rpg-roadmap.git
cd story-to-game-rpg-roadmap/web

# 2. 安装依赖（国内镜像）
npm install --registry=https://registry.npmmirror.com

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填写 AI API Key 和可选的 Vercel Blob Token

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 环境变量

```bash
# AI 提供商（5选1，通过 PROVIDER 切换）
PROVIDER=openai              # openai / siliconflow / deepseek / bailian / openrouter
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：Vercel Blob（不配置则回退本地文件）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 部署

详见 `web/DEPLOY.md`，支持三种方案：
- **Vercel**（国际）— 一键部署，Vercel Blob 存储
- **腾讯云 CloudBase**（国内免费）— 静态托管 + 云函数
- **VPS**（国内）— Docker 部署，对象存储

---

## JSON Schema v1.1 核心字段

```json
{
  "meta": {
    "title": "作品标题",
    "genre": "xianxia",
    "rpg": {
      "enabled": true,
      "primaryStats": [
        { "key": "qi", "label": "灵力", "type": "bar", "max": 100 }
      ]
    },
    "rules": {
      "pacing": "relaxed",
      "statImpact": "medium",
      "npcRelations": true,
      "timePressure": false
    }
  },
  "startNodeId": "node_start",
  "variables": { "qi": 30 },
  "npcRelations": [
    { "id": "master", "name": "师父", "initialAffinity": 10 }
  ],
  "timePressure": {
    "enabled": true,
    "countdown": 120,
    "timeoutNode": "ending_timeout"
  },
  "achievements": {
    "first_step": {
      "title": "初出茅庐",
      "description": "完成第一次选择",
      "autoUnlock": { "var": "progress", "op": ">=", "value": 10 }
    }
  },
  "nodes": { ... }
}
```

完整 Schema 定义参见 `docs/SCHEMA_v1.1.md`。

---

## 核心原则

1. **文学优先**：每一个选择必须从当前场景自然长出，每一个后果必须被世界认真承接
2. **轻 RPG 服务叙事**：数值变化先有文本回响，再展示数值，不压过文学体验
3. **JSON 可校验**：所有 JSON 必须通过 validate.py 的 18 条 RPG 校验规则
4. **向后兼容**：新增字段均为可选，旧 JSON 不受影响（`meta.rpg.enabled=false` 维持 v1.x 行为）
5. **类型深度**：5 种题材各有专属模板、状态系统、主题色和 VFX
6. **选择有重量**：choice.weight 四级系统（critical / branch / minor / cosmetic）+ delayedChanges 三层后果
7. **成长有仪式**：milestones 三级庆祝 + endings 多类型结局

---

## 路线图

| 季度 | 目标 | 状态 |
|------|------|------|
| **Q3 2026**（7-9 月）| MVP 核心验证：AI 自动生成 + 在线即时游玩 | 进行中 |
| Q4 2026（10-12 月）| 分发与完善：微信小程序 + 完整九步工作流 + 社区功能 | 待开始 |
| Q1 2027（1-3 月）| 生态扩展：5 种类型模板全部上线 + 数据驱动推荐 | 待开始 |
| Q2 2027（4-6 月）| 规模化：商业化 + 全球分发 + 自动化审核 | 待开始 |

详细路线图参见 `docs/v2-ROADMAP.md`。

---

## 变更日志

参见 [CHANGELOG.md](CHANGELOG.md)。

---

## 许可证

MIT License — 见 [LICENSE](LICENSE) 文件。