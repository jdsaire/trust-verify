/**
 * Scenario 1 — field-level forgery discrimination.
 *
 * For every field on the receipt, the build must know whether a forger can set it, and only the
 * operation number may be treated as anchored to the ledger. This is the finding the whole tool
 * rests on, so it is asserted directly rather than inferred from behaviour.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { RECEIPT_FIELDS, backendAnchoredField, NOT_SHOWN } from '../src/domain/receipt.ts';
import { judge } from '../src/domain/verdict.ts';
import type { LedgerRecord } from '../src/domain/receipt.ts';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

const RECORD: LedgerRecord = {
  operationNumber: '48120933',
  amount: 35,
  currency: 'S/',
  recipientName: 'Marisol Vent*',
  recipientPhoneMasked: '*** *** 412',
  timestamp: '15 jul. 2026 | 11:04 a.m.',
  securityCode: '718',
  destination: 'Yape',
};

describe('Scenario 1 — field-level forgery discrimination', () => {
  it('classifies every catalogued receipt field', () => {
    expect(RECEIPT_FIELDS.length).toBeGreaterThan(0);
    for (const f of RECEIPT_FIELDS) {
      expect(['sender-reproducible', 'backend-anchored']).toContain(f.provenance);
      // A classification without a reason can't be explained to a merchant, so it doesn't count.
      expect(f.rationale.length).toBeGreaterThan(0);
    }
  });

  it('treats exactly one field as backend-anchored, and it is the operation number', () => {
    const anchored = RECEIPT_FIELDS.filter((f) => f.provenance === 'backend-anchored');
    expect(anchored).toHaveLength(1);
    expect(anchored[0]!.id).toBe('lbl_transaction_operation_number');
    expect(backendAnchoredField().id).toBe('lbl_transaction_operation_number');
  });

  it('treats the security code as reproducible, not as proof', () => {
    // It ships on every receipt and looks like a countermeasure, but it is still text on an image.
    const code = RECEIPT_FIELDS.find((f) => f.id === 'lbl_anti_fraud_security_code');
    expect(code?.provenance).toBe('sender-reproducible');
  });

  it('names the specific field that contradicts the ledger', () => {
    const verdict = judge(
      { operationNumber: '48120933', amount: 350, recipientName: NOT_SHOWN, securityCode: NOT_SHOWN },
      RECORD,
    );
    expect(verdict.kind).toBe('mismatch');
    expect(verdict.mismatchedLabels).toEqual(['Monto']);
  });

  it('does not let a real operation number carry a forged amount', async () => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A real payment, edited' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Do not accept' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Monto');
  });

  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => VerificationSessionService.resetInstanceForTests());
});
