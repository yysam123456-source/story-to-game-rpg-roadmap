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
import { validateScript, autoFixScript } from './post-assembly-validator';
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
      let analysis: TextAnalysisResult;

      // ── 阶段 0: 文本分析 ──
      analysis = await this._runStage(jobId, 'ANALYZING', '正在分析文本结构...', async () => {
        const result = textSplitter.analyze(input.text);
        jobQueue.setChapterCount(jobId, result.totalChapters);
        jobQueue.broadcast(jobId, 'analyze_complete', `已识别 ${result.totalChapters} 章，约 ${result.totalWords} 字`, {
          totalChapters: result.totalChapters,
          totalWords: result.totalWords,
        });
        return result;
      });

      // ── 阶段 1: 拆分完成（本地处理，瞬间完成） ──
      jobQueue.updateStage(jobId, 'SPLITTING', 5, '文本拆分完成');
      jobQueue.broadcast(jobId, 'split_complete', '文本已拆分为独立章节', {
        totalChapters: jobQueue.getJob(jobId)?.totalChapters ?? 0,
      });

      // ── 阶段 2: 大纲生成 ──
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
              storyItems: stateDesign.items,
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

      // ── 阶段 5: 组装 + 自动修复 ──
      const script = await this._runStage(jobId, 'ASSEMBLING', '正在组装完整剧本...', async () => {
        jobQueue.broadcast(jobId, 'assemble_start', '正在合并所有章节...', {});
        let assembled = assembleScript(
          outline,
          stateDesign,
          chapterResults,
          input
        );

        // 自动修复：占位符替换、无效引用修复、补充选项
        jobQueue.broadcast(jobId, 'assemble_progress', '正在自动修复剧本问题...', {});
        const fixResult = autoFixScript(assembled);
        assembled = fixResult.script;

        if (fixResult.fixes.length > 0) {
          jobQueue.broadcast(jobId, 'assemble_fixes', `自动修复了 ${fixResult.fixes.length} 个问题`, {
            fixCount: fixResult.fixes.length,
            fixes: fixResult.fixes.slice(0, 20),
          });
        }

        jobQueue.broadcast(jobId, 'assemble_complete', '剧本组装完成', {
          nodeCount: Object.keys(assembled.nodes).length,
          fixCount: fixResult.fixes.length,
        });
        return assembled;
      });

      // ── 阶段 6: 全量校验 ──
      await this._runStage(jobId, 'VALIDATING', '正在校验剧本完整性...', async () => {
        // 使用全量验证器（BFS可达性、引用完整性、跳跃距离、选项质量等）
        const validation = validateScript(script);

        jobQueue.broadcast(jobId, 'validate_result',
          validation.errors.length === 0 ? '校验通过' : `发现 ${validation.errors.length} 个错误`,
          {
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
            errors: validation.errors,
            warnings: validation.warnings.slice(0, 50),
            stats: validation.stats,
          }
        );

        // 如果有致命错误，记录但不中断（因为已修复过一轮）
        if (validation.errors.length > 0) {
          console.warn(`[Pipeline] Job ${jobId} 校验发现 ${validation.errors.length} 个错误:`);
          validation.errors.forEach(e => console.warn(`  - ${e}`));
        }

        return { errors: validation.errors, warnings: validation.warnings, stats: validation.stats };
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
      const recoverable = failedStage !== 'VALIDATING';

      // ASSEMBLING 阶段可恢复（重新组装即可）
      // CHAPTER_GENERATING 阶段支持章节级重试（从失败章节继续）
      jobQueue.failJob(jobId, errMsg, failedStage, recoverable);
      jobQueue.broadcast(jobId, 'error', `生成失败：${errMsg}`, {
        failedStage,
        recoverable,
        error: errMsg,
      });
    }
  }

  /**
   * 重试失败的任务（支持章节级断点续传）
   */
  async retry(jobId: string, input: PipelineInput): Promise<boolean> {
    const reset = jobQueue.resetForRetry(jobId);
    if (!reset) return false;

    const job = jobQueue.getJob(jobId);
    const failedStage = job?.failedStage;

    // 如果是章节生成阶段失败，从失败章节继续（而非从头开始）
    if (failedStage === 'CHAPTER_GENERATING') {
      // 保留已完成的章节结果，从失败章节重试
      this._retryFromChapter(jobId, input, job?.completedChapters ?? 0).catch(() => {});
    } else {
      // 其他阶段从头开始
      this.run(jobId, input).catch(() => {});
    }
    return true;
  }

  /**
   * 从指定章节继续生成（断点续传）
   */
  private async _retryFromChapter(jobId: string, input: PipelineInput, completedChapters: number) {
    try {
      const job = jobQueue.getJob(jobId);
      if (!job) throw new Error('Job not found');

      // 恢复之前的上下文
      const analysis = (job as Record<string, unknown>).__analyzing as TextAnalysisResult;
      const outline = (job as Record<string, unknown>).__outlining as StoryOutline;
      const stateDesign = (job as Record<string, unknown>).__state_designing as StateDesign;
      const previousResults = ((job as Record<string, unknown>).__chapter_generating as ChapterResult[]) || [];

      if (!analysis || !outline || !stateDesign) {
        // 上下文丢失，从头开始
        this.run(jobId, input).catch(() => {});
        return;
      }

      const chapterResults = [...previousResults];
      let currentVariables = { ...stateDesign.variables };
      let currentFlags: string[] = [];

      // 重放已完成章节的变量变化
      for (const cr of chapterResults) {
        currentVariables = { ...currentVariables, ...cr.variablesDelta };
        currentFlags = [...currentFlags, ...cr.flagsAdded];
      }

      const total = analysis.chapters.length;
      const startTime = Date.now();

      jobQueue.updateStage(jobId, 'CHAPTER_GENERATING', 20, `从第 ${completedChapters + 1} 章继续...`);

      for (let i = completedChapters; i < total; i++) {
        const chapter = analysis.chapters[i];

        jobQueue.updateChapterStatus(jobId, i, 'running', chapter.title);
        jobQueue.broadcast(jobId, 'chapter_start', `正在写第 ${i + 1} 章：${chapter.title}...`, {
          chapterIndex: i,
          chapterTitle: chapter.title,
          completed: i,
          total,
        });

        const context = textSplitter.extractChapterContext(
          chapter.preview,
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
            storyItems: stateDesign.items,
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
        currentVariables = { ...currentVariables, ...result.variablesDelta };
        currentFlags = [...currentFlags, ...result.flagsAdded];

        const elapsed = (Date.now() - startTime) / 1000;
        const avgPerChapter = elapsed / (i - completedChapters + 1);
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

      // 保存章节结果到 job
      (job as Record<string, unknown>).__chapter_generating = chapterResults;

      // 继续组装 + 校验流程
      const script = await this._runStage(jobId, 'ASSEMBLING', '正在组装完整剧本...', async () => {
        jobQueue.broadcast(jobId, 'assemble_start', '正在合并所有章节...', {});
        let assembled = assembleScript(outline, stateDesign, chapterResults, input);

        const fixResult = autoFixScript(assembled);
        assembled = fixResult.script;

        if (fixResult.fixes.length > 0) {
          jobQueue.broadcast(jobId, 'assemble_fixes', `自动修复了 ${fixResult.fixes.length} 个问题`, {
            fixCount: fixResult.fixes.length,
            fixes: fixResult.fixes.slice(0, 20),
          });
        }

        jobQueue.broadcast(jobId, 'assemble_complete', '剧本组装完成', {
          nodeCount: Object.keys(assembled.nodes).length,
          fixCount: fixResult.fixes.length,
        });
        return assembled;
      });

      await this._runStage(jobId, 'VALIDATING', '正在校验剧本完整性...', async () => {
        const validation = validateScript(script);
        jobQueue.broadcast(jobId, 'validate_result',
          validation.errors.length === 0 ? '校验通过' : `发现 ${validation.errors.length} 个错误`,
          {
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
            errors: validation.errors,
            warnings: validation.warnings.slice(0, 50),
            stats: validation.stats,
          }
        );
        return validation;
      });

      // 保存
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
      const recoverable = failedStage !== 'VALIDATING';

      jobQueue.failJob(jobId, errMsg, failedStage, recoverable);
      jobQueue.broadcast(jobId, 'error', `生成失败：${errMsg}`, {
        failedStage,
        recoverable,
        error: errMsg,
      });
    }
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
