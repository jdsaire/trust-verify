/**
 * Scenario 2 — the unknown-code case.
 *
 * The security code is printed on every receipt but is absent from the public anti-fraud guidance,
 * so a merchant may not know it exists. A tool that demands a field its user has never heard of
 * fails exactly the person it is for. The verdict must remain reachable, and the tool must be
 * honest about what it did not check.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { judge } from '../src/domain/verdict.ts';
import { NOT_SHOWN, type LedgerRecord } from '../src/domain/receipt.ts';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

const RECORD: LedgerRecord = {
  operationNumber: '60553281',
  amount: 240,
  currency: 'S/',
  recipientName: 'Gianmarco Ríos*',
  recipientPhoneMasked: '*** *** 067',
  timestamp: '15 jul. 2026 | 3:47 p.m.',
  securityCode: '394',
  destination: 'Yape',
};

describe('Scenario 2 — the verifier does not know what to look for', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reaches a verdict with the security code unknown', () => {
    const verdict = judge(
      { operationNumber: '60553281', amount: 240, recipientName: NOT_SHOWN, securityCode: NOT_SHOWN },
      RECORD,
    );
    expect(verdict.kind).toBe('verified');
  });

  it('never counts an unreadable field as a mismatch', () => {
    // The failure this guards against: "not supplied" silently scoring as "does not match", which
    // would tell a merchant a genuine receipt is forged.
    const verdict = judge(
      { operationNumber: '60553281', amount: 240, recipientName: NOT_SHOWN, securityCode: NOT_SHOWN },
      RECORD,
    );
    expect(verdict.mismatchedLabels).toEqual([]);
    expect(verdict.skippedLabels).toContain('Código de seguridad');
    for (const c of verdict.comparisons) {
      if (c.skipped) expect(c.matches).toBeNull();
    }
  });

  it('still catches a forgery when the code is unknown, via the operation number', () => {
    const verdict = judge(
      { operationNumber: '60553281', amount: 999, recipientName: NOT_SHOWN, securityCode: NOT_SHOWN },
      RECORD,
    );
    expect(verdict.kind).toBe('mismatch');
    expect(verdict.mismatchedLabels).toEqual(['Monto']);
  });

  it('completes the flow and discloses what went unchecked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: "A receipt you can't fully read" }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    // The verdict must say what it rests on rather than implying it checked everything.
    expect(screen.getByText(/Not checked, because you couldn’t read/)).toBeInTheDocument();
  });

  it('defaults the optional fields to "not shown" rather than demanding them', () => {
    render(<App />);
    expect(screen.getByLabelText('Recipient not shown')).toBeChecked();
    expect(screen.getByLabelText('Security code not shown / I don’t know')).toBeChecked();
  });
});
