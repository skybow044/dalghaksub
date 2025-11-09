import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';

const SummaryView = () => {
  const { t } = useTranslation();
  const summaries = useAppStore((state) => state.summaries);
  const removeSummary = useAppStore((state) => state.removeSummary);

  return (
    <div className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t('summary.title')}</h2>
      </div>
      {summaries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('summary.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {summaries.map((summary) => (
            <li key={summary.id} className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm dark:bg-zinc-900/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{summary.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {summary.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSummary(summary.id)}
                  className="rounded-md border border-transparent px-2 py-1 text-xs text-muted-foreground transition hover:border-border hover:bg-muted"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SummaryView;
