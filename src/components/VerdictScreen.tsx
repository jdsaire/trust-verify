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

const HEADLINE: Record<Verdict['kind'], { title: string; line: string }> = {
  verified: {
    title: 'Payment found',
    line: 'The ledger has this operation, and every field you could read matches it.',
  },
  mismatch: {
    title: 'Do not accept',
    line: 'The ledger has this operation — but the receipt disagrees with it.',
  },
  'not-found': {
    title: 'No such payment',
    line: 'The ledger has no operation with this number. Nothing was transferred.',
  },
};

export function VerdictScreen({ verdict, onAgain }: { verdict: Verdict; onAgain: () => void }) {
  const head = HEADLINE[verdict.kind];

  return (
    <section className={`verdict verdict--${verdict.kind}`} aria-labelledby="verdict-h">
      <p className="verdict__eyebrow">Nro. de operación {verdict.operationNumber}</p>
      <h2 id="verdict-h" className="verdict__h">
        {head.title}
      </h2>
      <p className="verdict__line">{head.line}</p>

      {verdict.kind === 'mismatch' && (
        <p className="verdict__flag" role="alert">
          Disagrees with the ledger: <strong>{verdict.mismatchedLabels.join(', ')}</strong>. A real
          operation number does not make the rest of the receipt true.
        </p>
      )}

      {verdict.kind === 'not-found' && (
        <p className="verdict__flag" role="alert">
          Every other field on a receipt can be typed by whoever made it. This one could not be —
          which is why its absence is conclusive.
        </p>
      )}

      {verdict.skippedLabels.length > 0 && verdict.kind !== 'not-found' && (
        <p className="verdict__skipped">
          Not checked, because you couldn’t read {verdict.skippedLabels.length === 1 ? 'it' : 'them'}
          : <strong>{verdict.skippedLabels.join(', ')}</strong>. The verdict above rests on the
          operation number, which is enough.
        </p>
      )}

      {verdict.record && (
        <>
          <h3 className="verdict__sub">What the ledger says</h3>
          <dl className="record">
            <div>
              <dt>Monto</dt>
              <dd>
                {verdict.record.currency} {verdict.record.amount.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Destinatario</dt>
              <dd>{verdict.record.recipientName}</dd>
            </div>
            <div>
              <dt>Nro. de celular</dt>
              <dd>{verdict.record.recipientPhoneMasked}</dd>
            </div>
            <div>
              <dt>Fecha y hora</dt>
              <dd>{verdict.record.timestamp}</dd>
            </div>
            <div>
              <dt>Destino</dt>
              <dd>{verdict.record.destination}</dd>
            </div>
          </dl>

          <h3 className="verdict__sub">Field by field</h3>
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Receipt says</th>
                <th scope="col">Ledger says</th>
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
                        ? 'does not match'
                        : c.matches === true
                          ? 'matches'
                          : 'not checked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3 className="verdict__sub">Why only one field settles this</h3>
      <ul className="prov">
        {RECEIPT_FIELDS.map((f) => (
          <li key={f.id} className={`prov__row prov__row--${f.provenance}`}>
            <span className="prov__label">{f.label}</span>
            <span className="prov__tag">
              {f.provenance === 'backend-anchored' ? 'Written by the ledger' : 'Set by the sender'}
            </span>
            <span className="prov__why">{f.rationale}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="cta" onClick={onAgain}>
        Check another receipt
      </button>
    </section>
  );
}
