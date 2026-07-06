'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StoryScript } from '@/types';
import { StoryPlayer } from '@/components/player/story-player';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;

  const [script, setScript] = useState<StoryScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    async function loadScript() {
      try {
        setLoading(true);
        const res = await fetch(`/api/works/${id}?format=script`);
        const data = await res.json();
        if (data.success) {
          setScript(data.data);
        } else {
          setError(data.error || '加载失败');
        }
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }

    loadScript();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">请检查作品 ID 是否正确</p>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] flex items-center justify-center">
        <p className="text-muted-foreground">作品不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] px-4 py-8">
      <StoryPlayer script={script} />
    </div>
  );
}
