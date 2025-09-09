"use client";

import React from 'react';
import { useKeyboard } from '@/contexts/KeyboardContext';

const OnlineBar: React.FC = () => {
  const { online } = useKeyboard();
  if (online) return null;
  return (
    <div className="w-full bg-yellow-500 text-yellow-950 text-center text-sm py-1">
      You are offline. Some actions may be unavailable.
    </div>
  );
};

export default OnlineBar;


