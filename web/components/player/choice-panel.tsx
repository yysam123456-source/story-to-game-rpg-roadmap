'use client';

import { Choice, Condition } from '@/types';

interface ChoicePanelProps {
  choices: Choice[];
  variables: Record<string, number | string | boolean>;
  onChoose: (choice: Choice) => void;
  feedback?: { variable: string; value: number | string | boolean; show: boolean } | null;
}

function evaluateCondition(condition: Condition, variables: Record<string, number | string | boolean>): boolean {
  const val = variables[condition.variable];
  const cmp = condition.value;

  switch (condition.operator) {
    case '>': return (val as number) > (cmp as number);
    case '<': return (val as number) < (cmp as number);
    case '>=': return (val as number) >= (cmp as number);
    case '<=': return (val as number) <= (cmp as number);
    case '==': return val == cmp;
    case '!=': return val != cmp;
    default: return true;
  }
}

export function ChoicePanel({ choices, variables, onChoose, feedback }: ChoicePanelProps) {
  return (
    <div className="space-y-3 p-4">
      {choices.map((choice, i) => {
        const visible = !choice.condition || evaluateCondition(choice.condition, variables);
        if (!visible) return null;

        const isRecommended = (choice.weight || 0) > 1;
        const isRisky = (choice.weight || 0) < 0;

        return (
          <button
            key={choice.id}
            onClick={() => onChoose(choice)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
              isRecommended
                ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                : isRisky
                ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                : 'border-border bg-card hover:bg-card/80'
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">{choice.text}</span>
              {isRecommended && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  推荐
                </span>
              )}
              {isRisky && (
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  风险
                </span>
              )}
            </div>

            {/* Change feedback */}
            {feedback && choice.changes?.some((c) => c.variable === feedback.variable) && (
              <div className="mt-2 text-xs text-primary animate-fade-in">
                {feedback.variable} {typeof feedback.value === 'number' && feedback.value > 0 ? '+' : ''}
                {String(feedback.value)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
