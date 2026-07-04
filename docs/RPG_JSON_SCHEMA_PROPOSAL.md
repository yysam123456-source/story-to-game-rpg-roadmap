# RPG 化 JSON 扩展草案

本文档记录后续 RPG 化开发建议新增的 JSON 字段。所有字段都应保持可选，确保旧剧本完全兼容。

## 设计原则

- 叙事优先，数值服务剧情。
- 新字段可选，不破坏旧 JSON。
- 默认轻量，不做复杂战斗公式。
- AI 易生成，人工易编辑，校验器易检查。
- 强类型小说通过 `genre` 选择专属玩法模板。
- HTML 播放器和微信小程序播放器消费同一份 JSON 剧本协议。

## meta.genre

声明作品类型。

```json
{
  "meta": {
    "genre": "xianxia"
  }
}
```

建议枚举：

| 值 | 类型 |
| --- | --- |
| `literary` | 普通文学/现实向 |
| `xianxia` | 修仙 |
| `horror` | 无限恐怖/副本生存 |
| `mystery` | 悬疑推理 |
| `apocalypse` | 末世生存 |
| `palace` | 宫斗/权谋 |
| `custom` | 自定义 |

## meta.rpg

控制 RPG 展示和交互行为。

```json
{
  "meta": {
    "rpg": {
      "enabled": true,
      "mode": "light",
      "conditionDisplay": "disabled",
      "primaryStats": [
        { "key": "realm", "label": "境界", "type": "text" },
        { "key": "cultivation", "label": "修为", "type": "bar", "max": 100 },
        { "key": "qi", "label": "灵力", "type": "bar", "max": 80 }
      ],
      "hiddenStats": ["karma", "tribulationRisk"]
    }
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `enabled` | boolean | 是否启用 RPG 展示 |
| `mode` | string | 建议先支持 `light` |
| `conditionDisplay` | string | `hide` 或 `disabled` |
| `primaryStats` | array | 玩家可见核心数值 |
| `hiddenStats` | array | 可用于条件但不展示的隐藏数值 |

## primaryStats

```json
{
  "key": "qi",
  "label": "灵力",
  "type": "bar",
  "max": 80
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | string | 对应 `variables` 中的键 |
| `label` | string | UI 展示名 |
| `type` | string | `text` / `number` / `bar` |
| `max` | number | `bar` 类型最大值 |
| `min` | number | 可选，默认 0 |
| `tone` | string | 可选，如 `positive` / `danger` / `neutral` |

## variables

继续沿用现有 `variables`，作为 RPG 状态的主要承载层。

修仙示例：

```json
{
  "variables": {
    "realm": "炼气三层",
    "cultivation": 12,
    "qi": 30,
    "daoHeart": 3,
    "karma": 0,
    "tribulationRisk": 0
  }
}
```

无限恐怖示例：

```json
{
  "variables": {
    "hp": 100,
    "sanity": 70,
    "points": 0,
    "teamTrust": 0,
    "danger": 1,
    "clue": 0,
    "timeLeft": 6
  }
}
```

## changes.show

控制是否显示变化提示。

```json
{
  "changes": {
    "val": 5,
    "set": {
      "qi": 40,
      "masterTrust": 2
    },
    "show": true
  }
}
```

## changes.feedback

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

## interactions

节点内场景交互。

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

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 节点内唯一 |
| `label` | string | 按钮文字 |
| `once` | boolean | 是否只能执行一次 |
| `condition` | string/object | 执行条件 |
| `result.segments` | array | 执行后的文本反馈 |
| `result.changes` | object | 执行后的状态变化 |

### interaction.depth

标记交互的探索深度，决定交互在不同条件下的显示策略。

```json
{
  "interactions": [
    {
      "id": "search_bookshelf",
      "label": "翻阅书架",
      "depth": "surface",
      "once": false,
      "condition": null,
      "result": {
        "segments": [{ "text": "书架上摆满了道家典籍..." }],
        "changes": { "set": { "cultivation": 1 }, "show": true }
      }
    },
    {
      "id": "find_secret_compartment",
      "label": "检查书架暗格",
      "depth": "deep",
      "once": true,
      "condition": { "var": "comprehension", "op": ">=", "value": 5 },
      "result": {
        "segments": [{ "text": "你发现书架底层有一个隐蔽的暗格，里面藏着一卷泛黄的竹简..." }],
        "changes": { "addFlag": { "flag": "found_secret_manual", "label": "发现秘法竹简" }, "set": { "comprehension": 2 }, "show": true }
      }
    },
    {
      "id": "ancient_formula",
      "label": "参悟竹简上的上古阵法",
      "depth": "ultimate",
      "once": true,
      "condition": { "all": [
        { "flag": "found_secret_manual" },
        { "var": "comprehension", "op": ">=", "value": 8 },
        { "flag": "mastered_basic_formation" }
      ]},
      "result": {
        "segments": [{ "text": "竹简上的文字在你识海中展开，一道上古阵法的完整图景浮现..." }],
        "changes": { "addFlag": { "flag": "ancient_formation_mastered", "label": "领悟上古阵法" }, "set": { "comprehension": 5 }, "show": true }
      }
    }
  ]
}
```

depth 枚举：

| 值 | 说明 | 显示策略 |
| --- | --- | --- |
| `surface` | 默认。浅层交互，无需任何前置条件 | 始终渲染 |
| `deep` | 深层交互，需要 condition 满足才可执行 | condition 不满足时显示为锁定状态（虚线边框 + 锁图标 + 提示） |
| `ultimate` | 终极交互，需要 condition 满足且可能需要前置 interaction 已完成 | condition 不满足时完全隐藏；满足后以特殊动画显现 |

可选字段，缺失时默认为 `surface`。

### interaction.hint

用于在条件接近但未完全满足时给玩家暗示，避免 ultimate 交互完全隐藏导致玩家不知道有隐藏内容。

```json
{
  "interactions": [
    {
      "id": "find_secret_compartment",
      "label": "仔细检查书架",
      "depth": "ultimate",
      "condition": { "all": [
        { "interaction": "inspect_bookshelf", "completed": true },
        { "var": "comprehension", "op": ">=", "value": 8 }
      ]},
      "hint": {
        "text": "你感觉书架后面似乎有什么东西...",
        "showIf": { "var": "comprehension", "op": ">=", "value": 5 },
        "insertPosition": "after_interaction"
      }
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `hint.text` | string | 暗示文本 |
| `hint.showIf` | object | 显示条件（与 condition 不同，条件更宽松） |
| `hint.insertPosition` | string | 插入位置：`after_interaction`（在关联交互的叙事文本后）、`before_choice`（在选择前）、`in_narrative`（在叙事流中） |

hint 的展示方式：在 `insertPosition` 指定的位置插入一段淡化显示的文本（如斜体、透明度 60%），提示玩家"这里似乎还有什么"。hint 不替代 condition 判断，只提供方向性暗示。

## choice.weight

标记选项的叙事权重，用于前端差异化渲染和对玩家进行重要选择的视觉提示。

```json
{
  "choices": [
    {
      "text": "告诉师父真相",
      "weight": "critical",
      "weightHint": "此选择将影响后续剧情走向"
    }
  ]
}
```

weight 枚举：

| 值 | 说明 | 视觉差异 |
| --- | --- | --- |
| `critical` | 关键分歧点，影响主线走向 | 品牌色高亮边框 + 辉光 |
| `branch` | 支线影响 | 品牌色竖线 |
| `minor` | 小事 | 默认样式 |
| `cosmetic` | 纯对话变化 | 淡色 |

weightHint 为可选字段，鼠标悬停或长按时显示的提示文字。

可选字段，缺失时默认为 `minor`。

## milestones

顶层里程碑，用于标记剧情中的关键成就节点，触发时播放对应的庆祝效果。

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
        { "text": "体内的灵气开始流转，你感受到了天地之间的第一缕灵韵。从此，你踏上了修行之路。" }
      ],
      "changes": {
        "show": true,
        "feedback": [
          { "label": "修行", "delta": "开始", "tone": "positive" }
        ]
      }
    },
    {
      "id": "foundation_established",
      "name": "筑基成功",
      "condition": { "var": "realm", "op": "==", "value": "筑基期" },
      "celebration": "large",
      "vfx": "breakthrough",
      "segments": [
        { "text": "天雷滚滚，金光护体。你成功筑基，从此脱胎换骨，寿命延长至三百年。" }
      ]
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 全局唯一标识 |
| `name` | string | 里程碑名称，用于成就列表展示 |
| `condition` | string/object | 触发条件 |
| `celebration` | string | 庆祝级别 |
| `vfx` | string | 引用题材专属特效标识，如 `breakthrough`、`lightning`、`corruption` 等 |
| `segments` | array | 达成时的叙事文本 |
| `changes` | object | 可选，达成时附带的状态变化 |

celebration 枚举：

| 值 | 说明 |
| --- | --- |
| `small` | 简短通知 Toast |
| `medium` | 全屏半透明 overlay + 叙事文本 |
| `large` | 全屏庆祝动画 + 题材专属 VFX + 叙事文本 |

可选字段，整个 `milestones` 数组缺失时视为无里程碑。

#### milestone 检测策略

运行时在每次 `changes.apply()` 之后，遍历所有未触发的 milestones 并检查 condition。

优化规则：
- `once=true` 的 milestone 触发后从检测列表中移除
- 已触发过的 milestone 不再参与检测（通过 `saveModel.triggeredMilestones` 去重）
- 检测顺序：按数组定义顺序，首个满足条件的 milestone 触发后不阻断后续 milestone 的检测（允许多个 milestone 同时触发）

#### milestones 与 endings 检测优先级

检测顺序：milestones 先，endings 后（如果当前节点是 candidateEndings 节点）。

同时触发规则：
- milestone 和 ending 同时满足时，先展示 milestone 庆祝
- 如果 ending 实际触发（到达结局节点），milestone 的 celebration 简化为简短通知，不阻断 ending 动画
- milestone 触发不影响 ending 判定逻辑

## endings

顶层结局定义，描述所有可能的结局及其触发条件。

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
      "hidden": false
    },
    {
      "id": "demon_path",
      "name": "堕入魔道",
      "desc": "你在突破中走火入魔，成为人人惧怕的魔修。",
      "type": "dark",
      "condition": { "all": [
        { "var": "realm", "op": ">=", "value": "金丹期" },
        { "flag": "killed_innocent" },
        { "var": "karma", "op": "<=", "value": -50 }
      ]},
      "hidden": false
    },
    {
      "id": "secret_ending",
      "name": "???",
      "desc": "一段模糊的文字...",
      "type": "hidden",
      "condition": { "all": [
        { "flag": "ancient_formation_mastered" },
        { "flag": "saved_master_from_demon" },
        { "var": "comprehension", "op": ">=", "value": 15 }
      ]},
      "hidden": true,
      "hint": "在师父危难之际以古道法施救，且悟性达到极致"
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 全局唯一标识 |
| `name` | string | 结局名称。`hidden: true` 时在结局列表中显示为 `???` |
| `desc` | string | 结局描述。`hidden: true` 时显示模糊文本 |
| `type` | string | 结局类型 |
| `condition` | string/object | 触发条件 |
| `hidden` | boolean | 是否为隐藏结局，默认 `false` |
| `failureNode` | string | 否。失败后跳转到的节点 ID（用于"重新开始"或"读档"引导） |
| `hint` | string | 可选，给玩家方向性暗示，仅在 `hidden: true` 时有意义 |

type 枚举：

| 值 | 说明 | 视觉 |
| --- | --- | --- |
| `true` | 真结局 | |
| `dark` | 暗结局 | |
| `romance` | 感情线 | |
| `neutral` | 中立 | |
| `noble` | 牺牲 | |
| `hidden` | 隐藏 | |
| `failure` | 失败结局（中途死亡、精神崩溃、任务失败等） | 灰黑 |

可选字段，整个 `endings` 数组缺失时视为无结局定义（退回到基础的节点到达判定）。

#### endings 检测时机

**节点候选模式（MVP 推荐）**：在节点上通过 `candidateEndings` 字段声明该节点为结局候选节点，到达时检测声明的 endings.condition。

```json
{
  "id": "node_final",
  "segments": [{ "text": "一切尘埃落定..." }],
  "candidateEndings": ["ascension", "demon_path", "ending_ordinary"]
}
```

**全量检测模式（后续）**：每次状态变化后遍历所有 endings.condition，增加防重复冷却机制。

MVP 阶段只实现节点候选模式。

## delayedChanges

节点级延迟变化，用于实现"因果延迟"机制——当前节点的选择不在立即生效，而是延迟到后续某个节点才兑现后果。

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

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `triggerNode` | string | 延迟到哪个节点触发，值对应目标节点的 `id` |
| `changes` | object | 触发时执行的状态变化，结构同 `changes` |
| `reason` | string | 可选，解释延迟后果的原因，增强叙事感 |

运行时机制：当玩家做出选择后，引擎将 `delayedChanges` 记入 pending 队列。当玩家到达 `triggerNode` 时，引擎检查是否有匹配的 pending 变更并依次执行。`reason` 字段用于在触发时向玩家展示一段叙事解释。

#### 触发叙事流程

```
到达 triggerNode
  ↓
检查 pending delayedChanges
  ↓
按添加顺序依次处理：
  1. 插入 reason 文本到叙事流（作为新段落）
  2. 应用 changes 数值变化
  3. 如果 changes.show === true，显示变化反馈
  ↓
继续渲染 triggerNode 的 segments
```

reason 文本在 JSON 中预写好，以旁白风格插入到 triggerNode 的 segments 之前。多个 delayedChanges 同时触发时按添加顺序处理。

可选字段，节点内缺失时视为无延迟变化。

## inventory

顶层背包/资源。

简写：

```json
{
  "inventory": {
    "spirit_stone": 3,
    "healing_pill": 1
  }
}
```

完整写法：

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

## changes.inventory

```json
{
  "changes": {
    "inventory": {
      "spirit_stone": -1,
      "healing_pill": 1
    },
    "show": true
  }
}
```

## condition.item

```json
{
  "condition": {
    "item": "spirit_stone",
    "op": ">=",
    "value": 1
  }
}
```

也可以组合：

```json
{
  "condition": {
    "all": [
      { "item": "spirit_stone", "op": ">=", "value": 1 },
      { "var": "qi", "op": "<", "value": 30 }
    ]
  }
}
```

### condition.interaction

用于检查前置交互是否已完成，常用于 `interaction.depth = "ultimate"` 的条件中。

```json
{
  "condition": {
    "all": [
      { "interaction": "find_secret_compartment", "completed": true },
      { "var": "comprehension", "op": ">=", "value": 8 }
    ]
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `interaction` | string | 交互 ID，引用当前节点或之前节点中的 `interactions[].id` |
| `completed` | boolean | 是否已完成（默认 true） |

可选字段，与 `var`/`flag`/`item` 条件类型并列使用。替代了通过 flag 间接推断交互完成状态的做法，使前置依赖关系更显式。

## 跨端条件表达式

微信小程序端不应使用 `eval` 执行字符串条件。后续 Skill 应优先生成对象条件，字符串条件仅作为兼容格式保留。

兼容格式：

```json
{
  "condition": "qi >= 20"
}
```

推荐格式：

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

条件解析器必须在 HTML 和微信小程序两端复用，保证同一份 JSON 在双端得到一致结果。

## mission

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

## saveModel

HTML 和微信小程序应共享同一份存档模型，便于未来接入云存档。

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
  "playedAt": 1783000000
}
```

新增追踪字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `triggeredMilestones` | array\<string\> | 已触发的里程碑 `id` 列表 |
| `unlockedEndings` | array\<string\> | 已解锁的结局 `id` 列表 |
| `pendingDelayedChanges` | array | 尚未触发的延迟变更队列 |

HTML 端可用 `localStorage` 保存，小程序端使用 `wx.setStorageSync` / `wx.getStorageSync` 保存。字段语义不能因端而异。

## i18n 多语言支持

可选的多语言方案，通过字段后缀实现：

```json
{
  "meta": {
    "locale": "zh-CN",
    "title_i18n": {
      "zh-CN": "青炉夜火",
      "en-US": "Blue Furnace Night Fire"
    }
  },
  "nodes": [
    {
      "id": "node_001",
      "segments_i18n": {
        "zh-CN": [{ "text": "你站在青炉峰的石阶前..." }],
        "en-US": [{ "text": "You stand before the stone steps of Qinglu Peak..." }]
      }
    }
  ]
}
```

规则：
- 如果存在 `_i18n` 后缀字段，播放器优先读取当前 locale 对应的文本
- 如果不存在 `_i18n` 字段，回退到默认文本字段
- MVP 阶段可不做，后续阶段支持
- 推荐在 Phase 9（示例库与发布）时实现

## 玩法质量检测规则（validate.py 扩展）

后续在 validate.py 中增加以下玩法质量检查：

| 规则 | 级别 | 说明 |
|------|------|------|
| QUAL-001 | warning | 修仙 Demo 未包含突破节点 |
| QUAL-002 | warning | 整部作品无 critical 选择 |
| QUAL-003 | warning | critical 选择占比过高（>30%） |
| QUAL-004 | warning | 无 delayedChanges，因果深度不足 |
| QUAL-005 | warning | 无 milestones，缺乏成长仪式感 |
| QUAL-006 | warning | 无 endings，缺乏重玩动力 |
| QUAL-007 | suggestion | 每章应至少包含 1 个 surface 交互 |

这些规则用于 AI 生成后的自动质量评估，不阻止发布，仅作为改进建议。

## 兼容策略

- 旧 JSON 没有 `meta.rpg` 时，启动器不显示 RPG 面板。
- 旧 `changes.set` 不需要改。
- 旧 `condition` 字符串继续支持。
- 新增字段只在存在时启用。
- `theme` 继续兼容，但新稿建议使用 `ambient`。
- 小程序端必须走安全条件解析器，不执行任意 JavaScript。
- `choice.weight` 缺失时默认为 `minor`，不影响旧选项渲染。
- `interaction.depth` 缺失时默认为 `surface`，旧交互始终可见。
- `milestones`、`endings`、`delayedChanges` 整体缺失时不启用对应功能。
- `milestones` 和 `endings` 不存在时，存档模型中对应追踪字段为空数组。
- `pendingDelayedChanges` 不存在时视为无待处理延迟变更。

## MVP 必须支持

第一版只需要实现：

- `meta.genre`
- `meta.rpg.enabled`
- `meta.rpg.primaryStats`
- `changes.show`
- 条件选项置灰/隐藏
- `choice.weight`（至少识别 `critical` 和 `branch`，用于差异化渲染）
- `milestones` 的基础支持（至少 `small` 和 `medium` 庆祝级别）
- `endings` 的基础定义（结局列表展示、条件判定、`hidden` 隐藏机制）

`interactions`、`inventory`、`mission`、`delayedChanges`、`interaction.depth`、`endings` 的完整动画和 `milestones` 的 `large` 庆祝可在后续阶段加入。
