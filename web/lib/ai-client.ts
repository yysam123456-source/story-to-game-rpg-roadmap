/**
 * AI 生成客户端 — 多接口聚合层
 * 支持通过环境变量切换不同提供商，无需代码改动
 * 
 * 支持的提供商：
 * - SiliconFlow（硅基流动）：https://api.siliconflow.cn/v1
 * - DeepSeek 官方：https://api.deepseek.com/v1
 * - 阿里云百炼：https://dashscope.aliyuncs.com/compatible-mode/v1
 * - OpenAI 官方：https://api.openai.com/v1
 * - OpenRouter：https://openrouter.ai/api/v1
 * - 任意 OpenAI 兼容接口
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}

// ===== 配置读取（环境变量）=====
const API_KEY = process.env.AI_API_KEY || '';
const API_BASE = process.env.AI_API_BASE || 'https://api.siliconflow.cn/v1';
const MODEL = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3';

// 预设提供商配置（方便快速切换）
export const AI_PROVIDERS = {
  siliconflow: {
    name: '硅基流动',
    base: 'https://api.siliconflow.cn/v1',
    models: [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen2.5-72B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'THUDM/glm-4-9b-chat',
    ],
    recommend: '国内最便宜，推理速度快，新用户送大量免费额度',
  },
  deepseek: {
    name: 'DeepSeek 官方',
    base: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    recommend: '价格便宜，推理能力强，适合长文本生成',
  },
  bailian: {
    name: '阿里云百炼',
    base: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    recommend: '阿里系模型，中文能力强，新用户有免费额度',
  },
  openai: {
    name: 'OpenAI',
    base: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini'],
    recommend: '国际标杆，质量最高，但需要代理',
  },
  openrouter: {
    name: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
    recommend: '聚合平台，可以访问 Claude、GPT-4 等',
  },
};

function buildSystemPrompt(genre: string, enableRPG: boolean, rules?: Record<string, unknown>): string {
  const rpgHint = enableRPG
    ? `\n\n【RPG 模式已启用】\n请在 meta.rpg 中配置 primaryStats（最多5个可见数值），并在选项 changes 中设计数值变动。参考类型模板：修仙作品推荐配置境界、修为、灵力、心境、气血。`
    : '';

  let rulesHint = '';
  if (rules) {
    const parts = [];
    if (rules.pacing) parts.push(`节奏密度：${rules.pacing === 'compact' ? '紧凑（每2-3句一个选择）' : rules.pacing === 'relaxed' ? '舒缓（每7-10句一个选择）' : '适中（每4-6句一个选择）'}`);
    if (rules.choiceStyle) parts.push(`选项风格：${rules.choiceStyle === 'direct' ? '直接台词' : rules.choiceStyle === 'inner_monologue' ? '内心独白' : '行动描述'}`);
    if (rules.statImpact) parts.push(`数值影响强度：${rules.statImpact === 'light' ? '轻度' : rules.statImpact === 'heavy' ? '重度' : '中度'}`);
    if (rules.hiddenContentRatio) parts.push(`隐藏内容比例：${rules.hiddenContentRatio === 'low' ? '少' : rules.hiddenContentRatio === 'high' ? '多' : '中'}`);
    if (rules.endingBias) parts.push(`结局倾向：${rules.endingBias === 'heavy' ? 'HE偏多' : rules.endingBias === 'dark' ? 'BE偏多' : rules.endingBias === 'random' ? '随机' : '均衡'}`);
    if (rules.narrativePerson) parts.push(`叙事人称：${rules.narrativePerson === 'first' ? '第一人称"我"' : '第二人称"你"'}`);
    if (rules.dialogueDensity) parts.push(`对白密度：${rules.dialogueDensity === 'low' ? '低（重叙述）' : rules.dialogueDensity === 'high' ? '高（重对话）' : '中'}`);
    if (rules.informationAsymmetry) parts.push('信息不对称：启用（玩家与角色知道的信息不同）');
    if (rules.timePressure) parts.push('时间压力：启用（加入倒计时或时限机制）');
    if (rules.npcRelations) parts.push('NPC关系网络：启用（设计可变化的好感度系统）');
    if (parts.length > 0) {
      rulesHint = '\n\n【创作者自定义规则】\n' + parts.join('\n');
    }
  }

  return `你是一个专业的互动叙事游戏编剧。你的任务是将用户提供的小说文本改写为符合「分支剧情游戏启动器」格式的 JSON 剧本。

输出格式要求：
1. 必须符合以下 JSON Schema 结构
2. meta 字段包含 title、author、genre、version
3. nodes 是节点字典，每个节点包含 segments（文本数组）和 choices（选项数组）
4. choices 的 targetNodeId 必须指向存在的节点
5. 选项必须自然、有叙事意义，不是简单的"是/否"
6. 支持条件分支：choice.condition 使用 {variable, operator, value} 格式
7. 支持数值变化：choice.changes 使用 {variable, value, show?} 格式${rpgHint}${rulesHint}

当前类型：${genre}

请直接输出合法 JSON，不要包含 markdown 代码块标记。`;
}

function buildUserPrompt(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string,
  rules?: Record<string, unknown>
): string {
  const titleHint = title ? `\n作品标题：${title}` : '';
  const rpgHint = enableRPG ? '\n请启用 RPG 数值系统，设计符合该类型的主状态值。' : '';
  let rulesHint = '';
  if (rules) {
    if (rules.timePressure) rulesHint += '\n- 加入时间压力机制：设置倒计时或时限节点';
    if (rules.npcRelations) rulesHint += '\n- 设计 NPC 关系网络：至少3个有名字的角色，带好感度变化';
    if (rules.informationAsymmetry) rulesHint += '\n- 信息不对称：设计角色知道但玩家不知道的隐藏信息';
    if (rules.pacing === 'compact') rulesHint += '\n- 节奏紧凑：每2-3句就给一个选择';
    if (rules.pacing === 'relaxed') rulesHint += '\n- 节奏舒缓：充分叙述后再给选择';
  }

  return `请将以下小说文本改写为互动叙事游戏剧本。${titleHint}\n类型：${genre}${rpgHint}${rulesHint}\n\n小说文本：\n\n${novelText}\n\n要求：\n1. 生成 40-80 个节点\n2. 3-5 个不同结局\n3. 5-10 个成就\n4. 每 1-5 句正文给玩家一次选择\n5. 直接输出纯 JSON，不要 markdown`;
}

/**
 * 流式生成故事剧本
 * 返回 AsyncGenerator，支持 SSE 推送进度
 */
export async function* generateStoryStream(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string,
  rules?: Record<string, unknown>
): AsyncGenerator<AIStreamResponse> {
  const systemPrompt = buildSystemPrompt(genre, enableRPG, rules);
  const userPrompt = buildUserPrompt(novelText, genre, enableRPG, title, rules);

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          yield { content: '', done: true };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            yield { content, done: false };
          }
        } catch {
          // ignore parse error
        }
      }
    }
  }

  yield { content: '', done: true };
}

// ================================================================
// Pipeline v2: 分阶段专用生成方法
// ================================================================

import type { StoryOutline, StateDesign, ChapterResult, CreatorRules, StoryNode, ItemDef } from '@/types';

/**
 * 阶段 2: 生成剧情大纲
 * 输入：各章摘要列表，输出：完整大纲 JSON
 */
export async function generateOutline(
  chapterSummaries: string[],
  genre: string,
  title?: string,
  enableRPG?: boolean,
  rules?: CreatorRules,
  onChunk?: (chunk: string) => void
): Promise<StoryOutline> {
  const systemPrompt = `你是一个专业的互动叙事游戏架构师。你的任务是根据小说各章摘要，设计完整的分支剧情大纲。

输出必须为合法 JSON，格式如下：
{
  "title": "作品标题",
  "genre": "类型",
  "summary": "整体剧情概述（200字以内）",
  "totalNodesEstimate": 60,
  "endings": [
    { "title": "结局名", "condition": "达成条件描述", "type": "true|dark|romance|neutral" }
  ],
  "milestones": [
    { "title": "里程碑名", "condition": "触发条件描述" }
  ],
  "chapterPlans": [
    {
      "chapterIndex": 0,
      "title": "章标题",
      "nodeCountEstimate": 8,
      "keyEvents": ["关键事件1", "关键事件2"],
      "branchPoints": [
        { "description": "分支点描述", "type": "choice" }
      ],
      "explorations": ["可探索的场景/元素描述1", "可探索的场景/元素描述2"],
      "checks": [
        { "skill": "技能名", "dc": 14, "description": "检定描述" }
      ],
      "dialogues": [
        { "npcId": "NPC_id", "topicCount": 3 }
      ]
    }
  ]
}

要求：
- endings 至少 3 个，最多 5 个
- milestones 至少 3 个
- chapterPlans 必须覆盖所有输入的章节
- 每个 branchPoints 描述一个玩家可能做出重大选择的节点
- branchPoints.type 必须是 "choice"|"check"|"exploration"|"dialogue" 之一
- explorations 列出每章中可探索的场景或可调查元素
- checks 列出每章中的技能检定点，包含技能名、难度(dc)和描述
- dialogues 列出每章中的对话场景，包含NPC ID和预计话题数(3-5个)
- 每章通常有 2-3 个 explorations、0-2 个 checks、1-2 个 dialogues`;

  const userPrompt = `请为以下${genre}题材小说设计互动叙事大纲：
${title ? `\n作品标题：${title}` : ''}
${enableRPG ? '\n需要设计 RPG 数值系统' : ''}
${rules?.npcRelations ? '\n需要设计 NPC 关系网络' : ''}
${rules?.timePressure ? '\n需要设计时间压力机制' : ''}

各章摘要：
${chapterSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

请直接输出 JSON。`;

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Outline generation failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            onChunk?.(content);
          }
        } catch { /* ignore */ }
      }
    }
  }

  const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as StoryOutline;
}

/**
 * 阶段 3: 生成状态系统设计
 * 输入：大纲，输出：variables + primaryStats + npcRelations + achievements
 */
export async function generateStateDesign(
  outline: StoryOutline,
  genre: string,
  enableRPG?: boolean,
  rules?: CreatorRules
): Promise<StateDesign> {
  const systemPrompt = `你是一个专业的游戏数值设计师。根据剧情大纲，设计 RPG 状态系统。

输出必须为合法 JSON：
{
  "variables": { "变量名": 初始值 },
  "primaryStats": [
    { "key": "变量名", "label": "显示名", "type": "text|number|bar", "max": 100, "tone": "positive|danger|neutral" }
  ],
  "npcRelations": {
    "npcs": [
      { "id": "唯一标识", "name": "角色名", "defaultAffinity": 0, "description": "角色描述" }
    ]
  },
  "timePressure": {
    "enabled": false,
    "mode": "turn",
    "turnsPerCycle": 10,
    "globalDecay": [{ "variable": "变量名", "delta": -1 }]
  },
  "items": {
    "item_id": {
      "id": "item_id",
      "name": "物品名称",
      "desc": "物品描述",
      "category": "key_items",
      "usable": true,
      "usableIn": ["node_id1"],
      "onUse": {
        "text": "使用时的叙事文本",
        "changes": { "属性名": 变化值 },
        "flag": "标记名",
        "consume": true
      }
    }
  },
  "achievements": {
    "achievement_id": {
      "id": "achievement_id",
      "title": "成就名",
      "description": "描述",
      "category": "general",
      "rarity": "common"
    }
  }
}

物品系统说明：
- category 必须是 "key_items"（关键道具）、"consumables"（消耗品）、"equipment"（装备）之一
- usable 表示玩家是否可以主动使用此物品
- usableIn 为 null 时表示任何场景都可以使用，为字符串数组时限制为特定节点ID
- onUse.text 是使用物品时显示的叙事文本
- onUse.changes 是使用物品后的属性变化
- onUse.flag 是使用物品后触发的标记
- onUse.consume 为 true 表示使用后消耗（数量减一）
- 根据剧情需要设计 3-10 个物品，每个物品都有叙事用途`;

  const userPrompt = `请为「${outline.title}」设计${genre}类型的状态系统。
${enableRPG ? '' : '本作为纯文学模式，无需复杂数值，只需基础 variables。'}
${rules?.npcRelations ? '需要设计 NPC 关系网络。' : ''}
${rules?.timePressure ? '需要设计时间压力机制。' : ''}

剧情概述：${outline.summary}
结局设计：${outline.endings.map(e => e.title).join('、')}

请直接输出 JSON。`;

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`State design failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as StateDesign;
}

/**
 * 阶段 4: 逐章生成节点
 * 输入：单章内容 + 全局上下文，输出：该章的 nodes
 */
export async function generateChapter(
  params: {
    chapterIndex: number;
    totalChapters: number;
    title: string;
    content: string;
    prevHint: string;
    nextHint: string;
    outline: StoryOutline;
    stateDesign: StateDesign;
    currentVariables: Record<string, number | string | boolean>;
    currentFlags: string[];
    /** v2.0: item definitions from state design for reference */
    storyItems?: Record<string, ItemDef>;
  },
  genre: string,
  enableRPG?: boolean,
  rules?: CreatorRules,
  onProgress?: (tokens: number) => void
): Promise<ChapterResult> {
  const systemPrompt = `你是一个专业的互动叙事游戏编剧（v2.0架构）。根据提供的章节内容和全局上下文，生成本章的交互节点。

输出必须为合法 JSON，格式如下：
{
  "nodes": {
    "node_${params.chapterIndex}_001": {
      "id": "node_${params.chapterIndex}_001",
      "type": "narrative",
      "chapterTitle": "${params.title}",
      "title": "场景标题",
      "segments": [
        { "type": "narrative", "text": "叙述文本" },
        { "type": "dialogue", "text": "对话内容", "speaker": "角色名" },
        { "type": "inner_monologue", "text": "内心独白", "effect": "微微一怔" }
      ],
      "next": "node_${params.chapterIndex}_002"
    },
    "node_${params.chapterIndex}_010": {
      "id": "node_${params.chapterIndex}_010",
      "type": "exploration",
      "title": "可探索场景",
      "segments": [{ "type": "narrative", "text": "你来到了一处..." }],
      "explorables": [
        {
          "id": "exp_001",
          "label": "古老的石碑",
          "description": "石碑上刻着模糊的文字",
          "check": { "skill": "学识", "dc": 14, "onSuccess": { "text": "你辨认出...", "changes": { "学识": 1 }, "grantItems": ["ancient_scroll"] }, "onFailure": { "text": "你无法辨认..." } },
          "condition": null
        },
        {
          "id": "exp_002",
          "label": "角落的宝箱",
          "description": "一个小巧的木箱",
          "result": { "text": "你打开宝箱，发现了一把钥匙。", "grantItems": ["rusty_key"], "changes": { "运气": 1 } }
        }
      ]
    },
    "node_${params.chapterIndex}_020": {
      "id": "node_${params.chapterIndex}_020",
      "type": "dialogue",
      "title": "与NPC对话",
      "segments": [{ "type": "narrative", "text": "一位老者向你走来..." }],
      "dialogue": {
        "npc": "elder_wang",
        "greeting": "年轻人，你看起来面生啊。",
        "topics": [
          { "id": "topic_01", "text": "打听消息", "response": [{ "type": "dialogue", "text": "最近山里不太平...", "speaker": "王老汉" }], "condition": null, "changes": { "情报": 1 }, "affinityChanges": [{ "npcId": "elder_wang", "delta": 1 }], "grantItems": null },
          { "id": "topic_02", "text": "请求帮助", "response": "王老汉沉思片刻...", "condition": { "variable": "好感_elder_wang", "operator": ">=", "value": 10 } }
        ]
      }
    },
    "node_${params.chapterIndex}_030": {
      "id": "node_${params.chapterIndex}_030",
      "type": "check",
      "title": "技能检定",
      "segments": [{ "type": "narrative", "text": "你需要攀上悬崖..." }],
      "check": {
        "skill": "体魄",
        "dc": 16,
        "cost": { "体力": 5 },
        "onSuccess": { "text": "你成功攀上了悬崖！", "changes": { "体魄": 2 }, "flag": "climbed_cliff", "grantItems": ["cliff_herb"] },
        "onFailure": { "text": "你从崖壁滑落，但幸运地抓住了树枝。", "flag": "fell_from_cliff", "changes": { "体力": -3 } }
      }
    },
    "node_${params.chapterIndex}_040": {
      "id": "node_${params.chapterIndex}_040",
      "type": "choice",
      "title": "关键抉择",
      "segments": [{ "type": "narrative", "text": "你面前出现了两条路..." }],
      "choices": [
        {
          "id": "choice_040_a",
          "text": "选择冒险的小路",
          "targetNodeId": "node_${params.chapterIndex}_041",
          "weight": 2,
          "changes": [{ "variable": "勇气", "value": 5, "show": true }],
          "hint": "这条路充满未知",
          "delayedChanges": [{ "triggerAt": "chapter_3", "changes": { "声望": 10 }, "reminderText": "你当初的冒险选择传开了..." }]
        },
        {
          "id": "choice_040_b",
          "text": "选择安全的官道",
          "targetNodeId": "node_${params.chapterIndex}_042",
          "weight": 1,
          "changes": [{ "variable": "谨慎", "value": 5, "show": true }]
        }
      ]
    },
    "node_${params.chapterIndex}_099": {
      "id": "node_${params.chapterIndex}_099",
      "type": "scene_transition",
      "title": "场景切换",
      "segments": [{ "type": "narrative", "text": "你离开了这片区域..." }],
      "scene": { "name": "新的地点", "type": "major", "description": "一个繁忙的市镇" },
      "next": "node_next"
    },
    "node_${params.chapterIndex}_100": {
      "id": "node_${params.chapterIndex}_100",
      "type": "ending",
      "title": "结局",
      "isEnding": true,
      "segments": [{ "type": "narrative", "text": "故事结束了。" }],
      "candidateEndings": ["ending_good"]
    }
  },
  "variablesDelta": { "变量名": 变化值 },
  "flagsAdded": ["flag_name"],
  "npcAffinitiesDelta": { "npcId": 变化值 },
  "itemsGranted": ["item_id_1"]
}

## 关键设计原则（极其重要）

1. **不是每个节点都需要选择**。大部分节点应该是 narrative 类型（纯叙事，通过 next 自动推进）。
2. 只有在主角面临道德困境、战略抉择、关系转折时才设 choice 节点。每章最多1-2个 choice 节点。
3. exploration 节点用于可调查的场景（每章2-3个），每个探索元素有检定或直接结果。
4. dialogue 节点用于与NPC的主动对话（每章1-2个），话题由条件解锁。
5. check 节点用于关键的技能检定（每章0-2个），成功和失败都有不同的叙事。
6. 检定失败不是游戏结束，而是另一种故事走向。
7. conditionalSegments 用于高属性时显示额外叙事内容。
8. 选项的 delayedChanges 用于延迟后果（在后续章节才显现）。

## 通用要求
- 每章生成 5-15 个节点，节点 ID 格式：node_章节索引_序号（如 node_${params.chapterIndex}_001）
- segments 使用结构化格式：\`{ type: "narrative"|"dialogue"|"inner_monologue", text: string, speaker?: string, effect?: string }\`
- 也可以使用纯字符串格式（等同于 type=narrative），但推荐结构化
- conditionalSegments 用于根据玩家状态显示额外内容：\`{ condition: {variable, operator, value}, segments: [...] }\`
- grantItems 用于进入节点时自动获得物品：\`[{ item: "item_id", category: "key_items", qty: 1, desc: "描述" }]\`
- changes 中的变量必须存在于全局变量列表中
- 选项的 targetNodeId 必须指向本章内的其他节点，不能跨章引用（最后一章或章末使用 "node_next" 衔接下一章）
- 不要在 choices 中显示条件提示（如"需要 修为 >= 10"）或英文属性名
- exploration 节点的 explorables 中每个元素必须有 id 和 label
- dialogue 节点的 dialogue 必须包含 npc 和 topics 数组
- check 节点的 check 必须包含 skill、dc、onSuccess、onFailure`;

  const userPrompt = `请生成本章的交互节点。

【全局信息】
类型：${genre}
作品：${params.outline.title}
本章位置：第 ${params.chapterIndex + 1}/${params.totalChapters} 章
本章大纲：${params.outline.chapterPlans[params.chapterIndex]?.keyEvents.join('、') || ''}

【状态上下文】
当前变量状态：${JSON.stringify(params.currentVariables)}
已触发标记：${params.currentFlags.join(', ') || '无'}
${params.storyItems && Object.keys(params.storyItems).length > 0 ? `已设计的物品列表：${JSON.stringify(Object.fromEntries(Object.entries(params.storyItems).map(([id, item]) => [id, { id: item.id, name: item.name, desc: item.desc, category: item.category, usable: item.usable }])))}\n在 grantItems 或 explorables/check 的结果中引用物品时，请使用以上物品的 id。` : ''}

【衔接信息】
${params.prevHint}
${params.nextHint}

【本章内容】
${params.content.slice(0, 4000)}

${enableRPG ? '请设计选项的数值变化。' : ''}
${rules?.pacing === 'compact' ? '节奏紧凑：每2-3句正文给一个选择。' : rules?.pacing === 'relaxed' ? '节奏舒缓：充分叙述后再给选择。' : ''}

请直接输出 JSON。`;

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      temperature: 0.75,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chapter generation failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let tokenCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            tokenCount += content.length;
            onProgress?.(tokenCount);
          }
        } catch { /* ignore */ }
      }
    }
  }

  const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // JSON 解析失败，尝试修复常见格式问题
    const repaired = repairJSON(cleaned);
    parsed = JSON.parse(repaired);
  }

  // Schema 验证：确保 AI 输出结构正确
  const validated = validateChapterResult(parsed, params.chapterIndex, params.title);

  return {
    chapterIndex: params.chapterIndex,
    title: params.title,
    nodes: validated.nodes,
    variablesDelta: validated.variablesDelta || {},
    flagsAdded: validated.flagsAdded || [],
    npcAffinitiesDelta: validated.npcAffinitiesDelta,
    itemsGranted: validated.itemsGranted,
  };
}

/**
 * 修复常见的 JSON 格式问题（尾逗号、截断等）
 */
function repairJSON(raw: string): string {
  let s = raw.trim();
  // 移除尾逗号
  s = s.replace(/,(\s*[}\]])/g, '$1');
  // 如果 JSON 被截断（最后一个 } 或 ] 缺失），尝试补全
  const openBraces = (s.match(/{/g) || []).length;
  const closeBraces = (s.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    s += '}'.repeat(openBraces - closeBraces);
  }
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    s += ']'.repeat(openBrackets - closeBrackets);
  }
  return s;
}

/**
 * 验证 AI 返回的章节结果，确保结构正确（v2.0）
 */
const VALID_NODE_TYPES = ['narrative', 'exploration', 'dialogue', 'check', 'choice', 'scene_transition', 'ending'];

function validateChapterResult(
  parsed: unknown,
  chapterIndex: number,
  title: string
): Omit<ChapterResult, 'chapterIndex' | 'title'> {
  const result = parsed as Record<string, unknown>;
  if (!result || typeof result !== 'object') {
    throw new Error('AI 返回的 JSON 不是有效对象');
  }

  const nodes = result.nodes as Record<string, StoryNode> | undefined;
  if (!nodes || typeof nodes !== 'object' || Object.keys(nodes).length === 0) {
    throw new Error(`AI 返回的章节 "${title}" 没有 nodes 或 nodes 为空`);
  }

  // 验证每个节点的结构
  const validatedNodes: Record<string, StoryNode> = {};
  let nodeIdCounter = 0;

  for (const [rawId, rawNode] of Object.entries(nodes)) {
    const node = rawNode as StoryNode;
    const nodeId = rawId || `node_${chapterIndex}_${String(nodeIdCounter + 1).padStart(3, '0')}`;
    nodeIdCounter++;

    // v2.0: 验证节点类型
    if (node.type && !VALID_NODE_TYPES.includes(node.type)) {
      console.warn(`[validate] 节点 ${nodeId} 的 type "${node.type}" 不合法，已忽略`);
    }

    // v2.0: 验证 explorables
    if (node.explorables && Array.isArray(node.explorables)) {
      for (const exp of node.explorables) {
        if (!exp.id || !exp.label) {
          console.warn(`[validate] 节点 ${nodeId} 的 explorable 缺少 id 或 label，已跳过`);
          continue;
        }
      }
    }

    // v2.0: 验证 dialogue
    if (node.dialogue) {
      if (!node.dialogue.npc) {
        console.warn(`[validate] 节点 ${nodeId} 的 dialogue 缺少 npc 字段`);
      }
      if (!node.dialogue.topics || !Array.isArray(node.dialogue.topics) || node.dialogue.topics.length === 0) {
        console.warn(`[validate] 节点 ${nodeId} 的 dialogue 缺少 topics 或 topics 为空`);
      }
    }

    // v2.0: 验证 check
    if (node.check) {
      if (!node.check.skill) {
        console.warn(`[validate] 节点 ${nodeId} 的 check 缺少 skill 字段`);
      }
      if (node.check.dc === undefined || node.check.dc === null) {
        console.warn(`[validate] 节点 ${nodeId} 的 check 缺少 dc 字段`);
      }
      if (!node.check.onSuccess) {
        console.warn(`[validate] 节点 ${nodeId} 的 check 缺少 onSuccess`);
      }
      if (!node.check.onFailure) {
        console.warn(`[validate] 节点 ${nodeId} 的 check 缺少 onFailure`);
      }
    }

    // 确保必填字段存在，同时保留 v2.0 字段
    validatedNodes[nodeId] = {
      id: nodeId,
      type: (node.type && VALID_NODE_TYPES.includes(node.type)) ? node.type : node.type,
      chapterTitle: node.chapterTitle || title,
      title: node.title || '',
      segments: Array.isArray(node.segments) ? node.segments : [typeof node.segments === 'string' ? node.segments : ''],
      // v2.0 fields
      explorables: node.explorables,
      dialogue: node.dialogue,
      check: node.check,
      conditionalSegments: node.conditionalSegments,
      grantItems: node.grantItems,
      // legacy choice support
      choices: Array.isArray(node.choices) ? node.choices.map((c, idx) => ({
        id: c.id || `choice_${nodeId}_${idx}`,
        text: c.text || '继续',
        targetNodeId: c.targetNodeId || 'node_next',
        weight: c.weight ?? 2,
        changes: Array.isArray(c.changes) ? c.changes : undefined,
        condition: c.condition,
        affinityChanges: c.affinityChanges,
        countdown: c.countdown,
        hint: c.hint,
        delayedChanges: c.delayedChanges,
      })) : [],
      scene: node.scene,
      progress: node.progress,
      theme: node.theme,
      ambient: node.ambient,
      next: node.next,
      routes: node.routes,
      isEnding: node.isEnding,
      candidateEndings: node.candidateEndings,
      interactions: node.interactions,
      delayedChanges: node.delayedChanges,
      condition: node.condition,
      countdown: node.countdown,
      npcDialogue: node.npcDialogue,
    };
  }

  return {
    nodes: validatedNodes,
    variablesDelta: (result.variablesDelta as Record<string, number | string | boolean>) || {},
    flagsAdded: (result.flagsAdded as string[]) || [],
    npcAffinitiesDelta: result.npcAffinitiesDelta as Record<string, number> | undefined,
    itemsGranted: (result.itemsGranted as string[]) || undefined,
  };
}
