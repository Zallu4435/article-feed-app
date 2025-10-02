'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LoadingState {
  id: string;
  text?: string;
  backdrop?: 'light' | 'dark' | 'blur';
}

interface LoadingContextType {
  isLoading: boolean;
  activeLoadings: LoadingState[];
  showLoading: (id: string, text?: string, backdrop?: 'light' | 'dark' | 'blur') => void;
  hideLoading: (id: string) => void;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [activeLoadings, setActiveLoadings] = useState<LoadingState[]>([]);

  const showLoading = useCallback((id: string, text?: string, backdrop: 'light' | 'dark' | 'blur' = 'light') => {
    setActiveLoadings(prev => {
      // Remove existing loading with same id if any
      const filtered = prev.filter(loading => loading.id !== id);
      // Add new loading
      return [...filtered, { id, text, backdrop }];
    });
  }, []);

  const hideLoading = useCallback((id: string) => {
    setActiveLoadings(prev => prev.filter(loading => loading.id !== id));
  }, []);

  const clearAllLoading = useCallback(() => {
    setActiveLoadings([]);
  }, []);

  const isLoading = activeLoadings.length > 0;
  const currentLoading = activeLoadings[activeLoadings.length - 1]; // Show the most recent loading

  const value: LoadingContextType = {
    isLoading,
    activeLoadings,
    showLoading,
    hideLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {/* Global loading overlay */}
      {currentLoading && (
        <LoadingSpinner
          size={40}
          text={currentLoading.text}
          overlay={true}
          preventScroll={true}
          backdrop={currentLoading.backdrop}
        />
      )}
    </LoadingContext.Provider>
  );
};

/**
 * Hook for simple loading states - automatically handles show/hide
 */
export const useSimpleLoading = (id: string) => {
  const { showLoading, hideLoading } = useLoading();

  const setLoading = useCallback((loading: boolean, text?: string, backdrop?: 'light' | 'dark' | 'blur') => {
    if (loading) {
      showLoading(id, text, backdrop);
    } else {
      hideLoading(id);
    }
  }, [id, showLoading, hideLoading]);

  return { setLoading };
};

/**
 * Hook for async operations with automatic loading management
 */
export const useAsyncWithLoading = () => {
  const { showLoading, hideLoading } = useLoading();

  const executeWithLoading = useCallback(async (
    asyncFn: () => Promise<any>,
    loadingId: string,
    loadingText?: string,
    backdrop?: 'light' | 'dark' | 'blur'
  ) => {
    try {
      showLoading(loadingId, loadingText, backdrop);
      const result = await asyncFn();
      return result;
    } finally {
      hideLoading(loadingId);
    }
  }, [showLoading, hideLoading]);

  return { executeWithLoading };
};
