import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the CVClimber team. Questions about CV analysis, billing, partnerships, or feedback — we read every message.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact CVClimber',
    description:
      'Reach out for support, billing questions, partnerships, or product feedback.',
    url: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
