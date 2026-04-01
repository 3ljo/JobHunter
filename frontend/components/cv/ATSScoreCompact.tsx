'use client';

import { ATSScores } from '@/types';
import { Progress } from '@/components/ui/progress';

function scoreColor(score: number): string {
  if (score < 50) return 'text-red-500 dark:text-red-400';
  if (score < 70) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-green-500 dark:text-green-400';
}

function progressColor(score: number): string {
  if (score < 50) return '[&>div]:bg-red-500';
  if (score < 70) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

export default function ATSScoreCompact({ scores }: { scores: ATSScores }) {
  const subScores = [
    { label: 'Formatting', value: scores.formatting },
    { label: 'Keywords', value: scores.keyword_match },
    { label: 'Bullets', value: scores.bullet_quality },
    { label: 'Structure', value: scores.section_structure },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-center gap-3">
        <span className={`text-3xl font-bold tracking-tight ${scoreColor(scores.current_ats)}`}>
          {scores.current_ats}
        </span>
        <span className="text-muted-foreground/30 text-sm">&rarr;</span>
        <span className={`text-3xl font-bold tracking-tight ${scoreColor(scores.projected_ats)}`}>
          {scores.projected_ats}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {subScores.map((s) => (
          <div key={s.label} className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={`font-medium ${scoreColor(s.value)}`}>{s.value}%</span>
            </div>
            <Progress value={s.value} className={`h-1 ${progressColor(s.value)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
