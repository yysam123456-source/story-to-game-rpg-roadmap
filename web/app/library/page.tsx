'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkMeta } from '@/types';
import { BookOpen, Clock, GitBranch, Trash2, Loader2 } from 'lucide-react';

export default function LibraryPage() {
  const [works, setWorks] = useState<WorkMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorks();
  }, []);

  async function fetchWorks() {
    try {
      setLoading(true);
      const res = await fetch('/api/works');
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
      } else {
        setError(data.error || '获取失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  async function deleteWork(id: string) {
    if (!confirm('确定删除此作品？')) return;
    try {
      await fetch(`/api/works/${id}`, { method: 'DELETE' });
      setWorks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      alert('删除失败');
    }
  }

  const genreLabels: Record<string, string> = {
    xianxia: '修仙',
    horror: '恐怖',
    mystery: '悬疑',
    apocalypse: '末世',
    palace: '宫斗',
    general: '一般',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">作品库</h1>
          <Link
            href="/instant"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            新建作品
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="glass rounded-xl p-6 text-center text-destructive">
            {error}
          </div>
        )}

        {!loading && works.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">暂无作品</p>
            <Link
              href="/instant"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              立即创建
            </Link>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => (
            <div
              key={work.id}
              className="glass glass-hover rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {genreLabels[work.genre] || work.genre}
                </span>
                <button
                  onClick={() => deleteWork(work.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{work.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {work.description || '无描述'}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {work.nodeCount} 节点
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(work.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <Link
                href={`/play/${work.id}`}
                className="block w-full text-center rounded-lg bg-secondary py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                开始游玩
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
