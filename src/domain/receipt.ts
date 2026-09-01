/**
 * The receipt field model.
 *
 * This file encodes the finding the whole app exists to express: a shared payment receipt is a
 * static image, and every field printed on it is text a forger can set. Only the operation number
 * is written by the issuing bank's ledger rather than by the sender's device, so it is the only
 * field whose value can be checked against an authority.
 *
 * Field ids and observed copy are taken from the receipt field inventory in the selection dossier
 * (Appendix A.6, screen YAPE_10_TRANSFER_RECEIPT). Those values are APPROXIMATE — derived from
 * screen inspection, not from a published design system.
 */

/** Who ultimately writes a field's value — the sender's device, or the bank's ledger. */
export type Provenance = 'sender-reproducible' | 'backend-anchored';

export interface ReceiptFieldSpec {
  /** Element id as catalogued in the dossier's Appendix A.6 inventory. */
  readonly id: string;
  /** Label shown to the person doing the verifying. */
  readonly label: string;
  /** Whether a forger can set this value at will. */
  readonly provenance: Provenance;
  /** Why the field carries that provenance — shown in the UI so the verdict is explainable. */
  readonly rationale: string;
  /** Whether the verifier is asked to type this field in. */
  readonly compared: boolean;
}

/**
 * The inventory, in receipt reading order.
 *
 * Exactly one entry is `backend-anchored`. That is the point, and a test asserts it stays true.
 */
export const RECEIPT_FIELDS: readonly ReceiptFieldSpec[] = [
  {
    id: 'lbl_transfer_amount',
    label: 'Monto',
    provenance: 'sender-reproducible',
    rationale: 'Text on an image. A forger sets any amount.',
    compared: true,
  },
  {
    id: 'lbl_recipient_name',
    label: 'Destinatario',
    provenance: 'sender-reproducible',
    rationale: 'Fake-receipt tooling auto-completes recipient names.',
    compared: true,
  },
  {
    id: 'lbl_transaction_timestamp',
    label: 'Fecha y hora',
    provenance: 'sender-reproducible',
    rationale: 'Rendered from the sending device. Trivially edited.',
    compared: false,
  },
  {
    id: 'lbl_anti_fraud_security_code',
    label: 'Código de seguridad',
    provenance: 'sender-reproducible',
    rationale:
      'Shipped April 2025 and printed on every receipt — but it is still text on the same image, so it is reproducible too.',
    compared: true,
  },
  {
    id: 'lbl_optional_message',
    label: 'Mensaje',
    provenance: 'sender-reproducible',
    rationale: 'Free text supplied by the sender.',
    compared: false,
  },
  {
    id: 'lbl_yapeaste_status',
    label: 'Estado ("¡Yapeaste!")',
    provenance: 'sender-reproducible',
    rationale: 'A graphic. Present on every forgery.',
    compared: false,
  },
  {
    id: 'lbl_transaction_phone',
    label: 'Nro. de celular',
    provenance: 'sender-reproducible',
    rationale: 'Printed on the image, masked to the last three digits.',
    compared: false,
  },
  {
    id: 'lbl_transaction_operation_number',
    label: 'Nro. de operación',
    provenance: 'backend-anchored',
    rationale:
      'Written by the ledger, not by the sending device. The only field on the receipt that can be checked against an authority — and so the only one this tool verifies against.',
    compared: true,
  },
];

/** The single backend-anchored field. Throws if the invariant above is ever broken. */
export function backendAnchoredField(): ReceiptFieldSpec {
  const anchored = RECEIPT_FIELDS.filter((f) => f.provenance === 'backend-anchored');
  if (anchored.length !== 1 || !anchored[0]) {
    throw new Error(
      `Expected exactly one backend-anchored receipt field, found ${anchored.length}.`,
    );
  }
  return anchored[0];
}

/* ------------------------------------------------------------------ */
/* What the receipt in the merchant's hand claims                       */
/* ------------------------------------------------------------------ */

/**
 * A field the verifier was not able to read off the receipt.
 *
 * This exists because of a documented gap: the security code is printed in-app, but the public
 * anti-fraud guidance never mentions it, so a merchant may not know to look for it. A verifier who
 * cannot supply a field must still be able to reach a verdict.
 */
export const NOT_SHOWN = Symbol('not-shown');
export type Claimed<T> = T | typeof NOT_SHOWN;

export interface ClaimedReceipt {
  /** The one field the verifier must supply — everything hangs off it. */
  operationNumber: string;
  amount: Claimed<number>;
  recipientName: Claimed<string>;
  securityCode: Claimed<string>;
}

/** The ledger's record — the authority a claim is checked against. */
export interface LedgerRecord {
  operationNumber: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientPhoneMasked: string;
  timestamp: string;
  securityCode: string;
  destination: string;
}
