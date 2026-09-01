/**
 * Language context.
 *
 * A React equivalent of designops' own `assets/js/core/i18n.js` engine — same concept (a
 * persisted EN/ES choice, same localStorage key `jds-lang` for a consistent cross-property
 * choice), different mechanism (that one swaps `data-i18n` DOM attributes directly; this one is a
 * React app, so state + context is the idiomatic fit rather than porting the DOM-attribute walk).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

  // The document's own chrome follows the choice as well as the interface does: the tab title,
  // and the lang attribute that tells assistive tech and translation heuristics which language the
  // page is actually in. src/index.html keeps the English pair as its static default, which is
  // correct at load — EN is what readStoredLang() falls back to, and what renders with JS off.
  useEffect(() => {
    document.title = translations[lang].doc_title;
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang() must be called within a LangProvider.');
  return ctx;
}
