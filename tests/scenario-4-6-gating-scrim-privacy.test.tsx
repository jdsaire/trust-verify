/**
 * Scenarios 4, 5 and 6 — precondition gating, scrim integrity, privacy defaults.
 *
 * Three interaction rules carried from the reference flow into this build.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

describe('Scenario 4 — precondition gating', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts with the amount at zero and the action inert', () => {
    render(<App />);
    expect(screen.getByLabelText('Amount field')).toHaveTextContent('S/ 0');
    const cta = screen.getByRole('button', { name: 'Verify this receipt' });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('aria-disabled', 'true');
  });

  it('stays inert with an operation number but no amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByLabelText('Operation number field'));
    for (const d of '23937025') {
      await user.click(screen.getByRole('button', { name: d }));
    }
    expect(screen.getByRole('button', { name: 'Verify this receipt' })).toBeDisabled();
  });

  it('ignores taps while the precondition fails', async () => {
    const mock = installFetchMock();
    const user = userEvent.setup();
    render(<App />);

    const cta = screen.getByRole('button', { name: 'Verify this receipt' });
    await user.click(cta).catch(() => {
      /* pointer-events: none — the rule holding */
    });
    expect(mock.ledgerCalls()).toBe(0);
  });

  it('enables only once both preconditions are met', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Verify this receipt' })).toBeEnabled(),
    );
  });
});

describe('Scenario 5 — scrim integrity', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock({ delayMs: 80 });
    VerificationSessionService.getInstance().setLatencyForTests(40);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hides and inerts everything behind the scrim while a check runs', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const shell = container.querySelector('#app-root')!;
    expect(shell).toHaveAttribute('aria-hidden', 'true');
    expect(shell).toHaveAttribute('inert');
    expect(shell).toHaveClass('shell--inert');

    // The overlay must be a modal dialog, so assistive tech treats the rest as out of scope.
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('releases the page once the check settles', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    const shell = container.querySelector('#app-root')!;
    expect(shell).not.toHaveAttribute('aria-hidden');
    expect(shell).not.toHaveAttribute('inert');
  });
});

describe('Scenario 6 — privacy defaults', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('masks the phone number to its last three digits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    expect(screen.getByText('*** *** 794')).toBeInTheDocument();
  });

  it('never renders a full phone number anywhere on the verdict', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    // A bystander at the counter must not be able to read a number off the screen.
    expect(container.textContent).not.toMatch(/\b9\d{8}\b/);
  });

  it('keeps recipient names truncated', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    // The ledger's own value is truncated at source; the UI must not "helpfully" expand it.
    expect(screen.getAllByText('Sabina Don*').length).toBeGreaterThan(0);
    // No untruncated surname should reach the screen.
    expect(screen.queryByText(/Sabina Donayre/i)).toBeNull();
  });

  it('does not leak a full name through the comparison table', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );
    const table = screen.getByRole('table');
    expect(within(table).getAllByText(/Don\*/).length).toBeGreaterThan(0);
  });
});
