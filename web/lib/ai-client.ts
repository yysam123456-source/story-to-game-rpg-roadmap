/**
 * AI 生成客户端
 * 支持多模型：OpenAI、Claude、DeepSeek 等
 * 通过环境变量配置，无需代码改动即可切换
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}

const API_KEY = process.env.AI_API_KEY || '';
const API_BASE = process.env.AI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.AI_MODEL || 'gpt-4o';

/**
 * 流式生成故事剧本
 * 返回 AsyncGenerator，支持 SSE 推送进度
 */
export async function* generateStoryStream(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string
): AsyncGenerator<AIStreamResponse> {
  const systemPrompt = buildSystemPrompt(genre, enableRPG);
  const userPrompt = buildUserPrompt(novelText, genre, enableRPG, title);

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

function buildSystemPrompt(genre: string, enableRPG: boolean): string {
  const rpgHint = enableRPG
    ? `\n\n【RPG 模式已启用】\n请在 meta.rpg 中配置 primaryStats（最多5个可见数值），并在选项 changes 中设计数值变动。参考类型：修仙作品推荐配置境界、修为、灵力、心境、气血。`
    : '';

  return `你是一个专业的互动叙事游戏编剧。你的任务是将用户提供的小说文本改写为分支剧情游戏 JSON 剧本。

输出格式要求：
1. 必须符合以下 JSON Schema 结构
2. meta 字段包含 title、author、genre、version
3. nodes 是节点字典，每个节点包含 segments（文本数组）和 choices（选项数组）
4. choices 的 targetNodeId 必须指向存在的节点
5. 选项必须自然、有叙事意义，不是简单的"是/否"
6. 支持条件分支：choice.condition 使用 {variable, operator, value} 格式
7. 支持数值变化：choice.changes 使用 {variable, value, show?} 格式${rpgHint}

当前类型：${genre}

请直接输出合法 JSON，不要包含 markdown 代码块标记。`;
}

function buildUserPrompt(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string
): string {
  const titleHint = title ? `\n作品标题：${title}` : '';
  const rpgHint = enableRPG ? '\n请启用 RPG 数值系统，设计符合该类型的主状态值。' : '';

  return `请将以下小说文本改写为互动叙事游戏剧本。${titleHint}\n类型：${genre}${rpgHint}\n\n小说文本：\n\n${novelText}\n\n要求：\n1. 生成 40-80 个节点\n2. 3-5 个不同结局\n3. 5-10 个成就\n4. 每 1-5 句正文给玩家一次选择\n5. 直接输出纯 JSON，不要 markdown`;
}

/**
 * 非流式生成（备用）
 */
export async function generateStory(
  novelText: string,
  genre: string,
  enableRPG: boolean,
  title?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(genre, enableRPG);
  const userPrompt = buildUserPrompt(novelText, genre, enableRPG, title);

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
