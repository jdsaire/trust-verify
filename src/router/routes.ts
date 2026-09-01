/**
 * FlowPhase → route mapping.
 *
 * `verified` / `mismatch` / `not-found` share one route: they all render through the same
 * VerdictScreen (App.tsx switches on `flow.verdict !== null`, not on which kind it is), so they
 * are one screen, not three, and get one URL.
 */

import type { FlowPhase } from '../services/VerificationSessionService.ts';

export const ROUTES: Record<FlowPhase, string> = {
  idle: '#/',
  handshake: '#/step/handshake',
  'step-up': '#/step/step-up',
  requesting: '#/step/requesting',
  verified: '#/verdict',
  mismatch: '#/verdict',
  'not-found': '#/verdict',
  error: '#/error',
};

export const IDLE_ROUTE = ROUTES.idle;
