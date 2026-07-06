'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PlayPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verify work exists before showing iframe
  useEffect(() => {
    if (!id) return;

    async function verifyWork() {
      try {
        const res = await fetch(`/api/works/${id}?format=meta`);
        const data = await res.json();
        if (!data.success) {
          setError(data.error || '作品不存在');
        }
      } catch {
        setError('网络错误，无法验证作品');
      } finally {
        setLoading(false);
      }
    }

    verifyWork();
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

  return (
    <div className="h-[calc(100vh-64px)] bg-[#0a0a0c]">
      <iframe
        src={`/player/pages/game-main.html?story=${id}`}
        className="w-full h-full border-0"
        title="Story Player"
        allow="autoplay"
      />
    </div>
  );
}
