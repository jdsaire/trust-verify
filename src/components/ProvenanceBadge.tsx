/**
 * Provenance badging.
 *
 * This build contains two kinds of claim and they must never be read as one kind:
 *
 *  - SIMULATED — a security pattern demonstrated in the interface against fabricated fixtures.
 *    The pattern is the deliverable; the values are staged. Nothing here measures anything.
 *  - IMPLEMENTED — a control that genuinely runs in this app's client code and can be exercised.
 *
 * Every claim is routed through this component, so no simulated value can reach the screen as an
 * unqualified statement of fact. The two kinds are also kept in separate panels rather than
 * interleaved, so the segregation is structural and not only a matter of labelling.
 */

import { useLang } from '../i18n/LangContext.tsx';
import type { TranslationKey } from '../i18n/translations.ts';

export type ClaimProvenance = 'simulated' | 'implemented';

const KEYS: Record<ClaimProvenance, { label: TranslationKey; title: TranslationKey }> = {
  simulated: { label: 'badge_sim_label', title: 'badge_sim_title' },
  implemented: { label: 'badge_impl_label', title: 'badge_impl_title' },
};

export function ProvenanceBadge({ provenance }: { provenance: ClaimProvenance }) {
  const { t } = useLang();
  const { label, title } = KEYS[provenance];
  return (
    <span className={`badge badge--${provenance}`} title={t(title)}>
      {t(label)}
    </span>
  );
}
