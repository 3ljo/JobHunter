import type { MetadataRoute } from 'next';

const SITE_URL = 'https://cvclimber.lol';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/contact'],
        disallow: [
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/auth/',
          '/dashboard',
          '/cv',
          '/cv-history',
          '/create-cv',
          '/cover-letter',
          '/interview',
          '/tracker',
          '/gift',
          '/redeem/',
          '/settings',
          '/checkout',
          '/pricing',
          '/bosi',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
