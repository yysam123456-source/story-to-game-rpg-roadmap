/**
 * Job Queue — 内存级生成任务状态机
 * 支持：创建、状态推进、失败标记、重试、SSE 订阅
 * 注：当前为内存实现，服务重启会丢失。生产环境可升级为 Redis。
 */

import { JobStatus, JobStage, PipelineProgressEvent, ProgressEventType } from '@/types';

export class JobQueue {
  private jobs = new Map<string, JobStatus>();
  private subscribers = new Map<string, Set<(event: PipelineProgressEvent) => void>>();

  createJob(input: { textLength: number; genre: string; title?: string }): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: JobStatus = {
      id,
      stage: 'PENDING',
      progress: 0,
      currentStep: '等待开始',
      totalChapters: 0,
      completedChapters: 0,
      estimatedRemainingSeconds: 0,
      recoverable: true,
      chapterStatuses: [],
    };
    this.jobs.set(id, job);
    this.subscribers.set(id, new Set());
    return id;
  }

  getJob(id: string): JobStatus | undefined {
    return this.jobs.get(id);
  }

  updateStage(id: string, stage: JobStage, progress: number, currentStep: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.stage = stage;
    job.progress = progress;
    job.currentStep = currentStep;
  }

  setChapterCount(id: string, total: number) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.totalChapters = total;
    job.chapterStatuses = Array.from({ length: total }, (_, i) => ({
      index: i,
      title: '',
      status: 'pending' as const,
    }));
  }

  updateChapterStatus(
    id: string,
    chapterIndex: number,
    status: 'pending' | 'running' | 'completed' | 'failed',
    title?: string,
    nodeCount?: number
  ) {
    const job = this.jobs.get(id);
    if (!job || !job.chapterStatuses[chapterIndex]) return;
    const cs = job.chapterStatuses[chapterIndex];
    cs.status = status;
    if (title) cs.title = title;
    if (nodeCount !== undefined) cs.nodeCount = nodeCount;
    if (status === 'completed') {
      job.completedChapters = job.chapterStatuses.filter(c => c.status === 'completed').length;
    }
  }

  setEstimatedTime(id: string, seconds: number) {
    const job = this.jobs.get(id);
    if (job) job.estimatedRemainingSeconds = seconds;
  }

  setResult(id: string, result: { workId: string; title: string; nodeCount: number; endingCount: number }) {
    const job = this.jobs.get(id);
    if (job) job.result = result;
  }

  failJob(id: string, error: string, stage: JobStage, recoverable: boolean = true) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.stage = 'FAILED';
    job.error = error;
    job.failedStage = stage;
    job.recoverable = recoverable;
  }

  resetForRetry(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || !job.recoverable) return false;
    job.stage = job.failedStage || 'PENDING';
    job.error = undefined;
    job.failedStage = undefined;
    job.progress = this.stageToProgress(job.stage);
    // Reset failed chapters to pending
    job.chapterStatuses.forEach(cs => {
      if (cs.status === 'failed') cs.status = 'pending';
    });
    return true;
  }

  private stageToProgress(stage: JobStage): number {
    const map: Record<JobStage, number> = {
      PENDING: 0,
      ANALYZING: 0,
      SPLITTING: 5,
      OUTLINING: 10,
      STATE_DESIGNING: 15,
      CHAPTER_GENERATING: 20,
      ASSEMBLING: 95,
      VALIDATING: 98,
      COMPLETED: 100,
      FAILED: 0,
    };
    return map[stage] ?? 0;
  }

  // ── SSE 订阅 ──
  subscribe(id: string, callback: (event: PipelineProgressEvent) => void): () => void {
    const set = this.subscribers.get(id);
    if (!set) return () => {};
    set.add(callback);
    return () => set.delete(callback);
  }

  broadcast(id: string, type: ProgressEventType, message: string, detail?: Record<string, unknown>) {
    const job = this.jobs.get(id);
    if (!job) return;
    const event: PipelineProgressEvent = {
      type,
      jobId: id,
      stage: job.stage,
      progress: job.progress,
      message,
      detail,
      timestamp: Date.now(),
    };
    const set = this.subscribers.get(id);
    if (set) {
      set.forEach(cb => {
        try { cb(event); } catch { /* ignore */ }
      });
    }
  }

  cleanup(id: string) {
    this.jobs.delete(id);
    this.subscribers.delete(id);
  }
}

export const jobQueue = new JobQueue();
