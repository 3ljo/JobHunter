// GET /api/og/hired?name=<firstName>&company=<company>&ref=<code>
// Generates a 1200x630 "CvClimber Verified — Hired" badge PNG for the
// user to download or share on LinkedIn after marking a job "Offer
// Accepted". All params are optional; the card looks sensible with none.
//
// Edge runtime so @vercel/og can use the streaming Satori pipeline.

import { ImageResponse } from 'next/og';
import { OG_SIZE, COLORS, loadFonts } from '@/lib/og/theme';

export const runtime = 'edge';

const clamp = (s: string | null, max: number) => (s ? s.slice(0, max) : '');

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = clamp(url.searchParams.get('name'), 24) || 'Friend';
  const company = clamp(url.searchParams.get('company'), 28);
  const refCode = clamp(url.searchParams.get('ref'), 16);

  const shareUrl = refCode ? `cvclimber.lol/?ref=${refCode}` : 'cvclimber.lol';
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${COLORS.bgDeep} 0%, ${COLORS.bgCard} 60%, ${COLORS.violetDark} 100%)`,
          color: COLORS.textPrimary,
          fontFamily: '"Manrope", system-ui, sans-serif',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Violet glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 440,
            height: 440,
            borderRadius: 220,
            background: COLORS.violet,
            opacity: 0.28,
            filter: 'blur(80px)',
          }}
        />
        {/* Emerald glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -120,
            width: 340,
            height: 340,
            borderRadius: 170,
            background: COLORS.emerald,
            opacity: 0.18,
            filter: 'blur(80px)',
          }}
        />

        {/* Header: CvClimber mark + "Verified" pill */}
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
              background: 'rgba(251,191,36,0.15)',
              border: `1px solid ${COLORS.gold}66`,
              borderRadius: 999,
              padding: '10px 20px',
              color: COLORS.gold,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            🏆 Verified · Hired
          </div>
        </div>

        {/* Main block */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', zIndex: 1 }}>
          <p
            style={{
              fontSize: 28,
              color: COLORS.textMuted,
              margin: 0,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {name} just landed
          </p>
          <p
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.04,
              margin: '16px 0 0 0',
              letterSpacing: '-0.03em',
              background: `linear-gradient(90deg, ${COLORS.textPrimary}, ${COLORS.violetGlow})`,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {company ? `a role at ${company}` : 'their next role'}
          </p>
          <p
            style={{
              fontSize: 26,
              color: COLORS.textMuted,
              margin: '28px 0 0 0',
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Powered by AI CV analysis, tailored cover letters, and voice mock interviews.
          </p>
        </div>

        {/* Footer: share URL */}
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
            CvClimber Verified
          </span>
          <span style={{ fontSize: 22, color: COLORS.emerald, fontWeight: 700 }}>
            {shareUrl}
          </span>
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
