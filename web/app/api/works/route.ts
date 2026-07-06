import { NextRequest } from 'next/server';
import { listWorks, saveWork } from '@/lib/storage';
import { WorkMeta, StoryScript } from '@/types';

export const runtime = 'nodejs';

/**
 * GET /api/works
 * 获取作品列表
 */
export async function GET() {
  try {
    const works = await listWorks();
    return new Response(
      JSON.stringify({ success: true, data: works }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/works
 * 手动创建/导入作品
 * Body: { script: StoryScript }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script } = body as { script: StoryScript };

    if (!script || !script.meta) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid script format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const meta: WorkMeta = {
      id,
      title: script.meta.title || '未命名作品',
      genre: script.meta.genre || 'general',
      author: script.meta.author || '未知作者',
      description: script.meta.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: Object.keys(script.nodes || {}).length,
      endingCount: Object.keys(script.endings || {}).length,
      playCount: 0,
    };

    await saveWork(id, meta, script);

    return new Response(
      JSON.stringify({ success: true, data: { id, meta } }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
