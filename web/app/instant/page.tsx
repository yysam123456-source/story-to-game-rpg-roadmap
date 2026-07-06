'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Upload, Loader2, FileText, Wand2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { StoryScript, CreatorRules } from '@/types';

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

export default function InstantPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('general');
  const [enableRPG, setEnableRPG] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
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

  // File import handlers
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
        body: JSON.stringify({
          text,
          genre,
          title: title || undefined,
          enableRPG,
          rules: showRules ? rules : undefined,
        }),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">即时体验</h1>
        <p className="text-muted-foreground mb-8">
          粘贴小说文本让 AI 生成游戏，或导入已有的 JSON 剧本
        </p>

        {/* Import */}
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

        {/* Generate Form */}
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
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />{progress || '生成中...'}</>
            ) : (
              <><Wand2 className="h-5 w-5" />AI 生成游戏剧本</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
