/**
 * The blocking scrim.
 *
 * While a verification is in flight the rest of the interface must be genuinely unreachable, not
 * merely covered. A tap that lands on the keypad as the request fires must not queue a second
 * one, and a screen reader must not be able to walk into content that is behind an overlay.
 *
 * The scrim itself only covers. The inert-ing of what is behind it is done by the App, which owns
 * that subtree — see the aria-hidden / pointer-events treatment there.
 */

import type { HandshakeStep } from '../services/VerificationSessionService.ts';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';
import { useLang } from '../i18n/LangContext.tsx';

interface ProcessingScrimProps {
  steps: HandshakeStep[];
  phase: 'handshake' | 'requesting';
  onCancel: () => void;
}

export function ProcessingScrim({ steps, phase, onCancel }: ProcessingScrimProps) {
  const { t } = useLang();
  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label={t('ps_dialog_aria')}>
      <div className="scrim__panel">
        <div className="spinner" aria-hidden="true" />
        <p className="scrim__status" role="status">
          {phase === 'handshake' ? t('ps_status_handshake') : t('ps_status_requesting')}
        </p>

        <div className="scrim__steps">
          <div className="scrim__stepsHead">
            <span>{t('ps_transport_security')}</span>
            <ProvenanceBadge provenance="simulated" />
          </div>
          <ol>
            {steps.map((s) => (
              <li key={s.label}>
                <strong>{s.label}</strong>
                <span>{s.detail}</span>
              </li>
            ))}
          </ol>
        </div>

        <button type="button" className="scrim__cancel" onClick={onCancel}>
          {t('action_cancel')}
        </button>
      </div>
    </div>
  );
}
