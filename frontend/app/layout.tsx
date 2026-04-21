import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import I18nProvider from "@/lib/i18n/I18nProvider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CvClimber",
  description: "Land your dream job with AI-powered CV analysis, cover letter generation, and smart job tracking.",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider>{children}</I18nProvider>
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
