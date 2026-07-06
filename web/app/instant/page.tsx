'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Upload, Loader2, FileText, Wand2 } from 'lucide-react';
import { StoryScript } from '@/types';

const genres = [
  { value: 'xianxia', label: '修仙', desc: '境界、修为、灵力系统' },
  { value: 'horror', label: '恐怖', desc: '理智、恐惧、生存' },
  { value: 'mystery', label: '悬疑', desc: '线索、推理、真相' },
  { value: 'apocalypse', label: '末世', desc: '资源、生存、人性' },
  { value: 'palace', label: '宫斗', desc: '地位、宠爱、权谋' },
  { value: 'general', label: '一般', desc: '通用叙事' },
];

export default function InstantPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('general');
  const [enableRPG, setEnableRPG] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // 文件导入
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const script = JSON.parse(ev.target?.result as string) as StoryScript;
          importScript(script);
        } catch {
          setError('JSON 解析失败');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const script = JSON.parse(ev.target?.result as string) as StoryScript;
          importScript(script);
        } catch {
          setError('JSON 解析失败');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  async function importScript(script: StoryScript) {
    setLoading(true);
    setProgress('导入中...');
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/play/${data.data.id}`);
      } else {
        setError(data.error || '导入失败');
        setLoading(false);
      }
    } catch {
      setError('网络错误');
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!text.trim()) {
      setError('请输入小说文本');
      return;
    }
    setLoading(true);
    setError('');
    setProgress('连接 AI...');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, genre, title: title || undefined, enableRPG }),
      });

      if (!response.ok) {
        throw new Error('生成请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let generatedId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'start') {
                setProgress('正在生成剧本...');
              } else if (parsed.type === 'chunk') {
                setProgress('正在写入...');
              } else if (parsed.type === 'complete') {
                generatedId = parsed.id;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (generatedId) {
        router.push(`/play/${generatedId}`);
      } else {
        setError('生成未完成');
        setLoading(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">即时体验</h1>
        <p className="text-muted-foreground mb-8">
          粘贴小说文本让 AI 生成游戏，或导入已有的 JSON 剧本
        </p>

        {/* 导入区域 */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="glass rounded-xl border-2 border-dashed border-border p-8 text-center mb-8 hover:border-primary/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            拖拽 JSON 剧本到此处，或
          </p>
          <label className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 cursor-pointer transition-colors">
            <FileText className="h-4 w-4" />
            选择文件
            <input type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#12121a] px-2 text-muted-foreground">或</span>
          </div>
        </div>

        {/* 生成表单 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">作品标题（可选）</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入作品标题"
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">选择类型</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {genres.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGenre(g.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    genre === g.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:bg-card/80'
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{g.label}</div>
                  <div className="text-xs text-muted-foreground">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rpg"
              checked={enableRPG}
              onChange={(e) => setEnableRPG(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="rpg" className="text-sm text-foreground cursor-pointer">
              启用 RPG 数值系统
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">小说文本</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此粘贴你的小说原文..."
              rows={12}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {progress || '生成中...'}
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                AI 生成游戏剧本
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
