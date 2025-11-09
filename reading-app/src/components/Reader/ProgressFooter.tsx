import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';

const ProgressFooter = () => {
  const { t } = useTranslation();
  const progress = useAppStore((state) => state.progress);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-5 py-3 text-sm shadow-sm">
      <span className="font-medium text-muted-foreground">{t('progress.label')}</span>
      <div className="flex w-48 items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="tabular-nums font-semibold text-foreground">{progress}%</span>
      </div>
    </div>
  );
};

export default ProgressFooter;
