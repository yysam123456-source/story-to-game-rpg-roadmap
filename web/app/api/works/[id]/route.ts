import { NextRequest } from 'next/server';
import { getWorkMeta, getWorkScript, deleteWork } from '@/lib/storage';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/works/:id
 * 获取单个作品的元数据或完整剧本
 * Query: ?format=meta|script (default: meta)
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'meta';

    if (format === 'script') {
      const script = await getWorkScript(id);
      if (!script) {
        return new Response(
          JSON.stringify({ success: false, error: 'Work not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: script }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const meta = await getWorkMeta(id);
    if (!meta) {
      return new Response(
        JSON.stringify({ success: false, error: 'Work not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: meta }),
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
 * DELETE /api/works/:id
 * 删除作品
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteWork(id);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
