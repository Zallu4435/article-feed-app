import React from 'react';
import type { LoadingSpinnerProps } from '@/types/ui';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';

const sizeMap: Record<number, string> = {
  12: 'h-3 w-3',
  16: 'h-4 w-4',
  20: 'h-5 w-5',
  24: 'h-6 w-6',
  32: 'h-8 w-8',
  40: 'h-10 w-10',
};

const nearestSizeClass = (size: number) => {
  const keys = Object.keys(sizeMap).map(Number).sort((a, b) => Math.abs(a - size) - Math.abs(b - size));
  return sizeMap[keys[0]];
};

const LoadingSpinner: React.FC<LoadingSpinnerProps & { 
  center?: boolean; 
  overlay?: boolean; 
  className?: string;
  preventScroll?: boolean;
  backdrop?: 'light' | 'dark' | 'blur';
}> = ({ 
  size = 24, 
  text, 
  center = true, 
  overlay = false, 
  className,
  preventScroll = false,
  backdrop = 'light'
}) => {
  const dimClass = nearestSizeClass(size);

  // Use scroll lock hook to prevent scrolling when overlay is shown
  useScrollLock({ 
    isLocked: overlay && preventScroll,
    lockClass: 'loading-overlay-active'
  });

  const spinner = (
    <div className={cn('inline-flex items-center space-x-2', center && 'justify-center', className)}>
      <svg
        className={cn('animate-spin text-indigo-600', dimClass)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="status"
        aria-live="polite"
        aria-label={text || 'Loading'}
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && <span className="text-sm text-gray-600 font-medium">{text}</span>}
    </div>
  );

  if (!overlay) return spinner;

  // Different backdrop styles
  const getBackdropClass = () => {
    switch (backdrop) {
      case 'dark':
        return 'bg-black/50';
      case 'blur':
        return 'bg-white/80 backdrop-blur-sm';
      default:
        return 'bg-white/70';
    }
  };

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        getBackdropClass(),
        preventScroll ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="pointer-events-none">
        {spinner}
      </div>
    </div>
  );
};

export { LoadingSpinner };
