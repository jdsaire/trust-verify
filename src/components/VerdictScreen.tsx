/**
 * The verdict, and the reasoning behind it.
 *
 * The field table is the argument of the whole build: it shows which fields a forger controls and
 * which one they don't, so the merchant leaves knowing *why* the answer is the answer — not just
 * what it is. That is the gap the tool addresses. A verdict without the reasoning would teach
 * nothing and would be the same black box the fake-receipt apps exploit.
 */

import type { Verdict } from '../domain/verdict.ts';
import { RECEIPT_FIELDS } from '../domain/receipt.ts';
import { useLang } from '../i18n/LangContext.tsx';
import type { TranslationKey } from '../i18n/translations.ts';

const HEADLINE: Record<Verdict['kind'], { title: TranslationKey; line: TranslationKey }> = {
  verified: { title: 'verdict_verified_title', line: 'verdict_verified_line' },
  mismatch: { title: 'verdict_mismatch_title', line: 'verdict_mismatch_line' },
  'not-found': { title: 'verdict_notfound_title', line: 'verdict_notfound_line' },
};

export function VerdictScreen({ verdict, onAgain }: { verdict: Verdict; onAgain: () => void }) {
  const { t } = useLang();
  const head = HEADLINE[verdict.kind];

  return (
    <section className={`verdict verdict--${verdict.kind}`} aria-labelledby="verdict-h">
      <p className="verdict__eyebrow">
        {t('verdict_eyebrow_prefix')} {verdict.operationNumber}
      </p>
      <h2 id="verdict-h" className="verdict__h">
        {t(head.title)}
      </h2>
      <p className="verdict__line">{t(head.line)}</p>

      {verdict.kind === 'mismatch' && (
        <p className="verdict__flag" role="alert">
          {t('verdict_flag_mismatch_pre')}
          <strong>{verdict.mismatchedLabels.join(', ')}</strong>
          {t('verdict_flag_mismatch_post')}
        </p>
      )}

      {verdict.kind === 'not-found' && (
        <p className="verdict__flag" role="alert">
          {t('verdict_flag_notfound')}
        </p>
      )}

      {verdict.skippedLabels.length > 0 && verdict.kind !== 'not-found' && (
        <p className="verdict__skipped">
          {t('verdict_skipped_pre')}
          {verdict.skippedLabels.length === 1 ? t('verdict_skipped_it') : t('verdict_skipped_them')}
          : <strong>{verdict.skippedLabels.join(', ')}</strong>
          {t('verdict_skipped_post')}
        </p>
      )}

      {verdict.record && (
        <>
          <h3 className="verdict__sub">{t('verdict_sub_ledger')}</h3>
          <dl className="record">
            <div>
              <dt>{t('verdict_record_amount_label')}</dt>
              <dd>
                {verdict.record.currency} {verdict.record.amount.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>{t('verdict_record_recipient_label')}</dt>
              <dd>{verdict.record.recipientName}</dd>
            </div>
            <div>
              <dt>{t('verdict_record_phone_label')}</dt>
              <dd>{verdict.record.recipientPhoneMasked}</dd>
            </div>
            <div>
              <dt>{t('verdict_record_date_label')}</dt>
              <dd>{verdict.record.timestamp}</dd>
            </div>
            <div>
              <dt>{t('verdict_record_dest_label')}</dt>
              <dd>{verdict.record.destination}</dd>
            </div>
          </dl>

          <h3 className="verdict__sub">{t('verdict_sub_fieldbyfield')}</h3>
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">{t('verdict_table_field')}</th>
                <th scope="col">{t('verdict_table_receipt')}</th>
                <th scope="col">{t('verdict_table_ledger')}</th>
              </tr>
            </thead>
            <tbody>
              {verdict.comparisons.map((c) => (
                <tr
                  key={c.fieldId}
                  className={
                    c.matches === false ? 'cmp--bad' : c.matches === true ? 'cmp--ok' : 'cmp--skip'
                  }
                >
                  <th scope="row">{c.label}</th>
                  <td>{c.claimed}</td>
                  <td>
                    {c.actual}
                    <span className="cmp__mark" aria-hidden="true">
                      {c.matches === false ? '✕' : c.matches === true ? '✓' : '–'}
                    </span>
                    <span className="sr-only">
                      {c.matches === false
                        ? t('verdict_sr_nomatch')
                        : c.matches === true
                          ? t('verdict_sr_match')
                          : t('verdict_sr_notchecked')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3 className="verdict__sub">{t('verdict_sub_why')}</h3>
      <ul className="prov">
        {RECEIPT_FIELDS.map((f) => (
          <li key={f.id} className={`prov__row prov__row--${f.provenance}`}>
            <span className="prov__label">{f.label}</span>
            <span className="prov__tag">
              {f.provenance === 'backend-anchored' ? t('verdict_prov_backend') : t('verdict_prov_sender')}
            </span>
            <span className="prov__why">{f.rationale}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="cta" onClick={onAgain}>
        {t('verdict_cta')}
      </button>
    </section>
  );
}
