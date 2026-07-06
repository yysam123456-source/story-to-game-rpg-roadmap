'use client';

import { useState, useCallback, useEffect } from 'react';
import { StoryScript, StoryNode, Choice } from '@/types';
import { NarrativeView } from './narrative-view';
import { StatusBar } from './status-bar';
import { ChoicePanel } from './choice-panel';
import { RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface StoryPlayerProps {
  script: StoryScript;
}

export function StoryPlayer({ script }: StoryPlayerProps) {
  const [currentNodeId, setCurrentNodeId] = useState(script.startNodeId);
  const [variables, setVariables] = useState<Record<string, number | string | boolean>>(
    () => ({ ...script.variables })
  );
  const [flags, setFlags] = useState<Set<string>>(() => new Set(script.flags));
  const [history, setHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ variable: string; value: number | string | boolean; show: boolean } | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set([script.startNodeId]));

  const currentNode: StoryNode | undefined = script.nodes[currentNodeId];

  const applyChanges = useCallback((changes?: Choice['changes']) => {
    if (!changes) return;

    setVariables((prev) => {
      const next = { ...prev };
      for (const change of changes) {
        const current = next[change.variable];
        if (typeof current === 'number' && typeof change.value === 'number') {
          next[change.variable] = current + change.value;
        } else {
          next[change.variable] = change.value;
        }
      }
      return next;
    });

    // Show feedback for first change
    if (changes.length > 0 && changes[0].show) {
      setFeedback({
        variable: changes[0].variable,
        value: changes[0].value,
        show: true,
      });
      setTimeout(() => setFeedback(null), 2000);
    }
  }, []);

  const handleChoose = useCallback((choice: Choice) => {
    applyChanges(choice.changes);
    setHistory((prev) => [...prev, currentNodeId]);
    setCurrentNodeId(choice.targetNodeId);
    setVisitedNodes((prev) => new Set([...prev, choice.targetNodeId]));
  }, [applyChanges, currentNodeId]);

  const handleRestart = useCallback(() => {
    setCurrentNodeId(script.startNodeId);
    setVariables({ ...script.variables });
    setFlags(new Set(script.flags));
    setHistory([]);
    setVisitedNodes(new Set([script.startNodeId]));
    setFeedback(null);
  }, [script]);

  // Achievement check
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!currentNode?.achievements) return;
    setUnlockedAchievements((prev) => new Set([...prev, ...currentNode.achievements!]));
  }, [currentNode]);

  if (!currentNode) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">节点未找到</p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium"
        >
          <RotateCcw className="h-4 w-4" />
          重新开始
        </button>
      </div>
    );
  }

  const isEnding = currentNode.isEnding;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h1 className="text-lg font-bold text-foreground">{script.meta.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="重新开始"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Link
            href="/"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="返回首页"
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Status Bar */}
      {script.meta.rpg?.enabled && (
        <div className="mb-4">
          <StatusBar stats={script.meta.rpg.primaryStats} variables={variables} />
        </div>
      )}

      {/* Narrative */}
      <div className="glass rounded-xl mb-4 min-h-[200px]">
        <NarrativeView segments={currentNode.segments} />
      </div>

      {/* Choices or Ending */}
      {isEnding ? (
        <div className="glass rounded-xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-primary">结局</h2>
          <p className="text-muted-foreground">{currentNode.endings?.[0]?.description || '故事至此结束'}</p>
          {unlockedAchievements.size > 0 && (
            <div className="text-sm text-primary">
              解锁成就: {Array.from(unlockedAchievements).join(', ')}
            </div>
          )}
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            再次游玩
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl">
          <ChoicePanel
            choices={currentNode.choices}
            variables={variables}
            onChoose={handleChoose}
            feedback={feedback}
          />
        </div>
      )}
    </div>
  );
}
