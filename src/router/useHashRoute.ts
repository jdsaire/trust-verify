/**
 * One-way hash router: `FlowPhase` drives `location.hash`, never the other way around.
 *
 * This is deliberate, not a shortcut: `useFlowState.ts` is already the single source of truth for
 * where the user is in the flow (see architecture note — the router "reads/drives [flow] state, it
 * does not fork a parallel notion of current step"). `handshake`, `step-up`, and `requesting` are
 * live, in-flight states backed by a running `AbortController` and promise chain in
 * `VerificationSessionService`; there is no serialized form of "mid-handshake" to reconstruct from
 * a URL after a real page reload, and synthesizing one — worse, synthesizing a *verdict* from a
 * URL with no backing verification — would be actively wrong for a payment-verification tool, not
 * just an inconvenience.
 *
 * So: while the app is alive, every phase transition updates the hash, and the six routes are all
 * genuinely addressable and shareable within that session (deep-linking works). On a fresh load —
 * including a hard refresh — the runtime always boots at `idle` (see `VerificationSessionService`'s
 * `IDLE` constant), so any other route present in the address bar at that moment is corrected back
 * to `idle`'s route rather than left pointing at a screen the app has no state for.
 *
 * `replaceState`, not `pushState`: `App.tsx` already owns exactly one intentional history entry —
 * pushed when a verification goes busy, so a back-press cancels it rather than navigating away
 * (see the effect there). Pushing a second entry here for every phase change would stack on top of
 * that and break the "back cancels" contract; `replaceState` keeps the address bar in sync without
 * adding stops to the back/forward stack.
 */

import { useEffect, useRef } from 'react';
import type { FlowPhase } from '../services/VerificationSessionService.ts';
import { ROUTES, IDLE_ROUTE } from './routes.ts';

export function useHashRoute(phase: FlowPhase): void {
  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      // Fresh load: the runtime is always idle here, whatever the address bar says.
      if (location.hash !== IDLE_ROUTE && location.hash !== '' && location.hash !== '#') {
        history.replaceState(null, '', IDLE_ROUTE);
      }
      return;
    }
    const next = ROUTES[phase];
    if (location.hash !== next) history.replaceState(null, '', next);
  }, [phase]);
}
