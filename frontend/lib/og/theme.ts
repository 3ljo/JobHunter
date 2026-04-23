// Brand tokens + shared font loader for OG share cards. Pulled from the
// existing UI (Manrope from next/font/google, violet/emerald palette used
// throughout the dashboard and landing page). Keeping them in one file
// means /api/og/hired and /api/og/score stay visually consistent.

export const OG_SIZE = { width: 1200, height: 630 };

export const COLORS = {
  bgDeep: '#0a0d24',
  bgCard: '#101435',
  bgCardLight: '#1A1E42',
  violet: '#764DF0',
  violetDark: '#5b21b6',
  violetLight: '#a78bfa',
  violetGlow: '#c4b5fd',
  emerald: '#34d399',
  gold: '#fbbf24',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255,255,255,0.55)',
  textFaint: 'rgba(255,255,255,0.35)',
};

// Satori (inside @vercel/og) needs raw font bytes — it can't resolve
// next/font variables. We fetch Manrope's woff2 from Google's CDN at
// cold-start time; cached thereafter. If the fetch fails we fall back
// to Satori's built-in fallback font (Inter-like), which is uglier but
// keeps the route working.
type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: 'normal' };

// Cache across hot reloads within the same process.
let fontsCache: FontSpec[] | null = null;

export async function loadFonts(): Promise<FontSpec[]> {
  if (fontsCache) return fontsCache;

  // Manrope is already a next/font/google import in the main app.
  // Grab the same static TTFs Google ships for Satori consumption.
  const urls: Array<[string, 400 | 700 | 800]> = [
    ['https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-Regular.ttf', 400],
    ['https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-Bold.ttf', 700],
    ['https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-ExtraBold.ttf', 800],
  ];

  try {
    const fonts: FontSpec[] = await Promise.all(
      urls.map(async ([url, weight]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Font ${url} → ${res.status}`);
        return {
          name: 'Manrope',
          data: await res.arrayBuffer(),
          weight,
          style: 'normal' as const,
        };
      })
    );
    fontsCache = fonts;
    return fonts;
  } catch (err) {
    console.warn('OG font load failed, falling back to default:', (err as Error).message);
    return [];
  }
}
