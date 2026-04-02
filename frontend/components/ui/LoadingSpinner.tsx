'use client';

export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-fuchsia-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
    </div>
  );
}
