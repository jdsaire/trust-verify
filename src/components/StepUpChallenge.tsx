/**
 * Step-up authentication.
 *
 * The auth pattern this build demonstrates. When adaptive risk scores a session as elevated, the
 * ledger call does not proceed on the strength of the session alone — the operator re-authenticates
 * first. Risk is evaluated per request, not once at login, which is the point of adaptive auth.
 *
 * The PIN entry reuses the shuffled secure keypad, so the two client-side protections compose:
 * the app's own pad keeps a third-party keyboard out, and the shuffle keeps the finger path from
 * spelling the PIN to anyone watching over the counter.
 *
 * SIMULATED: the challenge is staged and any 4-digit PIN satisfies it. Nothing is authenticated,
 * no credential is checked, and nothing is transmitted. The pattern is the deliverable.
 */

import { useState } from 'react';
import { SecureKeypad } from './SecureKeypad.tsx';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface StepUpChallengeProps {
  band: string;
  score: number;
  signals: string[];
  onResolve: () => void;
  onCancel: () => void;
}

const PIN_LENGTH = 4;

export function StepUpChallenge({
  band,
  score,
  signals,
  onResolve,
  onCancel,
}: StepUpChallengeProps) {
  const [pin, setPin] = useState('');
  const complete = pin.length === PIN_LENGTH;

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Step-up authentication">
      <div className="scrim__panel stepup">
        <div className="sec__panelHead">
          <h3 className="stepup__h">Confirm it’s you</h3>
          <ProvenanceBadge provenance="simulated" />
        </div>

        <p className="stepup__why">
          This session scored <strong>{band.toLowerCase()}</strong> ({score}/100), so the ledger
          check needs your PIN before it runs.
        </p>

        <ul className="stepup__signals">
          {signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <div className="pin" role="status" aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={`pin__dot ${i < pin.length ? 'pin__dot--on' : ''}`} />
          ))}
        </div>

        <SecureKeypad
          ariaLabel="Secure keypad, PIN entry"
          onDigit={(d) => setPin((v) => (v.length >= PIN_LENGTH ? v : v + d))}
          onBackspace={() => setPin((v) => v.slice(0, -1))}
          onClear={() => setPin('')}
        />

        <p className="stepup__note">
          Staged challenge — any {PIN_LENGTH} digits are accepted. No credential is checked or sent.
        </p>

        <button type="button" className="cta" disabled={!complete} onClick={onResolve}>
          Confirm
        </button>
        <button type="button" className="scrim__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
