import { NextRequest } from 'next/server';
import { jobQueue } from '@/lib/job-queue';
import { pipeline } from '@/lib/generate-pipeline';
import { PipelineInput } from '@/types';

export const runtime = 'nodejs';

/**
 * POST /api/generate
 * 启动生成任务，返回 jobId
 * Body: { text, genre, title?, enableRPG?, rules? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, genre, title, enableRPG = false, rules } = body;

    if (!text || typeof text !== 'string') {
      return Response.json(
        { success: false, error: 'Missing text field' },
        { status: 400 }
      );
    }

    const input: PipelineInput = {
      text,
      genre: genre || 'general',
      title,
      enableRPG,
      rules,
    };

    const jobId = jobQueue.createJob({
      textLength: text.length,
      genre: input.genre,
      title,
    });

    // 异步启动流水线，不阻塞响应
    pipeline.run(jobId, input).catch(() => {});

    return Response.json({ success: true, data: { jobId } });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
