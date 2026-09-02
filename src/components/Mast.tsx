/**
 * Page mast.
 *
 * Lives here rather than inline in App.tsx for one reason: App *renders* `<LangProvider>`, so it
 * sits outside its own provider and cannot call `useLang()`. The header's three strings need the
 * language, so they need a component inside the provider to read it.
 */

import { useLang } from '../i18n/LangContext.tsx';
import { LangToggle } from '../i18n/LangToggle.tsx';

export function Mast() {
  const { t } = useLang();

  return (
    <header className="mast">
      <LangToggle />
      <p className="mast__kicker">{t('mast_kicker')}</p>
      <h1 className="mast__h">{t('mast_h')}</h1>
      <p className="mast__sub">{t('mast_sub')}</p>
    </header>
  );
}
