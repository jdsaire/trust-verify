# src/router/

One hash route per `FlowPhase` state.

- `routes.ts` — the `FlowPhase → route` map. `verified`/`mismatch`/`not-found` share `#/verdict`:
  they all render through the same `VerdictScreen`, so they're one screen, not three.
- `useHashRoute.ts` — reads `flow.phase` and reflects it into `location.hash` via
  `history.replaceState`. One-way only: the URL never drives `phase`, so the router never forks a
  second notion of "current step" against `useFlowState`'s existing one.

A hard refresh always boots at `idle` — `handshake`, `step-up`, and `requesting` are live,
in-flight states with no serialized form to reconstruct from a URL, and synthesizing a verdict from
a URL with no backing verification would be wrong for a payment-verification tool. Any non-idle
route present on a fresh load is corrected back to `idle` rather than left pointing at a screen the
app has no state for — see the reasoning in `useHashRoute.ts`.
