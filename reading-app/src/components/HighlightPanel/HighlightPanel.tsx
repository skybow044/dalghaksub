import { useTranslation } from 'react-i18next';
import { useHighlights } from '../../hooks/useHighlights';

const HighlightPanel = () => {
  const { t } = useTranslation();
  const { highlights, toggleHighlight } = useHighlights();

  return (
    <div className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{t('highlights.title')}</h2>
      {highlights.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('highlights.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {highlights.map((highlight) => (
            <li key={highlight} className="rounded-2xl border border-border/60 bg-white/70 p-4 text-sm text-muted-foreground shadow-sm dark:bg-zinc-900/60">
              <p className="whitespace-pre-line leading-relaxed text-foreground">{highlight}</p>
              <button
                type="button"
                onClick={() => toggleHighlight(highlight)}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                {t('highlights.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HighlightPanel;
