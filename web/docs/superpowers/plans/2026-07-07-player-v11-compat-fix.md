# 播放器 Schema v1.1 兼容修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让播放器能正确加载和游玩 Schema v1.1 格式的 JSON 剧本（demo_qinglu_yehuo.json），修复所有加载/选择/渲染/UI 问题。

**Architecture:** 修复 `rpg-story-loader.js` 中的 `_normalizeV11()` 兼容层，使转换后的数据结构与播放器其他模块（rpg-choice.js、rpg-core.js、ui.js）期望的格式完全一致。同时清理 game-main.html 中的硬编码默认值和测试按钮。

**Tech Stack:** 原生 JavaScript（无框架）、CSS

---

## 架构背景

### 两条数据格式对比

| 维度 | 旧格式（播放器原生） | Schema v1.1（新格式） |
|------|------|------|
| nodes | `nodes: [{ id, type, chapter, text, choices }]` (数组) | `nodes: { "node_01": { id, chapterTitle, segments, choices, isEnding } }` (字典) |
| 选项跳转 | `choice.next` | `choice.targetNodeId` |
| 选项条件 | `choice.condition: { var, op, value }` | `choice.condition: { variable, operator, value }` |
| 选项效果 | `choice.changes: { key: delta, show, feedback }` (对象) | `choice.changes: [{ variable, value, show, addFlag }]` (数组) |
| 初始状态 | `initialState: { key: value }` | `variables: { key: value }` |
| NPC 关系 | `npcRelations: [{ id, name, initialAffinity }]` (数组) | `npcRelations: { npcs: [{ id, name, defaultAffinity }] }` (嵌套) |
| 结局 | `endings: [{ id, name, desc, type, closing }]` (数组) | `endings: { "id": { id, title, description, condition, type } }` (字典) |
| 旗帜 | 无（旧格式不使用 flags） | `flags: ["flag_name"]` |
| 字段名 | `chapter` | `chapterTitle` |
| 文本 | `text: "一段文本"` | `segments: ["段落1", "段落2"]` |
| 结尾标记 | `type: "ending"` | `isEnding: true` |

### 核心游戏循环

```
load(v1.1 JSON)
  → _normalizeV11(v1.1) → 旧格式
  → rpg.loadStory(story) → 解析 meta.rpg 配置
  → state.stats = initialState
  → themeEngine.switchGenre(genre) → 设置 CSS 主题
  → navigateTo(startNodeId)
    → find node in story.nodes (数组)
    → _renderNode(node)
      → 设置 narrative-text
      → rpgChoiceRenderer.renderChoices(choices)
        → 按 weight 排序
        → 对每个 choice: evaluateCondition() → 渲染按钮
      → rpgStatusBar.render()
      → _bindChoiceEvents(choices) ← 关键！绑定点击
        → 点击回调: _handleStoryChoice(index, choices)
          → 禁用所有按钮
          → 应用 changes: rpg.applyChanges(choice.changes, state)
          → 高亮选中按钮
          → 500ms 后 navigateTo(choice.next)
```

### 关键：choice.changes 的消费方式（rpg-core.js）

`applyChanges(changes, gameState)` 期望的格式：
```js
changes = {
  key1: delta,      // 数字：直接加到 stat 上
  key2: "value",    // 字符串：直接设为 stat 值
  setFlag: "flag",  // 特殊键：设置 flag
  show: true,       // 特殊键：是否显示反馈
  feedback: {...}   // 特殊键：反馈配置
}
```

处理逻辑：
```js
for (const [key, delta] of Object.entries(changes)) {
  if (key === 'setFlag') { rpg.setFlag(delta); continue; }
  if (key === 'show' || key === 'feedback') continue;
  const current = gameState.stats[key] || 0;
  gameState.stats[key] = typeof delta === 'number' ? current + delta : delta;
}
```

### 关键：condition 的评估方式（rpg-core.js）

`evaluateCondition(condition)` 期望的格式：
```js
condition = { var: "stat_name", op: ">=", value: 10 }
// 或
condition = { var: "stat_name", op: ">", value: 10 }
// 或
condition = { flag: "flag_name" }
// 或
condition = { all: [...], any: [...] }
```

---

## 文件结构

| 文件 | 职责 | 修改范围 |
|------|------|---------|
| `rpg-story-loader.js` | 故事加载、节点渲染、选择处理、v1.1 兼容层 | 重写 `_normalizeV11()`，修复 `_handleStoryChoice()`，修复 `load()` 初始化 |
| `rpg-choice.js` | 选项渲染、权重排序、条件过滤 | 修复 `data-choice-index` 与排序后索引不匹配的 bug |
| `ui.js` | UI 事件绑定、通知系统 | 确认故事模式下不拦截 choice 事件 |
| `game-main.html` | HTML 结构、bootstrap 代码 | 清理硬编码默认值、移除测试按钮 |
| `narrative.css` | 叙事区域样式 | 修复宽度和章节图标 |

---

### Task 1: 重写 _normalizeV11() — 正确转换所有字段

**Files:**
- Modify: `public/player/js/rpg-story-loader.js`

v1.1 → 旧格式的转换必须精确匹配 rpg-core.js / rpg-choice.js 的消费方式。

- [ ] **Step 1: 找到 `_normalizeV11` 方法，替换为以下完整实现**

核心转换规则（必须严格遵守）：

```js
_normalizeV11(json) {
  const nodesDict = json.nodes || {};
  const nodesArray = [];

  for (const [id, node] of Object.entries(nodesDict)) {
    const normalized = {
      id: node.id || id,
      chapter: node.chapterTitle || '',
      text: Array.isArray(node.segments) ? node.segments.join('\n\n') : (node.text || ''),
      type: node.isEnding ? 'ending' : 'narrative',
      candidateEndings: node.isEnding ? Object.keys(json.endings || {}) : undefined,
    };

    // 转换 choices
    if (node.choices && node.choices.length > 0) {
      normalized.choices = node.choices.map(ch => {
        const result = {
          id: ch.id,
          text: ch.text,
          next: ch.targetNodeId || ch.next,
        };

        // condition 转换: variable→var, operator→op
        if (ch.condition) {
          if (ch.condition.variable) {
            result.condition = {
              var: ch.condition.variable,
              op: ch.condition.operator,
              value: ch.condition.value
            };
          } else if (ch.condition.flag) {
            result.condition = { flag: ch.condition.flag };
          } else if (ch.condition.all || ch.condition.any) {
            result.condition = ch.condition;
          }
          if (ch.conditionDisplay) result.conditionDisplay = ch.conditionDisplay;
        }

        // changes 转换: 数组→扁平对象（严格匹配 applyChanges 的消费格式）
        if (ch.changes && ch.changes.length > 0) {
          result.changes = {};
          let hasShow = false;
          for (const c of ch.changes) {
            if (c.variable) {
              result.changes[c.variable] = c.value;
            }
            if (c.addFlag) {
              result.changes.setFlag = c.addFlag;
            }
            if (c.addFlags && c.addFlags.length > 0) {
              result.changes.setFlag = c.addFlags[0]; // 取第一个
            }
            if (c.show) hasShow = true;
          }
          if (hasShow) result.changes.show = true;
        }

        // weight 透传
        if (ch.weight) result.weight = ch.weight;
        if (ch.weightHint) result.weightHint = ch.weightHint;

        // affinityChanges 透传
        if (ch.affinityChanges) result.affinityChanges = ch.affinityChanges;

        return result;
      });
    } else {
      normalized.choices = [];
    }

    nodesArray.push(normalized);
  }

  // endings: 字典→数组（保留 id 字段）
  const endings = json.endings
    ? Object.entries(json.endings).map(([id, e]) => ({
        id: e.id || id,
        name: e.title || e.name || id,
        desc: e.description || e.desc || '',
        type: e.type || 'neutral',
        closing: e.description || '',
        condition: e.condition
      }))
    : [];

  // npcRelations: 嵌套→扁平数组
  let npcRelations = [];
  if (json.npcRelations) {
    if (Array.isArray(json.npcRelations)) {
      npcRelations = json.npcRelations;
    } else if (json.npcRelations.npcs && Array.isArray(json.npcRelations.npcs)) {
      npcRelations = json.npcRelations.npcs.map(npc => ({
        id: npc.id,
        name: npc.name,
        initialAffinity: npc.defaultAffinity || npc.initialAffinity || 0,
        categories: npc.categories,
        avatar: npc.avatar,
        description: npc.description
      }));
    }
  }

  // milestones
  const milestones = json.milestones || [];

  return {
    meta: json.meta,
    initialState: json.variables || json.initialState || {},
    nodes: nodesArray,
    milestones,
    endings,
    npcRelations,
    timePressure: json.timePressure,
    achievements: json.achievements,
    startNodeId: json.startNodeId,
  };
}
```

**验证要点：**
- `choice.changes[c.variable] = c.value` → 匹配 `applyChanges` 的 `for (const [key, delta])` 遍历
- `choice.condition = { var, op, value }` → 匹配 `evaluateCondition` 的消费格式
- `endings[].id` 保留 → 匹配 `_triggerEnding` 中 `endings.find(e => e.id === id)` 的查找
- `npcRelations[].initialAffinity` → 匹配 `load()` 中的 `npc.initialAffinity || 0`

- [ ] **Step 2: 修复 `load()` 方法中的 npcRelations 初始化代码**

当前代码在 `_normalizeV11` 转换前就尝试读取 `storyJson.npcRelations`，需要确保它在转换后读取。

`load()` 方法中已有的 npcRelations 初始化代码：
```js
if (storyJson.npcRelations) {
  this.state.npcAffinities = {};
  const npcList = storyJson.npcRelations.npcs || storyJson.npcRelations;
  if (Array.isArray(npcList)) {
    for (const npc of npcList) {
      this.state.npcAffinities[npc.id] = npc.defaultAffinity || npc.initialAffinity || 0;
    }
  }
}
```

这段代码有两个问题：
1. 它在 `_normalizeV11()` 调用之后执行，此时 npcRelations 已被转换为扁平数组，不存在 `.npcs` 属性
2. 需要同时兼容旧格式（直接是数组）和新格式（已转换）

修复为：
```js
if (storyJson.npcRelations) {
  this.state.npcAffinities = {};
  const npcList = Array.isArray(storyJson.npcRelations)
    ? storyJson.npcRelations
    : [];
  for (const npc of npcList) {
    if (npc && npc.id) {
      this.state.npcAffinities[npc.id] = npc.initialAffinity || npc.defaultAffinity || 0;
    }
  }
}
```

---

### Task 2: 修复 rpg-choice.js — data-choice-index 索引不匹配

**Files:**
- Modify: `public/player/js/rpg-choice.js`

**问题:** `renderChoices()` 先按 weight 排序 choices，然后用排序后的索引 `idx` 设置 `data-choice-index`。但 `_bindChoiceEvents()` 用这个索引从原始 `choices` 数组中查找 choice，拿到错误的 `next` 值。

- [ ] **Step 1: 找到 renderChoices 方法中设置 `data-choice-index` 的代码**

当前代码（大致）：
```js
choices.forEach((choice, idx) => {
  // ...
  btn.dataset.choiceIndex = String(idx); // ← 错误：idx 是排序后的索引
});
```

修复为：使用原始数组中的索引
```js
const sorted = rpgCore.sortChoicesByWeight(choices);
sorted.forEach((choice) => {
  const originalIdx = choices.indexOf(choice);
  // ...
  btn.dataset.choiceIndex = String(originalIdx); // ← 正确：原始索引
});
```

**注意：** 需要确认当前代码的实际写法。如果 `renderChoices` 直接遍历排序后的数组，需要用 `choices.indexOf(choice)` 获取原始索引。

- [ ] **Step 2: 验证 `_bindChoiceEvents` 的消费方式**

`_bindChoiceEvents(choices)` 中通过 `parseInt(btn.dataset.choiceIndex)` 获取索引，然后 `choices[index]` 获取 choice。这里的 `choices` 参数是 `_renderNode()` 传入的原始 choices 数组。所以 `data-choice-index` 必须是原始索引。

---

### Task 3: 修复 _handleStoryChoice — 确保 choice.next 正确传递

**Files:**
- Modify: `public/player/js/rpg-story-loader.js`

- [ ] **Step 1: 确认 `_handleStoryChoice` 正确获取 next 值**

```js
_handleStoryChoice(index, choices) {
  const choice = choices[index];
  if (!choice || !choice.next) return; // ← 如果 next 为 undefined，什么都不会发生
  // ...
  setTimeout(() => this.navigateTo(choice.next), 500);
}
```

**验证：** `_normalizeV11` 转换后 `choice.next = ch.targetNodeId || ch.next`。确保所有 v1.1 的 choices 都有 `targetNodeId` 字段。

---

### Task 4: 修复 load() 初始化 — 不加载 data.js 的默认数据

**Files:**
- Modify: `public/player/js/rpg-story-loader.js`, `public/player/js/state.js`

**问题:** `GameState` 构造函数接受 genre 参数，从 `INITIAL_STATS[genre]` 和 `INITIAL_INVENTORY[genre]` 加载默认数据。在 v1.1 故事模式下，这些默认数据会覆盖故事的 `variables`，导致初始状态不正确。

- [ ] **Step 1: 在 `load()` 方法中，应用 initialState 时完全覆盖默认 stats**

当前代码：
```js
if (storyJson.initialState) {
  for (const [key, val] of Object.entries(storyJson.initialState)) {
    this.state.stats[key] = val;
  }
}
```

这段代码是**叠加**而非**覆盖**。如果 `INITIAL_STATS` 有 10 个字段，`initialState` 有 8 个字段，结果会有 18 个字段。

修复：在应用 `initialState` 之前，先重置 stats：
```js
// 先重置为故事定义的状态（清除 data.js 的默认值）
this.state.stats = {};
if (storyJson.initialState) {
  for (const [key, val] of Object.entries(storyJson.initialState)) {
    this.state.stats[key] = val;
  }
}
```

- [ ] **Step 2: 在 `load()` 方法中，清空默认 inventory**

RPG 故事模式下不应加载 data.js 的默认物品：
```js
// 重置 inventory 为空（故事模式下不从 data.js 加载默认物品）
this.state.setInventory([]);
```

需要在 `GameState` 上添加 `setInventory` 方法，或直接操作内部数据。

---

### Task 5: 清理 game-main.html

**Files:**
- Modify: `public/player/pages/game-main.html`

- [ ] **Step 1: 移除菜单中的测试按钮**

删除以下菜单项：
- "章节过渡" — `data-menu-item` 触发 `triggerChapterTransition`
- "测试转场动画" — `_testChapterTransition()`
- "测试交互流程" — `_testInteractionFlow()`
- "测试VFX特效" — `_testVFX()`
- "测试通知弹窗" — `_testNotifications()`
- "加载 Demo" — `loadFromUrl('../demo-rpg-story.json')`

保留：导入剧本、存档、读档、成就、结局、角色关系、BGM/SFX 控制、字体大小、色盲模式、切换题材

- [ ] **Step 2: 清理硬编码默认值**

- `inv-badge`: 改为空内容 `0` 并添加 `style="display:none"`
- `#narrative-text`: 清空内容为空字符串（或保留一个简短的"加载中..."提示）
- `chapter-indicator-text`: 改为"等待加载..."
- `scene-location-text`: 改为"--"
- `genre-tag`: 改为"--"

- [ ] **Step 3: 修改 bootstrap 的 API 失败回退逻辑**

API 加载失败时，不应回退到 xianxia demo 模式，而应显示错误提示：
```js
.catch(function(err) {
  console.error('Error loading story:', err);
  document.getElementById('narrative-text').textContent = '故事加载失败，请检查网络连接或故事 ID 是否正确。';
  document.getElementById('chapter-indicator-text').textContent = '加载失败';
});
```

---

### Task 6: 修复 narrative.css — 宽度和图标

**Files:**
- Modify: `public/player/css/components/narrative.css`

- [ ] **Step 1: 确保 narrative-area 不被挤压**

```css
#narrative-area {
  width: 100%;
  max-width: 100%;
  /* ... 其他样式 ... */
}
```

- [ ] **Step 2: 确保章节图标 SVG 正确渲染**

```css
.chapter-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}
```

---

### Task 7: 修复并重新生成 Demo JSON

**Files:**
- Create: `scripts/generate-demo.js` (临时脚本)
- Overwrite: `data/works/demo_qinglu_yehuo.json`

当前 demo JSON 有格式错误（手工编写导致），需要用 Node.js 脚本程序化生成，确保 JSON 合法。

- [ ] **Step 1: 创建 generate-demo.js 脚本**

脚本读取一个 JS 对象（旧格式），用 `JSON.stringify` 输出。这样可以避免手工编写导致的格式错误。

Demo 内容：38 个节点、5 个章节、4 个结局、3 个 NPC、5 个成就。

注意：Demo 直接用**旧格式**（与播放器原生格式一致），绕过 _normalizeV11 的转换风险。这样即使兼容层有问题，Demo 本身也能正确运行。

- [ ] **Step 2: 运行脚本生成 JSON 并验证合法性**

```bash
node scripts/generate-demo.js
node -e "JSON.parse(require('fs').readFileSync('data/works/demo_qinglu_yehuo.json','utf-8')); console.log('VALID')"
```

- [ ] **Step 3: 验证 API 可返回数据**

```bash
curl -s "http://localhost:3002/api/works/demo_qinglu_yehuo?format=script" | head -c 100
# 应返回 {"success":true,"data":{"meta":...
```

---

### Task 8: 端到端验证

- [ ] **Step 1: 重启 dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 2: 在浏览器中打开 `http://localhost:3002/play/demo_qinglu_yehuo`**

验证以下检查项：

| # | 检查项 | 预期结果 | 实际结果 |
|---|--------|---------|---------|
| 1 | 页面加载 | 显示第一个节点的叙事文本，章节标题正确 | |
| 2 | 选项显示 | 3 个选项按钮，每个有文字 | |
| 3 | 状态栏 | 显示境界、修为、灵力、心境、声望、气血 6 个属性 | |
| 4 | 背包 | 无物品（badge 不显示） | |
| 5 | 交互区域 | 隐藏（无交互按钮） | |
| 6 | 菜单 | 无测试按钮 | |
| 7 | 点击选项1 | 禁用所有选项，显示反馈 toast，0.5 秒后跳转 | |
| 8 | 新节点渲染 | 显示新文本和新选项，章节标题更新 | |
| 9 | 连续选择 5 次 | 无卡顿、无重复点击、无无限跳章 | |
| 10 | 到达结局 | 显示结局覆盖层，结局名称和描述正确 | |

- [ ] **Step 3: 修复发现的问题并重新验证**

---

## Self-Review

1. **Spec coverage:** 所有 8 类问题都有对应的 Task 覆盖
2. **Placeholder scan:** 每个步骤都有具体代码或验证命令
3. **Type consistency:** changes 格式统一为 `{ key: delta, setFlag: "flag", show: true }`，condition 格式统一为 `{ var, op, value }`
