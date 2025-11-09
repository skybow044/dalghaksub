import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentLoader } from '../../hooks/useDocumentLoader';
import { useHighlights } from '../../hooks/useHighlights';
import { useReadingProgress } from '../../hooks/useReadingProgress';

const Reader = () => {
  const { t } = useTranslation();
  const { content, metadata, openPicker, onInputChange, fileInputRef, clearContent } = useDocumentLoader();
  const { toggleHighlight, isHighlighted } = useHighlights();
  const { containerRef } = useReadingProgress<HTMLDivElement>();
  const [selection, setSelection] = useState('');

  const paragraphs = useMemo(() => {
    if (!content) return [];
    return content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [content]);

  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected) {
      setSelection(selected);
    }
  };

  const handleHighlightSelection = () => {
    if (selection) {
      toggleHighlight(selection);
      setSelection('');
    }
  };

  const handleClear = () => {
    clearContent();
    setSelection('');
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <input ref={fileInputRef} type="file" onChange={onInputChange} className="hidden" accept=".txt,.json" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('reader.title')}</h2>
          {metadata && (
            <p className="text-xs text-muted-foreground">
              {metadata.name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPicker}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {t('reader.load')}
          </button>
          {content && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted"
            >
              {t('reader.clear')}
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="mt-6 space-y-4 overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-6 leading-relaxed shadow-inner dark:bg-zinc-900/60"
        onMouseUp={handleMouseUp}
      >
        {paragraphs.length > 0 ? (
          <article className="prose max-w-none dark:prose-invert">
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${paragraph.slice(0, 24)}-${index}`}
                className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                  isHighlighted(paragraph)
                    ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100'
                    : 'hover:bg-muted'
                }`}
                onClick={() => toggleHighlight(paragraph)}
              >
                {paragraph}
              </p>
            ))}
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">{t('reader.empty')}</p>
        )}
      </div>

      {selection && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <div>
            <p className="font-medium">{t('reader.selected')}</p>
            <p className="text-primary/80">{selection}</p>
          </div>
          <button
            type="button"
            onClick={handleHighlightSelection}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {t('reader.highlight')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Reader;
