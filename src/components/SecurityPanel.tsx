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
import { useLang } from '../i18n/LangContext.tsx';

function Cert({ title, cert }: { title: string; cert: CertificateInfo }) {
  const { t } = useLang();
  return (
    <div className="cert">
      <h4 className="cert__h">{title}</h4>
      <dl className="cert__dl">
        <div>
          <dt>{t('sec_cert_subject')}</dt>
          <dd>{cert.subject}</dd>
        </div>
        <div>
          <dt>{t('sec_cert_issuer')}</dt>
          <dd>{cert.issuer}</dd>
        </div>
        <div>
          <dt>{t('sec_cert_serial')}</dt>
          <dd className="mono">{cert.serial}</dd>
        </div>
        <div>
          <dt>{t('sec_cert_valid')}</dt>
          <dd>
            {cert.validFrom} → {cert.validTo}
          </dd>
        </div>
        <div>
          <dt>{t('sec_cert_key')}</dt>
          <dd>{cert.keyAlgorithm}</dd>
        </div>
        <div>
          <dt>{t('sec_cert_sha')}</dt>
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
  const { t } = useLang();
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
        {t('sec_h')}
      </h2>

      {/* ---- Panel 1: staged. Nothing below this heading is real. ---- */}
      <div className="sec__panel sec__panel--sim">
        <div className="sec__panelHead">
          <h3>{t('sec_sim_heading')}</h3>
          <ProvenanceBadge provenance="simulated" />
        </div>
        <p className="sec__panelNote">{t('sec_sim_note')}</p>

        <div className="riskmode" role="group" aria-label={t('sec_riskmode_aria')}>
          <span className="riskmode__k">{t('sec_riskmode_label')}</span>
          <div className="riskmode__opts">
            <button
              type="button"
              className={`riskmode__opt ${mode === 'normal' ? 'riskmode__opt--on' : ''}`}
              aria-pressed={mode === 'normal'}
              onClick={() => chooseMode('normal')}
            >
              {t('sec_riskmode_low')}
            </button>
            <button
              type="button"
              className={`riskmode__opt ${mode === 'elevated' ? 'riskmode__opt--on' : ''}`}
              aria-pressed={mode === 'elevated'}
              onClick={() => chooseMode('elevated')}
            >
              {t('sec_riskmode_elevated')}
            </button>
          </div>
          <p className="riskmode__note">{t('sec_riskmode_note')}</p>
        </div>

        {handshake ? (
          <>
            <div className="sec__row">
              <span className="sec__k">{t('sec_transport_label')}</span>
              <span className="sec__v">{t('sec_transport_value')}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">{t('sec_protocol_label')}</span>
              <span className="sec__v">{handshake.protocol}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">{t('sec_cipher_label')}</span>
              <span className="sec__v mono">{handshake.cipherSuite}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">{t('sec_keyexchange_label')}</span>
              <span className="sec__v">{t('sec_keyexchange_value')}</span>
            </div>
            <div className="sec__row">
              <span className="sec__k">{t('sec_mutualauth_label')}</span>
              <span className="sec__v">{t('sec_mutualauth_value')}</span>
            </div>

            <div className="certs">
              <Cert title={t('sec_cert_server_title')} cert={handshake.serverCertificate} />
              <Cert title={t('sec_cert_client_title')} cert={handshake.clientCertificate} />
            </div>

            <div className="risk">
              <h4 className="cert__h">{t('sec_risk_heading')}</h4>
              <p className="risk__band">
                {handshake.adaptiveRisk.band} · {handshake.adaptiveRisk.score}/100
              </p>
              <ul className="risk__signals">
                {handshake.adaptiveRisk.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="risk__note">
                {handshake.stepUpRequired ? t('sec_risk_note_stepup') : t('sec_risk_note_clear')}
              </p>
            </div>
          </>
        ) : (
          <p className="sec__empty">{t('sec_empty')}</p>
        )}
      </div>

      {/* ---- Panel 2: real. Everything below this heading runs in this app. ---- */}
      <div className="sec__panel sec__panel--impl">
        <div className="sec__panelHead">
          <h3>{t('sec_impl_heading')}</h3>
          <ProvenanceBadge provenance="implemented" />
        </div>
        <p className="sec__panelNote sec__panelNote--impl">{t('sec_impl_note')}</p>
        <ul className="impl">
          <li>
            <strong>{t('sec_impl_item1_strong')}</strong> {t('sec_impl_item1_post')}
          </li>
          <li>
            <strong>{t('sec_impl_item2_strong')}</strong> {t('sec_impl_item2_post')}
          </li>
          <li>
            <strong>{t('sec_impl_item3_strong')}</strong> {t('sec_impl_item3_post')}
          </li>
          <li>
            <strong>{t('sec_impl_item4_strong')}</strong> {t('sec_impl_item4_mid')}
            <code>inert</code>
            {t('sec_impl_item4_and')}
            <code> aria-hidden</code>
            {t('sec_impl_item4_post')}
          </li>
          <li>
            <strong>{t('sec_impl_item5_strong')}</strong> {t('sec_impl_item5_post')}
          </li>
          <li>
            <strong>{t('sec_impl_item6_strong')}</strong> {t('sec_impl_item6_mid')}
            <code>VerificationSessionService.getInstance()</code>
            {t('sec_impl_item6_post')}
            {!sameInstance && t('sec_impl_item6_fail_suffix')}
            {t('sec_impl_item6_end')}
            <code className="mono">{sessionId}</code>.
          </li>
        </ul>
      </div>
    </section>
  );
}
