import { NextRequest } from 'next/server';
import { jobQueue } from '@/lib/job-queue';
import { pipeline } from '@/lib/generate-pipeline';
import { PipelineInput } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/generate/:id
 * SSE 流式订阅生成进度
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = jobQueue.getJob(id);

  if (!job) {
    return Response.json(
      { success: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 发送当前状态
      const initEvent = {
        type: 'sync',
        jobId: id,
        stage: job.stage,
        progress: job.progress,
        message: job.currentStep,
        detail: {
          totalChapters: job.totalChapters,
          completedChapters: job.completedChapters,
          estimatedRemainingSeconds: job.estimatedRemainingSeconds,
          chapterStatuses: job.chapterStatuses,
          error: job.error,
          recoverable: job.recoverable,
          result: job.result,
        },
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initEvent)}\n\n`)
      );

      // 如果已完成或已失败，发送终结事件并关闭
      if (job.stage === 'COMPLETED' || job.stage === 'FAILED') {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
        return;
      }

      // 订阅后续事件
      const unsubscribe = jobQueue.subscribe(id, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );

          if (event.type === 'complete' || event.type === 'error') {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        } catch {
          // 客户端断开时忽略
        }
      });

      // 心跳保持连接（每 30 秒）
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // 清理
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // 如果底层流关闭，清理
      // ReadableStream 没有直接的事件，但 enqueue 抛异常时会触发 close
      // 这里依赖 subscribe 回调中的 try/catch
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * POST /api/generate/:id
 * 重试失败的任务
 * Body: { text, genre, title?, enableRPG?, rules? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = jobQueue.getJob(id);

    if (!job) {
      return Response.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.stage !== 'FAILED') {
      return Response.json(
        { success: false, error: 'Job is not in failed state' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const input: PipelineInput = {
      text: body.text,
      genre: body.genre || 'general',
      title: body.title,
      enableRPG: body.enableRPG ?? false,
      rules: body.rules,
    };

    const ok = await pipeline.retry(id, input);

    if (!ok) {
      return Response.json(
        { success: false, error: 'Job is not recoverable' },
        { status: 400 }
      );
    }

    return Response.json({ success: true, data: { jobId: id } });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
