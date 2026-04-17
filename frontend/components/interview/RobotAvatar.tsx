'use client';

import { useEffect, useState } from 'react';

interface RobotAvatarProps {
  speaking: boolean;
  loading?: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
}

/**
 * Cartoon interviewer bot.
 *
 * - Chibi proportions: big rounded head, small body hint below.
 * - Expressive eyes with sparkle highlights; random blinks when idle.
 * - Soft cheek blush dots.
 * - Headphones on the sides (interviewer vibe).
 * - Antenna with pulsing tip.
 * - Mouth smiles when idle, opens/closes when speaking.
 * - Subtle float animation so it feels alive.
 * - Whole avatar is one big tap target — tap = play/stop audio.
 */
export default function RobotAvatar({ speaking, loading, size = 96, onClick, title }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 2800 + Math.random() * 3500;
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const eyeColor = speaking ? '#c4b5fd' : '#a78bfa';
  const ringColor = speaking ? 'rgba(167,139,250,0.55)' : 'rgba(167,139,250,0.22)';
  const glow = speaking
    ? '0 0 0 8px rgba(167,139,250,0.12), 0 12px 28px rgba(118,77,240,0.4)'
    : '0 6px 20px rgba(118,77,240,0.28)';

  const avatar = (
    <div
      className={speaking ? 'robot-wrap robot-breathe-fast' : 'robot-wrap robot-breathe'}
      style={{
        width: size,
        height: size,
        borderRadius: '28%',
        background: 'radial-gradient(circle at 30% 25%, #3b3f7a 0%, #1d2150 65%, #12163a 100%)',
        border: `1.5px solid ${ringColor}`,
        boxShadow: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'box-shadow 220ms, border-color 220ms',
        overflow: 'visible',
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size * 0.98}
        height={size * 0.98}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        {/* Antenna */}
        <line x1="60" y1="12" x2="60" y2="22" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
        <circle
          cx="60"
          cy="9"
          r="4.5"
          fill={eyeColor}
          className={speaking ? 'robot-antenna-pulse' : ''}
        />

        {/* Head — rounded square with soft gradient */}
        <defs>
          <radialGradient id="robot-head-grad" cx="35%" cy="25%" r="80%">
            <stop offset="0%"  stopColor="#4c5396" />
            <stop offset="55%" stopColor="#2a2f5a" />
            <stop offset="100%" stopColor="#1a1f4a" />
          </radialGradient>
          <linearGradient id="robot-face-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#0c0f28" />
            <stop offset="100%" stopColor="#070a1f" />
          </linearGradient>
        </defs>

        <rect
          x="22"
          y="26"
          width="76"
          height="68"
          rx="22"
          fill="url(#robot-head-grad)"
          stroke={eyeColor}
          strokeWidth="1.5"
          opacity="0.95"
        />

        {/* Face screen */}
        <rect
          x="30"
          y="36"
          width="60"
          height="42"
          rx="14"
          fill="url(#robot-face-grad)"
        />
        {/* Face shine */}
        <rect x="33" y="39" width="54" height="10" rx="5" fill="#ffffff" opacity="0.04" />

        {/* Eyes */}
        {blink ? (
          <>
            <rect x="38"  y="54.5" width="14" height="2.2" rx="1.1" fill={eyeColor} />
            <rect x="68" y="54.5" width="14" height="2.2" rx="1.1" fill={eyeColor} />
          </>
        ) : (
          <>
            {/* Big expressive eyes */}
            <circle cx="45" cy="55" r="7" fill={eyeColor} />
            <circle cx="75" cy="55" r="7" fill={eyeColor} />
            {/* Pupils */}
            <circle cx="45.5" cy="55.5" r="3" fill="#0a0d24" />
            <circle cx="75.5" cy="55.5" r="3" fill="#0a0d24" />
            {/* Sparkle highlights */}
            <circle cx="47" cy="52.5" r="1.8" fill="#ffffff" opacity="0.95" />
            <circle cx="77" cy="52.5" r="1.8" fill="#ffffff" opacity="0.95" />
            <circle cx="43.3" cy="57.3" r="0.9" fill="#ffffff" opacity="0.7" />
            <circle cx="73.3" cy="57.3" r="0.9" fill="#ffffff" opacity="0.7" />
          </>
        )}

        {/* Cheek blush */}
        <circle cx="36" cy="65" r="3.5" fill="#f472b6" opacity="0.28" />
        <circle cx="84" cy="65" r="3.5" fill="#f472b6" opacity="0.28" />

        {/* Mouth — smile when idle, open rectangle when speaking */}
        {speaking ? (
          <g className="robot-mouth-group speaking">
            <rect x="52" y="70" width="16" height="5" rx="2.5" fill={eyeColor} />
            <rect className="robot-tongue" x="55" y="71.5" width="10" height="1.8" rx="0.9" fill="#050720" />
          </g>
        ) : (
          <path
            d="M 50 70 Q 60 76 70 70"
            stroke={eyeColor}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Chin bolt */}
        <circle cx="60" cy="86" r="1.8" fill={eyeColor} opacity="0.6" />

        {/* Headphones / ears */}
        <rect x="14" y="48" width="10" height="26" rx="5" fill="#1a1f4a" stroke={eyeColor} strokeWidth="1.2" />
        <rect x="96" y="48" width="10" height="26" rx="5" fill="#1a1f4a" stroke={eyeColor} strokeWidth="1.2" />
        {/* Headphone bridge hint */}
        <path d="M 22 48 Q 60 18 98 48" stroke={eyeColor} strokeWidth="1" fill="none" opacity="0.35" />

        {/* Loading dots overlay when fetching audio */}
        {loading && (
          <g className="robot-loading">
            <circle cx="60" cy="70" r="2" fill={eyeColor}>
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="54" cy="70" r="2" fill={eyeColor}>
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" begin="0.2s" />
            </circle>
            <circle cx="66" cy="70" r="2" fill={eyeColor}>
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" begin="0.4s" />
            </circle>
          </g>
        )}
      </svg>

      {/* Tap hint ring — pulses gently when idle to signal interactivity */}
      {!speaking && !loading && onClick && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: 'inherit',
            border: '2px solid rgba(167,139,250,0.35)',
            pointerEvents: 'none',
            animation: 'robot-ring 2600ms ease-out infinite',
          }}
        />
      )}

      <style jsx>{`
        :global(.robot-wrap) {
          will-change: transform;
        }
        :global(.robot-breathe) {
          animation: robot-breathe 4200ms ease-in-out infinite;
        }
        :global(.robot-breathe-fast) {
          animation: robot-breathe 2200ms ease-in-out infinite;
        }
        @keyframes robot-breathe {
          0%, 100% { transform: translateY(0);    }
          50%      { transform: translateY(-3px); }
        }

        :global(.robot-mouth-group) {
          transform-box: fill-box;
          transform-origin: center center;
        }
        :global(.robot-mouth-group.speaking) {
          animation: robot-talk 340ms ease-in-out infinite;
        }
        :global(.robot-tongue) {
          opacity: 0;
        }
        :global(.robot-mouth-group.speaking .robot-tongue) {
          animation: robot-tongue 340ms ease-in-out infinite;
        }
        @keyframes robot-talk {
          0%   { transform: scaleY(1);   }
          25%  { transform: scaleY(2.2); }
          50%  { transform: scaleY(1.1); }
          75%  { transform: scaleY(2.6); }
          100% { transform: scaleY(1);   }
        }
        @keyframes robot-tongue {
          0%, 100% { opacity: 0;   }
          25%, 75% { opacity: 0.9; }
        }

        :global(.robot-antenna-pulse) {
          animation: robot-antenna 900ms ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center center;
        }
        @keyframes robot-antenna {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.5); opacity: 0.4; }
        }

        @keyframes robot-ring {
          0%   { transform: scale(1);    opacity: 0.8; }
          70%  { transform: scale(1.18); opacity: 0;   }
          100% { transform: scale(1.18); opacity: 0;   }
        }
      `}</style>
    </div>
  );

  if (!onClick) return avatar;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title || (speaking ? 'Stop speaking' : 'Play question')}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: loading ? 'wait' : 'pointer',
        display: 'inline-block',
      }}
    >
      {avatar}
    </button>
  );
}
