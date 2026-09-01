/**
 * Core-flow smoke test.
 *
 * Proves the one job completes end to end through the real UI: pick a receipt, verify it, read a
 * verdict. The full protocol lives alongside this; this file is the gate that says the thing runs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

describe('core verification flow', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('completes the one job: a genuine receipt reaches a "payment found" verdict', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    // The verdict must show its work, not just its answer.
    expect(screen.getByText('Nro. de operación 23937025')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Field by field' })).toBeInTheDocument();
  });
});
