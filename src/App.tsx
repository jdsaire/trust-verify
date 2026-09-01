/**
 * App shell.
 *
 * Owns three things the screens below it shouldn't:
 *  - the single session service, and the submit path into it;
 *  - the inert-ing of the page behind the scrim;
 *  - the back-press, which during a verification must cancel rather than navigate away.
 */

import { useEffect } from 'react';
import { EntryScreen } from './components/EntryScreen.tsx';
import { ProcessingScrim } from './components/ProcessingScrim.tsx';
import { StepUpChallenge } from './components/StepUpChallenge.tsx';
import { VerdictScreen } from './components/VerdictScreen.tsx';
import { SecurityPanel } from './components/SecurityPanel.tsx';
import { Disclaimer } from './components/Disclaimer.tsx';
import { VerificationSessionService } from './services/VerificationSessionService.ts';
import { useFlowState } from './services/useFlowState.ts';
import type { ClaimedReceipt } from './domain/receipt.ts';

export function App() {
  const service = VerificationSessionService.getInstance();
  const flow = useFlowState();
  const busy = flow.busy;

  // Back-press during a verification cancels it. Without this, leaving mid-flight could land the
  // user back on a screen whose state no longer matches the request still in the air.
  useEffect(() => {
    if (!busy) return;
    history.pushState({ verifying: true }, '');
    const onPop = () => service.cancel();
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [busy, service]);

  const submit = (claim: ClaimedReceipt) => {
    // The service refuses a second concurrent call itself; this is just the call site.
    void service.verify(claim);
  };

  return (
    <>
      {/*
        Everything behind the scrim is switched off while a verification runs: aria-hidden keeps
        assistive tech out, inert blocks focus and pointer events at the platform level, and the
        CSS class covers pointer-events for engines without inert.
      */}
      <div
        id="app-root"
        className={busy ? 'shell shell--inert' : 'shell'}
        aria-hidden={busy || undefined}
        inert={busy}
      >
        <header className="mast">
          <p className="mast__kicker">Brief 04 · Case study</p>
          <h1 className="mast__h">Is this payment real?</h1>
          <p className="mast__sub">
            A merchant is shown a payment confirmation. This checks whether it happened.
          </p>
        </header>

        <main className="main">
          {flow.verdict ? (
            <VerdictScreen verdict={flow.verdict} onAgain={() => service.reset()} />
          ) : (
            <EntryScreen onSubmit={submit} disabled={busy} />
          )}

          {flow.phase === 'error' && (
            <p className="error" role="alert">
              {flow.error}
            </p>
          )}

          <SecurityPanel handshake={flow.handshake} sessionId={service.sessionId} />
        </main>

        <Disclaimer />
      </div>

      {busy && (flow.phase === 'handshake' || flow.phase === 'requesting') && (
        <ProcessingScrim
          steps={flow.handshakeSteps}
          phase={flow.phase}
          onCancel={() => service.cancel()}
        />
      )}

      {busy && flow.phase === 'step-up' && flow.handshake && (
        <StepUpChallenge
          band={flow.handshake.adaptiveRisk.band}
          score={flow.handshake.adaptiveRisk.score}
          signals={flow.handshake.adaptiveRisk.signals}
          onResolve={() => service.resolveStepUp(true)}
          onCancel={() => service.resolveStepUp(false)}
        />
      )}
    </>
  );
}
