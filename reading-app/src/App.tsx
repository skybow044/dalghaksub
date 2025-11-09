import { Suspense } from 'react';
import Reader from './components/Reader/Reader';
import SummaryView from './components/SummaryView/SummaryView';
import HighlightPanel from './components/HighlightPanel/HighlightPanel';
import LanguageToggle from './components/LanguageToggle';
import ThemeToggle from './components/ThemeToggle';
import SettingsModal from './components/Settings/SettingsModal';
import ProgressFooter from './components/Reader/ProgressFooter';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">{t('loading')}</div>}>
      <div className="min-h-screen bg-surface text-foreground transition-colors selection:bg-indigo-200 selection:text-indigo-900 dark:bg-zinc-950 dark:text-zinc-50">
        <header className="border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70 sticky top-0 z-20 border-b px-6 py-4 shadow-sm dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <SettingsModal />
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-4">
            <Reader />
            <ProgressFooter />
          </section>
          <aside className="space-y-4">
            <SummaryView />
            <HighlightPanel />
          </aside>
        </main>
      </div>
    </Suspense>
  );
}

export default App;
