import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ThemeInitializer from "@/components/layout/ThemeInitializer";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "JobHunter — AI-Powered Job Search",
  description: "Land your dream job with AI-powered CV analysis, cover letter generation, and smart job tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeInitializer />
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
