import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/consent/CookieConsent";
import ChatBot from "@/components/chatbot/ChatBot";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const SITE_URL = 'https://cvclimber.lol';
const SITE_NAME = 'CVClimber';
const SITE_TAGLINE = 'AI CV analyzer, ATS optimizer & job tracker';
const SITE_DESCRIPTION =
  'CVClimber scores your CV against any job description using AI, generates tailored cover letters in seconds, and tracks every application — built for job seekers who want more interviews, faster.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'AI CV analyzer',
    'ATS resume checker',
    'AI cover letter generator',
    'CV optimizer',
    'resume scoring',
    'applicant tracking system',
    'job application tracker',
    'AI resume builder',
    'CV keyword analysis',
    'job search tool',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'productivity',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [
      {
        url: '/aivent/misc/c2.webp',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ['/aivent/misc/c2.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  formatDetection: {
    email: false,
    telephone: false,
  },
};

// Structured data — a single combined script lets Google understand both the
// brand (Organization) and the product (SoftwareApplication) in one pass.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.png`,
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier, $9 one-time 7-day pass, Pro ($19/mo), and Pro+ ($39/mo) subscriptions',
      },
      featureList: [
        'AI-powered CV analysis with ATS scoring',
        'Tailored cover letter generation',
        'Job application tracker (Kanban + table)',
        'CV history with score progression',
        '10 professional CV templates',
      ],
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} dark h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <ChatBot />
        <CookieConsent />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(13,17,48,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-manrope), sans-serif',
              letterSpacing: '0.01em',
              borderRadius: '12px',
              padding: '12px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              maxWidth: '420px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0d1130' },
              style: { borderColor: 'rgba(52,211,153,0.20)' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0d1130' },
              style: { borderColor: 'rgba(248,113,113,0.20)' },
            },
          }}
        />
      </body>
    </html>
  );
}
