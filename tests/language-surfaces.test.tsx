/**
 * D-S5-2 — the surfaces that stayed English while the rest of the interface was Spanish.
 *
 * One file per defect rather than per surface: these assertions all answer the same question —
 * with ES selected, does anything still render in English?
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.tsx';
import { VerificationSessionService } from '../src/services/VerificationSessionService.ts';
import { installFetchMock } from './helpers.ts';

/** Put the interface into Spanish the way an operator does — through the toggle. */
async function selectSpanish() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'ES' }));
  return user;
}

describe('D-S5-2 — no English left with ES selected', () => {
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

  it('renders the mast header in Spanish', async () => {
    await selectSpanish();

    expect(screen.getByText('Brief 04 · Estudio de caso')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '¿Este pago es real?' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'A un comerciante le muestran una confirmación de pago. Esto verifica si ocurrió.',
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText('Brief 04 · Case study')).not.toBeInTheDocument();
    expect(screen.queryByText('Is this payment real?')).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'A merchant is shown a payment confirmation. This checks whether it happened.',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders the four sample chip labels in Spanish', async () => {
    await selectSpanish();

    for (const label of [
      'Un comprobante genuino',
      'Un pago real, editado',
      'Un pago que nunca ocurrió',
      'Un comprobante difícil de leer',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    for (const label of [
      'A genuine receipt',
      'A real payment, edited',
      'A payment that never happened',
      "A receipt you can't fully read",
    ]) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
  });

  it('sets a Spanish document title and lang attribute', async () => {
    const user = await selectSpanish();

    expect(document.title).toBe('¿Este pago es real? — Brief 04, estudio de caso');
    expect(document.documentElement.lang).toBe('es');

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(document.title).toBe('Is this payment real? — Brief 04 case study');
    expect(document.documentElement.lang).toBe('en');
  });
});
