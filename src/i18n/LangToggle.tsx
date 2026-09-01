import { useLang } from './LangContext.tsx';

export function LangToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="langtoggle" role="group" aria-label={t('lang_toggle_aria')}>
      <button
        type="button"
        className={`langtoggle__opt ${lang === 'EN' ? 'langtoggle__opt--on' : ''}`}
        aria-pressed={lang === 'EN'}
        onClick={() => setLang('EN')}
      >
        EN
      </button>
      <button
        type="button"
        className={`langtoggle__opt ${lang === 'ES' ? 'langtoggle__opt--on' : ''}`}
        aria-pressed={lang === 'ES'}
        onClick={() => setLang('ES')}
      >
        ES
      </button>
    </div>
  );
}
