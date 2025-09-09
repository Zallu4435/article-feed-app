"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { useRouter } from 'next/navigation';

const options = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Write Article', href: '/articles/create' },
  { label: 'My Articles', href: '/articles/list' },
  { label: 'Settings', href: '/settings' },
];

const CommandPalette: React.FC = () => {
  const { isSearchOpen, closeSearch } = useKeyboard();
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isSearchOpen) setQuery('');
  }, [isSearchOpen]);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={closeSearch}>
      <div className="max-w-lg mx-auto mt-24" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-md shadow-lg overflow-hidden">
          <div className="border-b p-3">
            <input
              autoFocus
              className="w-full outline-none text-sm"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered[0]) {
                  router.push(filtered[0].href);
                  closeSearch();
                }
              }}
            />
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.map((o) => (
              <li key={o.href}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  onClick={() => {
                    router.push(o.href);
                    closeSearch();
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No results</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
