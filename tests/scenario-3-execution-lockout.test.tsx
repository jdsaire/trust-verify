/**
 * Scenario 3 — execution lockout.
 *
 * The highest-severity interaction rule in the reference flow. Once an operation is in flight the
 * screen freezes: a double-tap under network lag, or a back-press mid-flight, must not produce a
 * duplicate call or leave the view describing a request that no longer matches reality.
 *
 * The assertion is on the number of times the ledger was actually hit, not on what the screen
 * looks like — a disabled-looking button that still fires is exactly the bug being hunted.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

describe('Scenario 3 — execution lockout', () => {
  beforeEach(() => VerificationSessionService.resetInstanceForTests());
  afterEach(() => vi.unstubAllGlobals());

  it('drops a second submit fired while the first is in flight', async () => {
    const mock = installFetchMock({ delayMs: 60 });
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(30);

    const claim = {
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    };

    // Both calls are launched before either settles — the lag window a double-tap lands in.
    const [first, second] = await Promise.all([service.verify(claim), service.verify(claim)]);

    expect(first).toBe(true);
    expect(second).toBe(false); // refused by the lock, not merely slow
    expect(mock.ledgerCalls()).toBe(1);
  });

  it('records one audit entry for a double-tapped verification', async () => {
    installFetchMock({ delayMs: 60 });
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(30);
    const claim = {
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    };

    await Promise.all([service.verify(claim), service.verify(claim)]);
    expect(service.auditTrail).toHaveLength(1);
  });

  it('makes the primary action unreachable through the UI while busy', async () => {
    const mock = installFetchMock({ delayMs: 80 });
    VerificationSessionService.getInstance().setLatencyForTests(40);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));

    const cta = screen.getByRole('button', { name: 'Verify this receipt' });
    await user.click(cta);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // The button is behind an inert subtree now; clicking must be a no-op, not a second request.
    await user.click(cta).catch(() => {
      /* pointer-events: none makes this throw in user-event — itself a pass */
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    expect(mock.ledgerCalls()).toBe(1);
  });

  it('a back-press mid-flight lands on a clean state, not a stale verdict', async () => {
    installFetchMock({ delayMs: 80 });
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(60);

    const pending = service.verify({
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    });
    // The back-press: cancel while the request is still out.
    service.cancel();
    await pending;

    const state = service.subject.getState();
    expect(state.phase).toBe('idle');
    expect(state.busy).toBe(false);
    expect(state.verdict).toBeNull();
    // A cancelled check must not be recorded as having produced an outcome.
    expect(service.auditTrail).toHaveLength(0);
  });

  it('releases the lock after a cancel, so the next verification runs', async () => {
    const mock = installFetchMock({ delayMs: 20 });
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(10);
    const claim = {
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    };

    const pending = service.verify(claim);
    service.cancel();
    await pending;

    expect(service.isBusy).toBe(false);
    await expect(service.verify(claim)).resolves.toBe(true);
    expect(mock.ledgerCalls()).toBeGreaterThanOrEqual(1);
  });
});
