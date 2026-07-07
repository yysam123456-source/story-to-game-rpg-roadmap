/**
 * Text Splitter — 智能文本分析与拆分
 * 支持：章节识别、语义切分、摘要生成
 * 纯本地处理，不调用 AI
 */

import { TextAnalysisResult, ChapterAnalysis } from '@/types';

export class TextSplitter {
  /**
   * 分析文本结构，识别章节并拆分
   */
  analyze(text: string): TextAnalysisResult {
    const chapters = this.splitByChapters(text);
    const totalWords = this.countWords(text);

    return {
      totalChapters: chapters.length,
      totalWords,
      chapters,
    };
  }

  /**
   * 章节识别策略：
   * 1. 尝试匹配常见章节标题模式
   * 2. 如果无标题，按固定字数+段落边界拆分
   */
  private splitByChapters(text: string): ChapterAnalysis[] {
    // 常见章节标题正则（支持中文和英文）
    const chapterPatterns = [
      /^第[一二三四五六七八九十百千零\d]+章[\s:：]*/m,           // 第一章 / 第1章
      /^Chapter\s+\d+[\s:：.]*/im,                                // Chapter 1
      /^\d+[\.、\s]+[^\n]{1,30}$/m,                              // 1. 标题
      /^[\[【](第?[一二三四五六七八九十百千零\d]+章?)[\]】]/m,   // 【第一章】
    ];

    let splits: { index: number; title: string; content: string }[] = [];
    let matched = false;

    // 尝试用标题模式拆分
    for (const pattern of chapterPatterns) {
      const matches = this.findAllMatches(text, pattern);
      if (matches.length >= 2) {
        splits = this.buildSplitsFromMatches(text, matches);
        matched = true;
        break;
      }
    }

    // 如果没有匹配到标题，按语义块拆分
    if (!matched || splits.length < 2) {
      splits = this.splitBySemanticBlocks(text);
    }

    // 生成摘要和上下文提示
    return splits.map((s, i) => ({
      index: i,
      title: s.title || `第${i + 1}章`,
      wordCount: this.countWords(s.content),
      preview: this.generatePreview(s.content, 120),
      contextHint: this.generateContextHint(s.content, i, splits.length),
    }));
  }

  private findAllMatches(text: string, pattern: RegExp): Array<{ index: number; title: string }> {
    const matches: Array<{ index: number; title: string }> = [];
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ index: match.index, title: match[0].trim() });
    }
    return matches;
  }

  private buildSplitsFromMatches(
    text: string,
    matches: Array<{ index: number; title: string }>
  ): Array<{ index: number; title: string; content: string }> {
    const splits: Array<{ index: number; title: string; content: string }> = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
      splits.push({
        index: i,
        title: matches[i].title,
        content: text.slice(start, end).trim(),
      });
    }
    return splits;
  }

  /**
   * 按语义块拆分（无标题时使用）
   * 策略：
   * - 每 3000-5000 字一个块
   * - 在段落边界处切断
   * - 保留上下文重叠（每块末尾200字给下一块）
   */
  private splitBySemanticBlocks(text: string): Array<{ index: number; title: string; content: string }> {
    const targetChunkSize = 4000;
    const overlap = 200;
    const paragraphs = text.split(/\n{2,}/);
    const chunks: Array<{ index: number; title: string; content: string }> = [];
    let current = '';
    let idx = 0;

    for (const para of paragraphs) {
      if (current.length + para.length > targetChunkSize && current.length > 1000) {
        chunks.push({
          index: idx++,
          title: `第${idx}部分`,
          content: current.trim(),
        });
        // 保留重叠
        const overlapText = current.slice(-overlap);
        current = overlapText + '\n\n' + para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }

    if (current.length > 100) {
      chunks.push({
        index: idx,
        title: `第${idx + 1}部分`,
        content: current.trim(),
      });
    }

    return chunks;
  }

  /**
   * 为单章提取发送给 AI 的上下文片段
   * 包含：本章内容 + 前/后章的衔接提示
   */
  extractChapterContext(
    fullText: string,
    chapter: ChapterAnalysis,
    allChapters: ChapterAnalysis[],
    maxChars: number = 5000
  ): { content: string; prevHint: string; nextHint: string } {
    let content = fullText;
    // 如果本章太长，只取前 maxChars 字（AI 的上下文限制）
    if (content.length > maxChars) {
      content = content.slice(0, maxChars) + '\n\n[本章后续内容省略...]';
    }

    const prev = allChapters[chapter.index - 1];
    const next = allChapters[chapter.index + 1];

    return {
      content,
      prevHint: prev
        ? `前一章是「${prev.title}」，结尾处：${prev.preview.slice(-60)}`
        : '这是故事的第一章。',
      nextHint: next
        ? `下一章是「${next.title}」，预告：${next.preview.slice(0, 60)}`
        : '这是故事的最后一章。',
    };
  }

  /**
   * 生成章节摘要（用于大纲生成）
   */
  generateChapterSummary(chapter: ChapterAnalysis): string {
    return `「${chapter.title}」(${chapter.wordCount}字)：${chapter.preview}`;
  }

  private countWords(text: string): number {
    // 中文字符 + 英文单词
    const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return cnChars + enWords;
  }

  private generatePreview(text: string, maxLen: number): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen) + '...';
  }

  private generateContextHint(text: string, index: number, total: number): string {
    const firstSentence = text.split(/[。！？.!?]/)[0]?.trim() || '';
    const position = index === 0 ? '开篇' : index === total - 1 ? '结尾' : `第${index + 1}章`;
    return `${position}，${firstSentence.slice(0, 40)}`;
  }
}

export const textSplitter = new TextSplitter();
