'use client';

import { useEffect, useRef } from 'react';

interface NarrativeViewProps {
  segments: string[];
}

export function NarrativeView({ segments }: NarrativeViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  return (
    <div className="space-y-4 p-4">
      {segments.map((segment, i) => (
        <p
          key={i}
          className="text-foreground leading-relaxed text-base animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {segment}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
