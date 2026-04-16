'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function ScoreRing({ score, label, size = 100, className = '' }: ScoreRingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const getGradient = () => {
    if (score < 40) return 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (score < 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (score < 75) return 'linear-gradient(135deg, #a78bfa, #7c3aed)';
    return 'linear-gradient(135deg, #764DF0, #5b21b6)';
  };

  const getGlow = () => {
    if (score < 40) return 'rgba(239,68,68,0.25)';
    if (score < 60) return 'rgba(245,158,11,0.25)';
    return 'rgba(118,77,240,0.25)';
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Score number */}
      <div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: size,
          height: size * 0.85,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 0 40px ${getGlow()}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
          style={{ background: getGradient() }}
        />
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: size * 0.38,
            background: getGradient(),
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: mounted ? `${score}%` : '0%',
            background: getGradient(),
          }}
        />
      </div>

      {/* Label */}
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
          {label}
        </span>
      )}
    </div>
  );
}
