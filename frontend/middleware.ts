// Referral-code capture middleware.
//
// Runs on every non-static request. If the URL carries a ?ref=CODE param,
// persist it as the `cv_ref` cookie (90-day TTL) so we can attribute the
// referral at signup regardless of which page the visitor landed on
// (/, /pricing, /login, /register, /redeem/..., etc).
//
// Server-side cookie set survives:
//   - JS disabled / blocked
//   - First-render flashes before any client effect runs
//   - Cross-origin redirects back from OAuth / checkout
//
// Client-side helpers in lib/referralCookie.ts remain as a belt-and-braces
// fallback for SPA navigations that don't re-hit middleware.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'cv_ref';
const MAX_AGE = 90 * 24 * 60 * 60; // 90 days, matches client helper
const CODE_RE = /^[A-Z0-9]{4,16}$/;

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  if (!ref) return NextResponse.next();

  const clean = ref.trim().toUpperCase();
  if (!CODE_RE.test(clean)) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set({
    name: COOKIE_NAME,
    value: clean,
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax',
    // httpOnly stays false — client code reads this cookie at signup to
    // include it in the /api/auth/register body.
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

// Skip Next internals and API routes; referral capture only needs to run
// for actual page navigations.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|apple-icon|icon|robots.txt|sitemap.xml|aivent).*)',
  ],
};
