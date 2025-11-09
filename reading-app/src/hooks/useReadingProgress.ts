import { RefObject, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';

export const useReadingProgress = <T extends HTMLElement>() => {
  const containerRef = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const updateGlobalProgress = useAppStore((state) => state.setProgress);

  useEffect(() => {
    const updateProgress = () => {
      const element = containerRef.current;
      if (!element) {
        setProgress(0);
        updateGlobalProgress(0);
        return;
      }
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const elementHeight = element.scrollHeight || rect.height;
      if (elementHeight <= 0) {
        setProgress(0);
        updateGlobalProgress(0);
        return;
      }
      const viewportBottom = window.scrollY + window.innerHeight;
      const distance = viewportBottom - elementTop;
      const ratio = Math.min(Math.max(distance / elementHeight, 0), 1);
      const percent = Math.round(ratio * 100);
      setProgress(percent);
      updateGlobalProgress(percent);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [updateGlobalProgress]);

  return { progress, containerRef: containerRef as RefObject<T> };
};

export type UseReadingProgressReturn<T extends HTMLElement> = ReturnType<
  typeof useReadingProgress<T>
>;
