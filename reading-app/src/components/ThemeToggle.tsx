import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';

const ThemeToggle = () => {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/90 shadow-sm transition hover:bg-muted"
    >
      {theme === 'dark' ? t('theme.light') : t('theme.dark')}
    </button>
  );
};

export default ThemeToggle;
