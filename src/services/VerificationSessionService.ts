/**
 * Singleton pattern — the verification session service.
 *
 * Exactly one instance exists per running app, reached through getInstance(). The constructor is
 * private, so no second one can be built by accident.
 *
 * Single instance is the right shape here rather than a stylistic choice: this object owns the
 * execution lock. A lock only works if every caller contends for the same one — two instances
 * would mean two locks, which is the same as no lock. It also owns the session identity, the
 * audit trail, and the observable flow state, all of which are per-session, not per-component.
 *
 * The tightest interaction rule in the reference flow is the execution lockout: once an operation
 * is in flight the screen must freeze, because a double-tap under network lag or a back-press
 * mid-flight risks a duplicate or a desynchronised view. The guard lives here.
 */

import { ObservableSubject, type Subject } from '../patterns/Observer.ts';
import { judge, type Verdict } from '../domain/verdict.ts';
import type { ClaimedReceipt } from '../domain/receipt.ts';
import {
  fetchOperation,
  fetchHandshakeMaterial,
  type HandshakeMaterial,
  type RiskMode,
} from './ledgerApi.ts';

export type FlowPhase =
  | 'idle'
  | 'handshake'
  /** Adaptive risk came back elevated; waiting on re-authentication before touching the ledger. */
  | 'step-up'
  | 'requesting'
  | 'verified'
  | 'mismatch'
  | 'not-found'
  | 'error';

export interface HandshakeStep {
  label: string;
  detail: string;
  done: boolean;
}

export interface FlowState {
  phase: FlowPhase;
  /** True from submit until the flow settles. Drives the blocking scrim. */
  busy: boolean;
  verdict: Verdict | null;
  handshake: HandshakeMaterial | null;
  handshakeSteps: HandshakeStep[];
  error: string | null;
}

export interface AuditEntry {
  at: string;
  operationNumber: string;
  outcome: FlowPhase;
}

const IDLE: FlowState = {
  phase: 'idle',
  busy: false,
  verdict: null,
  handshake: null,
  handshakeSteps: [],
  error: null,
};

/** Latency so the lockout is observable rather than theoretical. Overridable in tests. */
const DEFAULT_LATENCY_MS = 900;

export class VerificationSessionService {
  static #instance: VerificationSessionService | null = null;

  readonly #subject = new ObservableSubject<FlowState>(IDLE);
  readonly #sessionId: string;
  readonly #startedAt = new Date();
  readonly #audit: AuditEntry[] = [];

  /** The execution lock. Guards the whole submit path, not just the network call. */
  #inFlight = false;
  #abort: AbortController | null = null;
  #latencyMs = DEFAULT_LATENCY_MS;
  #riskMode: RiskMode = 'normal';
  /** Resolves when the operator clears the step-up challenge. */
  #stepUpResolve: ((ok: boolean) => void) | null = null;

  private constructor() {
    this.#sessionId = `sess_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }

  static getInstance(): VerificationSessionService {
    // Lazily created and then reused for the lifetime of the page.
    VerificationSessionService.#instance ??= new VerificationSessionService();
    return VerificationSessionService.#instance;
  }

  /** Test seam: drop the instance so each test starts from a known session. */
  static resetInstanceForTests(): void {
    const current = VerificationSessionService.#instance;
    if (current) current.cancel();
    VerificationSessionService.#instance = null;
  }

  get subject(): Subject<FlowState> {
    return this.#subject;
  }
  get sessionId(): string {
    return this.#sessionId;
  }
  get startedAt(): Date {
    return this.#startedAt;
  }
  get auditTrail(): readonly AuditEntry[] {
    return this.#audit;
  }
  get isBusy(): boolean {
    return this.#inFlight;
  }

  setLatencyForTests(ms: number): void {
    this.#latencyMs = ms;
  }

  get riskMode(): RiskMode {
    return this.#riskMode;
  }

  /** Choose which staged session the next verification runs against. Ignored mid-flight. */
  setRiskMode(mode: RiskMode): void {
    if (this.#inFlight) return;
    this.#riskMode = mode;
  }

  /** Answer the step-up challenge. `false` abandons the verification. */
  resolveStepUp(ok: boolean): void {
    this.#stepUpResolve?.(ok);
  }

  #awaitStepUp(signal: AbortSignal): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Check before subscribing: an abort that already fired dispatches no further event, so a
      // listener alone would wait forever on a cancelled challenge.
      if (signal.aborted) {
        resolve(false);
        return;
      }
      this.#stepUpResolve = resolve;
      signal.addEventListener('abort', () => resolve(false), { once: true });
    }).finally(() => {
      this.#stepUpResolve = null;
    });
  }

  #emit(patch: Partial<FlowState>): void {
    this.#subject.notify({ ...this.#subject.getState(), ...patch });
  }

  #sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      // An abort raised before the flow reached this point has already dispatched its event, so
      // subscribing now would never hear it and the cancelled verification would sail on to write
      // a verdict the operator had already backed out of. Check the flag first.
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const t = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  }

  /**
   * Run one verification.
   *
   * Returns false when the lock is already held — the second of two rapid taps is dropped here,
   * before it can reach the network. Callers do not get to opt out of the lock.
   */
  async verify(claim: ClaimedReceipt): Promise<boolean> {
    if (this.#inFlight) return false;
    this.#inFlight = true;
    this.#abort = new AbortController();
    const { signal } = this.#abort;

    try {
      this.#emit({
        phase: 'handshake',
        busy: true,
        verdict: null,
        error: null,
        handshakeSteps: [],
      });

      const handshake = await fetchHandshakeMaterial(this.#riskMode, signal);
      const steps: HandshakeStep[] = [
        {
          label: 'Client certificate presented',
          detail: handshake.clientCertificate.subject,
          done: true,
        },
        {
          label: 'Server certificate presented',
          detail: handshake.serverCertificate.subject,
          done: true,
        },
        {
          label: 'Both certificates validated',
          detail: 'Mutual authentication — each side proves identity to the other.',
          done: true,
        },
        {
          label: 'Channel negotiated',
          detail: `${handshake.protocol} · ${handshake.cipherSuite}`,
          done: true,
        },
        {
          label: 'Adaptive risk scored',
          detail: `${handshake.adaptiveRisk.band} (${handshake.adaptiveRisk.score}/100)`,
          done: true,
        },
      ];
      this.#emit({ handshake, handshakeSteps: steps });

      // Adaptive risk gates the ledger call: an elevated session re-authenticates first, and a
      // refused or abandoned challenge means the ledger is never touched at all.
      if (handshake.stepUpRequired) {
        this.#emit({ phase: 'step-up' });
        const cleared = await this.#awaitStepUp(signal);
        if (!cleared) {
          this.#subject.notify(IDLE);
          return false;
        }
        this.#emit({
          handshakeSteps: [
            ...steps,
            {
              label: 'Step-up authentication cleared',
              detail: 'Operator re-authenticated before the ledger call.',
              done: true,
            },
          ],
        });
      }

      this.#emit({ phase: 'requesting' });
      await this.#sleep(this.#latencyMs, signal);

      const record = await fetchOperation(claim.operationNumber, signal);
      const verdict = judge(claim, record);
      const phase: FlowPhase =
        verdict.kind === 'verified'
          ? 'verified'
          : verdict.kind === 'mismatch'
            ? 'mismatch'
            : 'not-found';

      this.#audit.push({
        at: new Date().toISOString(),
        operationNumber: claim.operationNumber,
        outcome: phase,
      });
      this.#emit({ phase, busy: false, verdict });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // A deliberate cancel (back-press) — return to a clean idle rather than an error state.
        this.#subject.notify(IDLE);
        return false;
      }
      this.#emit({
        phase: 'error',
        busy: false,
        error: err instanceof Error ? err.message : 'Verification failed.',
      });
      return false;
    } finally {
      this.#inFlight = false;
      this.#abort = null;
    }
  }

  /**
   * Cancel an in-flight verification — the back-press case.
   *
   * The lock is released by verify()'s finally block, so the flow lands on idle with no pending
   * request able to write a stale verdict over it.
   */
  cancel(): void {
    this.#abort?.abort();
  }

  /** Return to entry, keeping the session and its audit trail. */
  reset(): void {
    if (this.#inFlight) return;
    this.#subject.notify(IDLE);
  }
}
