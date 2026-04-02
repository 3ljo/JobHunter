'use client';

import { Sparkles } from 'lucide-react';

interface SuggestionCardsProps {
  suggestions: any[];
}

export default function SuggestionCards({ suggestions }: SuggestionCardsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Quick Wins</h3>
      <div className="space-y-2">
        {suggestions.map((win: any, i: number) => {
          const impactColor =
            win.impact === 'high' ? 'bg-red-500/15 text-red-400' :
            win.impact === 'medium' ? 'bg-amber-500/15 text-amber-400' :
            'bg-emerald-500/15 text-emerald-400';

          return (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/80 border border-white/[0.06] p-4 border-l-2 border-l-violet-500 hover:bg-zinc-800/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400 mt-0.5">
                  <span className="text-[10px] font-bold">{win.priority || i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-zinc-200">
                      {typeof win === 'string' ? win : win.action}
                    </p>
                    {win.impact && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${impactColor}`}>
                        {win.impact}
                      </span>
                    )}
                  </div>
                  {win.reason && (
                    <p className="text-xs text-zinc-500 mt-1">{win.reason}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
