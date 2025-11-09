import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HighlightState = {
  highlights: string[];
  toggleHighlight: (content: string) => void;
  clearHighlights: () => void;
};

const useHighlightStore = create<HighlightState>()(
  persist(
    (set, get) => ({
      highlights: [],
      toggleHighlight: (content) => {
        const normalized = content.trim();
        if (!normalized) return;
        set((state) => {
          const exists = state.highlights.includes(normalized);
          return {
            highlights: exists
              ? state.highlights.filter((item) => item !== normalized)
              : [normalized, ...state.highlights]
          };
        });
      },
      clearHighlights: () => set({ highlights: [] })
    }),
    {
      name: 'reading-app-highlights',
      version: 1
    }
  )
);

export const useHighlights = () => {
  const highlights = useHighlightStore((state) => state.highlights);
  const toggleHighlight = useHighlightStore((state) => state.toggleHighlight);
  const clearHighlights = useHighlightStore((state) => state.clearHighlights);
  const isHighlighted = (content: string) => highlights.includes(content.trim());

  return {
    highlights,
    toggleHighlight,
    clearHighlights,
    isHighlighted
  };
};
