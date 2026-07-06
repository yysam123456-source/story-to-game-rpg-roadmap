# Story-to-Game JSON Schema v1.1

**日期**：2026-07-06  
**状态**：🔒 已锁定（Phase 1 交付物 + Phase 2 扩展）  
**覆盖范围**：文学模式（baseline）+ RPG 扩展（meta.rpg / meta.rules / milestones / endings / delayedChanges / interactions / inventory / npcRelations / timePressure / achievements.autoUnlock）

---

## 1. 顶层结构

```json
{
  "meta": {},
  "startNodeId": "node_start",
  "variables": {},
  "flags": [],
  "achievements": {},
  "inventory": {},
  "milestones": [],
  "endings": [],
  "mission": {},
  "npcRelations": {},
  "timePressure": {},
  "nodes": {}
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `meta` | object | ✅ | 作品元信息 |
| `startNodeId` | string | ✅ | 起始节点 ID |
| `variables` | object | ❌ | 自定义变量初始值 |
| `flags` | array\<string\> | ❌ | 已触发的 flag 列表（运行时） |
| `achievements` | object | ❌ | 成就定义 |
| `inventory` | object | ❌ | 背包/资源初始值 |
| `milestones` | array | ❌ | 里程碑定义 |
| `endings` | array | ❌ | 结局定义 |
| `mission` | object | ❌ | 任务信息（无限恐怖/末世类型） |
| `npcRelations` | object | ❌ | NPC 关系网络（v1.1 新增） |
| `timePressure` | object | ❌ | 时间压力/回合机制（v1.1 新增） |
| `nodes` | object | ✅ | 节点字典 |

**兼容性规则**：所有新增字段均为可选。缺失时启动器退回到纯文学模式。

---

## 2. meta

```json
{
  "meta": {
    "title": "青炉夜火",
    "author": "山音",
    "version": "1.0.0",
    "description": "修仙题材互动文游",
    "genre": "xianxia",
    "theme": "paper",
    "ambient": "rain",
    "cover": {
      "label": "修仙·互动文游",
      "tagline": "一炉烟火，半卷仙缘"
    },
    "variableName": "灵力",
    "initialVariable": 35,
    "rpg": {},
    "rules": {}
  }
}
```

### 2.1 meta.genre

声明作品类型，控制 AI Skill 生成策略和播放器 UI 模板。

| 值 | 类型 | 说明 |
|------|------|------|
| `literary` | 普通文学/现实向 | 无 RPG 面板 |
| `xianxia` | 修仙 | 境界 + 修为 + 灵力 |
| `horror` | 无限恐怖/副本生存 | HP + SAN + 点数 |
| `mystery` | 悬疑推理 | 线索 + 怀疑度 |
| `apocalypse` | 末世生存 | 食物 + 药品 + 安全度 |
| `palace` | 宫斗/权谋 | 好感度 + 声望 + 危机值 |
| `custom` | 自定义 | 由 `meta.rpg.primaryStats` 定义 |

### 2.2 meta.theme（弃用，保留兼容）

原 `theme` 字段继续兼容，新稿建议使用 `ambient`。

### 2.3 meta.ambient

环境效果，影响播放器视觉氛围。

| 值 | 效果 |
|------|------|
| `none` | 无环境效果 |
| `rain` | 雨线、潮湿感 |
| `wind` | 风、横向流动 |
| `sea` | 海潮、水面呼吸 |
| `heat` | 热浪、闷热扭曲 |
| `static` | 电流、信号、档案噪声 |

### 2.4 meta.rpg

控制 RPG 展示和交互行为。**整个 `rpg` 对象缺失时，启动器不显示 RPG 面板。**

```json
{
  "meta": {
    "rpg": {
      "enabled": true,
      "conditionDisplay": "disabled",
      "primaryStats": [
        { "key": "realm", "label": "境界", "type": "text" },
        { "key": "cultivation", "label": "修为", "type": "bar", "max": 100 },
        { "key": "qi", "label": "灵力", "type": "bar", "max": 80, "min": 0 }
      ],
      "hiddenStats": ["karma", "tribulationRisk"]
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | ❌ | 是否启用 RPG 展示，默认 `false` |
| `mode` | string | ❌ | `"light"`（轻 RPG，Q3 MVP）或 `"standard"`（标准 RPG，Q4+），默认 `"light"` |
| `conditionDisplay` | string | ❌ | 条件选项展示策略：`"hide"` 或 `"disabled"`，默认 `"disabled"` |
| `primaryStats` | array | ❌ | 玩家可见核心数值，见 §2.5 |
| `hiddenStats` | array\<string\> | ❌ | 可用于条件但不展示的隐藏数值键名列表 |

---

## 2.5 primaryStats 元素

定义顶部状态栏中展示的数值。

```json
{
  "key": "qi",
  "label": "灵力",
  "type": "bar",
  "max": 80,
  "min": 0,
  "tone": "positive"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | ✅ | 对应 `variables` 中的键名 |
| `label` | string | ✅ | UI 展示名 |
| `type` | string | ✅ | `"text"` / `"number"` / `"bar"` |
| `max` | number | ❌ | `bar` 类型最大值，默认 100；`type="bar"` 时必填 |
| `min` | number | ❌ | `bar` 类型最小值，默认 0 |
| `default` | string | ❌ | `type="text"` 时的默认值/初始显示文本，如 `"炼气三层"` |
| `tone` | string | ❌ | `"positive"` / `"danger"` / `"neutral"`，影响 bar 颜色 |

**类型说明**：
- `text`：直接显示 `variables[key]` 的字符串值（如"炼气三层"）
- `number`：显示数值，支持加减
- `bar`：显示进度条，有最大/最小值

---

### 2.6 meta.rules（v1.1 新增）

创作者可自定义的规则预设，控制 AI 生成行为与游戏机制。**整个 `rules` 对象缺失时，引擎使用默认配置，不影响任何现有功能。**

```json
{
  "meta": {
    "rules": {
      "pacing": "balanced",
      "choiceStyle": "direct",
      "statImpact": "medium",
      "hiddenContentRatio": "medium",
      "endingBias": "balanced",
      "narrativePerson": "second",
      "dialogueDensity": "medium",
      "informationAsymmetry": false,
      "timePressure": false,
      "npcRelations": false
    }
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `pacing` | enum | ❌ | `"balanced"` | 选项密度控制：`"compact"`（紧凑，每节点 2-3 选项）、`"balanced"`（平衡，3-4 选项）、`"relaxed"`（舒缓，4-5 选项） |
| `choiceStyle` | enum | ❌ | `"direct"` | 选项写作风格：`"direct"`（直接陈述）、`"inner_monologue"`（内心独白式）、`"action"`（动作导向式） |
| `statImpact` | enum | ❌ | `"medium"` | 数值对玩法的影响程度：`"light"`（轻微）、`"medium"`（中等）、`"heavy"`（重度） |
| `hiddenContentRatio` | enum | ❌ | `"medium"` | 隐藏分支占比：`"low"`（<20%）、`"medium"`（20%-40%）、`"high"`（>40%） |
| `endingBias` | enum | ❌ | `"balanced"` | 结局分布偏好：`"heavy"`（偏重型/史诗感）、`"balanced"`（均衡）、`"dark"`（偏悲剧）、`"random"`（随机分布） |
| `narrativePerson` | enum | ❌ | `"second"` | 叙事人称：`"first"`（第一人称）、`"second"`（第二人称） |
| `dialogueDensity` | enum | ❌ | `"medium"` | 叙事与对话的平衡：`"low"`（重叙事）、`"medium"`（均衡）、`"high"`（重对话） |
| `informationAsymmetry` | boolean | ❌ | `false` | 是否启用信息不对称机制：隐藏条件、误导性选项、需要推理的抉择 |
| `timePressure` | boolean | ❌ | `false` | 是否启用时间压力机制：回合衰减或倒计时 |
| `npcRelations` | boolean | ❌ | `false` | 是否启用 NPC 关系网络系统 |

**向后兼容**：`meta.rules` 完全可选。旧作品无此字段时，引擎按 `"balanced"` / `"direct"` / `"medium"` / `false` 等默认值处理。

---

## 3. variables

沿用现有 `variables` 作为 RPG 状态的主要承载层。

```json
{
  "variables": {
    "realm": "炼气三层",
    "cultivation": 12,
    "qi": 30,
    "daoHeart": 3,
    "karma": 0
  }
}
```

**修仙示例**：
```json
{ "realm": "炼气三层", "cultivation": 12, "qi": 30, "daoHeart": 3, "karma": 0 }
```

**无限恐怖示例**：
```json
{ "hp": 100, "sanity": 70, "points": 0, "teamTrust": 0, "clue": 0, "timeLeft": 6 }
```

---

## 4. flags

运行时标记，记录已触发的事件或选择。

- 添加：`changes.addFlag` 或 `changes.addFlags`
- 移除：`changes.removeFlag`
- 判断：`condition` 中使用 `hasFlag` / `!hasFlag`（字符串格式）或 `{ "flag": "flag_name" }`（对象格式）

**重要 flag（importantFlag）**：标记影响结局走向的关键决定，播放器会短暂浮出提示"重要决定已记录"。

```json
{ "changes": { "importantFlag": { "flag": "saved_master", "label": "救下师父" } } }
```

---

## 5. achievements

```json
{
  "achievements": {
    "first_breakthrough": {
      "title": "初入修行",
      "description": "第一次突破境界。",
      "autoUnlock": {
        "condition": { "variable": "realm", "operator": ">=", "value": 1 },
        "check": "onStatChange"
      }
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 成就标题 |
| `description` | string | ✅ | 成就描述 |
| `autoUnlock` | object | ❌ | 自动解锁配置（v1.1 新增），见 §5.1 |

解锁方式：`changes.unlockAchievement` 或 `changes.unlockAchievements`

### 5.1 achievements.autoUnlock（v1.1 新增）

配置成就的自动解锁条件，无需在 `changes` 中显式触发。

```json
{
  "autoUnlock": {
    "condition": { "variable": "realm", "operator": ">=", "value": 1 },
    "check": "onStatChange"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `condition` | object | ✅ | 自动解锁的触发条件 |
| `check` | enum | ❌ | 检测时机，默认 `"onStatChange"` |

**condition 格式**：
- `variable`：要监控的变量名（对应 `variables` 中的键）
- `operator`：`">="` / `"<="` / `">"` / `"<"` / `"=="` / `"!="`
- `value`：比较值

**check 枚举**：
- `"onStatChange"`：变量变化时检测（默认）
- `"onNodeEnter"`：进入任意节点时检测
- `"onEnding"`：到达结局候选节点时检测
- `"onFlagAdd"`：添加 flag 时检测

**向后兼容**：`autoUnlock` 完全可选。无此字段时成就仍通过 `changes.unlockAchievement` 手动解锁。

---

## 6. nodes

节点字典，键为节点 ID（英文、数字、下划线）。

```json
{
  "nodes": {
    "node_001": {
      "chapterTitle": "第一章：青炉峰",
      "title": "石阶前",
      "scene": {},
      "progress": 5,
      "theme": "paper",
      "ambient": "rain",
      "segments": [],
      "choices": [],
      "next": "node_002",
      "routes": [],
      "isEnding": false,
      "candidateEndings": [],
      "interactions": [],
      "delayedChanges": [],
      "condition": null
    }
  }
}
```

### 6.1 节点字段完整定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chapterTitle` | string | ❌ | 章节标题，只在章节第一个节点设置 |
| `title` | string | ❌ | 场景标题 |
| `scene` | object/string | ❌ | 场景信息，见 §6.2 |
| `progress` | number | ❌ | 进度百分比 0-100 |
| `theme` | string | ❌ | 节点级主题覆盖 |
| `ambient` | string | ❌ | 节点级环境效果覆盖 |
| `segments` | array | ✅ | 叙事段落，见 §6.3 |
| `choices` | array | ❌ | 选项列表，见 §6.4 |
| `next` | string | ❌ | 自动跳转目标节点 ID |
| `routes` | array | ❌ | 自动路由，见 §6.6 |
| `isEnding` | boolean | ❌ | 是否为结局节点，默认 `false` |
| `candidateEndings` | array\<string\> | ❌ | 声明该节点为结局候选节点，见 §10.3 |
| `interactions` | array | ❌ | 场景交互，见 §7 |
| `delayedChanges` | array | ❌ | 延迟变化，见 §8 |
| `condition` | string/object | ❌ | 节点级条件（用于节点是否可到达，高级用法） |

---

### 6.2 scene

告诉玩家当前叙述发生在哪里。

**简写形式**（仅场景名）：
```json
{ "scene": "旧公寓门前" }
```

**完整形式**：
```json
{
  "scene": {
    "id": "qinglu_peak",
    "name": "青炉峰",
    "type": "major",
    "description": "山峰凸起在云海之上，石阶沿着山脊蜿蜒而上。",
    "arrival": "你踏着石阶往上走。",
    "duration": 1900
  }
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ❌ | 场景唯一标识，同一场景跨多个节点时必须一致 |
| `name` | ✅ | 场景名，转场主标题 |
| `type` | ❌ | `"major"`（大场景）或 `"transient"`（过场），默认 `"major"` |
| `description` | ❌ | 稳定环境描写 |
| `arrival` | ❌ | 本次进入场景的动作/叙述 |
| `duration` | ❌ | 转场时长（毫秒） |

---

### 6.3 segments

叙事段落数组。

```json
{
  "segments": [
    { "text": "普通叙述。" },
    { "speaker": "师父", "text": "你今日感应到了什么？" },
    { "speaker": "系统", "text": "旁白内容。", "effect": "breath" },
    { "text": "多特效段落。", "effects": ["glitch", "noise"] }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `text` | 纯文本，不支持 HTML |
| `speaker` | 不写则为普通叙述；为 `系统`/`System`/`旁白`/`Narrator` 时显示为旁白样式 |
| `effect` | 单特效 |
| `effects` | 多特效 |

**特效可选值**：`shake` / `blur` / `noise` / `flash` / `blackout` / `silence` / `pulse` / `breath` / `glitch` / `drown` / `heat` / `cold` / `blood`

---

### 6.4 choices

选项数组。每个选项是一个独立的选择分支。

```json
{
  "choices": [
    {
      "text": "告诉师父真相",
      "next": "node_005",
      "condition": { "var": "qi", "op": ">=", "value": 20 },
      "weight": "critical",
      "weightHint": "此选择将影响后续剧情走向",
      "effect": "flash",
      "changes": {},
      "affinityChanges": [
        { "npcId": "master", "delta": 10 }
      ],
      "countdown": null
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | ✅ | 选项文字 |
| `next` | string | ❌ | 选择后跳转的节点 ID |
| `condition` | string/object | ❌ | 显示条件，见 §13 |
| `weight` | string | ❌ | 叙事权重，见 §6.5 |
| `weightTag` | string | ❌ | 选项旁边的标签文字（如"关键抉择"、"支线影响"），与 `weightHint` 独立 |
| `weightHint` | string | ❌ | 权重提示，鼠标悬停/长按显示 |
| `effect` | string | ❌ | 选项特效 |
| `changes` | object | ❌ | 选择后的状态变化，见 §6.7 |
| `affinityChanges` | array | ❌ | NPC 好感度变化（v1.1 新增），见 §6.4.1 |
| `countdown` | object | ❌ | 选项级倒计时（v1.1 新增），见 §6.4.2 |

**铁律**：选项不能直跳非草率结局，结局前必须有收束节点。

**组合条件示例**（标记关键分歧点）：
```json
{
  "choices": [
    {
      "text": "强行突破",
      "next": "node_death",
      "weight": "critical",
      "condition": { "all": [
        { "var": "realm", "op": "==", "value": "凡人" },
        { "flag": "impulsive" }
      ]}
    }
  ]
}
```

#### 6.4.1 choices.affinityChanges（v1.1 新增）

当 `meta.rules.npcRelations` 为 `true` 时生效，定义选择后对 NPC 好感度的影响。

```json
{
  "affinityChanges": [
    { "npcId": "master", "delta": 10 },
    { "npcId": "rival", "delta": -5 }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `npcId` | string | ✅ | NPC 唯一标识（需在 `npcRelations.npcs` 中定义） |
| `delta` | number | ✅ | 好感度变化量（可为负数） |

#### 6.4.2 choices.countdown（v1.1 新增）

当 `meta.rules.timePressure` 或 `timePressure.enabled` 为 `true` 时生效，为单个选项附加倒计时限制。

```json
{
  "countdown": {
    "seconds": 10,
    "defaultChoiceIndex": 0
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `seconds` | number | ✅ | 倒计时秒数 |
| `defaultChoiceIndex` | number | ❌ | 超时后自动选择的选项索引，默认 `0` |

**节点级 countdown**：也可以在节点上定义 `countdown`，作用于该节点所有选项：
```json
{
  "node_001": {
    "countdown": { "seconds": 15, "defaultChoiceIndex": 0 },
    "choices": [ ... ]
  }
}
```

---

### 6.5 choice.weight

标记选项的叙事权重，用于前端差异化渲染。

| 值 | 说明 | 视觉差异 |
|------|------|----------|
| `critical` | 关键分歧点，影响主线走向 | 品牌色高亮边框 + 辉光 |
| `branch` | 支线影响 | 品牌色竖线 |
| `minor` | 小事 | 默认样式 |
| `cosmetic` | 纯对话变化 | 淡色 |

缺失时默认为 `minor`。

---

### 6.6 routes

自动路由，按数组顺序判断，第一个满足的生效。

```json
{
  "routes": [
    { "condition": { "var": "qi", "op": ">=", "value": 70 }, "next": "ending_clear" },
    { "condition": { "var": "qi", "op": "<", "value": 30 }, "next": "ending_lost" },
    { "condition": "default", "next": "normal_path" }
  ]
}
```

建议最后放 `default` 兜底。

---

### 6.7 changes

状态变化对象，定义选择或交互执行后的状态变更。

```json
{
  "changes": {
    "val": 5,
    "valSet": 50,
    "set": { "qi": 40, "masterTrust": 2 },
    "addFlag": "found_secret",
    "addFlags": ["met_master", "entered_sect"],
    "importantFlag": { "flag": "saved_master", "label": "救下师父" },
    "importantFlags": ["key_decision_1", "key_decision_2"],
    "removeFlag": "flag_name",
    "unlockAchievement": "achievement_id",
    "unlockAchievements": ["id1", "id2"],
    "inventory": { "spirit_stone": -1, "healing_pill": 1 },
    "show": true,
    "feedback": []
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `val` | number | 在主状态值上加减（可为正负） |
| `valSet` | number | 直接设置主状态值 |
| `set` | object | 设置 `variables` 中的键值 |
| `addFlag` | string/object | 添加单个 flag；对象格式：`{ "flag": "flag_name", "label": "友好名称" }` |
| `addFlags` | array | 添加多个 flag；元素可为字符串或对象 |
| `importantFlag` | string/object | 添加重要 flag（显示提示）；对象格式：`{ "flag": "flag_name", "label": "友好名称" }` |
| `importantFlags` | array | 添加多个重要 flag |
| `removeFlag` | string | 移除单个 flag |
| `unlockAchievement` | string | 解锁单个成就 |
| `unlockAchievements` | array | 解锁多个成就 |
| `inventory` | object | 背包变更，见 §12 |
| `show` | boolean | 是否显示变化反馈 Toast，默认 `false` |
| `feedback` | array | 显式变化反馈列表，见 §6.8 |

**兼容性**：旧 JSON 的 `changes.set` 不需要改，继续兼容。

---

### 6.8 changes.feedback

显式定义变化提示，适合需要更文学化展示的场景。

```json
{
  "changes": {
    "feedback": [
      { "label": "灵力", "delta": "+10", "tone": "positive" },
      { "label": "师父信任", "delta": "+2", "tone": "positive" }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 数值名称 |
| `delta` | string | 变化量（含符号，如 `"+10"` / `"-5"`） |
| `tone` | string | `"positive"` / `"negative"` / `"neutral"` |

`feedback` 和 `show: true` 同时使用时，`feedback` 优先展示。

---

## 7. interactions

节点内场景交互，允许玩家在做出主线选择前先探索场景。

```json
{
  "interactions": [
    {
      "id": "inspect_buddha",
      "label": "查看佛像背后",
      "depth": "surface",
      "once": true,
      "condition": null,
      "hint": null,
      "result": {
        "segments": [
          { "text": "佛像背后刻着一行细字：今晚不要答应任何人。" }
        ],
        "changes": {
          "addFlag": { "flag": "found_warning", "label": "发现佛像背后的警告" },
          "set": { "clue": 1 },
          "show": true
        }
      }
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 节点内唯一标识 |
| `label` | string | ✅ | 按钮文字 |
| `depth` | string | ❌ | 探索深度：`"surface"` / `"deep"` / `"ultimate"`，默认 `"surface"` |
| `once` | boolean | ❌ | 是否只能执行一次，默认 `false` |
| `condition` | string/object | ❌ | 执行条件，见 §13 |
| `hint` | object | ❌ | 暗示，见 §7.1 |
| `result.segments` | array | ✅ | 执行后的文本反馈 |
| `result.changes` | object | ❌ | 执行后的状态变化 |

### 7.1 interaction.depth

标记交互的探索深度，决定在不同条件下的显示策略。

| 值 | 说明 | 显示策略 |
|------|------|----------|
| `surface` | 默认。浅层交互，无需任何前置条件 | 始终渲染 |
| `deep` | 深层交互，需要 condition 满足才可执行 | condition 不满足时显示为锁定状态（虚线边框 + 锁图标 + 提示） |
| `ultimate` | 终极交互，需要 condition 满足且可能需要前置 interaction 已完成 | condition 不满足时完全隐藏；满足后以特殊动画显现 |

### 7.2 interaction.hint

用于在条件接近但未完全满足时给玩家暗示。

```json
{
  "hint": {
    "text": "你感觉书架后面似乎有什么东西...",
    "showIf": { "var": "comprehension", "op": ">=", "value": 5 },
    "insertPosition": "after_interaction"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 暗示文本 |
| `showIf` | object | 显示条件（与 `condition` 不同，条件更宽松） |
| `insertPosition` | string | `"after_interaction"` / `"before_choice"` / `"in_narrative"` |

---

## 8. delayedChanges

节点级延迟变化，实现"因果延迟"机制。

```json
{
  "delayedChanges": [
    {
      "triggerNode": "node_025",
      "changes": {
        "set": { "masterTrust": -10 },
        "show": true,
        "feedback": [
          { "label": "师父信任", "delta": "-10", "tone": "negative" }
        ]
      },
      "reason": "师父发现了你隐瞒真相的事"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `triggerNode` | string | ✅ | 延迟到哪个节点触发（目标节点 ID） |
| `changes` | object | ✅ | 触发时执行的状态变化 |
| `reason` | string | ❌ | 解释延迟后果的原因，增强叙事感 |

**运行时机制**：
1. 玩家做出选择后，引擎将 `delayedChanges` 记入 `saveModel.pendingDelayedChanges` 队列
2. 当玩家到达 `triggerNode` 时，引擎检查是否有匹配的 pending 变更并依次执行
3. `reason` 文本以旁白风格插入到 `triggerNode` 的 `segments` 之前

---

## 9. milestones

顶层里程碑，标记剧情中的关键成就节点。

```json
{
  "milestones": [
    {
      "id": "first_breakthrough",
      "name": "踏入修行",
      "condition": { "var": "realm", "op": "!=", "value": "凡人" },
      "celebration": "small",
      "vfx": "breakthrough",
      "segments": [
        { "text": "体内的灵气开始流转，你感受到了天地之间的第一缕灵韵。" }
      ],
      "changes": { "show": true }
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一标识 |
| `name` | string | ✅ | 里程碑名称，用于成就列表展示 |
| `condition` | string/object | ✅ | 触发条件，见 §13 |
| `celebration` | string | ❌ | `"small"` / `"medium"` / `"large"`，默认 `"small"` |
| `vfx` | string | ❌ | 题材专属特效标识（如 `"breakthrough"` / `"lightning"` / `"corruption"`） |
| `segments` | array | ❌ | 达成时的叙事文本 |
| `once` | boolean | ❌ | 是否只触发一次，默认 `true` |
| `changes` | object | ❌ | 达成时附带的状态变化 |

### 9.1 celebration 级别

| 值 | 说明 | UI 表现 |
|------|------|----------|
| `small` | 简短通知 Toast | 顶部滑入，2 秒后自动消失 |
| `medium` | 全屏半透明 overlay + 叙事文本 | 需点击继续 |
| `large` | 全屏庆祝动画 + 题材专属 VFX + 叙事文本 | 播放动画后显示叙事 |

### 9.2 检测策略

- 运行时在每次 `changes.apply()` 之后，遍历所有未触发的 milestones 并检查 `condition`
- `once: true` 的 milestone 触发后从检测列表中移除
- 已触发过的 milestone 通过 `saveModel.triggeredMilestones` 去重
- 按数组顺序检测，允许多个 milestone 同时触发

---

## 10. endings

顶层结局定义。

```json
{
  "endings": [
    {
      "id": "ascension",
      "name": "飞升成仙",
      "desc": "你突破重重劫难，终于飞升仙界，得证大道。",
      "type": "true",
      "condition": { "all": [
        { "var": "realm", "op": "==", "value": "渡劫期" },
        { "flag": "passed_tribulation" },
        { "var": "daoHeart", "op": ">=", "value": 90 }
      ]},
      "hidden": false,
      "hint": null,
      "failureNode": null,
      "closing": "长生路上，不问归期。"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一标识 |
| `name` | string | ✅ | 结局名称（`hidden: true` 时显示为 `???`） |
| `desc` | string | ✅ | 结局描述（`hidden: true` 时显示模糊文本） |
| `type` | string | ✅ | 结局类型，见 §10.1 |
| `condition` | string/object | ✅ | 触发条件，见 §13 |
| `hidden` | boolean | ❌ | 是否为隐藏结局，默认 `false` |
| `hint` | string | ❌ | 给玩家方向性暗示（仅 `hidden: true` 时有意义） |
| `failureNode` | string | ❌ | 失败后跳转节点 ID |
| `closing` | string | ❌ | 结局收束语（情绪层最后余韵），与 `desc` 分开，用于结局展示时的尾声文本 |

### 10.1 ending type 枚举

| 值 | 说明 | 视觉 |
|------|------|------|
| `true` | 真结局 | 金色 |
| `dark` | 暗结局 | 暗红 |
| `romance` | 感情线 | 粉金 |
| `neutral` | 中立 | 灰蓝 |
| `noble` | 牺牲 | 白金 |
| `hidden` | 隐藏 | 暗色，需解锁才显示 |
| `failure` | 失败结局 | 灰黑 |

### 10.2 检测时机

**节点候选模式（MVP 推荐）**：在节点上通过 `candidateEndings` 字段声明该节点为结局候选节点。

```json
{
  "id": "node_final",
  "segments": [{ "text": "一切尘埃落定..." }],
  "candidateEndings": ["ascension", "demon_path", "ending_ordinary"]
}
```

到达候选节点时，引擎检测声明的 `endings[].condition`，第一个满足的结局触发。

**检测顺序**：milestones 先，endings 后。同时触发时，先展示 milestone 庆祝（简化为简短通知），再进入 ending 动画。

---

## 11. npcRelations（v1.1 新增）

NPC 关系网络系统。当 `meta.rules.npcRelations` 为 `true` 时启用。

```json
{
  "npcRelations": {
    "npcs": [
      {
        "id": "master",
        "name": "师父",
        "defaultAffinity": 0,
        "categories": ["mentor"]
      },
      {
        "id": "rival",
        "name": "林师兄",
        "defaultAffinity": -10,
        "categories": ["peer", "antagonist"]
      }
    ],
    "affinityRanges": {
      "hostile": [-100, -30],
      "cold": [-30, 0],
      "neutral": [0, 30],
      "friendly": [30, 70],
      "devoted": [70, 100]
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `npcs` | array | ✅ | NPC 定义列表 |
| `affinityRanges` | object | ❌ | 好感度区间定义，默认见上表 |

### 11.1 npcRelations.npcs 元素

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | NPC 唯一标识 |
| `name` | string | ✅ | NPC 显示名称 |
| `defaultAffinity` | number | ❌ | 初始好感度，默认 `0` |
| `categories` | array\<string\> | ❌ | NPC 分类标签（如 `"mentor"`、`"love_interest"`、`"antagonist"`、`"peer"` 等） |

### 11.2 npcRelations.affinityRanges

定义好感度区间与关系阶段的映射。可完全自定义，默认区间如下：

| 阶段 key | 区间 | UI 展示 |
|----------|------|---------|
| `hostile` | [-100, -30] | 敌对（红色） |
| `cold` | [-30, 0] | 冷淡（灰色） |
| `neutral` | [0, 30] | 中立（白色） |
| `friendly` | [30, 70] | 友好（绿色） |
| `devoted` | [70, 100] | 信赖（金色） |

**向后兼容**：`npcRelations` 完全可选。旧作品无此字段时，引擎不启用 NPC 关系系统，`choices.affinityChanges` 和 `condition.affinity` 条件被忽略。

---

## 12. timePressure（v1.1 新增）

时间压力/回合机制。当 `meta.rules.timePressure` 为 `true` 或 `timePressure.enabled` 为 `true` 时启用。

```json
{
  "timePressure": {
    "enabled": true,
    "mode": "turn",
    "turnsPerCycle": 10,
    "globalDecay": [
      { "variable": "food", "delta": -1 }
    ],
    "deadlineNodes": ["node_100"]
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | boolean | ❌ | `false` | 是否启用时间压力机制 |
| `mode` | enum | ❌ | `"turn"` | `"turn"`（回合制，每节点/每次选择消耗一回合）或 `"countdown"`（倒计时制，全局实时计时） |
| `turnsPerCycle` | number | ❌ | `10` | 每周期回合数（仅 `mode: "turn"` 时有效） |
| `globalDecay` | array | ❌ | `[]` | 全局衰减规则列表 |
| `deadlineNodes` | array\<string\> | ❌ | `[]` |  deadline 节点列表，到达时若条件未满足则触发失败结局 |

### 12.1 timePressure.globalDecay

定义每回合/每周期自动执行的变量衰减。

```json
{
  "globalDecay": [
    { "variable": "food", "delta": -1 },
    { "variable": "stamina", "delta": -2 }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `variable` | string | ✅ | 要衰减的变量名（对应 `variables` 中的键） |
| `delta` | number | ✅ | 每周期变化量（通常为负数） |

### 12.2 timePressure.deadlineNodes

到达 deadline 节点时，引擎会检查预设的 deadline 条件。若条件不满足，跳转到 `mission.failureNode` 或 `timePressure.failureNode`。

```json
{
  "timePressure": {
    "enabled": true,
    "mode": "turn",
    "deadlineNodes": ["node_100"],
    "failureNode": "ending_timeout"
  }
}
```

**节点级 countdown**：见 §6.4.2。节点级倒计时优先级高于全局配置。

**向后兼容**：`timePressure` 完全可选。旧作品无此字段时，引擎不启用时间压力机制，所有 countdown 相关字段被忽略。

---

## 13. inventory

顶层背包/资源。

**简写**（仅数量）：
```json
{
  "inventory": {
    "spirit_stone": 3,
    "healing_pill": 1
  }
}
```

**完整写法**：
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

`changes.inventory` 格式（同 `changes.set`，键为物品 ID，值为增减量）：
```json
{ "changes": { "inventory": { "spirit_stone": -1, "healing_pill": 1 } } }
```

---

## 14. mission

用于无限恐怖、副本生存、末世任务等结构。

```json
{
  "mission": {
    "title": "七日医院",
    "objective": "在天亮前找到 403 病房的真实病历",
    "timeLimit": 6,
    "failureNode": "ending_erased"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 任务标题 |
| `objective` | string | 任务目标 |
| `timeLimit` | number | 时限（回合或节点数） |
| `failureNode` | string | 失败后跳转节点 |

---

## 15. 条件表达式

### 15.1 字符串格式（兼容，不推荐新用）

```
val >= 60
val <= 30
trust >= 2
route == 'true'
hasFlag 'flag_name'
!hasFlag 'flag_name'
default
```

### 15.2 对象格式（推荐）

```json
{
  "all": [
    { "var": "val", "op": ">=", "value": 55 },
    { "flag": "checked_envelope" }
  ]
}
```

**组合操作符**：
- `all`：所有条件满足
- `any`：任一条件满足
- `not`：条件不满足

**条件单元类型**：

| 类型 | 格式 | 说明 |
|------|------|------|
| `var` | `{ "var": "qi", "op": ">=", "value": 20 }` | 变量比较 |
| `flag` | `{ "flag": "learned_spell" }` | flag 是否存在 |
| `item` | `{ "item": "spirit_stone", "op": ">=", "value": 1 }` | 背包物品数量 |
| `interaction` | `{ "interaction": "find_secret", "completed": true }` | 前置交互是否完成 |
| `affinity` | `{ "affinity": { "npcId": "master", "operator": ">=", "value": 30 } }` | NPC 好感度条件（v1.1 新增） |

**affinity 条件示例**：
```json
{
  "condition": {
    "all": [
      { "affinity": { "npcId": "master", "operator": ">=", "value": 30 } },
      { "var": "qi", "op": ">=", "value": 50 }
    ]
  }
}
```

**op 可选值**：`">="` / `"<="` / `">"` / `"<"` / `"=="` / `"!="`

**安全规则**：微信小程序端不使用 `eval`，所有条件走安全解析器。

---

## 16. saveModel（存档模型）

HTML 和微信小程序共享同一份存档模型。

```json
{
  "storyId": "qinglu-yehuo",
  "currentNodeId": "node_023",
  "val": 45,
  "variables": {},
  "flags": [],
  "inventory": {},
  "achievements": [],
  "visitedNodes": [],
  "triggeredMilestones": [],
  "unlockedEndings": [],
  "pendingDelayedChanges": [],
  "affinity": {},
  "turnCount": 0,
  "countdownDeadline": null,
  "playedAt": 1783000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `storyId` | string | 作品 ID |
| `currentNodeId` | string | 当前节点 ID |
| `val` | number | 主状态值 |
| `variables` | object | 自定义变量 |
| `flags` | array\<string\> | 已触发 flag 列表 |
| `inventory` | object | 背包物品 |
| `achievements` | array\<string\> | 已解锁成就 ID 列表 |
| `visitedNodes` | array\<string\> | 已访问节点 ID 列表 |
| `triggeredMilestones` | array\<string\> | 已触发里程碑 ID 列表 |
| `unlockedEndings` | array\<string\> | 已解锁结局 ID 列表 |
| `pendingDelayedChanges` | array | 尚未触发的延迟变更队列，元素结构：`{ "triggerNode": string, "changes": object, "reason": string }` |
| `affinity` | object | NPC 好感度快照（v1.1 新增），格式：`{ "npcId": number }` |
| `turnCount` | number | 当前回合数（v1.1 新增，仅 timePressure 启用时有效） |
| `countdownDeadline` | number | 倒计时截止时间戳（v1.1 新增，仅 countdown 模式时有效） |
| `playedAt` | number | 时间戳（Unix epoch seconds） |

HTML 端用 `localStorage`，小程序端用 `wx.setStorageSync` / `wx.getStorageSync`。

---

## 17. 兼容策略

| 规则 | 说明 |
|------|------|
| 旧 JSON 无 `meta.rpg` | 启动器不显示 RPG 面板 |
| 旧 JSON 无 `meta.rules` | 使用默认规则配置，不影响任何功能 |
| 旧 JSON 无 `npcRelations` | 不启用 NPC 关系系统 |
| 旧 JSON 无 `timePressure` | 不启用时间压力机制 |
| 旧 JSON 无 `achievements[].autoUnlock` | 成就仍通过手动 `changes.unlockAchievement` 解锁 |
| 旧 `changes.set` | 不需要改，继续兼容 |
| 旧 `condition` 字符串 | 继续支持 |
| 新增字段 | 只在存在时启用 |
| `choice.weight` 缺失 | 默认为 `minor` |
| `interaction.depth` 缺失 | 默认为 `surface` |
| `milestones`/`endings` 缺失 | 不启用对应功能 |
| 小程序端 | 必须走安全条件解析器，不执行任意 JavaScript |

---

## 18. 校验规则索引

| 规则 ID | 级别 | 说明 |
|---------|------|------|
| RPG-001 | error | `meta.rpg.primaryStats[].key` 必须在 `variables` 中有对应初始值 |
| RPG-002 | error | `meta.rpg.primaryStats[].type` 必须是 `text`/`number`/`bar` 之一 |
| RPG-003 | error | `choice.weight` 必须是 `critical`/`branch`/`minor`/`cosmetic` 之一 |
| RPG-004 | error | `milestones[].condition` 必须可解析 |
| RPG-005 | error | `endings[].condition` 必须可解析 |
| RPG-006 | error | `candidateEndings` 引用的结局 ID 必须在 `endings` 中定义 |
| RPG-007 | error | `delayedChanges[].triggerNode` 必须存在于 `nodes` 中 |
| RPG-008 | error | `interactions[].id` 在节点内必须唯一 |
| RPG-009 | warning | `meta.genre` 不在枚举值内 |
| RPG-010 | warning | `milestones` 存在但无 `endings` |
| RPG-011 | warning | `endings` 存在但无 `milestones` |
| RPG-012 | suggestion | 修仙类型建议至少 3 个 milestones |
| RPG-013 | suggestion | 建议至少 2 个 endings（含隐藏结局） |
| RPG-014 | error | `endings[].type` 必须在 §10.1 枚举范围内 |
| RPG-015 | error | `milestones[].celebration` 必须在 `small`/`medium`/`large` 范围内 |
| RPG-016 | error | `interactions[].depth` 必须在 `surface`/`deep`/`ultimate` 范围内 |
| RPG-017 | warning | `condition` 中 `var` 引用的变量必须在 `variables` 中存在 |
| RPG-018 | warning | `hiddenStats` 中的变量必须在 `variables` 中存在 |
| RPG-019 | warning | `meta.rules.pacing` 必须在 `compact`/`balanced`/`relaxed` 范围内（v1.1 新增） |
| RPG-020 | warning | `meta.rules.choiceStyle` 必须在 `direct`/`inner_monologue`/`action` 范围内（v1.1 新增） |
| RPG-021 | warning | `meta.rules.statImpact` 必须在 `light`/`medium`/`heavy` 范围内（v1.1 新增） |
| RPG-022 | warning | `meta.rules.hiddenContentRatio` 必须在 `low`/`medium`/`high` 范围内（v1.1 新增） |
| RPG-023 | warning | `meta.rules.endingBias` 必须在 `heavy`/`balanced`/`dark`/`random` 范围内（v1.1 新增） |
| RPG-024 | warning | `meta.rules.narrativePerson` 必须在 `first`/`second` 范围内（v1.1 新增） |
| RPG-025 | warning | `meta.rules.dialogueDensity` 必须在 `low`/`medium`/`high` 范围内（v1.1 新增） |
| RPG-026 | error | `npcRelations.npcs[].id` 必须全局唯一（v1.1 新增） |
| RPG-027 | error | `choices.affinityChanges[].npcId` 必须在 `npcRelations.npcs` 中定义（v1.1 新增） |
| RPG-028 | error | `condition.affinity.npcId` 必须在 `npcRelations.npcs` 中定义（v1.1 新增） |
| RPG-029 | error | `timePressure.deadlineNodes[]` 必须存在于 `nodes` 中（v1.1 新增） |
| RPG-030 | warning | `timePressure.globalDecay[].variable` 必须在 `variables` 中存在（v1.1 新增） |

---

> **Schema 锁定声明**：本文档（v1.1）在 v1.0 基础上扩展了创作者规则、NPC 关系、时间压力和成就自动解锁机制。所有新增字段均为可选，完全向后兼容 v1.0。后续修改需经阶段评审流程。新字段提案在 `docs/SCHEMA_v1.x_PROPOSAL.md` 中记录，评审通过后并入下一版。
