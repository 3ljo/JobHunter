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

function writeCookie(response: NextResponse, code: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: code,
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax',
    // httpOnly stays false — client code reads this cookie at signup to
    // include it in the /api/auth/register body.
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  if (!ref) return NextResponse.next();

  const clean = ref.trim().toUpperCase();
  if (!CODE_RE.test(clean)) return NextResponse.next();

  // A bare /?ref=CODE link should drop the visitor straight on the signup
  // form — the referrer already sold them on the product, no need to make
  // them scroll the marketing page. Handles legacy share URLs still
  // floating around in chats / emails.
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/register';
    // Keep ?ref= on the URL so the register form's URL-param branch
    // pre-fills it (belt-and-braces with the cookie we're about to set).
    const redirect = NextResponse.redirect(url);
    writeCookie(redirect, clean);
    return redirect;
  }

  const response = NextResponse.next();
  writeCookie(response, clean);
  return response;
}

// Skip Next internals and API routes; referral capture only needs to run
// for actual page navigations.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|apple-icon|icon|robots.txt|sitemap.xml|aivent).*)',
  ],
};
