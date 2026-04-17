'use client';

import { useEffect, useRef, useState } from 'react';

interface RobotAvatarProps {
  speaking: boolean;
  loading?: boolean;
  size?: number;
  onClick?: () => void;
  bubbleText?: string;
  /** Optional looping talking video (muted). When speaking, it plays;
   *  when idle, it's paused at frame 1. If it fails to load we fall
   *  back to a static still image. */
  videoSrc?: string;
  /** Static fallback / poster image. */
  posterSrc?: string;
}

const DEFAULT_VIDEO_SRC = '/interview/robot-talking.mp4';
const DEFAULT_POSTER_SRC = '/aivent/misc/c2.webp';

export default function RobotAvatar({
  speaking,
  loading,
  size = 150,
  onClick,
  bubbleText,
  videoSrc = DEFAULT_VIDEO_SRC,
  posterSrc = DEFAULT_POSTER_SRC,
}: RobotAvatarProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Play / pause based on speaking state. Video is always muted (audio
  // comes from the separate TTS/speechSynthesis system).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || videoFailed) return;
    if (speaking) {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay blocked — that's fine */ });
    } else {
      v.pause();
      // Reset to first frame so the robot looks "ready" rather than mid-sentence
      try { v.currentTime = 0; } catch { /* noop */ }
    }
  }, [speaking, videoFailed]);

  const bubble = bubbleText ?? (loading ? 'Loading my voice…' : speaking ? 'Tap me to mute' : 'Tap me to talk');

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
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          filter: 'drop-shadow(0 10px 28px rgba(118,77,240,0.35))',
        }}
      >
        {/* Video layer (preferred) */}
        {!videoFailed && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            muted
            playsInline
            loop
            preload="metadata"
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              borderRadius: 18,
              background: 'transparent',
            }}
          />
        )}

        {/* Fallback: static image shown only if the video failed to load */}
        {videoFailed && (
          <img
            src={posterSrc}
            alt="Robot interviewer"
            className={speaking ? 'robot-img-talking' : 'robot-img-idle'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              borderRadius: 18,
            }}
          />
        )}

        {/* Subtle "tap me" ring when idle, glow ring when speaking */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 24,
            border: `2px solid ${speaking ? 'rgba(239,68,68,0.45)' : 'rgba(167,139,250,0.30)'}`,
            pointerEvents: 'none',
            animation: speaking ? 'robot-ring-fast 1200ms ease-out infinite' : 'robot-ring-slow 2800ms ease-out infinite',
          }}
        />

        {/* Loading dots overlay while TTS fetch in flight */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8,11,35,0.45)',
              borderRadius: 18,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#a78bfa', animation: 'robot-dot 1s ease-in-out infinite', animationDelay: '0s' }} />
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#a78bfa', animation: 'robot-dot 1s ease-in-out infinite', animationDelay: '0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#a78bfa', animation: 'robot-dot 1s ease-in-out infinite', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
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
            borderRight: `8px solid ${speaking ? '#ef4444' : loading ? '#a78bfa' : '#764DF0'}`,
          }}
        />
      </div>

      <style jsx>{`
        :global(.robot-img-idle)    { animation: robot-float 4200ms ease-in-out infinite; will-change: transform; }
        :global(.robot-img-talking) { animation: robot-float 2000ms ease-in-out infinite; will-change: transform; }
        @keyframes robot-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes robot-ring-slow {
          0%   { transform: scale(1);    opacity: 0.7; }
          70%  { transform: scale(1.10); opacity: 0;   }
          100% { transform: scale(1.10); opacity: 0;   }
        }
        @keyframes robot-ring-fast {
          0%   { transform: scale(1);    opacity: 0.9; }
          70%  { transform: scale(1.14); opacity: 0;   }
          100% { transform: scale(1.14); opacity: 0;   }
        }
        @keyframes robot-dot {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50%      { opacity: 1;   transform: translateY(-2px); }
        }
      `}</style>

      {/* Hide video controls on all browsers even if they sneak in */}
      <style jsx>{`
        :global(video::-webkit-media-controls) { display: none !important; }
        :global(video::-webkit-media-controls-enclosure) { display: none !important; }
      `}</style>
    </div>
  );
}
