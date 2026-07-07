/**
 * Generate Pipeline — 分阶段生成流水线编排器
 * 协调：文本分析 → 大纲生成 → 状态设计 → 逐章生成 → 组装校验
 * 每阶段有独立进度事件，失败可重试
 */

import { jobQueue } from './job-queue';
import { textSplitter } from './text-splitter';
import {
  generateOutline,
  generateStateDesign,
  generateChapter,
} from './ai-client';
import { assembleScript } from './script-assembler';
import { saveWork } from './storage';
import {
  PipelineInput,
  JobStage,
  TextAnalysisResult,
  StoryOutline,
  StateDesign,
  ChapterResult,
  StoryScript,
  WorkMeta,
} from '@/types';

const STAGE_PROGRESS: Record<JobStage, number> = {
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

export class GeneratePipeline {
  /**
   * 启动完整流水线
   */
  async run(jobId: string, input: PipelineInput) {
    try {
      // ── 阶段 0: 文本分析 ──
      await this._runStage(jobId, 'ANALYZING', '正在分析文本结构...', async () => {
        const analysis = textSplitter.analyze(input.text);
        jobQueue.setChapterCount(jobId, analysis.totalChapters);
        jobQueue.broadcast(jobId, 'analyze_complete', `已识别 ${analysis.totalChapters} 章，约 ${analysis.totalWords} 字`, {
          totalChapters: analysis.totalChapters,
          totalWords: analysis.totalWords,
        });
        return analysis;
      });

      // ── 阶段 1: 拆分完成（本地处理，瞬间完成） ──
      jobQueue.updateStage(jobId, 'SPLITTING', 5, '文本拆分完成');
      jobQueue.broadcast(jobId, 'split_complete', '文本已拆分为独立章节', {
        totalChapters: jobQueue.getJob(jobId)?.totalChapters ?? 0,
      });

      // ── 阶段 2: 大纲生成 ──
      const analysis = jobQueue.getJob(jobId)?.__analysis as TextAnalysisResult;
      const outline = await this._runStage(jobId, 'OUTLINING', '正在构思剧情骨架...', async () => {
        jobQueue.broadcast(jobId, 'outline_start', 'AI 正在构思剧情骨架...', {});
        const summaries = analysis.chapters.map(c => textSplitter.generateChapterSummary(c));
        const result = await generateOutline(
          summaries,
          input.genre,
          input.title,
          input.enableRPG,
          input.rules,
          (chunk) => {
            jobQueue.broadcast(jobId, 'outline_chunk', chunk, {});
          }
        );
        jobQueue.broadcast(jobId, 'outline_complete', '剧情骨架构思完成', {
          totalNodesEstimate: result.totalNodesEstimate,
          endingCount: result.endings.length,
        });
        return result;
      });

      // ── 阶段 3: 状态系统设计 ──
      const stateDesign = await this._runStage(jobId, 'STATE_DESIGNING', '正在设计数值系统...', async () => {
        jobQueue.broadcast(jobId, 'state_design_start', 'AI 正在设计 RPG 数值系统...', {});
        const result = await generateStateDesign(
          outline,
          input.genre,
          input.enableRPG,
          input.rules
        );
        jobQueue.broadcast(jobId, 'state_design_complete', '数值系统设计完成', {
          statCount: result.primaryStats?.length ?? 0,
          npcCount: result.npcRelations?.npcs?.length ?? 0,
        });
        return result;
      });

      // ── 阶段 4: 逐章生成（核心，最耗时） ──
      const chapterResults: ChapterResult[] = [];
      let currentVariables = { ...stateDesign.variables };
      let currentFlags: string[] = [];

      await this._runStage(jobId, 'CHAPTER_GENERATING', '开始逐章生成...', async () => {
        const total = analysis.chapters.length;
        const startTime = Date.now();

        for (let i = 0; i < total; i++) {
          const chapter = analysis.chapters[i];
          const chapterStart = Date.now();

          jobQueue.updateChapterStatus(jobId, i, 'running', chapter.title);
          jobQueue.broadcast(jobId, 'chapter_start', `正在写第 ${i + 1} 章：${chapter.title}...`, {
            chapterIndex: i,
            chapterTitle: chapter.title,
            completed: i,
            total,
          });

          const context = textSplitter.extractChapterContext(
            chapter.preview, // 用 preview 代替全文，控制 token
            chapter,
            analysis.chapters
          );

          const result = await generateChapter(
            {
              chapterIndex: i,
              totalChapters: total,
              title: chapter.title,
              content: context.content,
              prevHint: context.prevHint,
              nextHint: context.nextHint,
              outline,
              stateDesign,
              currentVariables,
              currentFlags,
            },
            input.genre,
            input.enableRPG,
            input.rules,
            (tokens) => {
              jobQueue.broadcast(jobId, 'chapter_progress', `第 ${i + 1} 章生成中...`, {
                chapterIndex: i,
                tokensOutput: tokens,
              });
            }
          );

          chapterResults.push(result);

          // 更新状态传递
          currentVariables = { ...currentVariables, ...result.variablesDelta };
          currentFlags = [...currentFlags, ...result.flagsAdded];

          const elapsed = (Date.now() - startTime) / 1000;
          const avgPerChapter = elapsed / (i + 1);
          const remaining = Math.round(avgPerChapter * (total - i - 1));
          const progress = 20 + Math.round(((i + 1) / total) * 75);

          jobQueue.updateStage(jobId, 'CHAPTER_GENERATING', progress, `第 ${i + 1}/${total} 章完成`);
          jobQueue.updateChapterStatus(jobId, i, 'completed', chapter.title, Object.keys(result.nodes).length);
          jobQueue.setEstimatedTime(jobId, remaining);

          jobQueue.broadcast(jobId, 'chapter_complete', `第 ${i + 1} 章完成 ✓`, {
            chapterIndex: i,
            chapterTitle: chapter.title,
            nodeCount: Object.keys(result.nodes).length,
            progress,
            estimatedRemaining: remaining,
          });
        }

        return chapterResults;
      });

      // ── 阶段 5: 组装 ──
      const script = await this._runStage(jobId, 'ASSEMBLING', '正在组装完整剧本...', async () => {
        jobQueue.broadcast(jobId, 'assemble_start', '正在合并所有章节...', {});
        const assembled = assembleScript(
          outline,
          stateDesign,
          chapterResults,
          input
        );
        jobQueue.broadcast(jobId, 'assemble_complete', '剧本组装完成', {
          nodeCount: Object.keys(assembled.nodes).length,
        });
        return assembled;
      });

      // ── 阶段 6: 校验 ──
      await this._runStage(jobId, 'VALIDATING', '正在校验剧本格式...', async () => {
        // 基础校验
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!script.meta?.title) errors.push('缺少作品标题');
        if (!script.startNodeId) errors.push('缺少起始节点');
        if (Object.keys(script.nodes || {}).length < 3) errors.push('节点数过少');

        // next 引用完整性
        for (const [nid, node] of Object.entries(script.nodes || {})) {
          for (const choice of node.choices || []) {
            if (choice.targetNodeId && !script.nodes[choice.targetNodeId]) {
              warnings.push(`节点 ${nid} 的选项指向不存在的节点 ${choice.targetNodeId}`);
            }
          }
          if (node.next && !script.nodes[node.next]) {
            warnings.push(`节点 ${nid} 的 next 指向不存在的节点 ${node.next}`);
          }
        }

        jobQueue.broadcast(jobId, 'validate_result', errors.length === 0 ? '校验通过' : `发现 ${errors.length} 个错误`, {
          errorCount: errors.length,
          warningCount: warnings.length,
          errors,
          warnings,
        });

        return { errors, warnings };
      });

      // ── 阶段 7: 保存 ──
      const workId = `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const meta: WorkMeta = {
        id: workId,
        title: script.meta.title || input.title || '未命名作品',
        genre: script.meta.genre || input.genre,
        author: script.meta.author || 'AI生成',
        description: script.meta.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodeCount: Object.keys(script.nodes).length,
        endingCount: Object.keys(script.endings || {}).length,
        playCount: 0,
      };

      await saveWork(workId, meta, script);

      jobQueue.updateStage(jobId, 'COMPLETED', 100, '生成完成');
      jobQueue.setResult(jobId, {
        workId,
        title: meta.title,
        nodeCount: meta.nodeCount,
        endingCount: meta.endingCount,
      });
      jobQueue.broadcast(jobId, 'complete', '作品生成完成！', {
        workId,
        title: meta.title,
        nodeCount: meta.nodeCount,
        endingCount: meta.endingCount,
        chapterCount: analysis.chapters.length,
      });

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const currentJob = jobQueue.getJob(jobId);
      const failedStage = currentJob?.stage || 'PENDING';
      const recoverable = failedStage !== 'ASSEMBLING' && failedStage !== 'VALIDATING';

      jobQueue.failJob(jobId, errMsg, failedStage, recoverable);
      jobQueue.broadcast(jobId, 'error', `生成失败：${errMsg}`, {
        failedStage,
        recoverable,
        error: errMsg,
      });
    }
  }

  /**
   * 重试失败的任务
   */
  async retry(jobId: string, input: PipelineInput): Promise<boolean> {
    const reset = jobQueue.resetForRetry(jobId);
    if (!reset) return false;
    // 异步启动，不阻塞
    this.run(jobId, input).catch(() => {});
    return true;
  }

  /**
   * 辅助：运行单个阶段，统一错误处理
   */
  private async _runStage<T>(
    jobId: string,
    stage: JobStage,
    stepName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    jobQueue.updateStage(jobId, stage, STAGE_PROGRESS[stage], stepName);
    const result = await fn();
    // 把分析结果暂存在 job 上供后续阶段使用
    const job = jobQueue.getJob(jobId);
    if (job) {
      (job as Record<string, unknown>)[`__${stage.toLowerCase()}`] = result;
    }
    return result;
  }
}

export const pipeline = new GeneratePipeline();
