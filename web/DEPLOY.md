# 部署指南

本项目支持多环境部署，通过环境变量切换存储和 AI 接口，代码零改动。

## 方案对比

| 方案 | 成本 | 难度 | 国内访问 | 推荐度 |
|------|------|------|----------|--------|
| Vercel Hobby + 国内域名 | 免费 | 简单 | 良好 | ⭐⭐⭐⭐⭐ |
| 腾讯云 CloudBase | 免费额度 | 中等 | 优秀 | ⭐⭐⭐⭐ |
| 阿里云函数计算 FC | 免费额度 | 中等 | 优秀 | ⭐⭐⭐⭐ |
| 自托管 VPS | ~50元/年 | 简单 | 优秀 | ⭐⭐⭐ |
| Cloudflare Pages | 免费 | 复杂 | 一般 | ⭐⭐ |

---

## 方案一：Vercel Hobby（推荐，零成本）

最适合：个人项目、快速上线、国际+国内兼顾

### 1. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署（在项目根目录执行，即 web/ 目录）
cd web
vercel --prod
```

或者通过 GitHub 集成：
1. 将代码推送到 GitHub
2. 在 Vercel 控制台 Import Git Repository
3. 选择 `web/` 作为 Root Directory
4. 添加环境变量（见下方）
5. 点击 Deploy

### 2. 配置环境变量

在 Vercel Dashboard -> Project Settings -> Environment Variables 中添加：

```
AI_API_KEY=你的API_KEY
AI_API_BASE=https://api.siliconflow.cn/v1
AI_MODEL=deepseek-ai/DeepSeek-V3
STORAGE_MODE=vercel-blob
BLOB_READ_WRITE_TOKEN=你的Vercel Blob Token
```

### 3. 绑定国内域名（可选但推荐）

Vercel 默认域名国内访问可能较慢，建议绑定自定义域名：

1. 在 Vercel Dashboard -> Domains 中添加域名
2. 在域名服务商（阿里云/腾讯云）添加 CNAME 记录指向 `cname.vercel-dns.com`
3. 等待 DNS 生效（通常几分钟到几小时）

国内域名推荐在腾讯云/阿里云购买，`.com` 或 `.cn` 首年约 10-30 元。

---

## 方案二：腾讯云 CloudBase（免费额度）

最适合：纯国内用户、完全零成本

### 1. 准备工作

- 注册腾讯云账号
- 开通 CloudBase（云开发）

### 2. 部署步骤

```bash
# 安装 CloudBase CLI
npm i -g @cloudbase/cli

# 登录
tcb login

# 部署
tcb framework deploy
```

需要创建 `cloudbaserc.json` 配置文件（见下方示例）。

### 3. 配置

```json
// cloudbaserc.json
{
  "envId": "你的环境ID",
  "framework": {
    "name": "story-to-game",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "story-to-game",
          "path": "/",
          "entry": "dist/server.js"
        }
      }
    }
  }
}
```

### 4. 免费额度

- 云函数调用：每月 500 万次
- 外网出流量：每月 1GB
- 足够个人项目使用

---

## 方案三：自托管 VPS（最稳定）

最适合：长期运营、数据自主、需要稳定访问

### 推荐服务器

| 平台 | 配置 | 首年价格 | 购买链接 |
|------|------|----------|----------|
| 腾讯云轻量 | 2核2G 3M | ~50元 | 腾讯云官网 |
| 阿里云轻量 | 2核2G 3M | ~50元 | 阿里云官网 |

### 部署步骤

```bash
# 1. 服务器安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 上传代码到服务器（通过 git clone 或 scp）
git clone https://github.com/your-repo/story-to-game-rpg-roadmap.git
cd story-to-game-rpg-roadmap/web

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 5. 构建
npm run build

# 6. 启动（生产环境建议用 pm2）
npm install -g pm2
pm2 start npm --name "story-to-game" -- start

# 7. 配置 Nginx 反向代理（如果需要域名）
```

---

## 环境变量完整说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `AI_API_KEY` | 是 | AI 平台 API Key |
| `AI_API_BASE` | 是 | API 基础地址 |
| `AI_MODEL` | 是 | 模型名称 |
| `STORAGE_MODE` | 否 | `local` 或 `vercel-blob`，默认 `local` |
| `DATA_DIR` | 否 | 本地存储路径，默认 `./data/works` |
| `BLOB_READ_WRITE_TOKEN` | 条件 | Vercel Blob Token，仅 `STORAGE_MODE=vercel-blob` 时需要 |

### AI 接口快速切换

```bash
# 硅基流动（推荐）
AI_API_BASE=https://api.siliconflow.cn/v1
AI_MODEL=deepseek-ai/DeepSeek-V3

# DeepSeek 官方
AI_API_BASE=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

# 阿里云百炼
AI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-max
```

---

## 常见问题

**Q: Vercel 国内访问慢怎么办？**
A: 绑定国内域名（如阿里云/腾讯云购买的域名），通过 CNAME 指向 Vercel，国内访问速度会显著提升。

**Q: 免费额度用完怎么办？**
A: 硅基流动新用户送大量免费额度，足够个人项目使用数月。也可切换到 DeepSeek 官方（更便宜）。

**Q: 数据会丢失吗？**
A: Vercel Blob 和本地文件存储都是持久化的。如果担心，可以定期备份 `data/works/` 目录。

**Q: 可以纯前端部署吗？**
A: 可以。纯前端部署时 AI 生成和存储功能不可用，但导入 JSON 游玩功能完全可用。将 `web/out/` 目录部署到任意静态托管即可。
