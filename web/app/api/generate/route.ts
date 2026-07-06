import { NextRequest } from 'next/server';
import { generateStoryStream } from '@/lib/ai-client';
import { saveWork } from '@/lib/storage';
import { WorkMeta, StoryScript } from '@/types';

export const runtime = 'nodejs';

/**
 * POST /api/generate
 * SSE 流式生成故事剧本
 * Body: { text: string, genre: string, title?: string, enableRPG?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, genre, title, enableRPG = false } = body;

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing text field' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const id = `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';

          // 发送开始事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', id })}\n\n`)
          );

          // 流式生成
          const generator = generateStoryStream(text, genre || 'general', enableRPG, title);
          for await (const chunk of generator) {
            if (chunk.done) break;
            fullContent += chunk.content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`)
            );
          }

          // 解析 JSON
          let script: StoryScript;
          try {
            // 清理可能的 markdown 代码块
            const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            script = JSON.parse(cleaned) as StoryScript;
          } catch (e) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'JSON parse failed: ' + (e as Error).message })}\n\n`)
            );
            controller.close();
            return;
          }

          // 保存作品
          const meta: WorkMeta = {
            id,
            title: script.meta.title || title || '未命名作品',
            genre: script.meta.genre || genre || 'general',
            author: script.meta.author || 'AI生成',
            description: script.meta.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodeCount: Object.keys(script.nodes || {}).length,
            endingCount: Object.keys(script.endings || {}).length,
            playCount: 0,
          };

          await saveWork(id, meta, script);

          // 发送完成事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'complete', id, meta })}\n\n`)
          );
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: (error as Error).message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
