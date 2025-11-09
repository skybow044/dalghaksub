import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { DIR_MAP } from '../i18n';

const LanguageToggle = () => {
  const { t, i18n } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const changeLanguage = (lng: 'en' | 'fa') => {
    setLanguage(lng);
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/90 shadow-sm transition hover:bg-muted">
        {t('language.toggle')} · {language === 'fa' ? t('language.persian') : t('language.english')}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Menu.Items className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-lg focus:outline-none">
          {Object.entries(DIR_MAP).map(([lng]) => (
            <Menu.Item key={lng}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => changeLanguage(lng as 'en' | 'fa')}
                  className={`block w-full px-4 py-2 text-sm text-left ${
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  } ${language === lng ? 'font-semibold text-primary' : ''}`}
                >
                  {lng === 'fa' ? t('language.persian') : t('language.english')}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default LanguageToggle;
