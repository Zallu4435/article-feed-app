import React from 'react';
import type { PaginationProps } from '@/types/ui';
import { cn } from '@/lib/utils';

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const createPageList = () => {
    const pages: (number | 'ellipsis')[] = [];
    const siblings = 1;
    const boundary = 1;

    const startPages = range(1, Math.min(boundary, totalPages));
    const endPages = range(Math.max(totalPages - boundary + 1, boundary + 1), totalPages);
    const leftSiblingStart = Math.max(page - siblings, boundary + 2);
    const rightSiblingEnd = Math.min(page + siblings, totalPages - boundary - 1);

    pages.push(...startPages);
    if (leftSiblingStart > boundary + 2) pages.push('ellipsis');
    pages.push(...range(leftSiblingStart, rightSiblingEnd));
    if (rightSiblingEnd < totalPages - boundary - 1) pages.push('ellipsis');
    pages.push(...endPages);

    return pages.filter((p, idx, arr) =>
      p === 'ellipsis' || (typeof p === 'number' && (idx === 0 || arr[idx - 1] !== p))
    );
  };

  const pages = createPageList();

  const buttonBase = 'h-9 w-9 inline-flex items-center justify-center rounded-md border text-sm transition-colors select-none';

  return (
    <nav className="mt-6 flex items-center justify-center space-x-2" role="navigation" aria-label="Pagination">
      <button
        className={cn(buttonBase,
          'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
          page === 1 && 'opacity-50 cursor-not-allowed hover:bg-white')}
        onClick={() => page > 1 && onChange(page - 1)}
        aria-label="Previous page"
        disabled={page === 1}
      >
        ‹
      </button>

      {pages.map((p, i) => p === 'ellipsis' ? (
        <span key={`e-${i}`} className="px-2 text-gray-500">…</span>
      ) : (
        <button
          key={p}
          className={cn(buttonBase,
            p === page
              ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-600'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
        >
          {p}
        </button>
      ))}

      <button
        className={cn(buttonBase,
          'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
          page === totalPages && 'opacity-50 cursor-not-allowed hover:bg-white')}
        onClick={() => page < totalPages && onChange(page + 1)}
        aria-label="Next page"
        disabled={page === totalPages}
      >
        ›
      </button>
    </nav>
  );
};

export { Pagination };
