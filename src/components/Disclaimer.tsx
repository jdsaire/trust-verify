/**
 * Standing non-affiliation notice.
 *
 * This is an independent case study that references a real product and a real fraud. It is not
 * connected to either company, and it must never be mistaken for something they published. The
 * notice is persistent rather than tucked into a corner for that reason.
 */

import { useLang } from '../i18n/LangContext.tsx';

export function Disclaimer() {
  const { t } = useLang();
  return (
    <footer className="disclaimer">
      <p className="disclaimer__strong">{t('d_strong')}</p>
      <p>{t('d_p1')}</p>
      <p>
        {t('d_p2_pre')}
        <strong>{t('d_p2_strong')}</strong>
        {t('d_p2_post')}
      </p>
    </footer>
  );
}
