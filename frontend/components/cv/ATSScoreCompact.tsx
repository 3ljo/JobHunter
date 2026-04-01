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
    <div className="space-y-4">
      {/* Main scores */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className={`text-2xl font-bold ${scoreColor(scores.current_ats)}`}>
            {scores.current_ats}
          </p>
        </div>
        <span className="text-lg text-muted-foreground/40">&rarr;</span>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Projected</p>
          <p className={`text-2xl font-bold ${scoreColor(scores.projected_ats)}`}>
            {scores.projected_ats}
          </p>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2">
        {subScores.map((s) => (
          <div key={s.label} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={`font-medium ${scoreColor(s.value)}`}>{s.value}%</span>
            </div>
            <Progress value={s.value} className={`h-1.5 ${progressColor(s.value)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
