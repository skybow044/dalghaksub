import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SummaryItem = {
  id: string;
  label: string;
  content: string;
};

type Theme = 'light' | 'dark';
type Language = 'en' | 'fa';

type AppState = {
  theme: Theme;
  language: Language;
  summaries: SummaryItem[];
  progress: number;
  toggleTheme: () => void;
  setLanguage: (lng: Language) => void;
  addSummary: (summary: SummaryItem) => void;
  removeSummary: (id: string) => void;
  setProgress: (value: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      summaries: [],
      progress: 0,
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark'
        })),
      setLanguage: (lng) => set({ language: lng }),
      addSummary: (summary) => {
        set((state) => ({ summaries: [summary, ...state.summaries] }));
      },
      removeSummary: (id) => {
        set((state) => ({ summaries: state.summaries.filter((item) => item.id !== id) }));
      },
      setProgress: (value) => set({ progress: value })
    }),
    {
      name: 'reading-app-store',
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        summaries: state.summaries
      })
    }
  )
);

export const getSummaryById = (id: string) =>
  useAppStore.getState().summaries.find((item) => item.id === id);
