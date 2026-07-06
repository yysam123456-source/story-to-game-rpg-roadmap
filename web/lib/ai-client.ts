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

/**
 * 非流式生成（备用）
 */
export async function generateStory(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string,
  rules?: Record<string, unknown>
): Promise<string> {
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
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 获取当前配置信息
 */
export function getAIConfig() {
  return {
    provider: API_BASE,
    model: MODEL,
    hasKey: !!API_KEY,
  };
}
