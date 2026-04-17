'use client';

import { useEffect, useState } from 'react';

interface RobotAvatarProps {
  speaking: boolean;
  loading?: boolean;
  size?: number;             // rendered pixel height
  onClick?: () => void;
  bubbleText?: string;       // caption displayed next to the robot
}

/**
 * Full-body cartoon interviewer robot.
 * Light-blue body, orange eyes + feet, antenna, friendly teeth grid mouth,
 * little waving arms. Comes with a speech bubble caption on the right.
 *
 * Tap anywhere on the robot (or the bubble) to play/stop voice.
 */
export default function RobotAvatar({ speaking, loading, size = 150, onClick, bubbleText }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const delay = 3000 + Math.random() * 3500;
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  const width = size * (160 / 200); // keep aspect ratio 160x200
  const bubble =
    bubbleText ??
    (loading ? 'Loading my voice…' : speaking ? 'Tap me to mute' : 'Tap me to talk');

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      aria-label={onClick ? bubble : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className={speaking ? 'robot-breathe-fast' : 'robot-breathe'}
        style={{
          width, height: size, flexShrink: 0,
          filter: 'drop-shadow(0 8px 22px rgba(118,77,240,0.28))',
        }}
      >
        <svg
          viewBox="0 0 160 200"
          width={width}
          height={size}
          style={{ display: 'block' }}
          aria-hidden
        >
          <defs>
            <linearGradient id="robot-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#b6dff0" />
              <stop offset="100%" stopColor="#7bb8d1" />
            </linearGradient>
            <linearGradient id="robot-panel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#2a3540" />
              <stop offset="100%" stopColor="#1b242e" />
            </linearGradient>
          </defs>

          {/* Antenna stem + tip */}
          <line x1="80" y1="6" x2="80" y2="22" stroke="#1f2a36" strokeWidth="2.5" strokeLinecap="round" />
          <circle
            cx="80" cy="5" r="5"
            fill="#f97316"
            className={speaking ? 'robot-antenna-pulse' : ''}
          />
          {/* "Brain" dome patch */}
          <ellipse cx="80" cy="25" rx="18" ry="6" fill="#f59e0b" stroke="#1f2a36" strokeWidth="1.8" />
          <circle cx="74" cy="24" r="1.3" fill="#fbbf24" />
          <circle cx="83" cy="22" r="1.3" fill="#fbbf24" />
          <circle cx="88" cy="25" r="1.3" fill="#fbbf24" />

          {/* Ears / side pieces */}
          <rect x="26" y="55" width="12" height="18" rx="4"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.8" />
          <rect x="122" y="55" width="12" height="18" rx="4"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.8" />

          {/* Head */}
          <rect x="38" y="30" width="84" height="62" rx="10"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="2" />

          {/* Face screen */}
          <rect x="48" y="42" width="64" height="38" rx="6"
            fill="#9fd0e2" stroke="#1f2a36" strokeWidth="1.5" />

          {/* Eyes */}
          {blink ? (
            <>
              <rect x="56"  y="57" width="14" height="2.4" rx="1.2" fill="#1f2a36" />
              <rect x="90" y="57" width="14" height="2.4" rx="1.2" fill="#1f2a36" />
            </>
          ) : (
            <>
              <circle cx="63" cy="58" r="8" fill="white" stroke="#1f2a36" strokeWidth="1.8" />
              <circle cx="97" cy="58" r="8" fill="white" stroke="#1f2a36" strokeWidth="1.8" />
              <circle cx="63" cy="58" r="4.5" fill="#f97316" />
              <circle cx="97" cy="58" r="4.5" fill="#f97316" />
              <circle cx="61.5" cy="56" r="1.4" fill="white" />
              <circle cx="95.5" cy="56" r="1.4" fill="white" />
            </>
          )}

          {/* Mouth — teeth-grid smile when idle, open oval when speaking */}
          {speaking ? (
            <g>
              <rect className="robot-mouth-open" x="68" y="70" width="24" height="6" rx="3" fill="#1f2a36">
                <animate attributeName="height" values="6;12;4;10;6" dur="420ms" repeatCount="indefinite" />
                <animate attributeName="y"      values="70;67;71;68;70" dur="420ms" repeatCount="indefinite" />
              </rect>
            </g>
          ) : (
            <g>
              <rect x="68" y="70" width="24" height="6" fill="white" stroke="#1f2a36" strokeWidth="1.5" />
              <line x1="74" y1="70" x2="74" y2="76" stroke="#1f2a36" strokeWidth="1" />
              <line x1="80" y1="70" x2="80" y2="76" stroke="#1f2a36" strokeWidth="1" />
              <line x1="86" y1="70" x2="86" y2="76" stroke="#1f2a36" strokeWidth="1" />
            </g>
          )}

          {/* Neck */}
          <rect x="72" y="92" width="16" height="8" fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.5" />

          {/* Body */}
          <rect x="34" y="100" width="92" height="64" rx="8"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="2" />

          {/* Body panel */}
          <rect x="50" y="110" width="60" height="42" rx="4"
            fill="url(#robot-panel)" stroke="#1f2a36" strokeWidth="1.5" />
          {/* "Hi!" text */}
          <text x="80" y="138" fontFamily="'Manrope', sans-serif" fontSize="18"
                fontWeight="800" fill="white" textAnchor="middle" letterSpacing="0.5">
            Hi!
          </text>

          {/* Arms (left waving when speaking) */}
          <g className={speaking ? 'robot-arm-left-wave' : ''} style={{ transformOrigin: '26px 108px' }}>
            <rect x="20" y="106" width="10" height="34" rx="3"
              fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />
            <rect x="16" y="138" width="18" height="12" rx="3"
              fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />
            <path d="M 18 150 L 16 155 M 25 150 L 25 156 M 32 150 L 34 155"
              stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
          <g>
            <rect x="130" y="106" width="10" height="34" rx="3"
              fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />
            <rect x="126" y="138" width="18" height="12" rx="3"
              fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />
            <path d="M 128 150 L 126 155 M 135 150 L 135 156 M 142 150 L 144 155"
              stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>

          {/* Legs */}
          <rect x="58" y="164" width="16" height="22" rx="3"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />
          <rect x="86" y="164" width="16" height="22" rx="3"
            fill="url(#robot-body)" stroke="#1f2a36" strokeWidth="1.6" />

          {/* Feet (orange) */}
          <rect x="50" y="186" width="28" height="10" rx="3"
            fill="#f97316" stroke="#1f2a36" strokeWidth="1.6" />
          <rect x="82" y="186" width="28" height="10" rx="3"
            fill="#f97316" stroke="#1f2a36" strokeWidth="1.6" />
        </svg>

        <style jsx>{`
          :global(.robot-breathe) { animation: rb-float 4200ms ease-in-out infinite; will-change: transform; }
          :global(.robot-breathe-fast) { animation: rb-float 2200ms ease-in-out infinite; will-change: transform; }
          @keyframes rb-float {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-3px); }
          }
          :global(.robot-antenna-pulse) {
            animation: rb-antenna 900ms ease-in-out infinite;
            transform-box: fill-box; transform-origin: center;
          }
          @keyframes rb-antenna {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.5); opacity: 0.45; }
          }
          :global(.robot-arm-left-wave) {
            animation: rb-wave 1200ms ease-in-out infinite;
            transform-box: fill-box;
          }
          @keyframes rb-wave {
            0%, 100% { transform: rotate(0deg);  }
            25%      { transform: rotate(-12deg); }
            75%      { transform: rotate(8deg);   }
          }
        `}</style>
      </div>

      {/* Speech bubble */}
      <div
        style={{
          position: 'relative',
          padding: '10px 14px',
          borderRadius: 16,
          background: speaking
            ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
            : loading
              ? 'linear-gradient(135deg,#a78bfa,#6d28d9)'
              : 'linear-gradient(135deg,#764DF0,#5b21b6)',
          color: 'white',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(118,77,240,0.35)',
          maxWidth: 200,
        }}
      >
        {bubble}
        {/* Tail pointing left to the robot */}
        <span
          style={{
            position: 'absolute',
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: `8px solid ${
              speaking ? '#ef4444' : loading ? '#a78bfa' : '#764DF0'
            }`,
          }}
        />
      </div>
    </div>
  );
}
