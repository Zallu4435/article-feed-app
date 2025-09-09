import React from 'react';
import type { EmptyStateProps } from '@/types/ui';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="w-full">
      <div className={cn(
        'mx-auto flex max-w-xl flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center',
        'shadow-sm'
      )}>
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75V12h6.75a.75.75 0 010 1.5h-7.5A.75.75 0 0111.25 12V5.25A.75.75 0 0112 4.5z" clipRule="evenodd" />
            <path d="M6.75 7.5A2.25 2.25 0 004.5 9.75v7.5A2.25 2.25 0 006.75 19.5h10.5A2.25 2.25 0 0019.5 17.25v-3a.75.75 0 011.5 0v3A3.75 3.75 0 0117.25 21H6.75A3.75 3.75 0 013 17.25v-7.5A3.75 3.75 0 016.75 6h3a.75.75 0 010 1.5h-3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mb-6 max-w-md text-sm text-gray-600">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button variant="default" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export { EmptyState };
