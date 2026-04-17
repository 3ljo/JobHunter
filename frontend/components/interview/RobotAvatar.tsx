'use client';

import { useEffect, useState } from 'react';

interface RobotAvatarProps {
  speaking: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
}

/**
 * Friendly talking-robot avatar.
 *
 * Idle: subtle up/down float, occasional blink.
 * Speaking: mouth opens/closes smoothly, antenna pulses,
 *           subtle eye-color shift for liveliness.
 */
export default function RobotAvatar({ speaking, size = 56, onClick, title }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 3200 + Math.random() * 3500;
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const accent = speaking ? '#c4b5fd' : '#a78bfa';
  const ring = speaking ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.2)';
  const glow = speaking
    ? '0 0 0 6px rgba(167,139,250,0.15), 0 10px 24px rgba(118,77,240,0.4)'
    : '0 4px 14px rgba(118,77,240,0.22)';

  const avatar = (
    <div
      className={speaking ? 'robot-wrap robot-breathe-fast' : 'robot-wrap robot-breathe'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #2a2f5a, #12163a)',
        border: `1.5px solid ${ring}`,
        boxShadow: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 220ms, border-color 220ms',
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size * 0.72}
        height={size * 0.72}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        {/* Antenna */}
        <line x1="32" y1="4" x2="32" y2="12" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <circle
          cx="32"
          cy="3.5"
          r="2.5"
          fill={accent}
          className={speaking ? 'robot-antenna-pulse' : ''}
        />

        {/* Outer head shell */}
        <rect
          x="11"
          y="13"
          width="42"
          height="38"
          rx="12"
          ry="12"
          fill="#232759"
          stroke={accent}
          strokeWidth="1.5"
        />

        {/* Face screen */}
        <rect x="16" y="18" width="32" height="22" rx="7" ry="7" fill="#0b0e28" />

        {/* Eyes */}
        {blink ? (
          <>
            <rect x="21" y="28.5" width="6" height="1.6" rx="0.8" fill={accent} />
            <rect x="37" y="28.5" width="6" height="1.6" rx="0.8" fill={accent} />
          </>
        ) : (
          <>
            <circle cx="24" cy="28.5" r="2.8" fill={accent} />
            <circle cx="40" cy="28.5" r="2.8" fill={accent} />
            {/* highlights */}
            <circle cx="24.8" cy="27.6" r="0.8" fill="#ffffff" opacity="0.95" />
            <circle cx="40.8" cy="27.6" r="0.8" fill="#ffffff" opacity="0.95" />
          </>
        )}

        {/* Mouth — a group we scale/translate via CSS when speaking */}
        <g className={speaking ? 'robot-mouth-group speaking' : 'robot-mouth-group'}>
          <rect
            x="25"
            y="42"
            width="14"
            height="3"
            rx="1.5"
            fill={accent}
          />
          {/* Little tongue hint visible only when mouth is "open" */}
          <rect
            className="robot-tongue"
            x="27"
            y="43"
            width="10"
            height="1.2"
            rx="0.6"
            fill="#0b0e28"
          />
        </g>

        {/* Side ears */}
        <rect x="6" y="26" width="4" height="10" rx="1.5" fill="#1a1f4a" stroke={accent} strokeWidth="1" />
        <rect x="54" y="26" width="4" height="10" rx="1.5" fill="#1a1f4a" strokeWidth="1" stroke={accent} />

        {/* Chin bolt */}
        <circle cx="32" cy="49" r="1.4" fill={accent} opacity="0.7" />
      </svg>

      <style jsx>{`
        :global(.robot-wrap) {
          will-change: transform;
        }
        :global(.robot-breathe) {
          animation: robot-breathe 4200ms ease-in-out infinite;
        }
        :global(.robot-breathe-fast) {
          animation: robot-breathe 2400ms ease-in-out infinite;
        }
        @keyframes robot-breathe {
          0%, 100% { transform: translateY(0);   }
          50%      { transform: translateY(-2px); }
        }

        :global(.robot-mouth-group) {
          transform-box: fill-box;
          transform-origin: center center;
          transition: transform 140ms ease-in-out;
        }
        :global(.robot-mouth-group.speaking) {
          animation: robot-talk 360ms ease-in-out infinite;
        }
        :global(.robot-tongue) {
          opacity: 0;
          transition: opacity 120ms ease-in-out;
        }
        :global(.robot-mouth-group.speaking .robot-tongue) {
          animation: robot-tongue 360ms ease-in-out infinite;
        }
        @keyframes robot-talk {
          0%   { transform: scaleY(1);    }
          25%  { transform: scaleY(2.6);  }
          50%  { transform: scaleY(1.2);  }
          75%  { transform: scaleY(3.0);  }
          100% { transform: scaleY(1);    }
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
          50%      { transform: scale(1.6); opacity: 0.5; }
        }
      `}</style>
    </div>
  );

  if (!onClick) return avatar;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title || (speaking ? 'Stop speaking' : 'Replay question')}
      title={title}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      {avatar}
    </button>
  );
}
