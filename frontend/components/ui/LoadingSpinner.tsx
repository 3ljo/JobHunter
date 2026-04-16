'use client';

/**
 * AIvent-style orbiting-dots loader.
 *
 * size="lg"  → 80px  (full-page loading states)
 * size="md"  → 48px  (card/section loading)
 * size="sm"  → 24px  (inline / button loading)
 */
export default function LoadingSpinner({
  className = '',
  size = 'lg',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'lds-roller-sm' : size === 'md' ? 'lds-roller-md' : 'lds-roller';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={sizeClass}>
        <div /><div /><div /><div /><div /><div /><div /><div />
      </div>
    </div>
  );
}
