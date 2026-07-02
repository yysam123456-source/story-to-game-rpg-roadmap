# Story-to-Game RPG 化阶段开发路线图

本文档用于记录本仓库后续开发目标：在保留原项目“高质量互动文学生成与运行”能力的基础上，逐步升级为“类型小说轻 RPG 文游生成器”。

## 产品定位

Story-to-Game 后续方向不是重型 RPG 引擎，而是叙事优先的轻 RPG 文游系统：

- 保留原作气质、人物关系、文学节奏和分支回响。
- 让玩家看得见关键数值、资源和关系变化。
- 支持按小说类型生成专属互动逻辑。
- 保持 JSON 对 AI 友好、对人工可编辑、对启动器可直接运行。

目标形态：

```text
Story-to-Game 2.0
= 文学改编 Skill
+ 单文件/可部署文游启动器
+ 轻 RPG 状态系统
+ 类型小说玩法模板
+ JSON 校验与调试工具
```

## 阶段总览

| 阶段 | 名称 | 目标 | 优先级 |
| --- | --- | --- | --- |
| 0 | 工程基线 | 源码化 `.skill`，整理目录，建立可维护仓库结构 | P0 |
| 1 | RPG 数值可视化 | 让 `val`、`variables`、`flags` 变成玩家可见状态 | P0 |
| 2 | 变化反馈与条件提示 | 选择后展示数值变化，条件不满足选项可提示原因 | P0 |
| 3 | 场景交互系统 | 将 `scene` 从地点展示升级为可探索空间 | P1 |
| 4 | 背包与资源系统 | 支持道具、资源获取、消耗和条件判断 | P1 |
| 5 | 类型模板 v1 | 实现修仙、无限恐怖两类强玩法模板 | P1 |
| 6 | 类型模板 v2 | 扩展悬疑、末世、宫斗/权谋模板 | P2 |
| 7 | Skill 生成流程升级 | 让 AI 根据类型自动生成玩法循环和 RPG 数值结构 | P1 |
| 8 | 校验器与调试器增强 | 增加 RPG 字段、类型模板、交互系统的校验和调试能力 | P1 |
| 9 | 示例库与发布形态 | 建立类型 demo、文档、发布包和使用说明 | P2 |

## 阶段 0：工程基线

### 目标

解决当前 `.skill` 二进制不可审查、启动器单文件难维护的问题。

### 任务

- 将 `story-to-game.skill` 解包源码放入仓库。
- 保留 `.skill` 作为发布产物。
- 新增打包脚本，支持从源码重新生成 `.skill`。
- 整理示例 JSON 和验证脚本目录。
- 后续逐步拆分启动器源码，构建时再打包成单文件 HTML。

### 验收标准

- 修改 `SKILL.md` 时 GitHub 能显示文本 diff。
- 一条命令能重新打包 `.skill`。
- 示例 JSON 能被 `validate.py` 批量验证。
- 原启动器功能不退化。

## 阶段 1：RPG 数值可视化

### 目标

在不破坏旧 JSON 的前提下，让玩家看到关键状态、资源或成长数值。

### 新增字段草案

```json
{
  "meta": {
    "genre": "xianxia",
    "rpg": {
      "enabled": true,
      "mode": "light",
      "primaryStats": [
        { "key": "realm", "label": "境界", "type": "text" },
        { "key": "cultivation", "label": "修为", "type": "bar", "max": 100 },
        { "key": "qi", "label": "灵力", "type": "bar", "max": 80 },
        { "key": "daoHeart", "label": "道心", "type": "number" }
      ],
      "hiddenStats": ["karma", "tribulationRisk"]
    }
  },
  "variables": {
    "realm": "炼气三层",
    "cultivation": 12,
    "qi": 30,
    "daoHeart": 3
  }
}
```

### 启动器任务

- 新增顶部状态栏。
- 新增详细状态抽屉。
- 支持 `text`、`number`、`bar` 三种展示。
- 未开启 `meta.rpg.enabled` 时保持旧 UI。

### Skill 任务

- 强类型小说或用户要求 RPG 化时，生成 `meta.genre` 和 `meta.rpg`。
- 可见数值最多 5 个。
- 隐藏数值可用于路由和结局，但不在玩家 UI 中暴露。

## 阶段 2：变化反馈与条件提示

### 目标

让玩家明确知道“刚才的选择改变了什么”，并理解某些选项为什么可用或不可用。

### 新增字段草案

```json
{
  "changes": {
    "val": 5,
    "set": {
      "qi": 40,
      "masterTrust": 2
    },
    "addFlag": {
      "flag": "helped_master",
      "label": "替师父守住丹炉"
    },
    "show": true
  }
}
```

也支持显式反馈：

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

### UI 任务

- 选择后弹出变化提示。
- 支持条件不满足选项隐藏或置灰。
- 置灰时显示简短条件原因。

### 验收标准

- 旧写法仍能运行。
- `changes.show = true` 时展示状态变化。
- 条件选项可根据配置隐藏或置灰。
- 变化提示不泄露隐藏结局条件。

## 阶段 3：场景交互系统

### 目标

将 `scene` 从“地点展示”升级为“可探索、可调查、可使用道具”的互动空间。

### 新增字段草案

```json
{
  "title": "破庙夜宿",
  "scene": {
    "id": "ruined_temple",
    "name": "破庙",
    "type": "interactive",
    "description": "佛像半塌，梁上挂着旧幡，庙外有脚步声绕了三圈。"
  },
  "segments": [
    { "text": "你在破庙里醒来，火堆快灭了。" }
  ],
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
  ],
  "choices": [
    { "text": "等到天亮", "next": "temple_wait_route" },
    { "text": "现在离开", "next": "temple_leave" }
  ]
}
```

### 规则

- `interactions` 在 `choices` 之前展示。
- `once = true` 的交互执行后隐藏或标记已调查。
- `interactions` 可修改 `val`、`variables`、`flags`、`inventory`。
- `interactions` 可解锁新的 `choices`。
- 交互用于探索和准备，不替代关键剧情分支。

## 阶段 4：背包与资源系统

### 目标

支持道具、资源、消耗、奖励和资源条件判断。

### 新增字段草案

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

选择变化：

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

条件判断：

```json
{
  "condition": {
    "item": "spirit_stone",
    "op": ">=",
    "value": 1
  }
}
```

## 阶段 5：类型模板 v1

### 修仙模板

核心循环：

```text
入门/当前困境
  -> 修炼/悟道
  -> 资源选择
  -> 外出历练
  -> 人情因果
  -> 突破/失败
  -> 新境界或新危机
```

推荐变量：

```json
{
  "realm": "炼气三层",
  "cultivation": 12,
  "qi": 30,
  "daoHeart": 3,
  "comprehension": 5,
  "karma": 0,
  "tribulationRisk": 0,
  "sectReputation": 0,
  "masterTrust": 0
}
```

每章至少包含：

- 1 个修炼或悟道互动。
- 1 个资源/法宝/丹药选择。
- 1 个道心或因果选择。
- 1 个境界/功法反馈。

### 无限恐怖模板

核心循环：

```text
主神空间
  -> 任务发布
  -> 进入恐怖世界
  -> 搜索情报
  -> 团队分歧
  -> 危机爆发
  -> 支线奖励/逃生抉择
  -> 回归结算
  -> 强化兑换
```

推荐变量：

```json
{
  "hp": 100,
  "sanity": 70,
  "points": 0,
  "teamTrust": 0,
  "danger": 1,
  "clue": 0,
  "timeLeft": 6,
  "infection": 0
}
```

每个任务世界必须包含：

- 明确主线任务。
- 时间或危险度压力。
- 至少 3 个可调查场景。
- 团队信任变化。
- 至少 1 个支线奖励诱惑。
- 回归结算节点。

## 阶段 6：类型模板 v2

### 悬疑推理

核心数值：

- `deduction`：推理完整度。
- `clueCount`：线索数量。
- `pressure`：压力。
- `suspectAlert`：嫌疑人警觉。
- `mistake`：错误推断次数。

核心交互：

- 调查现场。
- 询问人物。
- 比对证词。
- 提交推理。
- 指认证词矛盾。

### 末世生存

核心数值：

- `hp`：生命。
- `food`：食物。
- `water`：水。
- `ammo`：弹药。
- `shelter`：庇护所安全度。
- `morale`：队伍士气。
- `infection`：感染。
- `noise`：噪音。

核心交互：

- 搜刮。
- 加固。
- 分配物资。
- 侦察。
- 夜晚防守。

### 宫斗/权谋

核心数值：

- `favor`：宠信。
- `suspicion`：疑心。
- `reputation`：名声。
- `silver`：银钱。
- `intel`：情报。
- `queenHostility`：皇后敌意。
- `factionPower`：派系力量。

核心交互：

- 送礼。
- 打探。
- 试探。
- 布置眼线。
- 交换利益。

## 阶段 7：Skill 生成流程升级

### 类型识别

Skill 在改编方向阶段必须判断原作类型：

- 修仙。
- 无限恐怖/副本生存。
- 悬疑推理。
- 末世生存。
- 宫斗权谋。
- 普通文学/现实向。

### RPG 规划输出

如果识别为强类型，内部规划必须包含：

- 玩法循环。
- 核心数值。
- 可见数值。
- 隐藏数值。
- 场景交互类型。
- 失败机制。
- 成长/结算机制。

### 快速模式补充

快速模式也必须生成轻玩法摘要：

- 类型判断。
- 3-5 个核心数值。
- 2-3 种场景交互。
- 3-5 个结局方向。

## 阶段 8：校验器与调试器增强

### 校验器新增规则

- `meta.rpg.primaryStats` 引用的变量必须存在。
- `changes.set` 修改的变量建议在 `variables` 中定义。
- `condition.var` 引用的变量必须存在或由前置路径设置。
- `condition.item` 引用的道具必须存在。
- `changes.inventory` 不应导致道具负数。
- `interactions[].id` 在节点内唯一。
- `once=true` 的 interaction 不应承担唯一主线出口。
- 类型模板必需字段检查。

### 调试器新增能力

- 查看并修改所有 variables。
- 查看 inventory。
- 添加/删除道具。
- 查看 flags。
- 查看当前可见/不可见选项及原因。
- 测试 interaction。
- 查看 routes 命中情况。
- 一键模拟进入某结局。

## 阶段 9：示例库与发布

建议示例目录：

```text
examples/
├── literary/
│   └── 成人日.json
├── xianxia/
│   ├── 青炉夜火.quick.json
│   └── 境界突破.demo.json
├── infinite-horror/
│   ├── 七日医院.quick.json
│   └── 主神空间结算.demo.json
├── mystery/
│   └── 雨夜证词.demo.json
├── apocalypse/
│   └── 停电第七天.demo.json
└── palace/
    └── 春宴试探.demo.json
```

每个示例应说明：

- 使用了哪些变量。
- 哪些是可见数值。
- 哪些是隐藏数值。
- 哪些节点演示 `interactions`。
- 哪些 `routes` 控制结局。

## MVP 范围

最小可行版本建议只做以下 5 件事：

1. `meta.rpg.primaryStats`。
2. 状态栏展示 variables。
3. `changes` 前后 diff 弹窗。
4. condition 不满足选项置灰提示。
5. 修仙 demo JSON。

这 5 件事不大改结构，但能让体验从“分支小说”明显变成“轻 RPG 文游”。

## 风险控制

### 数值压过文学

- 可见数值最多 5 个。
- 每个数值必须有叙事含义。
- 不做复杂公式。
- 选择反馈先写文本，再显示数值。

### JSON 变复杂

- 所有新字段可选。
- 旧 JSON 完全兼容。
- `interactions` / `inventory` 分阶段加入。
- `validate.py` 给出清晰错误。

### AI 生成失控

- Skill 提供类型模板。
- 每类限制核心数值数量。
- 每类规定最小互动结构。
- 校验器检查结构。
- 示例库提供参考。

### 启动器难维护

- 源码拆分开发。
- 构建时打包单文件。
- 发布物仍保持“一个 HTML 可运行”。
