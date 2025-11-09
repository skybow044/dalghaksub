import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { nanoid } from '../../utils/nanoid';

const SettingsModal = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const addSummary = useAppStore((state) => state.addSummary);

  const resetForm = () => {
    setLabel('');
    setContent('');
  };

  const handleSave = () => {
    if (!label.trim() || !content.trim()) {
      return;
    }
    addSummary({
      id: nanoid(),
      label: label.trim(),
      content: content.trim()
    });
    resetForm();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/90 shadow-sm transition hover:bg-muted"
      >
        {t('settings.title')}
      </button>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    {t('settings.title')}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {t('settings.description')}
                  </Dialog.Description>

                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground" htmlFor="summary-label">
                        {t('settings.label')}
                      </label>
                      <input
                        id="summary-label"
                        type="text"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground" htmlFor="summary-content">
                        {t('settings.content')}
                      </label>
                      <textarea
                        id="summary-content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setOpen(false);
                      }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                      {t('settings.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      {t('settings.save')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default SettingsModal;
