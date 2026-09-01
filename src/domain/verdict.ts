/**
 * Verdict logic — comparing what a receipt claims against what the ledger says.
 *
 * Kept free of React and of the network on purpose: this is the part that decides whether a
 * merchant hands over goods, so it is plain, synchronous, and directly testable.
 */

import { NOT_SHOWN, type ClaimedReceipt, type LedgerRecord, type Claimed } from './receipt.ts';

export type VerdictKind =
  /** The ledger has this operation, and every field the verifier could read matches it. */
  | 'verified'
  /** The ledger has this operation, but a field the verifier read disagrees with it. */
  | 'mismatch'
  /** The ledger has no such operation. The receipt refers to a payment that never happened. */
  | 'not-found';

export interface FieldComparison {
  fieldId: string;
  label: string;
  claimed: string;
  actual: string;
  /** null when the verifier could not read the field, so nothing was compared. */
  matches: boolean | null;
  /** True when the field was left as "not shown" — surfaced rather than silently skipped. */
  skipped: boolean;
}

export interface Verdict {
  kind: VerdictKind;
  operationNumber: string;
  comparisons: FieldComparison[];
  /** Field labels that contradict the ledger. Empty unless kind === 'mismatch'. */
  mismatchedLabels: string[];
  /** Field labels the verifier could not read. Never blocks a verdict. */
  skippedLabels: string[];
  record: LedgerRecord | null;
}

const money = (n: number, currency = 'S/') => `${currency} ${n.toFixed(2)}`;

/** Compare loosely enough to survive how a human reads a name off a screen. */
function namesAgree(claimed: string, actual: string): boolean {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\*+$/, '') // receipts truncate: "Sabina Don*"
      .replace(/[.*]/g, '')
      .replace(/\s+/g, ' ');
  const c = norm(claimed);
  const a = norm(actual);
  if (!c) return false;
  // The receipt shows a truncated name, so a prefix match in either direction is agreement.
  return a.startsWith(c) || c.startsWith(a);
}

const isShown = <T,>(v: Claimed<T>): v is T => v !== NOT_SHOWN;

/**
 * Build the verdict.
 *
 * `record === null` means the ledger lookup returned no such operation — the strongest signal the
 * tool can give, because the operation number is the one field a forger cannot invent into
 * existence.
 */
export function judge(claim: ClaimedReceipt, record: LedgerRecord | null): Verdict {
  if (!record) {
    return {
      kind: 'not-found',
      operationNumber: claim.operationNumber,
      comparisons: [],
      mismatchedLabels: [],
      skippedLabels: [],
      record: null,
    };
  }

  const comparisons: FieldComparison[] = [
    {
      fieldId: 'lbl_transfer_amount',
      label: 'Monto',
      claimed: isShown(claim.amount) ? money(claim.amount) : '—',
      actual: money(record.amount, record.currency),
      matches: isShown(claim.amount) ? Math.abs(claim.amount - record.amount) < 0.005 : null,
      skipped: !isShown(claim.amount),
    },
    {
      fieldId: 'lbl_recipient_name',
      label: 'Destinatario',
      claimed: isShown(claim.recipientName) ? claim.recipientName : '—',
      actual: record.recipientName,
      matches: isShown(claim.recipientName)
        ? namesAgree(claim.recipientName, record.recipientName)
        : null,
      skipped: !isShown(claim.recipientName),
    },
    {
      fieldId: 'lbl_anti_fraud_security_code',
      label: 'Código de seguridad',
      claimed: isShown(claim.securityCode) ? claim.securityCode : '—',
      actual: record.securityCode,
      matches: isShown(claim.securityCode)
        ? claim.securityCode.replace(/\s/g, '') === record.securityCode.replace(/\s/g, '')
        : null,
      skipped: !isShown(claim.securityCode),
    },
  ];

  const mismatchedLabels = comparisons.filter((c) => c.matches === false).map((c) => c.label);
  const skippedLabels = comparisons.filter((c) => c.skipped).map((c) => c.label);

  return {
    kind: mismatchedLabels.length > 0 ? 'mismatch' : 'verified',
    operationNumber: claim.operationNumber,
    comparisons,
    mismatchedLabels,
    skippedLabels,
    record,
  };
}
