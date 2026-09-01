/**
 * Sample chip labels.
 *
 * The four sample receipts are domain data and stay that way — `src/domain/` carries no React and
 * no network, which is what makes it directly testable. A chip's *label* is presentation, so the
 * mapping from a sample's stable id to its translation key belongs on this side of that line.
 *
 * Keyed by the id union rather than by `string`: an unmapped sample is then a compile error, not a
 * label that quietly stays English while the rest of the interface is Spanish.
 */

import type { SampleId } from '../domain/samples.ts';
import type { TranslationKey } from './translations.ts';

export const SAMPLE_TITLE_KEYS: Record<SampleId, TranslationKey> = {
  genuine: 'sample_genuine_title',
  'forged-amount': 'sample_forged_amount_title',
  fabricated: 'sample_fabricated_title',
  'unknown-code': 'sample_unknown_code_title',
};
