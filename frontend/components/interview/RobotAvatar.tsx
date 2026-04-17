'use client';

import { useEffect, useState } from 'react';

interface RobotAvatarProps {
  speaking: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
}

/**
 * Small animated robot head.
 * - Mouth animates open/close while `speaking === true`
 * - Random blink loop when idle
 * - Antenna dot pulses while speaking
 * - When onClick is provided it renders as a button (tap to replay / stop)
 */
export default function RobotAvatar({ speaking, size = 56, onClick, title }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);

  // Random blinks
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 2800 + Math.random() * 2800;
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Mouth open-amount animation while speaking.
  // A simple CSS keyframe handles the "talking" mouth shape; we toggle a class.
  const mouthClass = speaking ? 'robot-mouth speaking' : 'robot-mouth';
  const accent = speaking ? '#a78bfa' : '#764DF0';
  const glow = speaking ? '0 0 0 6px rgba(167,139,250,0.15), 0 8px 20px rgba(118,77,240,0.35)' : '0 4px 14px rgba(118,77,240,0.22)';

  const content = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#1a1f4a,#12163a)',
        border: `1px solid ${speaking ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'box-shadow 180ms, border-color 180ms',
      }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size * 0.65}
        height={size * 0.65}
        style={{ display: 'block' }}
        aria-hidden
      >
        {/* Antenna stem + blob */}
        <line x1="24" y1="4" x2="24" y2="10" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="3.5" r="1.8" fill={accent} className={speaking ? 'robot-antenna-pulse' : ''} />

        {/* Head */}
        <rect x="8" y="10" width="32" height="28" rx="7" ry="7" fill="#2a2f5a" stroke={accent} strokeWidth="1.4" />
        {/* Head inner screen area */}
        <rect x="11" y="14" width="26" height="16" rx="4" ry="4" fill="#0f1230" />

        {/* Eyes (closed when blinking) */}
        {blink ? (
          <>
            <rect x="16.5" y="21.5" width="4" height="1.2" rx="0.6" fill={accent} />
            <rect x="27.5" y="21.5" width="4" height="1.2" rx="0.6" fill={accent} />
          </>
        ) : (
          <>
            <circle cx="18.5" cy="22" r="1.9" fill={accent} />
            <circle cx="29.5" cy="22" r="1.9" fill={accent} />
            {/* eye highlights */}
            <circle cx="19" cy="21.4" r="0.55" fill="#fff" opacity="0.9" />
            <circle cx="30" cy="21.4" r="0.55" fill="#fff" opacity="0.9" />
          </>
        )}

        {/* Mouth — animated when speaking */}
        <rect
          className={mouthClass}
          x="20"
          y="32"
          width="8"
          height="1.5"
          rx="0.75"
          fill={accent}
        />

        {/* Ears / side knobs */}
        <rect x="5" y="20" width="3" height="8" rx="1" fill="#2a2f5a" stroke={accent} strokeWidth="1" />
        <rect x="40" y="20" width="3" height="8" rx="1" fill="#2a2f5a" stroke={accent} strokeWidth="1" />
      </svg>

      <style jsx>{`
        :global(.robot-mouth) {
          transform-origin: 24px 33px;
          transition: transform 120ms ease-in-out;
        }
        :global(.robot-mouth.speaking) {
          animation: robot-talk 320ms ease-in-out infinite;
        }
        :global(.robot-antenna-pulse) {
          animation: robot-antenna 900ms ease-in-out infinite;
        }
        @keyframes robot-talk {
          0%   { transform: scaleY(1)   translateY(0); }
          25%  { transform: scaleY(3.2) translateY(-1px); }
          50%  { transform: scaleY(1.5) translateY(0); }
          75%  { transform: scaleY(4.2) translateY(-1.5px); }
          100% { transform: scaleY(1)   translateY(0); }
        }
        @keyframes robot-antenna {
          0%, 100% { opacity: 1;   r: 1.8; }
          50%      { opacity: 0.5; r: 2.6; }
        }
      `}</style>
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title || (speaking ? 'Stop speaking' : 'Replay question')}
      title={title}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      {content}
    </button>
  );
}
