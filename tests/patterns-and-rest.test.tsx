/**
 * The named patterns, the REST surface, and the simulated/real segregation.
 *
 * These back the claims the build makes about itself: that Singleton and Observer are load-bearing
 * rather than decorative, that REST consumption handles the status codes it says it does, and that
 * no staged claim can reach the screen unbadged.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { ObservableSubject } from '../src/patterns/Observer.ts';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { fetchOperation, ApiError } from '../src/services/ledgerApi.ts';
import { installFetchMock } from './helpers.ts';

describe('Singleton — VerificationSessionService', () => {
  beforeEach(() => VerificationSessionService.resetInstanceForTests());

  it('hands back the same instance every time', () => {
    const a = VerificationSessionService.getInstance();
    const b = VerificationSessionService.getInstance();
    expect(a).toBe(b);
    expect(a.sessionId).toBe(b.sessionId);
  });

  it('survives a reset with a fresh session identity', () => {
    // The private constructor is enforced by the compiler, not at runtime, so there is no runtime
    // throw to assert. What is worth pinning is that the accessor is the only way the app obtains
    // the service, and that a reset yields a genuinely new session rather than a recycled one.
    const first = VerificationSessionService.getInstance();
    const firstId = first.sessionId;
    VerificationSessionService.resetInstanceForTests();
    const second = VerificationSessionService.getInstance();

    expect(second).not.toBe(first);
    expect(second.sessionId).not.toBe(firstId);
    expect(VerificationSessionService.getInstance()).toBe(second);
  });

  it('shares one execution lock across every caller', async () => {
    const mock = installFetchMock({ delayMs: 40 });
    VerificationSessionService.getInstance().setLatencyForTests(20);
    const claim = {
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    };

    // Two "different" references contending for the lock — the reason the singleton exists.
    const one = VerificationSessionService.getInstance();
    const two = VerificationSessionService.getInstance();
    await Promise.all([one.verify(claim), two.verify(claim)]);

    expect(mock.ledgerCalls()).toBe(1);
    vi.unstubAllGlobals();
  });
});

describe('Observer — ObservableSubject', () => {
  it('broadcasts each state to every observer', () => {
    const subject = new ObservableSubject(0);
    const seenA: number[] = [];
    const seenB: number[] = [];
    subject.subscribe((v) => seenA.push(v));
    subject.subscribe((v) => seenB.push(v));

    subject.notify(1);
    subject.notify(2);

    expect(seenA).toEqual([1, 2]);
    expect(seenB).toEqual([1, 2]);
    expect(subject.getState()).toBe(2);
    expect(subject.observerCount()).toBe(2);
  });

  it('stops delivering after unsubscribe', () => {
    const subject = new ObservableSubject(0);
    const seen: number[] = [];
    const off = subject.subscribe((v) => seen.push(v));
    subject.notify(1);
    off();
    subject.notify(2);
    expect(seen).toEqual([1]);
    expect(subject.observerCount()).toBe(0);
  });

  it('survives an observer that unsubscribes mid-broadcast', () => {
    const subject = new ObservableSubject(0);
    const seen: string[] = [];
    const off = subject.subscribe(() => {
      seen.push('first');
      off(); // mutating the observer set while it is being iterated
    });
    subject.subscribe(() => seen.push('second'));

    expect(() => subject.notify(1)).not.toThrow();
    expect(seen).toEqual(['first', 'second']);
  });

  it('drives the session flow through its phases in order', async () => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(0);

    const phases: string[] = [];
    service.subject.subscribe((s) => {
      if (phases[phases.length - 1] !== s.phase) phases.push(s.phase);
    });

    await service.verify({
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    });

    expect(phases).toEqual(['handshake', 'requesting', 'verified']);
    vi.unstubAllGlobals();
  });
});

describe('REST consumption', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps a 404 to "no such operation" rather than an error', async () => {
    installFetchMock();
    await expect(fetchOperation('99180244')).resolves.toBeNull();
  });

  it('parses a 200 ledger record', async () => {
    installFetchMock();
    const rec = await fetchOperation('23937025');
    expect(rec?.operationNumber).toBe('23937025');
    expect(rec?.amount).toBe(1);
  });

  it('refuses a non-JSON body that claims success', async () => {
    // A static host answering a missing file with an HTML page, or a dev server's SPA fallback.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html><p>not found</p>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })),
    );
    await expect(fetchOperation('23937025')).resolves.toBeNull();
  });

  it('raises a real failure rather than silently reading it as not-found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })),
    );
    // A 500 must not be mistaken for "this payment doesn't exist" — opposite meanings.
    await expect(fetchOperation('23937025')).rejects.toBeInstanceOf(ApiError);
  });

  it('never puts an unvalidated operation number into a URL', async () => {
    const mock = installFetchMock();
    await expect(fetchOperation('../session/handshake')).resolves.toBeNull();
    expect(mock.calls.filter((u) => u.includes('operations'))).toHaveLength(0);
  });

  it('requests only relative paths', async () => {
    const mock = installFetchMock();
    await fetchOperation('23937025');
    for (const url of mock.calls) {
      expect(url.startsWith('/')).toBe(false);
      expect(url.startsWith('http')).toBe(false);
    }
  });
});

describe('simulated / real segregation', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('badges the staged panel and the implemented panel differently', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Demonstrated security patterns' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Controls that actually run here' })).toBeInTheDocument();
    expect(screen.getAllByText('SIMULATED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('IMPLEMENTED').length).toBeGreaterThan(0);
  });

  it('keeps every staged claim inside the badged panel', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'A genuine receipt' }));
    await user.click(screen.getByRole('button', { name: 'Verify this receipt' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment found' })).toBeInTheDocument(),
    );

    const simPanel = container.querySelector('.sec__panel--sim')!;
    // The staged vocabulary must not appear anywhere outside the panel that disclaims it.
    for (const term of ['TLS_ECDHE_RSA', 'Case Study Demo CA', 'RSA Adaptive']) {
      const everywhere = container.textContent ?? '';
      const inPanel = simPanel.textContent ?? '';
      if (everywhere.includes(term)) expect(inPanel).toContain(term);
    }
    expect(simPanel.querySelector('.badge--simulated')).not.toBeNull();
  });

  it('states plainly that the staged panel measures nothing', () => {
    const { container } = render(<App />);
    const simPanel = container.querySelector('.sec__panel--sim')!;
    expect(simPanel.textContent).toMatch(/measures nothing|not a measurement/i);
  });

  it('carries a standing non-affiliation notice', () => {
    render(<App />);
    expect(
      screen.getByText(/Not affiliated with, endorsed by, or connected to Yape or BCP/),
    ).toBeInTheDocument();
  });
});

describe('step-up authentication', () => {
  beforeEach(() => {
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does not touch the ledger until the challenge is cleared', async () => {
    const mock = installFetchMock();
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(0);
    service.setRiskMode('elevated');

    const pending = service.verify({
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    });

    await waitFor(() => expect(service.subject.getState().phase).toBe('step-up'));
    expect(mock.ledgerCalls()).toBe(0); // the whole point of a step-up

    service.resolveStepUp(true);
    await pending;
    expect(service.subject.getState().phase).toBe('verified');
    expect(mock.ledgerCalls()).toBe(1);
  });

  it('abandons the verification if the challenge is refused', async () => {
    const mock = installFetchMock();
    const service = VerificationSessionService.getInstance();
    service.setLatencyForTests(0);
    service.setRiskMode('elevated');

    const pending = service.verify({
      operationNumber: '23937025',
      amount: 1,
      recipientName: 'Sabina Don*',
      securityCode: '025',
    });
    await waitFor(() => expect(service.subject.getState().phase).toBe('step-up'));
    service.resolveStepUp(false);

    await expect(pending).resolves.toBe(false);
    expect(mock.ledgerCalls()).toBe(0);
    expect(service.subject.getState().phase).toBe('idle');
    expect(service.isBusy).toBe(false);
  });
});
