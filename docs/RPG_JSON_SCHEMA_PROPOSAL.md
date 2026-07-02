# RPG 化 JSON 扩展草案

本文档记录后续 RPG 化开发建议新增的 JSON 字段。所有字段都应保持可选，确保旧剧本完全兼容。

## 设计原则

- 叙事优先，数值服务剧情。
- 新字段可选，不破坏旧 JSON。
- 默认轻量，不做复杂战斗公式。
- AI 易生成，人工易编辑，校验器易检查。
- 强类型小说通过 `genre` 选择专属玩法模板。

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
| `infinite_horror` | 无限恐怖/副本生存 |
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

## 兼容策略

- 旧 JSON 没有 `meta.rpg` 时，启动器不显示 RPG 面板。
- 旧 `changes.set` 不需要改。
- 旧 `condition` 字符串继续支持。
- 新增字段只在存在时启用。
- `theme` 继续兼容，但新稿建议使用 `ambient`。

## MVP 必须支持

第一版只需要实现：

- `meta.genre`
- `meta.rpg.enabled`
- `meta.rpg.primaryStats`
- `changes.show`
- 条件选项置灰/隐藏

`interactions`、`inventory`、`mission` 可在后续阶段加入。
