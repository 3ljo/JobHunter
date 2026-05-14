// GET /api/og/score?name=<firstName>&score=<0-100>&ref=<code>
// "I scored X% ATS" brag card. Reuses brand tokens + font loader from
// lib/og/theme so Phase 7 and Phase 8 cards match 1:1.

import { ImageResponse } from 'next/og';
import { OG_SIZE, COLORS, loadFonts } from '@/lib/og/theme';

export const runtime = 'edge';

const clamp = (s: string | null, max: number) => (s ? s.slice(0, max) : '');

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = clamp(url.searchParams.get('name'), 24) || 'Friend';
  const rawScore = Number(url.searchParams.get('score') || '0');
  const score = Math.max(0, Math.min(100, Number.isFinite(rawScore) ? Math.round(rawScore) : 0));
  const refCode = clamp(url.searchParams.get('ref'), 16);
  const shareUrl = refCode ? `cvclimber.lol/?ref=${refCode}` : 'cvclimber.lol';

  const fonts = await loadFonts();

  // Score ring geometry: stroke-based circle with a gradient fill that
  // sweeps from 0 to `score`% of 360deg. SVG inline since Satori supports it.
  const R = 120;
  const C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${COLORS.bgDeep} 0%, ${COLORS.bgCard} 55%, ${COLORS.violetDark} 100%)`,
          color: COLORS.textPrimary,
          fontFamily: '"Manrope", system-ui, sans-serif',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Emerald glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            left: -150,
            width: 440,
            height: 440,
            borderRadius: 220,
            background: COLORS.emerald,
            opacity: 0.2,
            filter: 'blur(80px)',
          }}
        />
        {/* Gold glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: 180,
            background: COLORS.gold,
            opacity: 0.14,
            filter: 'blur(80px)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.violetDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 24,
              }}
            >
              C
            </div>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em' }}>CvClimber</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: `rgba(52,211,153,0.15)`,
              border: `1px solid ${COLORS.emerald}66`,
              borderRadius: 999,
              padding: '10px 20px',
              color: COLORS.emerald,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ATS Score
          </div>
        </div>

        {/* Body: score ring + label */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 60,
            zIndex: 1,
          }}
        >
          {/* Ring */}
          <div style={{ display: 'flex', position: 'relative', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
            <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} />
                  <stop offset="100%" stopColor={COLORS.violetLight} />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="18" fill="none" />
              <circle
                cx="140"
                cy="140"
                r={R}
                stroke="url(#ring)"
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                transform="rotate(-90 140 140)"
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 28, color: COLORS.textMuted, fontWeight: 700, marginTop: 4 }}>/ 100</span>
            </div>
          </div>

          {/* Label */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 620 }}>
            <span style={{ fontSize: 24, color: COLORS.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              {name} just hit
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.05,
                marginTop: 16,
                letterSpacing: '-0.03em',
                background: `linear-gradient(90deg, ${COLORS.textPrimary}, ${COLORS.emerald})`,
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              top-tier ATS
            </span>
            <span style={{ fontSize: 24, color: COLORS.textMuted, marginTop: 28, lineHeight: 1.45 }}>
              CvClimber&apos;s AI audit: keyword match, formatting, bullet quality, section structure.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24,
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 22, color: COLORS.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
            Try it yourself
          </span>
          <span style={{ fontSize: 22, color: COLORS.emerald, fontWeight: 700 }}>{shareUrl}</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fonts.length > 0 ? fonts : undefined,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
