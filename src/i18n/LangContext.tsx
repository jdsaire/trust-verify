/**
 * Language context.
 *
 * A React equivalent of designops' own `assets/js/core/i18n.js` engine — same concept (a
 * persisted EN/ES choice, same localStorage key `jds-lang` for a consistent cross-property
 * choice), different mechanism (that one swaps `data-i18n` DOM attributes directly; this one is a
 * React app, so state + context is the idiomatic fit rather than porting the DOM-attribute walk).
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations.ts';

const STORAGE_KEY = 'jds-lang';

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'ES' ? 'ES' : 'EN';
  } catch {
    return 'EN';
  }
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is a convenience, not a requirement — an unavailable localStorage (private
      // browsing, quota) should not stop the toggle from working for the rest of the session.
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang() must be called within a LangProvider.');
  return ctx;
}
