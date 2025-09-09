import React from 'react';
import type { LoadingSpinnerProps } from '@/types/ui';
import { cn } from '@/lib/utils';

const sizeMap: Record<number, string> = {
  12: 'h-3 w-3',
  16: 'h-4 w-4',
  20: 'h-5 w-5',
  24: 'h-6 w-6',
  32: 'h-8 w-8',
  40: 'h-10 w-10',
};

const nearestSizeClass = (size: number) => {
  const keys = Object.keys(sizeMap).map(Number).sort((a, b) => Math.abs(a - size) - Math.abs(b - a));
  return sizeMap[keys[0]];
};

const LoadingSpinner: React.FC<LoadingSpinnerProps & { center?: boolean; overlay?: boolean; className?: string }> = ({ size = 24, text, center = true, overlay = false, className }) => {
  const dimClass = nearestSizeClass(size);

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
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );

  if (!overlay) return spinner;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      {spinner}
    </div>
  );
};

export { LoadingSpinner };
