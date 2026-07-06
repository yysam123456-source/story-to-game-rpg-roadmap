# RPG Game UI V2 — UI 设计说明文档

## 1. 项目概述

- **项目定位**：小说改编 RPG 游戏的 UI 系统，面向多题材叙事型游戏场景
- **核心特性**：
  - 5 种题材主题实时切换（修仙/恐怖/悬疑/末日/宫斗）
  - Glassmorphism（毛玻璃）视觉系统，营造沉浸式游戏氛围
  - 完整游戏功能：状态管理、叙事引擎、交互探索、背包系统、存档/读档、成就系统、多结局追踪、VFX 视觉特效、音频系统
- **技术栈**：纯 HTML/CSS/JS（无构建工具），基于 CSS Custom Properties 的主题系统，通过 `data-genre` 属性实现题材级联切换

---

## 2. 架构设计

### 2.1 文件结构

```
rpg-game-ui-v2/
├── index.html                        # 入口页
├── pages/
│   └── game-main.html                # 游戏主页
├── css/
│   ├── tokens.css                    # 设计 Token（颜色、阴影、圆角、间距、字体、动画、z-index）
│   ├── base.css                      # 基础样式重置与全局样式
│   ├── themes/
│   │   ├── xianxia.css               # 修仙主题色值
│   │   ├── horror.css                # 恐怖主题色值
│   │   ├── mystery.css               # 悬疑主题色值
│   │   ├── apocalypse.css            # 末日主题色值
│   │   └── palace.css                # 宫斗主题色值
│   ├── components/
│   │   ├── scene-viewport.css        # 场景视口
│   │   ├── status-bar.css            # 状态栏
│   │   ├── narrative.css             # 叙事区域 + 选择按钮
│   │   ├── interactions.css          # 交互按钮
│   │   ├── inventory.css             # 背包面板
│   │   ├── menu.css                  # 菜单系统
│   │   ├── notifications.css         # 通知系统
│   │   ├── chapter-nav.css           # 章节导航
│   │   ├── portrait.css              # 立绘/头像系统
│   │   ├── save-system.css           # 存档/读档系统
│   │   ├── achievements.css          # 成就系统
│   │   └── endings.css               # 结局系统
│   └── vfx/
│       ├── shared.css                # VFX 共享动画与粒子基类
│       ├── xianxia-vfx.css           # 修仙粒子特效
│       ├── horror-vfx.css            # 恐怖粒子特效
│       ├── mystery-vfx.css           # 悬疑粒子特效
│       ├── apocalypse-vfx.css        # 末日粒子特效
│       └── palace-vfx.css            # 宫斗粒子特效
└── js/
    ├── state.js                      # 状态管理
    ├── theme.js                      # 主题引擎 + 章节切换 + 物品渲染
    ├── ui.js                         # UI 控制器 + 通知 + 交互流程 + 测试入口
    ├── vfx.js                        # 视觉特效引擎
    ├── audio.js                      # 音频系统
    ├── data.js                       # 数据配置（物品、交互逻辑、初始状态）
    ├── portrait.js                   # 立绘系统
    ├── save-system.js               # 存档系统
    ├── achievements.js              # 成就系统
    └── endings.js                   # 结局系统
```

### 2.2 CSS 架构层级

CSS 文件按照以下层级顺序加载，后加载的层覆盖先加载的层：

```
tokens.css
  ↓  定义全局设计 Token（CSS 自定义属性）
base.css
  ↓  基础样式重置、全局排版、滚动条
themes/*.css
  ↓  通过 [data-genre="xxx"] 选择器覆盖 Token 变量
components/*.css
  ↓  各功能组件的独立样式模块
vfx/*.css
  ↓  视觉特效与粒子动画
```

| 层级 | 文件 | 作用 |
|------|------|------|
| Token 层 | `tokens.css` | 定义全局设计 Token：颜色、阴影、圆角、间距、字体、动画、z-index |
| Base 层 | `base.css` | CSS Reset、全局排版规则、滚动条样式、body 基础样式 |
| Theme 层 | `themes/*.css` | 通过 `[data-genre]` 属性选择器覆盖 Token 变量，实现题材级联 |
| Component 层 | `components/*.css` | 各 UI 组件的独立样式，引用 Token 变量实现主题适配 |
| VFX 层 | `vfx/*.css` | 转场动画关键帧、粒子特效样式，引用 `--z-vfx` / `--z-transition` |

### 2.3 JS 模块划分

| 模块 | 文件 | 职责 |
|------|------|------|
| `GameState` | `state.js` | 游戏状态管理：当前题材、章节、角色属性值、背包数据 |
| `ThemeEngine` | `theme.js` | 主题引擎：题材切换（更新 `data-genre`）、章节转场动画触发、物品渲染 |
| `UIController` | `ui.js` | UI 控制器：通知系统、交互流程控制、菜单开关、测试入口 |
| `VFXEngine` | `vfx.js` | 视觉特效引擎：粒子系统管理、题材专属特效触发 |
| `AudioSystem` | `audio.js` | 音频系统：背景音乐（BGM）与音效（SFX）开关控制 |
| `GENRE_CONFIGS` | `data.js` | 数据配置：5 种题材的属性定义、交互按钮、背包分类、初始故事与选项、交互逻辑映射 |
| `PortraitSystem` | `portrait.js` | 立绘系统：全身立绘进出动画、对话头像管理 |
| `SaveSystem` | `save-system.js` | 存档系统：8 个存档槽位的保存/读取/删除，基于 localStorage |
| `AchievementSystem` | `achievements.js` | 成就系统：成就列表管理、解锁检测、解锁 Toast 弹出 |
| `EndingSystem` | `endings.js` | 结局系统：多结局追踪、隐藏结局管理、mini dot 追踪器 |

---

## 3. 设计系统 (Design Tokens)

### 3.1 色彩系统

#### 基础色彩

| Token | 值 | 用途 |
|-------|-----|------|
| `--c-bg-base` | `#08080e` | 页面最深背景色 |
| `--c-bg-surface` | `#111118` | 卡片/面板表面背景 |
| `--c-bg-elevated` | `#1a1a24` | 提升层级背景（按钮、物品卡片） |
| `--c-bg-overlay` | `rgba(17, 17, 24, 0.85)` | 弹出叠加层背景 |
| `--c-text-primary` | `#e8e8f2` | 主文字色 |
| `--c-text-secondary` | `#8888a0` | 次要文字色 |
| `--c-text-muted` | `#55556a` | 弱化文字色 |
| `--c-text-accent` | `var(--c-brand)` | 强调文字色（跟随品牌色） |

#### 品牌色

| Token | 值 | 用途 |
|-------|-----|------|
| `--c-brand` | `#c9a86c` | 主品牌色 |
| `--c-brand-light` | `#e2cc9e` | 品牌色亮变体 |
| `--c-brand-dark` | `#a8874a` | 品牌色暗变体 |
| `--c-brand-glow` | `rgba(201, 168, 108, 0.2)` | 品牌辉光色（弱） |
| `--c-brand-glow-strong` | `rgba(201, 168, 108, 0.4)` | 品牌辉光色（强） |

#### 状态色

| Token | 值 | 用途 |
|-------|-----|------|
| `--c-state-success` | `#4ade80` | 成功/正面 |
| `--c-state-warning` | `#fbbf24` | 警告/稀有 |
| `--c-state-error` | `#f87171` | 错误/负面 |
| `--c-state-info` | `#60a5fa` | 信息/稀有成就 |

#### 边框色

| Token | 值 | 用途 |
|-------|-----|------|
| `--c-border-default` | `rgba(255, 255, 255, 0.06)` | 默认边框 |
| `--c-border-subtle` | `rgba(255, 255, 255, 0.03)` | 极淡边框 |
| `--c-border-brand` | `rgba(201, 168, 108, 0.15)` | 品牌色边框 |

#### Glassmorphism（毛玻璃）参数

| Token | 值 | 用途 |
|-------|-----|------|
| `--glass-bg` | `rgba(17, 17, 24, 0.7)` | 毛玻璃背景 |
| `--glass-bg-hover` | `rgba(26, 26, 36, 0.8)` | 悬停态毛玻璃背景 |
| `--glass-blur` | `20px` | 标准模糊半径 |
| `--glass-blur-heavy` | `28px` | 重度模糊半径（菜单、背包面板） |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | 毛玻璃边框 |
| `--glass-border-hover` | `rgba(255, 255, 255, 0.15)` | 悬停态毛玻璃边框 |
| `--glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.4)` | 毛玻璃阴影 |
| `--glass-shadow-lg` | `0 16px 48px rgba(0, 0, 0, 0.5)` | 毛玻璃大阴影 |
| `--glass-inset` | `inset 0 1px 0 rgba(255, 255, 255, 0.06)` | 内部顶部高光 |

### 3.2 五种题材主题色值

#### 修仙（Xianxia）— 金色/琥珀色调

| Token | 值 |
|-------|-----|
| `--c-brand` | `#c9a86c` |
| `--c-brand-light` | `#e2cc9e` |
| `--c-brand-dark` | `#a8874a` |
| `--c-brand-glow` | `rgba(201, 168, 108, 0.2)` |
| `--c-brand-glow-strong` | `rgba(201, 168, 108, 0.4)` |
| `--c-bg-base` | `#080812` |
| `--c-bg-surface` | `#0e0e1e` |
| `--c-bg-elevated` | `#181830` |
| `--c-text-primary` | `#ede6dc` |
| `--c-text-secondary` | `#a09888` |
| `--c-text-muted` | `#685f52` |
| `--stat-color-1` | `#4fc3f7` |
| `--stat-color-2` | `#81c784` |
| `--stat-color-3` | `#ff8a65` |
| `--stat-color-4` | `#ffd54f` |
| `--stat-color-5` | `#c9a86c` |
| `--stat-color-6` | `#ab47bc` |

#### 恐怖（Horror）— 深红色调，压抑氛围

| Token | 值 |
|-------|-----|
| `--c-brand` | `#F44336` |
| `--c-brand-light` | `#EF5350` |
| `--c-brand-dark` | `#C62828` |
| `--c-brand-glow` | `rgba(244, 67, 54, 0.2)` |
| `--c-brand-glow-strong` | `rgba(244, 67, 54, 0.4)` |
| `--c-danger` | `#FF0000` |
| `--c-bg-base` | `#0a0204` |
| `--c-bg-surface` | `#140608` |
| `--c-bg-elevated` | `#220e10` |
| `--c-text-primary` | `#f0d8d8` |
| `--c-text-secondary` | `#a87070` |
| `--c-text-muted` | `#6b4040` |
| `--stat-color-1` | `#9C27B0` |
| `--stat-color-2` | `#F44336` |
| `--stat-color-3` | `#607d8b` |
| `--stat-color-4` | `#ffc107` |
| `--stat-color-5` | `#F44336` |
| `--stat-color-6` | `#7b1fa2` |

#### 悬疑（Mystery）— 冷蓝灰色调，理性分析氛围

| Token | 值 |
|-------|-----|
| `--c-brand` | `#607D8B` |
| `--c-brand-light` | `#78909C` |
| `--c-brand-dark` | `#455A64` |
| `--c-brand-glow` | `rgba(96, 125, 139, 0.2)` |
| `--c-brand-glow-strong` | `rgba(96, 125, 139, 0.4)` |
| `--c-danger` | `#F44336` |
| `--c-bg-base` | `#060610` |
| `--c-bg-surface` | `#0c0c1c` |
| `--c-bg-elevated` | `#161628` |
| `--c-text-primary` | `#d0d4e0` |
| `--c-text-secondary` | `#808898` |
| `--c-text-muted` | `#505868` |
| `--stat-color-1` | `#4CAF50` |
| `--stat-color-2` | `#FF9800` |
| `--stat-color-3` | `#ab47bc` |
| `--stat-color-4` | `#42a5f5` |
| `--stat-color-5` | `#64748b` |
| `--stat-color-6` | `#78909c` |

#### 末日（Apocalypse）— 军绿色调，荒野废土感

| Token | 值 |
|-------|-----|
| `--c-brand` | `#8D6E63` |
| `--c-brand-light` | `#A1887F` |
| `--c-brand-dark` | `#6D4C41` |
| `--c-brand-glow` | `rgba(141, 110, 99, 0.2)` |
| `--c-brand-glow-strong` | `rgba(141, 110, 99, 0.4)` |
| `--c-bg-base` | `#080806` |
| `--c-bg-surface` | `#12120e` |
| `--c-bg-elevated` | `#1e1e16` |
| `--c-text-primary` | `#d4d0c0` |
| `--c-text-secondary` | `#8a8670` |
| `--c-text-muted` | `#585646` |
| `--stat-color-1` | `#FF9800` |
| `--stat-color-2` | `#4CAF50` |
| `--stat-color-3` | `#F44336` |
| `--stat-color-4` | `#9e9e9e` |
| `--stat-color-5` | `#8D6E63` |
| `--stat-color-6` | `#ff7043` |

#### 宫斗（Palace）— 金色+玫粉色调，华丽精致

| Token | 值 |
|-------|-----|
| `--c-brand` | `#FFD700` |
| `--c-brand-light` | `#FFEB3B` |
| `--c-brand-dark` | `#FFA000` |
| `--c-brand-glow` | `rgba(255, 215, 0, 0.2)` |
| `--c-brand-glow-strong` | `rgba(255, 215, 0, 0.4)` |
| `--c-bg-base` | `#10060c` |
| `--c-bg-surface` | `#160a12` |
| `--c-bg-elevated` | `#26141e` |
| `--c-text-primary` | `#F5F0E0` |
| `--c-text-secondary` | `#a87890` |
| `--c-text-muted` | `#724a60` |
| `--stat-color-1` | `#E91E63` |
| `--stat-color-2` | `#9C27B0` |
| `--stat-color-3` | `#FFD700` |
| `--stat-color-4` | `#FFD700` |
| `--stat-color-5` | `#FFD700` |
| `--stat-color-6` | `#E91E63` |

### 3.3 阴影系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.3)` | 小元素阴影 |
| `--shadow-md` | `0 4px 16px rgba(0, 0, 0, 0.35)` | 中等阴影（交互按钮 hover） |
| `--shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.4)` | 大阴影 |
| `--shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.5)` | 超大阴影（弹窗面板） |
| `--shadow-glow` | `0 0 30px var(--c-brand-glow)` | 品牌辉光 |
| `--shadow-glow-strong` | `0 0 50px var(--c-brand-glow-strong)` | 强品牌辉光 |

### 3.4 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | `4px` | 小圆角（关闭按钮、标签） |
| `--radius-md` | `8px` | 中等圆角（通知 toast、物品卡片、菜单项） |
| `--radius-lg` | `12px` | 大圆角（状态栏、叙事区域、选择按钮、存档槽位） |
| `--radius-xl` | `16px` | 超大圆角（弹窗面板、菜单面板） |
| `--radius-pill` | `9999px` | 药丸形（标签按钮、进度条、筛选 tab） |

### 3.5 间距系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | `4px` | 极小间距 |
| `--space-2` | `8px` | 小间距 |
| `--space-3` | `12px` | 常规小间距 |
| `--space-4` | `16px` | 常规间距 |
| `--space-5` | `20px` | 中等间距 |
| `--space-6` | `24px` | 大间距 |
| `--space-8` | `32px` | 较大间距（菜单面板 padding） |
| `--space-10` | `40px` | 大间距 |
| `--space-12` | `48px` | 超大间距（背包面板底部 padding） |
| `--space-16` | `64px` | 最大间距 |

### 3.6 字体系统

#### 字体族

| Token | 值 | 用途 |
|-------|-----|------|
| `--font-sans` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif` | 主 UI 字体 |
| `--font-display` | `"Georgia", "Noto Serif SC", "STSong", serif` | 叙事文字/标题字体（衬线体，文学感） |
| `--font-mono` | `"JetBrains Mono", "SF Mono", "Fira Code", "Menlo", monospace` | 等宽字体（数值显示） |

#### 字号

| Token | 值 | 用途 |
|-------|-----|------|
| `--text-xs` | `10px` | 极小文字（标签、元数据、badge） |
| `--text-sm` | `12px` | 小文字（通知文本、物品名、对话名） |
| `--text-base` | `14px` | 正文文字（叙事区域、选择按钮） |
| `--text-lg` | `16px` | 较大文字（对话内容、背包标题） |
| `--text-xl` | `20px` | 大标题（面板标题） |
| `--text-2xl` | `28px` | 超大标题（章节转场标题） |

#### 字重

| Token | 值 | 用途 |
|-------|-----|------|
| `--weight-normal` | `400` | 常规 |
| `--weight-medium` | `500` | 中等（菜单项、物品名） |
| `--weight-semibold` | `600` | 半粗（标签、小标题） |
| `--weight-bold` | `700` | 粗体（标题、数值） |

#### 行高

| Token | 值 | 用途 |
|-------|-----|------|
| `--leading-tight` | `1.25` | 紧凑行高 |
| `--leading-normal` | `1.5` | 正常行高 |
| `--leading-relaxed` | `1.75` | 宽松行高（对话内容） |
| `--leading-narrative` | `1.85` | 叙事行高（叙事文本区域） |

#### 字间距

| Token | 值 | 用途 |
|-------|-----|------|
| `--letter-tight` | `-0.02em` | 紧凑（数值） |
| `--letter-normal` | `0` | 正常 |
| `--letter-wide` | `0.05em` | 宽松（标签、章节指示器） |
| `--letter-wider` | `0.1em` | 最宽（状态栏标题、题材标签） |

### 3.7 动画系统

#### 缓动函数

| Token | 值 | 用途 |
|-------|-----|------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | 快出缓动（弹性感，用于 hover/面板打开） |
| `--ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 回弹缓动（菜单面板缩放，轻微过冲） |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | 平滑缓入缓出（菜单叠加层淡入淡出） |

#### 时长

| Token | 值 | 用途 |
|-------|-----|------|
| `--duration-fast` | `150ms` | 快速（颜色变化、小元素过渡） |
| `--duration-normal` | `250ms` | 正常（hover 效果、面板过渡） |
| `--duration-slow` | `400ms` | 慢速（叙事淡入、通知弹出、背包滑入） |
| `--duration-slower` | `600ms` | 更慢（复杂过渡） |

#### 过渡组合模式

组件中常见的过渡写法：
- hover 效果：`all var(--duration-normal) var(--ease-out-expo)`
- 面板打开：`opacity var(--duration-normal) var(--ease-out-expo)` + `transform var(--duration-slow) var(--ease-out-expo)`
- 菜单叠加层：`opacity var(--duration-slow) var(--ease-in-out)`

### 3.8 Z-Index 层叠

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--z-base` | `1` | 基础内容层（场景视口内元素） |
| `--z-dropdown` | `100` | 下拉菜单 |
| `--z-sticky` | `200` | 吸顶元素 |
| `--z-fixed` | `300` | 固定按钮（菜单按钮 `#menu-toggle`、背包按钮 `#inventory-toggle`） |
| `--z-overlay` | `400` | 叠加层（菜单 `#menu-overlay`、背包面板 `#inventory-panel`） |
| `--z-modal` | `500` | 模态弹窗（存档、成就、结局面板） |
| `--z-toast` | `600` | 通知 Toast（`#notifications`） |
| `--z-vfx` | `9998` | VFX 视觉特效层（`#vfx-layer`） |
| `--z-transition` | `9999` | 章节转场全屏覆盖层 |
| `--z-accessibility` | `99999` | 无障碍辅助层（最高优先级） |

---

## 4. 组件设计规范

### 4.1 场景视口 (Scene Viewport)

**定位与尺寸**：
- `position: relative`，宽度 `100%`
- 宽高比 `aspect-ratio: 16 / 9`，最大高度 `max-height: 50vh`
- 圆角 `var(--radius-lg)` (12px)，`overflow: hidden`
- 背景色 `var(--c-bg-surface)`，边框 `1px solid var(--c-border-brand)`
- 底部间距 `margin-bottom: var(--space-5)`

**背景处理**：
- 无图片时显示占位渐变：径向渐变 + 线性渐变组合
- 底部 40% 高度叠加从 `--c-bg-base` 到透明的渐变（`::before` 伪元素），实现图片底部融入背景

**场景标签**：
- 左下角 `scene-label`：毛玻璃药丸形，显示"场景 初始位置"
- 右上角 `genre-tag`：品牌色渐变背景（`--c-brand-dark` → `--c-brand`），显示题材名称

**题材专属边框辉光**：
通过 `::after` 伪元素实现，各题材略有不同：
- 修仙：`inset 0 0 40px rgba(201, 168, 108, 0.08), 0 0 20px rgba(201, 168, 108, 0.06)`
- 恐怖：`inset 0 0 40px rgba(244, 67, 54, 0.1), 0 0 20px rgba(244, 67, 54, 0.08)`

**移动端适配**：`aspect-ratio: 21 / 9`，圆角 `--radius-md` (8px)

**核心 CSS**：

```css
#scene-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 50vh;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--c-bg-surface);
  border: 1px solid var(--c-border-brand);
  margin-bottom: var(--space-5);
}
```

### 4.2 状态栏 (Status Bar)

**布局结构**：
- 毛玻璃容器：`var(--glass-bg)` + `backdrop-filter: blur(var(--glass-blur))`
- 顶部渐变高光线：`linear-gradient(90deg, transparent, var(--c-brand), transparent)`，不透明度 0.4
- 头部行：左侧标题（小号大写字母间距），右侧展开/收起按钮
- **收起态**：显示 `.status-mini`（横向属性值行）
- **展开态**：显示 `.status-full`（网格进度条布局）

**属性项结构**（展开态）：
- 网格布局：`grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`
- 每项包含：图标 + 属性名 + 数值（顶部行），4px 进度条（底部行）
- 进度条颜色通过 `:nth-child` 引用 `--stat-color-1` 至 `--stat-color-6`，各题材自动着色
- 低值警告：`.stat-bar-fill.low` 触发 `barPulse` 动画（2s 循环，50% 透明度）

**核心 CSS**：

```css
#status-bar {
  position: relative;
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.stat-bar-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-pill);
}

.stat-item:nth-child(1) .stat-bar-fill {
  background: var(--stat-color-1, var(--c-brand));
  box-shadow: 0 0 8px var(--stat-color-1, var(--c-brand-glow));
}
```

### 4.3 叙事区域 (Narrative Area)

**文字样式**：
- 字体：`var(--font-display)`（衬线体，文学感）
- 字号：`var(--text-base)` (14px)，移动端 `var(--text-sm)` (12px)
- 行高：`var(--leading-narrative)` (1.85)
- 颜色：`var(--c-text-primary)`
- 内边距：`var(--space-5)` (20px)
- 背景：`var(--c-bg-surface)`，圆角 `var(--radius-lg)` (12px)
- 最小高度：`120px`
- `white-space: pre-wrap` 保留换行

**进入动画**：`fadeIn` 关键帧，`var(--duration-slow)` + `var(--ease-out-expo)`

**章节指示器**：
- 位于叙事区域顶部，图标 + 文字，使用 `--font-display` + `--text-sm`
- 底部 `1px solid var(--c-border-subtle)` 分隔线
- 颜色：`var(--c-brand)`

**对话行样式**：
- 左侧 3px 品牌色竖线
- 斜体，次要文字色
- 说话者名：正常字重，品牌色

**核心 CSS**：

```css
#narrative-text {
  font-family: var(--font-display);
  font-size: var(--text-base);
  line-height: var(--leading-narrative);
  color: var(--c-text-primary);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  background: var(--c-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border-subtle);
  white-space: pre-wrap;
  min-height: 120px;
  animation: fadeIn var(--duration-slow) var(--ease-out-expo);
}
```

### 4.4 选择按钮 (Choice Buttons)

**默认状态**：
- 毛玻璃背景 + 模糊效果
- 左侧 3px 渐变竖线（`--c-brand-dark` → `--c-brand-light`），不透明度 0.6
- 最小高度 `52px`，内边距 `var(--space-4) var(--space-5)`，左侧额外 `var(--space-6)`
- 间距：`14px` 纵向排列

**Hover 状态**：
- 背景切换为 `--glass-bg-hover`
- 右移 `translateX(6px)`
- 竖线加粗至 `4px`，不透明度提升至 1
- 触发 `--shadow-glow` 辉光

**Selected 状态** (`.choice-selected`)：
- 边框变为品牌色 `--c-brand`
- 背景填充 `--c-brand-glow`
- 缩放 `scale(1.02)`
- 强辉光 `--shadow-glow-strong`

**Disabled 状态**：
- 不透明度 0.4
- `cursor: not-allowed`，禁止 transform
- 竖线不透明度降至 0.2

**选择区域动画**：`fadeSlideUp` 关键帧，从下方 12px 淡入

**核心 CSS**：

```css
.choice-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  padding-left: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  min-height: 52px;
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.choice-btn:hover {
  transform: translateX(6px);
  box-shadow: var(--shadow-glow);
}

.choice-btn.choice-selected {
  border-color: var(--c-brand);
  background: var(--c-brand-glow);
  transform: scale(1.02);
  box-shadow: var(--shadow-glow-strong);
}
```

### 4.5 交互按钮 (Interaction Buttons)

**默认状态**：
- 透明背景，虚线边框 `1px dashed var(--c-border-default)`
- 网格布局：`grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`
- 最小高度 `72px`，居中排列图标 + 文字
- 图标 `22px`，品牌色，不透明度 0.7
- 文字 `var(--text-sm)`，次要文字色

**Hover 状态**：
- 虚线变实线，边框变为 `--c-border-brand`
- 上移 `translateY(-2px)`，阴影 `--shadow-sm`
- 图标放大 `scale(1.1)`，不透明度 1

**Disabled 状态**：
- 不透明度 0.3，虚线变点线 `dotted`
- 灰度滤镜 `filter: grayscale(0.6)`

**探索中状态** (`.exploring`)：
- 不透明度 0.5，禁止交互
- 文字后追加 12px 旋转加载器（`spinLoader` 动画，0.8s 线性循环）

**核心 CSS**：

```css
.interaction-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--c-border-default);
  background: transparent;
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  min-height: 72px;
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.interaction-btn:hover {
  border-style: solid;
  border-color: var(--c-border-brand);
  transform: translateY(-2px);
}
```

### 4.6 背包面板 (Inventory Panel)

**面板结构**：
- 固定右侧滑出抽屉：`position: fixed; right: 0; width: 340px; height: 100dvh`
- z-index: `var(--z-overlay)` (400)
- 毛玻璃背景 + `backdrop-filter: blur(var(--glass-blur-heavy))` (28px)
- 关闭时 `translateX(100%)`，打开时 `translateX(0)`
- 遮罩层 `#inventory-backdrop`：`rgba(0, 0, 0, 0.4)`

**切换按钮**：
- 固定右下角：`position: fixed; bottom: var(--space-6); right: var(--space-6)`
- 52px 正方形，毛玻璃样式
- 右上角 badge：品牌色背景，显示物品数量

**分类筛选 Tabs**：
- 药丸形按钮行，支持横向滚动
- 激活态：`--c-brand-glow` 背景 + `--c-brand` 边框

**物品卡片**：
- 横向排列：图标 (20px, 品牌色) + 名称 + 数量
- 背景极淡白 `rgba(255, 255, 255, 0.03)`
- Hover 右移 `translateX(-2px)`

**核心 CSS**：

```css
#inventory-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  height: 100dvh;
  z-index: var(--z-overlay);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-heavy));
  border-left: 1px solid var(--glass-border);
  transform: translateX(100%);
  transition: transform var(--duration-slow) var(--ease-out-expo);
}
```

### 4.7 通知系统 (Notifications)

**容器**：
- 固定右上角：`position: fixed; top: var(--space-6); right: var(--space-6)`
- z-index: `var(--z-toast)` (600)
- 最大宽度 `320px`，纵向排列，间距 `var(--space-2)`

#### 类型 1：stat-change-card（数值变化卡片）

- 背景：`var(--c-bg-elevated)`，非毛玻璃
- 布局：图标 (28px 圆角方块) + 标签 + 变化量
- 顶部辉光线：
  - positive：绿色渐变 `var(--c-state-success)` + box-shadow 辉光
  - negative：红色渐变 `var(--c-state-error)` + box-shadow 辉光
- 变化量字体：`var(--text-base)` (14px)，字重 600，`font-variant-numeric: tabular-nums`
- 进入动画：`statCardIn`（从右侧 40px 滑入 + 60% 处轻微回弹）

#### 类型 2：notification toast（文本通知）

- 毛玻璃背景 + 模糊效果
- 左侧 2px 色条：标识 tone 类型
- 布局：图标 (28px 圆角方块) + 文本
- 进入动画：`notifSlideIn`（从上方 12px 淡入 + 缩放）

#### 4 种 Tone

| Tone | 左侧色条颜色 | 图标背景色 | 图标颜色 |
|------|-------------|-----------|---------|
| `positive` | `var(--c-state-success)` `#4ade80` | `rgba(74, 222, 128, 0.1)` | `var(--c-state-success)` |
| `negative` | `var(--c-state-error)` `#f87171` | `rgba(248, 113, 113, 0.1)` | `var(--c-state-error)` |
| `neutral` | `var(--c-brand)` | `var(--c-brand-glow)` | `var(--c-brand)` |
| `info` | `var(--c-state-info)` `#60a5fa` | `rgba(96, 165, 250, 0.1)` | `var(--c-state-info)` |

#### 堆叠效果

- 第 2 项：`opacity: 0.7; transform: scale(0.97)`
- 第 3 项：`opacity: 0.5; transform: scale(0.94)`
- 退出动画：`translateX(40px) scale(0.95)` 淡出

**核心 CSS**：

```css
#notifications {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-toast);
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat-change-card::before {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
}

.stat-change-card.positive::before {
  background: linear-gradient(90deg, transparent, var(--c-state-success), transparent);
  box-shadow: 0 0 12px var(--c-state-success);
}

.notification::before {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
}
```

### 4.8 菜单系统 (Menu)

**叠加层**：
- 全屏 `position: fixed; inset: 0`
- z-index: `var(--z-overlay)` (400)
- 背景 `rgba(0, 0, 0, 0.6)` + `backdrop-filter: blur(4px)`
- 淡入淡出：`var(--duration-slow)` + `var(--ease-in-out)`

**面板**：
- 居中卡片：`width: 360px; max-width: 90vw`
- 毛玻璃 + 28px 重度模糊
- 打开动画：`scale(0.95) translateY(12px)` → `scale(1) translateY(0)`（使用 `--ease-out-back` 回弹）
- 内边距 `var(--space-8)` (32px)

**菜单项列表**：
- 纵向排列，间距 `var(--space-2)`
- 每项：图标 (20px, 品牌色 70% 不透明) + 文字，左对齐
- Hover：右移 `translateX(4px)`，背景淡白

**题材切换器**：
- 药丸形按钮组，`flex-wrap: wrap`
- 激活态：品牌色填充背景 + 粗体

**测试入口**（4 个按钮）：
1. 测试转场动画
2. 测试交互流程
3. 测试 VFX 特效
4. 测试通知弹窗

**核心 CSS**：

```css
.menu-panel {
  width: 360px;
  max-width: 90vw;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow-lg);
  padding: var(--space-8);
  transform: scale(0.95) translateY(12px);
  transition: transform var(--duration-slow) var(--ease-out-back);
}

.genre-pill.active {
  background: var(--c-brand);
  color: var(--c-bg-base);
  border-color: var(--c-brand);
  font-weight: var(--weight-bold);
}
```

### 4.9 立绘/头像系统 (Portrait/Avatar)

#### 全身立绘 (Portrait Stand)

- `position: fixed; bottom: 30vh; left: 50%; transform: translateX(-50%)`
- z-index: `var(--z-base)` (1)
- 高度 `380px`，最大 `55vh`，宽度自适应
- 投影：`drop-shadow(0 0 30px rgba(0, 0, 0, 0.5))`

**进出动画**：
- 进入 (`.entering`)：`opacity: 0; translateY(20px) scale(0.97)`
- 可见 (`.visible`)：`opacity: 1; translateY(0) scale(1)`
- 退出 (`.exiting`)：`opacity: 0; translateY(-15px) scale(1.02)`

#### 角色名标签

- 立绘底部居中，毛玻璃药丸形
- 字号 `var(--text-xs)` (10px)，品牌色，大写字母间距 1.5px

#### 对话头像 (Dialogue Avatar)

- 48px 圆形，品牌色边框 (2px)
- 辉光：`0 0 12px var(--c-brand-glow)`
- 说话中脉冲动画 `avatarPulse`：2s 循环，辉光 12px → 24px

#### 对话块 (Dialogue Block)

- 头像 + 对话体横向排列，间距 `var(--space-4)` (16px)
- 无头像时：左侧 3px 品牌色竖线 + 圆角背景
- 进入动画 `dialogueIn`：从下方 8px 淡入

**核心 CSS**：

```css
#portrait-stand {
  position: fixed;
  bottom: 30vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-base);
}

.portrait-stand-img {
  height: 380px;
  max-height: 55vh;
  filter: drop-shadow(0 0 30px rgba(0, 0, 0, 0.5));
}

.dialogue-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--c-border-brand);
  box-shadow: 0 0 12px var(--c-brand-glow);
}

.dialogue-avatar.speaking {
  animation: avatarPulse 2s ease infinite;
}
```

### 4.10 存档/读档系统 (Save System)

**叠加层**：
- 全屏固定，`rgba(0, 0, 0, 0.7)` + `backdrop-filter: blur(12px)`
- z-index: `var(--z-modal)` (500)

**面板**：
- 宽度 `580px; max-width: 92vw; max-height: 80vh`
- 面板进入：`translateY(20px) scale(0.97)` → `translateY(0) scale(1)`

**头部**：
- 标题 + 存档/读档 tab 切换（药丸形按钮） + 关闭按钮 (32px)

**存档槽位网格**：
- `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`
- 每个槽位包含：
  - 缩略图区域：`100px` 高，圆角 `var(--radius-md)` (8px)
  - 槽位信息：编号（品牌色）+ 元数据（章节、时间）
- 选中态：品牌色边框 + `0 0 0 1px` 外环 + 辉光
- 空槽位：文字弱化

**底部操作栏**：
- 删除按钮：危险红色样式
- 取消按钮：次要样式
- 确认按钮：品牌色填充，hover 时 `brightness(1.15)` + 辉光

**核心 CSS**：

```css
.save-panel {
  background: var(--c-bg-surface);
  border: 1px solid var(--c-border-default);
  border-radius: var(--radius-xl);
  width: 580px;
  max-width: 92vw;
  max-height: 80vh;
  transform: translateY(20px) scale(0.97);
  transition: transform var(--duration-slow) var(--ease-out-expo);
}

.save-slot.selected {
  border-color: var(--c-brand);
  box-shadow: 0 0 0 1px var(--c-brand), var(--shadow-glow);
}
```

### 4.11 成就系统 (Achievements)

**面板结构**：
- 面板尺寸：`600px; max-width: 92vw; max-height: 80vh`
- 头部统计：已解锁数（大号品牌色）+ 进度条 (4px) + 总数
- 分类 tabs：药丸形按钮，支持横向滚动（修炼/战斗/侦探/生存/宫廷/权谋/收集/挑战）
- 成就列表：纵向排列，间距 `var(--space-3)` (12px)

**成就项结构**：
- 图标 (44px 圆角方块) + 信息区（名称 + 描述 + 进度条 + 稀有度 badge + 解锁时间）

**3 种稀有度**：

| 稀有度 | badge 颜色 | 图标背景 | 图标边框 | 进度条颜色 |
|--------|-----------|---------|---------|-----------|
| 普通 (common) | `--c-text-muted` | 虚线边框 + 极淡白背景 | 虚线 | `--c-brand` |
| 稀有 (rare) | `--c-state-info` `#60a5fa` + `rgba(96, 165, 250, 0.08)` | `rgba(96, 165, 250, 0.12)` | `rgba(96, 165, 250, 0.2)` | `--c-state-info` |
| 传说 (legendary) | `--c-state-warning` `#fbbf24` + `rgba(251, 191, 36, 0.08)` | `rgba(251, 191, 36, 0.12)` | `rgba(251, 191, 36, 0.2)` | `--c-state-warning` |

**解锁 Toast**：
- 屏幕正中弹出，z-index `calc(var(--z-modal) + 100)` (600)
- 圆形图标 (64px) + `achieveGlow` 脉冲动画（2s 循环）
- 标签 + 名称 + 描述
- 缩放动画：`scale(0.8)` → `scale(1)`

**核心 CSS**：

```css
.achievement-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
}

.achievement-item.unlocked.rare .achievement-icon {
  background: rgba(96, 165, 250, 0.12);
  color: var(--c-state-info);
  border-color: rgba(96, 165, 250, 0.2);
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.15);
}

.achievement-rarity.legendary {
  color: var(--c-state-warning);
  background: rgba(251, 191, 36, 0.08);
}
```

### 4.12 结局系统 (Endings)

**面板结构**：
- 面板尺寸：`560px; max-width: 92vw; max-height: 80vh`
- 头部：标题 + 统计（已达成 X / Y 个结局）
- 结局列表：纵向排列，间距 `var(--space-4)` (16px)
- 底部：mini dot 追踪器

**结局项结构**：
- 左侧状态圆点 (44px 圆形) + 右侧信息（名称 + 描述 + 类型标签）

**6 种结局类型标签**：

| 类型 | CSS 类名 | 文字颜色 | 背景色 |
|------|---------|---------|--------|
| 真结局 | `.true-ending` | `#fbbf24` | `rgba(251, 191, 36, 0.12)` |
| 暗结局 | `.dark-ending` | `#f87171` | `rgba(248, 113, 113, 0.1)` |
| 感情线 | `.romance-ending` | `#f472b6` | `rgba(244, 114, 182, 0.1)` |
| 中立 | `.neutral-ending` | `var(--c-text-secondary)` | `rgba(255, 255, 255, 0.06)` |
| 高贵 | `.noble-ending` | `#60a5fa` | `rgba(96, 165, 250, 0.1)` |
| 隐藏 | `.hidden-ending` | `#a78bfa` | `rgba(167, 139, 250, 0.1)` |

**隐藏结局特殊处理**：
- 名称显示为斜体，`--c-text-muted` 色
- 描述文字 `filter: blur(4px)` + `user-select: none`
- 状态圆点边框为虚线

**当前进行中结局**：
- 状态圆点脉冲动画 `endingDotPulse`：2s 循环，辉光 4px → 14px

**Mini Dot 追踪器**：
- 10px 圆点，横向排列
- 未解锁：`--c-border-default`
- 已解锁：`--c-brand` + 辉光
- 进行中：`--c-brand-dark` + 脉冲动画

**核心 CSS**：

```css
.ending-item.hidden .ending-desc {
  filter: blur(4px);
  user-select: none;
}

.ending-tag.type.true-ending {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
}

.ending-mini-dot.unlocked {
  background: var(--c-brand);
  border-color: var(--c-brand);
  box-shadow: 0 0 6px var(--c-brand-glow);
}
```

### 4.13 章节导航 (Chapter Navigation)

**布局**：
- 居中排列，间距 `var(--space-3)` (12px)
- 上下内边距 `var(--space-4)` (16px)

**章节圆点**：
- 默认：`10px` 圆形，`1.5px` 边框，`--c-border-default`
- 已完成：品牌色填充，不透明度 0.6，hover 时 1.0 + 放大 1.2 倍
- 当前章节：`12px`（略大），品牌色填充 + 双层辉光 + `dotPulse` 脉冲动画 (2.5s)
- 未解锁：不透明度 0.3

**连接线**：
- `24px` 宽，`1px` 高
- 已完成段落：品牌色，不透明度 0.3

**Tooltip**：
- hover 时显示章节名称（通过 `data-label` 属性 + `::after` 伪元素）

**核心 CSS**：

```css
.chapter-dot.current {
  width: 12px;
  height: 12px;
  background: var(--c-brand);
  border-color: var(--c-brand);
  box-shadow: 0 0 10px var(--c-brand-glow), 0 0 20px var(--c-brand-glow);
  animation: dotPulse 2.5s infinite;
}

.chapter-connector {
  width: 24px;
  height: 1px;
  background: var(--c-border-subtle);
}
```

---

## 5. VFX 视觉特效

### 5.1 章节转场动画（1.5 秒统一时长）

转场覆盖层：`position: fixed; inset: 0; z-index: var(--z-transition)` (9999)，背景色 `rgba(15, 15, 25, 0.95)`

#### 修仙：水墨晕开 (inkSpread)

从中心点向外扩散的金色径向渐变，模拟墨汁在水中晕开的效果：
- 0%：金色光点出现
- 20%：金色光环扩展至 70% 半径，背景深色渗透
- 50%：墨色主导，金色边缘淡化至 80%
- 80%：整体开始消退
- 100%：完全透明

#### 恐怖：画面撕裂 (tearIn)

使用 `clip-path: polygon()` 实现画面撕裂效果：
- 0%：画面不可见
- 30%：红色画面从左撕裂至 95%
- 50%：全屏暗红色覆盖
- 80%：右侧开始撕裂消失
- 100%：完全透明

#### 悬疑：打字机 (typewriterFlash)

模拟老式打字机屏幕闪烁效果：
- 0%：透明
- 10%：蓝灰色背景闪烁
- 30%-70%：间歇闪烁，模拟文字输入节奏
- 90%-100%：渐隐消失

#### 末日：噪点闪烁 (noiseStatic)

使用 `repeating-conic-gradient` 模拟 CRT 噪点：
- 0%：透明，20px 网格噪点
- 15%-50%：不同密度、不同颜色的噪点快速切换
- 70%-100%：渐隐消失

#### 宫斗：帷幕拉开 (curtainOpen)

使用线性渐变模拟左右帷幕向两侧拉开：
- 0%：深红色帷幕完全闭合
- 50%：帷幕拉开至 30%-70% 区域
- 100%：完全透明，帷幕消失

#### 新章节标题

- 居中显示于覆盖层上方
- 字体：`var(--font-display)`，字号 `var(--text-2xl)` (28px)
- 颜色：`var(--c-brand-light)`，文字阴影 `0 0 30px var(--c-brand-glow-strong)`
- 动画 `chapterTitleFade`：2 秒淡入淡出
  - 0%：透明，上移 5%
  - 15%-70%：完全可见
  - 100%：透明，下移 5%

### 5.2 题材专属粒子效果

粒子基类 `.vfx-particle`：
- `position: absolute; border-radius: 50%`
- `pointer-events: none`
- `will-change: transform, opacity`（GPU 加速）

#### 修仙：灵气粒子 (breakthrough)
金色光点上升飘散，模拟灵气聚集

#### 恐怖：恐惧闪屏 (scare)
红色闪烁 + 扭曲效果

#### 悬疑：线索闪光 (clue)
绿色扫描光效

#### 末日：资源警告 (warning)
橙色闪烁警告

#### 宫斗：金色闪烁 (sparkle)
金色粒子闪耀

### 5.3 VFX 触发条件

| VFX 类型 | 触发时机 |
|---------|---------|
| 章节转场动画 | 选择剧情选项后 / 手动触发（测试按钮） |
| 灵气粒子 (breakthrough) | 修为提升突破时 |
| 恐惧闪屏 (scare) | 理智值过低或遭遇惊吓事件时 |
| 线索闪光 (clue) | 发现新线索时 |
| 资源警告 (warning) | 食物/饮水等 gauge 资源低于阈值时 |
| 金色闪烁 (sparkle) | 圣宠/魅力提升时 |
| 低理智扭曲 (sanityDistortion) | 恐怖题材理智值过低，叙事区域 blur + contrast + hue-rotate |
| 资源低值闪烁 (resourceBlink) | 末日题材资源 gauge 低值，1s 循环闪烁 |
| 线索高亮扫描 (clueSweep) | 悬疑题材发现线索，绿色横向扫描光 |
| 危险暗角 (danger-active) | 恐怖题材危险状态，`inset 0 0 120px` 暗角，2s 淡入 |

---

## 6. 交互流程

### 6.1 选择确认流程

```
1. 玩家点击某个选择按钮
2. 其他按钮添加淡出/禁用效果 (choice-disabled)
3. 播放转场动画（1.5秒，使用当前题材专属动画）
4. 转场过程中居中显示新章节标题（2秒淡入淡出）
5. 动画进行到约 750ms 时，处理数值变化
6. 动画完成后，淡入新叙事文本 (fadeIn 动画)
7. 弹出数值变化通知 (stat-change-card)
```

### 6.2 交互探索流程

```
1. 玩家点击交互按钮
2. 按钮进入"探索中"状态：不透明度 0.5 + 旋转加载器
3. 等待 2 秒
4. 显示探索结果文本（"新发现！" / "深入探索..."）
5. 弹出数值变化通知 (stat-change-card)
6. 按钮恢复可用状态（可重复交互）
7. 如有物品消耗，自动扣减背包物品
```

### 6.3 题材切换流程

```
1. 玩家在菜单中点击题材 pill 按钮
2. 触发转场动画（当前题材动画）
3. 更新 #game-root 的 data-genre 属性
4. CSS 变量级联更新（通过 [data-genre="xxx"] 选择器）
5. 重新渲染所有题材相关内容：
   - 属性名称和进度条颜色
   - 交互按钮列表
   - 背包分类和物品
   - 章节导航
   - 叙事文本
6. VFX 粒子系统切换为对应题材特效
7. 场景视口边框辉光更新
```

---

## 7. 测试入口

菜单中提供 4 个测试按钮（位于菜单列表底部分隔线下方）：

| 测试按钮 | 功能 | 触发方法 |
|---------|------|---------|
| 测试转场动画 | 触发当前题材的章节转场动画 | `themeEngine._testChapterTransition()` |
| 测试交互流程 | 模拟点击交互按钮的完整流程 | `uiController._testInteractionFlow()` |
| 测试 VFX 特效 | 触发当前题材的粒子特效 | `uiController._testVFX()` |
| 测试通知弹窗 | 连续展示 5 种通知 | `uiController._testNotifications()` |

此外菜单中还提供：
- **色盲辅助**：切换 `colorblind-mode` 类，显示数值旁的色盲符号
- **背景音乐 / 音效**：开关 BGM 和 SFX

---

## 8. 响应式设计

### 关键断点

| 断点 | 适配内容 |
|------|---------|
| `<= 768px` | 状态栏 padding 缩小、属性网格列宽降至 150px、叙事文字 12px、选择按钮 padding 缩小、交互按钮网格 minmax 110px、通知全宽、存档槽位单列、场景视口比例 21:9、立绘高度 260px/40vh、对话头像 40px |
| `<= 480px` | 交互按钮固定 3 列、通知移至底部（距底部 64px）、背包面板全宽、菜单面板 padding 缩小、场景视口圆角 8px |

### 移动端适配策略

- **状态栏**：padding 从 `16px 20px` 缩减为 `12px 16px`
- **场景视口**：宽高比从 `16:9` 变为 `21:9`（更窄），适配竖屏手机
- **叙事区域**：字号从 14px 降至 12px，padding 从 20px 降至 16px
- **选择按钮**：字号降至 12px，间距从 14px 降至 10px
- **交互按钮**：网格最小列宽从 140px 降至 110px；480px 以下固定 3 列
- **通知**：768px 以下全宽；480px 以下移至屏幕底部
- **背包面板**：480px 以下宽度 100%，全屏抽屉
- **章节导航**：480px 以下间距缩至 8px，连接线宽度缩至 16px
- **立绘**：768px 以下高度 260px / max-height 40vh
- **对话头像**：768px 以下从 48px 缩至 40px
- **题材按钮**：横向滚动

---

## 9. 性能约束

| 约束项 | 说明 |
|--------|------|
| **粒子上限** | 同屏粒子数量 <= 10 个 |
| **GPU 加速动画** | 所有动画仅使用 `transform` 和 `opacity` 属性（避免触发布局重排） |
| **粒子 will-change** | `.vfx-particle` 声明 `will-change: transform, opacity` |
| **模糊性能** | 毛玻璃效果使用 `backdrop-filter: blur()`，重度模糊 28px 仅用于大面板（菜单、背包） |
| **localStorage 存档** | 存档数据存储于 localStorage，注意存储配额限制（通常 5-10MB） |
| **图片懒加载** | 场景图片使用 `object-fit: cover` + 过渡动画 |
| **无障碍** | 所有交互元素提供 `aria-label`，通知区域使用 `aria-live="polite"` |
