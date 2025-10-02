import { useEffect } from 'react';

interface UseScrollLockOptions {
  isLocked: boolean;
  lockClass?: string;
}

/**
 * Custom hook to lock/unlock body scroll and prevent background interactions
 * 
 * @param isLocked - Whether to lock the scroll
 * @param lockClass - Optional CSS class to add to body when locked
 */
export function useScrollLock({ isLocked, lockClass }: UseScrollLockOptions) {
  useEffect(() => {
    if (!isLocked) return;

    // Store original scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Store original body styles
    const originalStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      pointerEvents: document.body.style.pointerEvents,
    };

    // Apply scroll lock styles
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    // Add optional class
    if (lockClass) {
      document.body.classList.add(lockClass);
    }

    // Cleanup function
    return () => {
      // Restore original styles
      Object.entries(originalStyles).forEach(([property, value]) => {
        (document.body.style as any)[property] = value;
      });

      // Remove optional class
      if (lockClass) {
        document.body.classList.remove(lockClass);
      }

      // Restore scroll position
      window.scrollTo(scrollX, scrollY);
    };
  }, [isLocked, lockClass]);
}

/**
 * Simple version that just locks/unlocks scroll
 */
export function useSimpleScrollLock(isLocked: boolean) {
  useScrollLock({ isLocked });
}
