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

export default function ATSScoreCard({ scores }: { scores: ATSScores }) {
  const subScores = [
    { label: 'Formatting', value: scores.formatting },
    { label: 'Keyword Match', value: scores.keyword_match },
    { label: 'Bullet Quality', value: scores.bullet_quality },
    { label: 'Section Structure', value: scores.section_structure },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Current ATS</p>
          <p className={`text-4xl font-bold ${scoreColor(scores.current_ats)}`}>
            {scores.current_ats}
          </p>
        </div>
        <div className="text-2xl text-muted-foreground/50">&rarr;</div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Projected ATS</p>
          <p className={`text-4xl font-bold ${scoreColor(scores.projected_ats)}`}>
            {scores.projected_ats}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {subScores.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={`font-medium ${scoreColor(s.value)}`}>{s.value}%</span>
            </div>
            <Progress value={s.value} className={`h-2 ${progressColor(s.value)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
