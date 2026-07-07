'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Upload, Loader2, FileText, Wand2, ChevronDown, ChevronUp, Settings,
  CheckCircle2, Circle, AlertCircle, Clock, BookOpen, Layers, Zap, ShieldCheck,
  RotateCcw, ArrowRight, BarChart3, Users, Timer
} from 'lucide-react';
import { StoryScript, CreatorRules, JobStage, ProgressEventType } from '@/types';

const genres = [
  { value: 'xianxia', label: '修仙', desc: '境界、修为、灵力系统', defaultRules: { pacing: 'relaxed', statImpact: 'medium', hiddenContentRatio: 'high', npcRelations: true, timePressure: false } },
  { value: 'horror', label: '恐怖', desc: '理智、恐惧、生存', defaultRules: { pacing: 'compact', statImpact: 'heavy', hiddenContentRatio: 'medium', timePressure: true, npcRelations: false } },
  { value: 'mystery', label: '悬疑', desc: '线索、推理、真相', defaultRules: { pacing: 'balanced', statImpact: 'light', hiddenContentRatio: 'high', informationAsymmetry: true, timePressure: false } },
  { value: 'apocalypse', label: '末世', desc: '资源、生存、人性', defaultRules: { pacing: 'compact', statImpact: 'heavy', hiddenContentRatio: 'low', timePressure: true, npcRelations: false } },
  { value: 'palace', label: '宫斗', desc: '地位、宠爱、权谋', defaultRules: { pacing: 'balanced', statImpact: 'medium', hiddenContentRatio: 'high', npcRelations: true, timePressure: false } },
  { value: 'general', label: '一般', desc: '通用叙事', defaultRules: { pacing: 'balanced', statImpact: 'medium', hiddenContentRatio: 'medium' } },
];

const pacingOptions = [
  { value: 'compact', label: '紧凑', desc: '每2-3句一个选择' },
  { value: 'balanced', label: '适中', desc: '每4-6句一个选择' },
  { value: 'relaxed', label: '舒缓', desc: '每7-10句一个选择' },
];

const choiceStyleOptions = [
  { value: 'direct', label: '直接台词' },
  { value: 'inner_monologue', label: '内心独白' },
  { value: 'action', label: '行动描述' },
];

const statImpactOptions = [
  { value: 'light', label: '轻度', desc: '数值微调' },
  { value: 'medium', label: '中度', desc: '影响选项可见性' },
  { value: 'heavy', label: '重度', desc: '数值决定生死' },
];

const hiddenContentOptions = [
  { value: 'low', label: '少', desc: '主线清晰' },
  { value: 'medium', label: '中', desc: '有支线' },
  { value: 'high', label: '多', desc: '大量隐藏线' },
];

const endingBiasOptions = [
  { value: 'heavy', label: 'HE偏多' },
  { value: 'balanced', label: '均衡' },
  { value: 'dark', label: 'BE偏多' },
  { value: 'random', label: '随机' },
];

const personOptions = [
  { value: 'first', label: '第一人称"我"' },
  { value: 'second', label: '第二人称"你"' },
];

const dialogueDensityOptions = [
  { value: 'low', label: '低', desc: '重叙述' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高', desc: '重对话' },
];

// 阶段配置（图标、标签、颜色）
const STAGE_CONFIG: Record<JobStage, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING: { label: '等待开始', icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground' },
  ANALYZING: { label: '文本分析', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-400' },
  SPLITTING: { label: '文本拆分', icon: <Layers className="h-4 w-4" />, color: 'text-blue-400' },
  OUTLINING: { label: '剧情大纲', icon: <BookOpen className="h-4 w-4" />, color: 'text-purple-400' },
  STATE_DESIGNING: { label: '数值设计', icon: <BarChart3 className="h-4 w-4" />, color: 'text-orange-400' },
  CHAPTER_GENERATING: { label: '逐章生成', icon: <Zap className="h-4 w-4" />, color: 'text-yellow-400' },
  ASSEMBLING: { label: '剧本组装', icon: <Layers className="h-4 w-4" />, color: 'text-green-400' },
  VALIDATING: { label: '校验检查', icon: <ShieldCheck className="h-4 w-4" />, color: 'text-teal-400' },
  COMPLETED: { label: '生成完成', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-400' },
  FAILED: { label: '生成失败', icon: <AlertCircle className="h-4 w-4" />, color: 'text-destructive' },
};

interface ChapterStatusItem {
  index: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  nodeCount?: number;
}

interface JobProgress {
  jobId: string;
  stage: JobStage;
  progress: number;
  message: string;
  totalChapters: number;
  completedChapters: number;
  estimatedRemainingSeconds: number;
  error?: string;
  recoverable: boolean;
  result?: { workId: string; title: string; nodeCount: number; endingCount: number };
  chapterStatuses: ChapterStatusItem[];
}

export default function InstantPage() {
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  // 表单状态
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('general');
  const [enableRPG, setEnableRPG] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // 进度状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [error, setError] = useState('');

  const [rules, setRules] = useState<CreatorRules>({
    pacing: 'balanced',
    choiceStyle: 'direct',
    statImpact: 'medium',
    hiddenContentRatio: 'medium',
    endingBias: 'balanced',
    narrativePerson: 'second',
    dialogueDensity: 'medium',
    informationAsymmetry: false,
    timePressure: false,
    npcRelations: false,
  });

  const applyGenreDefaults = (g: string) => {
    const config = genres.find(x => x.value === g);
    if (config?.defaultRules) {
      setRules(prev => ({ ...prev, ...(config.defaultRules as Partial<CreatorRules>) }));
    }
  };

  const handleGenreChange = (g: string) => {
    setGenre(g);
    applyGenreDefaults(g);
  };

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
    setIsGenerating(true);
    setError('');
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
        setIsGenerating(false);
      }
    } catch {
      setError('网络错误');
      setIsGenerating(false);
    }
  }

  // 启动 SSE 监听
  function startListening(jobId: string) {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`/api/generate/${jobId}`);
    esRef.current = es;

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        es.close();
        esRef.current = null;
        return;
      }

      try {
        const data = JSON.parse(event.data);
        handleSSEEvent(data);
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      // SSE 错误，可能是网络断开，稍后自动重连或等待用户操作
      es.close();
      esRef.current = null;
    };
  }

  function handleSSEEvent(data: any) {
    if (data.type === 'sync' || data.detail) {
      setJobProgress({
        jobId: data.jobId,
        stage: data.stage,
        progress: data.progress,
        message: data.message,
        totalChapters: data.detail?.totalChapters ?? 0,
        completedChapters: data.detail?.completedChapters ?? 0,
        estimatedRemainingSeconds: data.detail?.estimatedRemainingSeconds ?? 0,
        error: data.detail?.error,
        recoverable: data.detail?.recoverable ?? true,
        result: data.detail?.result,
        chapterStatuses: data.detail?.chapterStatuses ?? [],
      });
    }

    // 完成
    if (data.type === 'complete' && data.detail?.workId) {
      setTimeout(() => {
        router.push(`/play/${data.detail.workId}`);
      }, 800);
    }

    // 错误
    if (data.type === 'error') {
      setError(data.message || '生成失败');
    }
  }

  async function handleGenerate() {
    if (!text.trim()) {
      setError('请输入小说文本');
      return;
    }
    setIsGenerating(true);
    setError('');
    setJobProgress(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          genre,
          title: title || undefined,
          enableRPG,
          rules: showRules ? rules : undefined,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.data?.jobId) {
        throw new Error(data.error || '启动失败');
      }

      // 立即开始监听进度
      startListening(data.data.jobId);
    } catch (err) {
      setError((err as Error).message);
      setIsGenerating(false);
    }
  }

  async function handleRetry() {
    if (!jobProgress?.jobId) return;
    setError('');

    try {
      const response = await fetch(`/api/generate/${jobProgress.jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          genre,
          title: title || undefined,
          enableRPG,
          rules: showRules ? rules : undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '重试失败');
      }

      startListening(jobProgress.jobId);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const RuleSelect = ({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string; desc?: string }[]; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
              value === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
            {opt.desc && <span className="block text-[10px] opacity-60">{opt.desc}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  const RuleToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '计算中...';
    if (seconds < 60) return `${seconds}秒`;
    const m = Math.ceil(seconds / 60);
    return `约 ${m} 分钟`;
  };

  // 阶段步骤列表（用于显示进度轨道）
  const stageSteps: JobStage[] = ['ANALYZING', 'SPLITTING', 'OUTLINING', 'STATE_DESIGNING', 'CHAPTER_GENERATING', 'ASSEMBLING', 'VALIDATING', 'COMPLETED'];

  const getStageIndex = (stage: JobStage) => stageSteps.indexOf(stage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">即时体验</h1>
        <p className="text-muted-foreground mb-8">
          粘贴小说文本让 AI 生成游戏，或导入已有的 JSON 剧本
        </p>

        {/* Import */}
        {!isGenerating && (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="glass rounded-xl border-2 border-dashed border-border p-8 text-center mb-8 hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">拖拽 JSON 剧本到此处，或</p>
              <label className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 cursor-pointer transition-colors">
                <FileText className="h-4 w-4" />
                选择文件
                <input type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#12121a] px-2 text-muted-foreground">或</span></div>
            </div>
          </>
        )}

        {/* Generate Form */}
        {!isGenerating ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">作品标题（可选）</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
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
                    onClick={() => handleGenreChange(g.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      genre === g.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-card/80'
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">{g.label}</div>
                    <div className="text-xs text-muted-foreground">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="rpg" checked={enableRPG} onChange={(e) => setEnableRPG(e.target.checked)} className="rounded border-border" />
              <label htmlFor="rpg" className="text-sm text-foreground cursor-pointer">启用 RPG 数值系统</label>
            </div>

            {/* Rules Config */}
            <div className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setShowRules(!showRules)}
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  自定义游戏规则
                  {!showRules && <span className="text-xs text-muted-foreground font-normal">（可选，展开配置）</span>}
                </span>
                {showRules ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showRules && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    当前类型推荐配置已自动应用，可手动调整
                  </div>

                  <RuleSelect label="节奏密度" value={rules.pacing || 'balanced'} options={pacingOptions} onChange={(v) => setRules({ ...rules, pacing: v as any })} />
                  <RuleSelect label="选项风格" value={rules.choiceStyle || 'direct'} options={choiceStyleOptions} onChange={(v) => setRules({ ...rules, choiceStyle: v as any })} />
                  <RuleSelect label="数值影响强度" value={rules.statImpact || 'medium'} options={statImpactOptions} onChange={(v) => setRules({ ...rules, statImpact: v as any })} />
                  <RuleSelect label="隐藏内容比例" value={rules.hiddenContentRatio || 'medium'} options={hiddenContentOptions} onChange={(v) => setRules({ ...rules, hiddenContentRatio: v as any })} />
                  <RuleSelect label="结局倾向" value={rules.endingBias || 'balanced'} options={endingBiasOptions} onChange={(v) => setRules({ ...rules, endingBias: v as any })} />
                  <RuleSelect label="叙事人称" value={rules.narrativePerson || 'second'} options={personOptions} onChange={(v) => setRules({ ...rules, narrativePerson: v as any })} />
                  <RuleSelect label="对白密度" value={rules.dialogueDensity || 'medium'} options={dialogueDensityOptions} onChange={(v) => setRules({ ...rules, dialogueDensity: v as any })} />

                  <div className="space-y-2 pt-2 border-t border-border">
                    <RuleToggle label="信息不对称（隐藏条件/误导选项）" checked={!!rules.informationAsymmetry} onChange={(v) => setRules({ ...rules, informationAsymmetry: v })} />
                    <RuleToggle label="时间压力（回合/倒计时）" checked={!!rules.timePressure} onChange={(v) => setRules({ ...rules, timePressure: v })} />
                    <RuleToggle label="NPC 关系网络" checked={!!rules.npcRelations} onChange={(v) => setRules({ ...rules, npcRelations: v })} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">小说文本</label>
              <textarea
                value={text} onChange={(e) => setText(e.target.value)}
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Wand2 className="h-5 w-5" />AI 生成游戏剧本
            </button>
          </div>
        ) : (
          /* Progress Panel */
          <div className="space-y-6">
            {/* 顶部状态卡 */}
            <div className="glass rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-opacity-10 ${STAGE_CONFIG[jobProgress?.stage || 'PENDING'].color.replace('text-', 'bg-')}`}>
                    {STAGE_CONFIG[jobProgress?.stage || 'PENDING'].icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {jobProgress?.message || '准备中...'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {jobProgress?.stage === 'COMPLETED'
                        ? '即将跳转到游戏...'
                        : jobProgress?.stage === 'FAILED'
                        ? '生成失败，可尝试重试'
                        : `预计剩余时间：${formatTime(jobProgress?.estimatedRemainingSeconds ?? 0)}`}
                    </div>
                  </div>
                </div>
                {jobProgress?.stage === 'FAILED' && jobProgress.recoverable && (
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重试
                  </button>
                )}
              </div>

              {/* 进度条 */}
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                  style={{ width: `${jobProgress?.progress ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">{jobProgress?.progress ?? 0}%</span>
                {(jobProgress?.totalChapters ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    章节 {jobProgress?.completedChapters ?? 0}/{jobProgress?.totalChapters ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* 阶段轨道 */}
            <div className="glass rounded-xl p-5 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-4">生成流程</h3>
              <div className="relative">
                {/* 连接线 */}
                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
                <div className="space-y-0">
                  {stageSteps.map((stage, idx) => {
                    const config = STAGE_CONFIG[stage];
                    const currentIdx = getStageIndex(jobProgress?.stage || 'PENDING');
                    const isDone = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    const isFuture = idx > currentIdx;

                    return (
                      <div key={stage} className="flex items-start gap-3 py-2.5 relative">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                          isDone
                            ? 'bg-green-500 border-green-500'
                            : isActive
                            ? 'bg-primary border-primary animate-pulse'
                            : 'bg-card border-border'
                        }`}>
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          ) : isActive ? (
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                            {config.label}
                          </div>
                          {isActive && jobProgress?.stage === 'CHAPTER_GENERATING' && jobProgress.totalChapters > 0 && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              正在生成第 {jobProgress.completedChapters + 1}/{jobProgress.totalChapters} 章
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 章节状态网格 */}
            {jobProgress && jobProgress.totalChapters > 0 && (
              <div className="glass rounded-xl p-5 border border-border">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  章节进度
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {jobProgress.chapterStatuses.map((ch) => (
                    <div
                      key={ch.index}
                      className={`rounded-lg border px-3 py-2 transition-all ${
                        ch.status === 'completed'
                          ? 'border-green-500/30 bg-green-500/5'
                          : ch.status === 'running'
                          ? 'border-primary/30 bg-primary/5 animate-pulse'
                          : ch.status === 'failed'
                          ? 'border-destructive/30 bg-destructive/5'
                          : 'border-border bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {ch.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                        ) : ch.status === 'running' ? (
                          <Loader2 className="h-3 w-3 text-primary shrink-0 animate-spin" />
                        ) : ch.status === 'failed' ? (
                          <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-xs font-medium text-foreground truncate">
                          {ch.title || `第${ch.index + 1}章`}
                        </span>
                      </div>
                      {ch.nodeCount !== undefined && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 pl-4.5">
                          {ch.nodeCount} 节点
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 错误详情 */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">生成失败</span>
                </div>
                <div className="text-destructive/80">{error}</div>
              </div>
            )}

            {/* 取消/返回 */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (esRef.current) {
                    esRef.current.close();
                    esRef.current = null;
                  }
                  setIsGenerating(false);
                  setJobProgress(null);
                  setError('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消生成，返回编辑
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
