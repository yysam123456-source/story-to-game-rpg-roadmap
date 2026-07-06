'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Zap, Brain, Flame, Star } from 'lucide-react';
import { RPGStat } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  'icon-heart': <Heart className="h-4 w-4" />,
  'icon-bolt': <Zap className="h-4 w-4" />,
  'icon-brain': <Brain className="h-4 w-4" />,
  'icon-fire': <Flame className="h-4 w-4" />,
  'icon-star': <Star className="h-4 w-4" />,
};

interface StatusBarProps {
  stats: RPGStat[];
  variables: Record<string, number | string | boolean>;
}

export function StatusBar({ stats, variables }: StatusBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (!stats || stats.length === 0) return null;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          状态面板
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {stats.map((stat) => {
            const value = variables[stat.key];
            const icon = stat.icon ? iconMap[stat.icon] : <Star className="h-4 w-4" />;

            return (
              <div key={stat.key} className="flex items-center gap-3">
                <div className="text-primary w-5">{icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="text-foreground font-medium">
                      {stat.type === 'bar' && typeof value === 'number'
                        ? `${value} / ${stat.max || variables[stat.maxKey || ''] || 100}`
                        : String(value ?? '-')}
                    </span>
                  </div>
                  {stat.type === 'bar' && typeof value === 'number' && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (value / (stat.max || variables[stat.maxKey || ''] || 100)) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
