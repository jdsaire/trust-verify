/**
 * REST client for the operations ledger.
 *
 * There is no backend. The endpoints below are static JSON documents published alongside the app
 * and fetched over HTTPS with the standard fetch API, so the consumption path — request, status
 * handling, content negotiation, parsing, error mapping — is the real thing even though the
 * origin is static hosting.
 *
 *   GET api/operations/{operationNumber}.json  -> 200 ledger record | 404 no such operation
 *   GET api/session/handshake.json             -> 200 simulated transport-security material
 *
 * All paths are relative. The site is served from a project path (/designops/) and forbids
 * leading-slash asset paths; this sub-app inherits that rule.
 */

import type { LedgerRecord } from '../domain/receipt.ts';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Static hosts answer a missing file with an HTML 404 page, and a dev server may answer with an
 * SPA fallback that is HTML with a 200. Either way the body is not a ledger record, so require
 * JSON before trusting the response. Without this check an HTML error page could parse-fail in a
 * way that reads as a server problem rather than as "no such operation".
 */
function looksLikeJson(res: Response): boolean {
  return (res.headers.get('content-type') ?? '').toLowerCase().includes('application/json');
}

const OPERATION_NUMBER = /^\d{6,12}$/;

/**
 * Fetch one operation from the ledger.
 *
 * Returns null for "no such operation" rather than throwing, because that is not an error — it is
 * the single most informative verdict this tool produces.
 */
export async function fetchOperation(
  operationNumber: string,
  signal?: AbortSignal,
): Promise<LedgerRecord | null> {
  // Validate before it reaches a URL: the input is typed by a person and interpolated into a path.
  if (!OPERATION_NUMBER.test(operationNumber)) return null;

  const res = await fetch(`api/operations/${encodeURIComponent(operationNumber)}.json`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(`Ledger lookup failed (${res.status}).`, res.status);
  if (!looksLikeJson(res)) return null;

  return (await res.json()) as LedgerRecord;
}

export interface HandshakeMaterial {
  protocol: string;
  cipherSuite: string;
  /** When the adaptive band is elevated, the session must re-authenticate before the ledger call. */
  stepUpRequired?: boolean;
  serverCertificate: CertificateInfo;
  clientCertificate: CertificateInfo;
  adaptiveRisk: { score: number; band: string; signals: string[] };
}

/**
 * Which staged session to fetch.
 *
 * Two fixtures rather than one so the elevated path is demonstrable on demand — a risk engine that
 * only ever returns "low" demonstrates nothing.
 */
export type RiskMode = 'normal' | 'elevated';

export interface CertificateInfo {
  subject: string;
  issuer: string;
  serial: string;
  validFrom: string;
  validTo: string;
  keyAlgorithm: string;
  fingerprintSha256: string;
}

export async function fetchHandshakeMaterial(
  mode: RiskMode = 'normal',
  signal?: AbortSignal,
): Promise<HandshakeMaterial> {
  const endpoint =
    mode === 'elevated' ? 'api/session/handshake-elevated.json' : 'api/session/handshake.json';
  const res = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok || !looksLikeJson(res)) {
    throw new ApiError(`Handshake material unavailable (${res.status}).`, res.status);
  }
  return (await res.json()) as HandshakeMaterial;
}
