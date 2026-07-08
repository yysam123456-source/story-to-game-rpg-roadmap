# 播放器 UI 全面优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面优化播放器 UI 的视觉设计、布局结构、图标系统、场景图和交互细节，从"工程师原型"提升为"可交付产品"。

**Architecture:** 保持现有 CSS 分层架构（tokens → base → themes → components → vfx），不重构文件组织。通过优化 tokens、重新设计场景图 SVG、增强组件样式、统一图标引用方式，逐层提升视觉品质。

**Tech Stack:** 纯 HTML/CSS/SVG/JS，无外部依赖。字体通过 Google Fonts CDN 引入。

---

## 文件变更清单

| 文件 | 职责 | 操作 |
|------|------|------|
| `css/tokens.css` | 设计令牌 | 修改：补全缺失 token、引入 Google Fonts |
| `css/base.css` | 基础样式 | 修改：优化排版细节 |
| `assets/images/scenes/xianxia-default.svg` | 修仙场景图 | 重写：高品质手绘风场景 |
| `assets/images/scenes/horror-default.svg` | 恐怖场景图 | 重写：氛围恐怖场景 |
| `assets/images/scenes/mystery-default.svg` | 悬疑场景图 | 重写：悬疑场景 |
| `assets/images/scenes/apocalypse-default.svg` | 末日场景图 | 重写：末世荒芜场景 |
| `assets/images/scenes/palace-default.svg` | 宫斗场景图 | 重写：宫殿华贵场景 |
| `css/components/scene-viewport.css` | 场景视口 | 修改：增强渐变、比例优化 |
| `css/components/narrative.css` | 叙事区域 | 修改：排版提升、选项按钮重新设计 |
| `css/components/status-bar.css` | 状态栏 | 修改：视觉层次优化 |
| `css/components/menu.css` | 菜单面板 | 修改：布局优化、图标增强 |
| `css/components/inventory.css` | 背包面板 | 修改：视觉层次优化 |
| `css/components/chapter-nav.css` | 章节导航 | 修改：重新设计为更有质感的样式 |
| `css/components/rpg-extensions.css` | RPG扩展 | 修改：统一颜色 token、视觉优化 |
| `css/themes/xianxia.css` | 修仙主题色 | 修改：氛围增强 |
| `css/themes/horror.css` | 恐怖主题色 | 修改：补全缺失 token |
| `css/themes/mystery.css` | 悬疑主题色 | 修改：补全缺失 token |
| `css/themes/palace.css` | 宫斗主题色 | 修改：stat-color 差异化 |
| `pages/game-main.html` | 主页面 | 修改：引入 Google Fonts、清理内联样式 |

---

### Task 1: 引入高质量字体 + 补全 Design Tokens

**Files:**
- Modify: `css/tokens.css`
- Modify: `pages/game-main.html`

- [ ] **Step 1: 在 game-main.html 的 `<head>` 中添加 Google Fonts 引入**

在 `<title>` 标签之后、CSS link 之前，添加：

```html
<!-- Fonts: Noto Serif SC (display) + LXGW WenKai (body fallback) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=LXGW+WenKai:wght@300;400;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: 更新 tokens.css 的字体定义**

将 `tokens.css` 中的字体定义替换为：

```css
/* ── Typography ───────────────────────────── */
--font-sans: "LXGW WenKai", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-display: "Noto Serif SC", "Georgia", "STSong", serif;
--font-mono: "JetBrains Mono", "SF Mono", "Fira Code", "Menlo", monospace;
```

- [ ] **Step 3: 在 tokens.css 中补全缺失的 CSS 变量**

在 `:root` 块末尾添加：

```css
  /* ── Missing Z-Index ──────────────────────── */
  --z-header: 350;
  --z-floating: 320;
  
  /* ── Missing Radius ─────────────────────── */
  --radius-circle: 50%;
  
  /* ── Missing Danger Color ──────────────────── */
  --c-danger: var(--c-state-error);
  
  /* ── Missing Text Aliases ──────────────────── */
  --c-text-error: var(--c-state-error);
```

- [ ] **Step 4: 提交**

```bash
git add css/tokens.css pages/game-main.html
git commit -m "style(tokens): 引入 Noto Serif SC + LXGW WenKai 字体，补全缺失 design tokens"
```

---

### Task 2: 重写全部 5 个场景 SVG

**Files:**
- Rewrite: `assets/images/scenes/xianxia-default.svg`
- Rewrite: `assets/images/scenes/horror-default.svg`
- Rewrite: `assets/images/scenes/mystery-default.svg`
- Rewrite: `assets/images/scenes/apocalypse-default.svg`
- Rewrite: `assets/images/scenes/palace-default.svg`

- [ ] **Step 1: 重写 xianxia-default.svg**

替换为高品质修仙场景（ viewBox="0 0 1200 600" 以适应更高分辨率）：

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a2e"/>
      <stop offset="40%" stop-color="#151545"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </linearGradient>
    <radialGradient id="moon-glow" cx="0.75" cy="0.2" r="0.25">
      <stop offset="0%" stop-color="rgba(200,210,255,0.25)"/>
      <stop offset="60%" stop-color="rgba(150,160,220,0.08)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="mountain-mist" cx="0.5" cy="0.7" r="0.6">
      <stop offset="0%" stop-color="rgba(100,120,180,0.12)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(100,120,180,0.06)"/>
      <stop offset="100%" stop-color="rgba(80,90,140,0.02)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Sky -->
  <rect width="1200" height="600" fill="url(#sky)"/>
  
  <!-- Moon + glow -->
  <rect width="1200" height="600" fill="url(#moon-glow)"/>
  <circle cx="900" cy="120" r="50" fill="rgba(210,220,255,0.12)" stroke="rgba(210,220,255,0.2)" stroke-width="1"/>
  <circle cx="900" cy="120" r="35" fill="rgba(230,235,255,0.08)"/>
  
  <!-- Stars -->
  <g fill="rgba(200,210,255,0.5)">
    <circle cx="100" cy="80" r="1.2"/><circle cx="250" cy="45" r="0.8"/>
    <circle cx="400" cy="100" r="1"/><circle cx="550" cy="30" r="0.7"/>
    <circle cx="700" cy="70" r="1.1"/><circle cx="1050" cy="50" r="0.9"/>
    <circle cx="150" cy="150" r="0.6"/><circle cx="500" cy="160" r="0.8"/>
    <circle cx="800" cy="180" r="0.5"/><circle cx="1100" cy="130" r="1"/>
  </g>
  
  <!-- Far mountains (silhouette) -->
  <path d="M0 420 L80 320 L160 360 L280 260 L400 350 L500 280 L600 330 L720 240 L850 310 L950 220 L1050 290 L1150 250 L1200 300 L1200 600 L0 600Z" fill="rgba(40,40,90,0.5)"/>
  
  <!-- Mid mountains -->
  <path d="M0 450 L120 350 L200 390 L320 300 L450 380 L560 310 L680 370 L800 290 L920 350 L1020 300 L1100 340 L1200 310 L1200 600 L0 600Z" fill="rgba(30,30,70,0.6)"/>
  
  <!-- Near mountains -->
  <path d="M0 500 L100 400 L220 450 L340 380 L480 440 L600 400 L720 430 L860 370 L1000 420 L1120 390 L1200 410 L1200 600 L0 600Z" fill="rgba(20,20,50,0.8)"/>
  
  <!-- Mist layer -->
  <rect width="1200" height="600" fill="url(#mountain-mist)"/>
  
  <!-- Pagoda silhouette on peak -->
  <g transform="translate(830,210)" fill="rgba(50,50,100,0.9)">
    <rect x="-8" y="0" width="16" height="4" rx="1"/>
    <rect x="-6" y="4" width="12" height="6" rx="1"/>
    <rect x="-5" y="10" width="10" height="6" rx="1"/>
    <rect x="-3" y="16" width="6" height="8" rx="1"/>
    <line x1="0" y1="0" x2="0" y2="-12" stroke="rgba(201,168,108,0.3)" stroke-width="1"/>
  </g>
  
  <!-- Water/lake at bottom -->
  <ellipse cx="600" cy="560" rx="600" ry="60" fill="url(#water)"/>
  
  <!-- Floating qi particles -->
  <g filter="url(#glow)" opacity="0.6">
    <circle cx="300" cy="350" r="2" fill="rgba(201,168,108,0.4)">
      <animate attributeName="cy" values="350;280;350" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="600" cy="300" r="1.5" fill="rgba(150,200,255,0.3)">
      <animate attributeName="cy" values="300;240;300" dur="5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="900" cy="280" r="1.8" fill="rgba(201,168,108,0.3)">
      <animate attributeName="cy" values="280;220;280" dur="6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="6s" repeatCount="indefinite"/>
    </circle>
  </g>
  
  <!-- Subtle text label -->
  <text x="600" y="575" text-anchor="middle" fill="rgba(201,168,108,0.15)" font-size="12" font-family="serif" letter-spacing="8">修仙 · 灵山</text>
</svg>
```

- [ ] **Step 2: 重写 horror-default.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0005"/>
      <stop offset="50%" stop-color="#120008"/>
      <stop offset="100%" stop-color="#080004"/>
    </linearGradient>
    <radialGradient id="red-fog" cx="0.3" cy="0.6" r="0.5">
      <stop offset="0%" stop-color="rgba(180,30,30,0.08)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="mist-filter">
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="gray-noise"/>
      <feComponentTransfer in="gray-noise" result="threshold">
        <feFuncA type="discrete" tableValues="0 0 0 0 0.05 0.05 0.08 0.08"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="threshold" mode="screen"/>
    </filter>
  </defs>
  <rect width="1200" height="600" fill="url(#sky)"/>
  <rect width="1200" height="600" fill="url(#red-fog)"/>
  
  <!-- Dead trees -->
  <g stroke="rgba(60,20,20,0.7)" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M200 600 L200 350 L170 280 M200 400 L230 340 M200 450 L160 390"/>
    <path d="M1000 600 L1000 380 L1030 310 M1000 430 L970 360 M1000 480 L1040 420"/>
    <path d="M600 600 L600 420 L570 360 M600 460 L630 400"/>
  </g>
  
  <!-- Abandoned building silhouette -->
  <g fill="rgba(30,10,10,0.9)">
    <rect x="500" y="320" width="200" height="280" rx="2"/>
    <rect x="510" y="280" width="180" height="40" rx="2"/>
    <polygon points="500,320 600,250 700,320"/>
    <!-- Windows -->
    <rect x="530" y="360" width="40" height="50" rx="2" fill="rgba(180,30,30,0.06)"/>
    <rect x="630" y="360" width="40" height="50" rx="2" fill="rgba(180,30,30,0.04)"/>
    <rect x="570" y="450" width="60" height="80" rx="2" fill="rgba(0,0,0,0.5)"/>
    <!-- Door frame -->
    <rect x="560" y="540" width="80" height="60" rx="2"/>
  </g>
  
  <!-- Ground fog -->
  <ellipse cx="600" cy="580" rx="700" ry="80" fill="rgba(80,20,20,0.06)"/>
  
  <!-- Red moon -->
  <circle cx="900" cy="100" r="60" fill="rgba(180,30,30,0.06)"/>
  <circle cx="900" cy="100" r="35" fill="rgba(200,40,40,0.08)" stroke="rgba(200,40,40,0.15)" stroke-width="1"/>
  
  <!-- Scattered gravestones -->
  <g fill="rgba(40,15,15,0.6)">
    <rect x="350" y="520" width="30" height="50" rx="3 3 0 0"/>
    <rect x="800" y="530" width="25" height="40" rx="3 3 0 0"/>
    <rect x="900" y="540" width="20" height="30" rx="2 2 0 0"/>
  </g>
  
  <!-- Blood drip accents -->
  <g fill="rgba(180,30,30,0.15)">
    <rect x="680" y="250" width="2" height="30" rx="1"/>
    <rect x="530" y="280" width="2" height="20" rx="1"/>
  </g>
  
  <text x="600" y="580" text-anchor="middle" fill="rgba(180,30,30,0.15)" font-size="12" font-family="serif" letter-spacing="8">恐怖 · 废墟</text>
</svg>
```

- [ ] **Step 3: 重写 mystery-default.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050510"/>
      <stop offset="100%" stop-color="#0a0a18"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="0.5" cy="0.4" r="0.4">
      <stop offset="0%" stop-color="rgba(200,200,220,0.08)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <pattern id="rain" width="4" height="20" patternUnits="userSpaceOnUse">
      <line x1="2" y1="0" x2="1" y2="20" stroke="rgba(150,170,200,0.12)" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="600" fill="url(#sky)"/>
  <rect width="1200" height="600" fill="url(#spotlight)"/>
  <rect width="1200" height="600" fill="url(#rain)" opacity="0.6"/>
  
  <!-- City skyline silhouette -->
  <g fill="rgba(15,15,30,0.95)">
    <rect x="50" y="350" width="80" height="250"/>
    <rect x="150" y="300" width="60" height="300"/>
    <rect x="230" y="380" width="100" height="220"/>
    <rect x="360" y="280" width="70" height="320"/>
    <rect x="450" y="330" width="90" height="270"/>
    <rect x="570" y="260" width="50" height="340"/>
    <rect x="640" y="350" width="110" height="250"/>
    <rect x="780" y="290" width="80" height="310"/>
    <rect x="880" y="340" width="70" height="260"/>
    <rect x="970" y="310" width="100" height="290"/>
    <rect x="1090" y="360" width="80" height="240"/>
  </g>
  
  <!-- Lit windows (clues) -->
  <g fill="rgba(220,200,100,0.25)">
    <rect x="70" y="380" width="8" height="10" rx="1"/>
    <rect x="170" y="330" width="8" height="10" rx="1"/>
    <rect x="380" y="310" width="8" height="10" rx="1"/>
    <rect x="590" y="290" width="8" height="10" rx="1"/>
    <rect x="800" y="320" width="8" height="10" rx="1"/>
    <rect x="1000" y="340" width="8" height="10" rx="1"/>
  </g>
  
  <!-- Street lamp glow -->
  <g>
    <circle cx="400" cy="440" r="40" fill="rgba(220,200,120,0.04)"/>
    <circle cx="400" cy="440" r="15" fill="rgba(220,200,120,0.06)"/>
    <rect x="398" y="440" width="4" height="60" fill="rgba(80,80,100,0.3)"/>
  </g>
  <g>
    <circle cx="800" cy="440" r="40" fill="rgba(220,200,120,0.03)"/>
    <circle cx="800" cy="440" r="15" fill="rgba(220,200,120,0.05)"/>
    <rect x="798" y="440" width="4" height="60" fill="rgba(80,80,100,0.3)"/>
  </g>
  
  <!-- Wet ground reflection -->
  <rect x="0" y="500" width="1200" height="100" fill="rgba(80,100,140,0.04)"/>
  
  <!-- Magnifying glass hint -->
  <g transform="translate(600,480)" opacity="0.08">
    <circle cx="0" cy="0" r="20" stroke="rgba(200,200,220,1)" stroke-width="2" fill="none"/>
    <line x1="14" y1="14" x2="30" y2="30" stroke="rgba(200,200,220,1)" stroke-width="2"/>
  </g>
  
  <text x="600" y="575" text-anchor="middle" fill="rgba(96,125,139,0.2)" font-size="12" font-family="serif" letter-spacing="8">悬疑 · 雨夜</text>
</svg>
```

- [ ] **Step 4: 重写 apocalypse-default.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1508"/>
      <stop offset="40%" stop-color="#12100a"/>
      <stop offset="100%" stop-color="#0a0806"/>
    </linearGradient>
    <radialGradient id="sun-haze" cx="0.8" cy="0.3" r="0.35">
      <stop offset="0%" stop-color="rgba(200,120,50,0.15)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(80,60,40,0.15)"/>
      <stop offset="100%" stop-color="rgba(40,30,20,0.05)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#sky)"/>
  <rect width="1200" height="600" fill="url(#sun-haze)"/>
  
  <!-- Hazy sun -->
  <circle cx="960" cy="180" r="80" fill="rgba(200,100,40,0.06)"/>
  <circle cx="960" cy="180" r="40" fill="rgba(220,130,60,0.08)" stroke="rgba(220,130,60,0.12)" stroke-width="1"/>
  
  <!-- Ruined cityscape -->
  <g fill="rgba(50,40,25,0.8)">
    <!-- Broken buildings -->
    <path d="M100 600 L100 350 L120 340 L130 350 L130 600Z"/>
    <path d="M200 600 L200 280 L210 270 L230 260 L240 270 L240 600Z"/>
    <path d="M200 280 L210 250 L220 260"/>
    <rect x="300" y="320" width="80" height="280"/>
    <path d="M300 320 L340 300 L380 320"/>
    <rect x="450" y="380" width="60" height="220"/>
    <rect x="550" y="300" width="100" height="300"/>
    <path d="M550 300 L600 270 L650 300"/>
    <rect x="750" y="350" width="70" height="250"/>
    <path d="M850 600 L850 400 L870 380 L890 390 L900 420 L900 600Z"/>
    <rect x="1000" y="360" width="90" height="240"/>
    <path d="M1000 360 L1045 340 L1090 360"/>
    <rect x="1120" y="400" width="60" height="200"/>
  </g>
  
  <!-- Wrecked vehicle -->
  <g transform="translate(400,500)" fill="rgba(60,45,30,0.7)">
    <rect x="0" y="10" width="60" height="20" rx="5"/>
    <rect x="10" y="0" width="40" height="12" rx="3"/>
    <circle cx="15" cy="32" r="6" fill="rgba(40,30,20,0.8)"/>
    <circle cx="50" cy="32" r="6" fill="rgba(40,30,20,0.8)"/>
  </g>
  
  <!-- Dust particles -->
  <g fill="rgba(180,140,80,0.15)">
    <circle cx="200" cy="250" r="1.5"/>
    <circle cx="500" cy="300" r="1"/>
    <circle cx="800" cy="280" r="1.2"/>
    <circle cx="350" cy="350" r="0.8"/>
    <circle cx="700" cy="400" r="1"/>
  </g>
  
  <!-- Cracked ground -->
  <g stroke="rgba(80,60,40,0.15)" stroke-width="0.5" fill="none">
    <path d="M0 550 L200 540 L250 560 L400 545"/>
    <path d="M500 555 L650 540 L700 560 L850 550"/>
    <path d="M900 545 L1050 555 L1200 540"/>
  </g>
  
  <!-- Ground haze -->
  <rect x="0" y="480" width="1200" height="120" fill="url(#ground)"/>
  
  <text x="600" y="580" text-anchor="middle" fill="rgba(141,110,99,0.15)" font-size="12" font-family="serif" letter-spacing="8">末日 · 废土</text>
</svg>
```

- [ ] **Step 5: 重写 palace-default.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#100610"/>
      <stop offset="100%" stop-color="#0a0408"/>
    </linearGradient>
    <radialGradient id="golden-glow" cx="0.5" cy="0.3" r="0.5">
      <stop offset="0%" stop-color="rgba(255,215,0,0.06)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="curtain-left" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(180,40,40,0.15)"/>
      <stop offset="100%" stop-color="rgba(120,20,20,0.08)"/>
    </linearGradient>
    <linearGradient id="curtain-right" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(180,40,40,0.15)"/>
      <stop offset="100%" stop-color="rgba(120,20,20,0.08)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#sky)"/>
  <rect width="1200" height="600" fill="url(#golden-glow)"/>
  
  <!-- Palace architecture -->
  <g fill="rgba(60,20,20,0.7)">
    <!-- Main hall -->
    <rect x="350" y="200" width="500" height="300" rx="3"/>
    <!-- Roof -->
    <path d="M320 200 L600 120 L880 200Z"/>
    <path d="M330 200 L600 130 L870 200Z" fill="rgba(80,30,30,0.6)"/>
    <!-- Roof ridge ornaments -->
    <circle cx="600" cy="125" r="8" fill="rgba(255,215,0,0.15)"/>
    <circle cx="450" cy="170" r="5" fill="rgba(255,215,0,0.1)"/>
    <circle cx="750" cy="170" r="5" fill="rgba(255,215,0,0.1)"/>
    <!-- Columns -->
    <rect x="380" y="200" width="12" height="300" fill="rgba(120,40,40,0.5)"/>
    <rect x="480" y="200" width="12" height="300" fill="rgba(120,40,40,0.5)"/>
    <rect x="600" y="200" width="14" height="300" fill="rgba(140,50,50,0.5)"/>
    <rect x="720" y="200" width="12" height="300" fill="rgba(120,40,40,0.5)"/>
    <rect x="820" y="200" width="12" height="300" fill="rgba(120,40,40,0.5)"/>
    <!-- Throne area -->
    <rect x="540" y="380" width="120" height="120" rx="4" fill="rgba(100,35,35,0.6)"/>
    <rect x="555" y="360" width="90" height="20" rx="2" fill="rgba(180,50,50,0.3)"/>
  </g>
  
  <!-- Golden accents -->
  <g stroke="rgba(255,215,0,0.12)" stroke-width="1" fill="none">
    <rect x="350" y="200" width="500" height="300" rx="3"/>
    <path d="M320 200 L600 120 L880 200"/>
    <rect x="540" y="380" width="120" height="120" rx="4"/>
  </g>
  
  <!-- Side curtains -->
  <path d="M0 0 L250 0 L200 600 L0 600Z" fill="url(#curtain-left)"/>
  <path d="M1200 0 L950 0 L1000 600 L1200 600Z" fill="url(#curtain-right)"/>
  
  <!-- Lanterns -->
  <g>
    <ellipse cx="300" cy="250" rx="12" ry="18" fill="rgba(255,80,40,0.08)" stroke="rgba(255,100,50,0.12)" stroke-width="0.5"/>
    <line x1="300" y1="232" x2="300" y2="200" stroke="rgba(200,50,30,0.1)" stroke-width="0.5"/>
    <ellipse cx="900" cy="250" rx="12" ry="18" fill="rgba(255,80,40,0.08)" stroke="rgba(255,100,50,0.12)" stroke-width="0.5"/>
    <line x1="900" y1="232" x2="900" y2="200" stroke="rgba(200,50,30,0.1)" stroke-width="0.5"/>
  </g>
  
  <!-- Floor pattern hint -->
  <g stroke="rgba(255,215,0,0.04)" stroke-width="0.5" fill="none">
    <rect x="350" y="500" width="500" height="2"/>
    <line x1="400" y1="502" x2="400" y2="600"/>
    <line x1="500" y1="502" x2="500" y2="600"/>
    <line x1="600" y1="502" x2="600" y2="600"/>
    <line x1="700" y1="502" x2="700" y2="600"/>
    <line x1="800" y1="502" x2="800" y2="600"/>
  </g>
  
  <text x="600" y="580" text-anchor="middle" fill="rgba(255,215,0,0.12)" font-size="12" font-family="serif" letter-spacing="8">宫斗 · 金殿</text>
</svg>
```

- [ ] **Step 6: 提交**

```bash
git add assets/images/scenes/
git commit -m "art(scenes): 重写全部 5 个场景 SVG，提升视觉品质和氛围感"
```

---

### Task 3: 优化场景视口 + 叙事区域核心排版

**Files:**
- Modify: `css/components/scene-viewport.css`
- Modify: `css/components/narrative.css`
- Modify: `css/base.css`

- [ ] **Step 1: 优化 scene-viewport.css**

将 `#scene-viewport` 的 `aspect-ratio` 和 `max-height` 调整，并增强底部渐变：

```css
#scene-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 9;
  max-height: 40vh;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background-color: var(--c-bg-surface);
  border: 1px solid var(--c-border-brand);
  margin-bottom: var(--space-6);
  transition: border-color var(--duration-slow) var(--ease-in-out), box-shadow var(--duration-slow) var(--ease-in-out);
  box-shadow: var(--shadow-glow);
}
```

将 `::before` 底部渐变的不透明度提升：

```css
#scene-viewport::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, var(--c-bg-base) 0%, rgba(8,8,14,0.6) 40%, transparent 100%);
  pointer-events: none;
  z-index: var(--z-base);
}
```

更新 responsive 断点：

```css
@media (max-width: 768px) {
  #scene-viewport {
    aspect-ratio: 21 / 9;
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    max-height: 35vh;
  }
}
```

- [ ] **Step 2: 优化 narrative.css — 叙事文本排版提升**

```css
#narrative-text {
  font-family: var(--font-display);
  font-size: var(--text-base);
  line-height: var(--leading-narrative);
  color: var(--c-text-primary);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-6);
  background: var(--c-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border-subtle);
  border-left: 2px solid var(--c-brand-glow);
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 140px;
  position: relative;
  animation: fadeIn var(--duration-slow) var(--ease-out-expo);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}
```

- [ ] **Step 3: 优化 narrative.css — 选项按钮视觉升级**

```css
.choice-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  padding-left: var(--space-8);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  color: var(--c-text-primary);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  line-height: var(--leading-relaxed);
  text-align: left;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-expo);
  min-height: 48px;
  overflow: hidden;
}
```

更新选项间距为 token：

```css
#choices-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: fadeSlideUp var(--duration-normal) var(--ease-out-expo);
}
```

- [ ] **Step 4: 优化 base.css — 移除 p 标签对叙事区域的副作用**

```css
#narrative-text p {
  margin-bottom: var(--space-2);
  line-height: var(--leading-narrative);
}
```

在 base.css 的 responsive 部分前添加此规则。

- [ ] **Step 5: 提交**

```bash
git add css/components/scene-viewport.css css/components/narrative.css css/base.css
git commit -m "style(layout): 优化场景视口比例、叙事排版和选项按钮视觉"
```

---

### Task 4: 优化状态栏 + 章节导航

**Files:**
- Modify: `css/components/status-bar.css`
- Modify: `css/components/chapter-nav.css`

- [ ] **Step 1: 增强 status-bar.css 的视觉层次**

更新 `#status-bar` 的样式，增加内阴影质感：

```css
#status-bar {
  position: relative;
  padding: var(--space-4) var(--space-6);
  margin-bottom: var(--space-5);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out-expo);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
```

更新 mini-stat 的 gap：

```css
.status-mini {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
}
```

- [ ] **Step 2: 优化 chapter-nav.css**

将 `.chapter-dot` 的大小和动画增强：

```css
.chapter-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-circle);
  border: 2px solid var(--c-border-default);
  background: transparent;
  cursor: default;
  transition: all var(--duration-normal) var(--ease-out-expo);
  position: relative;
}

.chapter-dot.current {
  width: 14px;
  height: 14px;
  background: var(--c-brand);
  border-color: var(--c-brand);
  box-shadow: 0 0 12px var(--c-brand-glow-strong);
  animation: dotPulse 2s infinite;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 12px var(--c-brand-glow-strong); }
  50% { box-shadow: 0 0 20px var(--c-brand-glow-strong); }
}

.chapter-dot.completed {
  background: var(--c-brand);
  border-color: var(--c-brand);
  opacity: 0.6;
}

.chapter-dot.upcoming {
  opacity: 0.3;
}
```

更新 `.chapter-connector` 的样式：

```css
.chapter-connector {
  width: 24px;
  height: 2px;
  background: var(--c-border-default);
  flex-shrink: 0;
}

.chapter-connector.completed {
  background: var(--c-brand);
  opacity: 0.4;
}
```

- [ ] **Step 3: 提交**

```bash
git add css/components/status-bar.css css/components/chapter-nav.css
git commit -m "style(ui): 增强状态栏和章节导航的视觉质感"
```

---

### Task 5: 统一主题 token + 修复硬编码颜色

**Files:**
- Modify: `css/themes/horror.css`
- Modify: `css/themes/mystery.css`
- Modify: `css/themes/palace.css`
- Modify: `css/components/rpg-extensions.css`
- Modify: `css/components/save-system.css`

- [ ] **Step 1: 在所有主题文件中添加统一的 --c-danger 定义**

在每个主题 CSS 的 `[data-genre="xxx"]` 块内添加：

```css
--c-danger: var(--c-state-error);
```

具体操作：
- `horror.css`：已有类似值，确认名为 `--c-danger` 且值为 `#F44336`，改为 `var(--c-state-error)` 以统一
- `mystery.css`：同上
- `xianxia.css`：添加新行 `--c-danger: var(--c-state-error);`
- `apocalypse.css`：添加新行
- `palace.css`：添加新行

- [ ] **Step 2: 修复 palace.css stat-color 差异化**

将 palace.css 中的 `--stat-color` 改为使用差异化颜色（替换全金方案）：

```css
--stat-color-1: #FFD700;
--stat-color-2: #FF6B6B;
--stat-color-3: #4FC3F7;
--stat-color-4: #81C784;
--stat-color-5: #CE93D8;
--stat-color-6: #FFB74D;
```

- [ ] **Step 3: 修复 rpg-extensions.css 中的硬编码颜色**

将 `rpg-extensions.css` 中的以下硬编码替换为 token：

- `.npc-affinity-fill` 中的 `#22c55e` 替换为 `var(--c-state-success)`
- `.npc-affinity-fill.negative` 中的 `#dc2626` 替换为 `var(--c-state-error)`
- `.rpg-inline-feedback` 中的 `rgba(201, 168, 108, ...)` 替换为 `var(--c-brand-glow)` 和 `var(--c-brand-glow-strong)`
- `.delayed-change-notification` 中的 `rgba(139, 92, 246, ...)` 替换为 `rgba(var(--c-brand), 0.15)` — 注：CSS 不支持 `var()` 在 `rgba()` 中，保留为合理的半透明紫色但添加注释

- [ ] **Step 4: 修复 save-system.css 中的 --c-text-error 引用**

确认 save-system.css 中引用的 `--c-text-error` 会被新添加的 token 正确解析（Task 1 已添加）。

- [ ] **Step 5: 提交**

```bash
git add css/themes/ css/components/rpg-extensions.css css/components/save-system.css
git commit -m "fix(tokens): 统一主题危险色定义，修复硬编码颜色引用"
```

---

### Task 6: 优化菜单面板布局

**Files:**
- Modify: `css/components/menu.css`
- Modify: `pages/game-main.html`

- [ ] **Step 1: 增强 menu.css 的视觉细节**

将 `.menu-panel` 的样式升级：

```css
.menu-panel {
  width: 380px;
  max-width: 90vw;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-heavy));
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow-lg), 0 0 80px var(--c-brand-glow);
  padding: var(--space-8);
  transform: scale(0.95) translateY(12px);
  transition: transform var(--duration-slow) var(--ease-out-back);
}
```

将 `#menu-overlay` 的 blur 增强：

```css
#menu-overlay {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

- [ ] **Step 2: 移除 game-main.html 中内联 style**

在 game-main.html 中找到 `<div class="genre-switcher" style="margin-top:var(--space-6)">` 并改为：

```html
<div class="genre-switcher">
```

确保 menu.css 中已有的 `margin-top: var(--space-4)` 生效（在 CSS 中改为 `var(--space-5)` 以更宽松）：

```css
.genre-switcher {
  margin-top: var(--space-5);
}
```

- [ ] **Step 3: 提交**

```bash
git add css/components/menu.css pages/game-main.html
git commit -m "style(menu): 增强菜单面板视觉效果，移除内联样式"
```

---

### Task 7: 增强 overlay 面板一致性

**Files:**
- Modify: `css/components/inventory.css`
- Modify: `css/components/achievements.css`
- Modify: `css/components/endings.css`

- [ ] **Step 1: 统一 inventory.css 的圆角和内阴影**

确保 `#inventory-panel` 使用 `--radius-xl`：

```css
#inventory-panel {
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow-lg);
}
```

- [ ] **Step 2: 为 achievements.css 和 endings.css 添加空状态样式**

在两个文件中分别添加：

```css
/* Empty state */
.achievement-empty,
.ending-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  color: var(--c-text-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.achievement-empty::before,
.ending-empty::before {
  content: '—';
  font-size: var(--text-2xl);
  margin-bottom: var(--space-4);
  opacity: 0.3;
}
```

- [ ] **Step 3: 提交**

```bash
git add css/components/inventory.css css/components/achievements.css css/components/endings.css
git commit -m "style(panels): 统一 overlay 面板圆角，添加空状态样式"
```

---

### Task 8: 可访问性增强

**Files:**
- Modify: `css/themes/horror.css`
- Modify: `css/vfx/horror-vfx.css`

- [ ] **Step 1: 为 horror 主题添加 reduced-motion 保护**

在 horror.css 中找到 `sanityDistortion` 动画，在其所在选择器后添加：

```css
@media (prefers-reduced-motion: reduce) {
  .low-sanity #narrative-text,
  .low-sanity .narrative-content {
    filter: none !important;
  }
}
```

- [ ] **Step 2: 为 horror-vfx.css 的 screenShake 添加保护**

在 horror-vfx.css 中找到 `screenShake` 动画，添加：

```css
@media (prefers-reduced-motion: reduce) {
  .screen-shake {
    animation: none !important;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add css/themes/horror.css css/vfx/horror-vfx.css
git commit -m "a11y: 恐怖主题添加 prefers-reduced-motion 保护"
```

---

### Task 9: 端到端验证

- [ ] **Step 1: 打开浏览器验证所有主题的场景图渲染**

在浏览器中依次测试：
- `http://localhost:3002/player/pages/game-main.html?story=demo_qinglu_yehuo` — 确认修仙场景图、字体加载
- 点击菜单中各题材按钮 — 确认主题切换后场景图更换

- [ ] **Step 2: 验证叙事排版和选项按钮**

- 确认叙事文本使用衬线字体（Noto Serif SC）
- 确认选项按钮有左侧渐变装饰线
- 确认选择后按钮禁用 + 跳转正常

- [ ] **Step 3: 验证面板样式**

- 打开背包面板：确认圆角统一、空状态显示
- 打开角色关系面板
- 打开成就面板

- [ ] **Step 4: 验证色盲模式和字体调整**

- 色盲模式切换：确认 stat 颜色正确显示色盲符号
- 字体大小滑块：拖动确认实时生效

- [ ] **Step 5: 最终提交推送**

```bash
git push
```
