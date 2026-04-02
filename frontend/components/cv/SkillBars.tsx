'use client';

import { useEffect, useState } from 'react';
import { ATSScores } from '@/types';

const bars = [
  { key: 'formatting' as const, label: 'Formatting' },
  { key: 'keyword_match' as const, label: 'Keyword Match' },
  { key: 'bullet_quality' as const, label: 'Bullet Quality' },
  { key: 'section_structure' as const, label: 'Structure' },
];

export default function SkillBars({ scores }: { scores: ATSScores }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-3">
      {bars.map((bar, i) => {
        const value = scores[bar.key];
        const barColor =
          value < 50 ? 'bg-red-500' :
          value < 70 ? 'bg-amber-500' :
          'bg-violet-500';

        return (
          <div key={bar.key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">{bar.label}</span>
              <span className="font-medium text-foreground">{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                style={{
                  width: mounted ? `${value}%` : '0%',
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
