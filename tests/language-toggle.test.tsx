/**
 * D-S5-1 — the EN | ES toggle.
 *
 * Two tests, covering two different things, because one of them cannot be covered here at all.
 *
 * The behavioural tests assert what the control is *for*: activating it changes the language the
 * interface renders in, by mouse and by keyboard, and the choice reaches `jds-lang`. They assert
 * rendered copy rather than that `setLang` was called — a toggle that satisfies a spy and not a
 * reader is the failure this defect was.
 *
 * The stacking test covers the cause. The toggle's buttons were never broken: `.mast__kicker`
 * carries an opacity below 1, which paints it as if positioned at z-index 0 — the same step the
 * absolutely positioned `.langtoggle` occupied with `z-index: auto`, where later DOM order wins —
 * so the kicker's box covered the toggle and took the clicks. jsdom performs no layout and no
 * hit-testing, so no test rendered here can catch that: the behavioural tests below pass against
 * the broken build as readily as against the fixed one. The stylesheet assertion is the one that
 * fails without the fix, and it is written against the pair of declarations that caused it.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

const EN_HEADING = 'Check a payment receipt';
const ES_HEADING = 'Verifica un comprobante de pago';

describe('D-S5-1 — language toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    VerificationSessionService.resetInstanceForTests();
    installFetchMock();
    VerificationSessionService.getInstance().setLatencyForTests(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('switches the interface to Spanish and back by mouse', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: EN_HEADING })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ES' }));

    expect(screen.getByRole('heading', { name: ES_HEADING })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: EN_HEADING })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('heading', { name: EN_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the interface by keyboard, on the element that actually holds focus', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Walk focus rather than calling .focus(): the point is that the control is reachable.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'EN' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'ES' }));

    await user.keyboard('{Enter}');

    expect(screen.getByRole('heading', { name: ES_HEADING })).toBeInTheDocument();
  });

  it('persists the choice under jds-lang, the key shared with the designops site', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'ES' }));
    expect(localStorage.getItem('jds-lang')).toBe('ES');

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(localStorage.getItem('jds-lang')).toBe('EN');
  });

  it('keeps the toggle above the mast text it overlaps', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../src/styles/app.css'), 'utf8');
    const rule = (selector: string) => {
      const match = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`).exec(css);
      if (!match?.[1]) throw new Error(`No rule found for ${selector}`);
      return match[1];
    };

    // The two declarations whose interaction caused D-S5-1. The kicker's opacity is a deliberate
    // part of the visual treatment and stays; the toggle's z-index is what keeps it clickable.
    const kickerOpacity = Number(/opacity:\s*([\d.]+)/.exec(rule('.mast__kicker'))?.[1]);
    expect(kickerOpacity).toBeLessThan(1);

    const toggle = rule('.langtoggle');
    expect(toggle).toMatch(/position:\s*absolute/);
    const zIndex = /z-index:\s*(-?\d+)/.exec(toggle);
    expect(
      zIndex,
      '.langtoggle declares no z-index: the mast text above it is opacity-promoted into the same ' +
        'painting step and, coming later in DOM order, covers the toggle and swallows its clicks',
    ).not.toBeNull();
    expect(Number(zIndex?.[1])).toBeGreaterThan(0);
  });
});
