import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { translations, LANGUAGES } from './translations.js';

const I18nContext = createContext(null);

const STORAGE_KEY = 'fennec_lang';
const DEFAULT_LANG = 'ar';

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANG;
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  });

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((code) => {
    setLangState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations[DEFAULT_LANG];
      let str = dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, dir, t, languages: LANGUAGES }), [lang, setLang, dir, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
