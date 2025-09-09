"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { KeyboardContextType } from '@/types';

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const useKeyboard = () => {
  const ctx = useContext(KeyboardContext);
  if (!ctx) throw new Error('useKeyboard must be used within KeyboardProvider');
  return ctx;
};

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const value: KeyboardContextType = {
    isSearchOpen,
    online,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
  };

  return <KeyboardContext.Provider value={value}>{children}</KeyboardContext.Provider>;
};
