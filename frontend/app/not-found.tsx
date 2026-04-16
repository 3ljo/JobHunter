import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: '#101435' }}>
      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: '15%',
            left: '25%',
            background: 'radial-gradient(circle, rgba(118,77,240,0.22) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: '10%',
            right: '15%',
            background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.03,
        }}
      />

      {/* Noise grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Logo */}
        <img
          src="/aivent/logo.webp"
          alt="JobHunter"
          style={{ height: '36px', width: 'auto', opacity: 0.7 }}
          className="mb-14"
        />

        {/* Big 404 */}
        <h1
          className="leading-none mb-4"
          style={{
            fontSize: 'clamp(100px, 18vw, 180px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </h1>

        {/* Text */}
        <span
          className="aivent-subtitle"
          style={{ marginBottom: '14px', display: 'block' }}
        >
          Page Not Found
        </span>
        <p
          className="text-white/45 text-base leading-relaxed mb-10"
          style={{ fontWeight: 400, maxWidth: '28rem' }}
        >
          The page you are looking for does not exist or has been moved. Head back to your dashboard and continue your job search.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="btn-aivent fx-slide"
            data-hover="DASHBOARD"
          >
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="btn-aivent btn-line fx-slide"
            data-hover="HOME"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
