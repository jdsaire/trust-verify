/**
 * React's attachment point to the Observer.
 *
 * useSyncExternalStore is the supported way to read state that lives outside React: subscribe with
 * the same subscribe/unsubscribe contract the subject already exposes, and React handles tearing
 * and re-render scheduling. Every component calling this hook is an independent observer of the
 * one subject owned by the session singleton.
 */

import { useSyncExternalStore } from 'react';
import { VerificationSessionService, type FlowState } from './VerificationSessionService.ts';

export function useFlowState(): FlowState {
  const service = VerificationSessionService.getInstance();
  return useSyncExternalStore(
    (onChange) => service.subject.subscribe(onChange),
    () => service.subject.getState(),
  );
}
