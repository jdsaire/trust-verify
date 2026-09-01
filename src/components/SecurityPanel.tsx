/**
 * The security panel.
 *
 * Structural rule, and the reason this file is laid out the way it is: simulated claims and real
 * ones live in separate panels with separate headings and separate badges. They are never
 * interleaved in one list, because a reader skimming a mixed list would carry the credibility of
 * the real rows onto the staged ones.
 *
 * The top panel is staged fixtures. The bottom panel is code that actually runs. Neither borrows
 * authority from the other.
 */

import { useState } from 'react';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';
import type { HandshakeMaterial, CertificateInfo, RiskMode } from '../services/ledgerApi.ts';
import { VerificationSessionService } from '../services/VerificationSessionService.ts';

function Cert({ title, cert }: { title: string; cert: CertificateInfo }) {
  return (
    <div className="cert">
      <h4 className="cert__h">{title}</h4>
      <dl className="cert__dl">
        <div>
          <dt>Subject</dt>
          <dd>{cert.subject}</dd>
        </div>
        <div>
          <dt>Issuer</dt>
          <dd>{cert.issuer}</dd>
        </div>
        <div>
          <dt>Serial</dt>
          <dd className="mono">{cert.serial}</dd>
        </div>
        <div>
          <dt>Valid</dt>
          <dd>
            {cert.validFrom} → {cert.validTo}
          </dd>
        </div>
        <div>
          <dt>Key</dt>
          <dd>{cert.keyAlgorithm}</dd>
        </div>
        <div>
          <dt>SHA-256</dt>
          <dd className="mono cert__fp">{cert.fingerprintSha256}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SecurityPanel({
  handshake,
  sessionId,
}: {
  handshake: HandshakeMaterial | null;
  sessionId: string;
}) {
  const service = VerificationSessionService.getInstance();
  const sameInstance = service === VerificationSessionService.getInstance();
  const [mode, setMode] = useState<RiskMode>(service.riskMode);

  const chooseMode = (m: RiskMode) => {
    service.setRiskMode(m);
    setMode(service.riskMode);
  };

  return (
    <section className="sec" aria-labelledby="sec-h">
      <h2 id="sec-h" className="sec__h">
        Security layer
      </h2>

      {/* ---- Panel 1: staged. Nothing below this heading is real. ---- */}
      <div className="sec__panel sec__panel--sim">
        <div className="sec__panelHead">
          <h3>Demonstrated security patterns</h3>
          <ProvenanceBadge provenance="simulated" />
        </div>
        <p className="sec__panelNote">
          The patterns below are demonstrated in the interface against fabricated fixtures. The
          certificates are not issued by any authority, the fingerprints identify nothing, the
          keys sign nothing, and the risk score measures nothing. Nothing in this panel is a
          measurement of anything. This page’s actual transport security is whatever its host
          provides — these rows describe a staged exchange, not that connection.
        </p>

        <div className="riskmode" role="group" aria-label="Staged session risk">
          <span className="riskmode__k">Staged session</span>
          <div className="riskmode__opts">
            <button
              type="button"
              className={`riskmode__opt ${mode === 'normal' ? 'riskmode__opt--on' : ''}`}
              aria-pressed={mode === 'normal'}
              onClick={() => chooseMode('normal')}
            >
              Low risk
            </button>
            <button
              type="button"
              className={`riskmode__opt ${mode === 'elevated' ? 'riskmode__opt--on' : ''}`}
              aria-pressed={mode === 'elevated'}
              onClick={() => chooseMode('elevated')}
            >
              Elevated → step-up
            </button>
          </div>
          <p className="riskmode__note">
            Picks which staged session the next verification runs against. An elevated score
            demands re-authentication before the ledger is touched.
          </p>
        </div>

        {handshake ? (
          <>
            <div className="sec__row">
              <span className="sec__k">Transport</span>
              <span className="sec__v">HTTPS — SSL/TLS record layer</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">Protocol</span>
              <span className="sec__v">{handshake.protocol}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">Cipher suite</span>
              <span className="sec__v mono">{handshake.cipherSuite}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">Key exchange</span>
              <span className="sec__v">ECDHE with RSA-2048 asymmetric keys</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">Mutual authentication</span>
              <span className="sec__v">Both sides presented and validated a certificate</span>
            </div>

            <div className="certs">
              <Cert title="Server certificate" cert={handshake.serverCertificate} />
              <Cert title="Client certificate" cert={handshake.clientCertificate} />
            </div>

            <div className="risk">
              <h4 className="cert__h">RSA Adaptive — risk scoring</h4>
              <p className="risk__band">
                {handshake.adaptiveRisk.band} · {handshake.adaptiveRisk.score}/100
              </p>
              <ul className="risk__signals">
                {handshake.adaptiveRisk.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="risk__note">
                {handshake.stepUpRequired
                  ? 'This band demands a step-up challenge before the ledger call proceeds.'
                  : 'This band clears without a challenge. Switch the staged session above to see the step-up path.'}
              </p>
            </div>
          </>
        ) : (
          <p className="sec__empty">
            Run a verification to see the staged handshake for this session.
          </p>
        )}
      </div>

      {/* ---- Panel 2: real. Everything below this heading runs in this app. ---- */}
      <div className="sec__panel sec__panel--impl">
        <div className="sec__panelHead">
          <h3>Controls that actually run here</h3>
          <ProvenanceBadge provenance="implemented" />
        </div>
        <p className="sec__panelNote sec__panelNote--impl">
          These run in this app’s client code and can be exercised on this page right now. They are
          the controls behind the staged patterns above — the pad the step-up PIN is typed on is
          this pad.
        </p>
        <ul className="impl">
          <li>
            <strong>In-app secure keypad</strong> — the app’s own numeric pad, so a third-party
            keyboard never sees the input.
          </li>
          <li>
            <strong>Shuffled digits</strong> — key positions change per session, so watching the
            finger path reveals nothing.
          </li>
          <li>
            <strong>Execution lock</strong> — one verification at a time; a second tap is dropped
            before it reaches the network.
          </li>
          <li>
            <strong>Blocking scrim</strong> — the page behind it is <code>inert</code> and
            <code> aria-hidden</code> while a request is in flight.
          </li>
          <li>
            <strong>Privacy defaults</strong> — recipient names truncated, phone numbers masked to
            the last three digits.
          </li>
          <li>
            <strong>Single session instance</strong> —{' '}
            <code>VerificationSessionService.getInstance()</code> returns the same object every
            time{sameInstance ? '' : ' (assertion failed)'}; the execution lock depends on that.
            Session <code className="mono">{sessionId}</code>.
          </li>
        </ul>
      </div>
    </section>
  );
}
