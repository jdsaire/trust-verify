# Testing protocol — payment-confirmation trust & verification

The six scenarios below are the protocol this build is required to pass. They are not invented
here: each is seeded from the confirmed evidence in the Brief 04 selection dossier
(`docs/v2/banking-selection-dossier.md`, §7 → task 4.2), and each is a scenario rather than a
design.

Run them with:

```bash
npm ci
npm test          # vitest run
npm run typecheck # tsc --noEmit
```

They also run automatically on every push and pull request that touches this directory
(`.github/workflows/yape-trust-verify-ci.yml`).

---

## Result

**45 of 45 assertions pass. No scenario is waived.**

Recorded 15 Jul 2026 · Node 24.18.0 · Vitest 3.2.7 · TypeScript 5.9.3.

| # | Scenario | Source | Result |
|---|---|---|---|
| 1 | Field-level forgery discrimination | dossier §7, §2.5 | **PASS** (5 assertions) |
| 2 | The unknown-code case | dossier §7, §2.4 | **PASS** (5 assertions) |
| 3 | Execution lockout | dossier §7, A.5 | **PASS** (5 assertions) |
| 4 | Precondition gating | dossier §7, A.5 | **PASS** (4 assertions) |
| 5 | Scrim integrity | dossier §7, A.5 | **PASS** (2 assertions) |
| 6 | Privacy defaults | dossier §7, A.5 | **PASS** (4 assertions) |
| — | Patterns, REST surface, provenance segregation | success criteria 2–3 | **PASS** (19 assertions) |
| — | Core-flow smoke | roadmap 4.1 | **PASS** (1 assertion) |

---

## 1 — Field-level forgery discrimination

`tests/scenario-1-forgery-discrimination.test.tsx`

The dossier's central structural finding: every field on a shared receipt is text a forger can set,
except the operation number, which the ledger writes. The protocol requires the build to state that
distinction per field and be testable against it.

- Every catalogued field carries a provenance **and** a stated reason.
- **Exactly one** field is `backend-anchored`, and it is `Nro. de operación`. The assertion pins the
  count, so adding a second anchored field fails the suite rather than quietly eroding the premise.
- The *código de seguridad* is classified `sender-reproducible`. It ships on every receipt and looks
  like proof, but it is text on the same image — treating it as proof is the trap the tool exists to
  close.
- A forged amount against a real operation number is named precisely (`Monto`), not reported as a
  vague failure.
- End-to-end: the "real payment, edited" sample reaches **Do not accept** and names the field.

## 2 — The unknown-code case

`tests/scenario-2-unknown-code.test.tsx`

The security code is deployed in-app but absent from the public anti-fraud guidance, so a merchant
may not know to look for it. A tool that demands a field its user has never heard of fails exactly
the person it is for.

- A verdict is reachable with the code unknown.
- An unreadable field is **never** scored as a mismatch. This guards the dangerous inversion —
  "not supplied" reading as "does not match" would tell a merchant a genuine receipt is forged.
- A forgery is still caught with the code unknown, via the operation number.
- The optional fields **default** to "not shown"; the verifier is never asked to know first.
- The verdict discloses what it did not check rather than implying completeness.

## 3 — Execution lockout

`tests/scenario-3-execution-lockout.test.tsx`

The highest-severity interaction rule in the reference flow. Assertions count **actual ledger
calls**, not button appearance — a disabled-looking control that still fires is the bug being hunted.

- A second submit during flight is refused by the lock; the ledger is hit **once**.
- A double-tapped verification writes **one** audit entry.
- Through the UI: the CTA is unreachable behind the inert subtree; still one ledger call.
- A back-press mid-flight lands on a clean idle state — no stale verdict, and no audit entry for a
  check that never completed.
- The lock is released after a cancel, so the next verification runs.

> **This scenario caught a real defect.** `#sleep` and `#awaitStepUp` subscribed to `abort` without
> first checking `signal.aborted`. A cancel raised before the flow reached that await had already
> dispatched its event, so the listener never fired and the cancelled verification continued on to
> write a verdict the operator had backed out of — precisely the desync the rule forbids. Both now
> check the flag before subscribing. Fixed, not waived.

## 4 — Precondition gating

`tests/scenario-4-6-gating-scrim-privacy.test.tsx`

- Entry state is `S/ 0` with the action disabled and `aria-disabled`.
- An operation number alone does not satisfy the gate.
- Taps are **ignored** while the precondition fails — `pointer-events: none`, so a failed
  precondition is inert rather than merely grey. Zero ledger calls.
- The action enables only once both preconditions hold.

## 5 — Scrim integrity

`tests/scenario-4-6-gating-scrim-privacy.test.tsx`

- While a check is in flight the page behind the scrim carries `aria-hidden="true"`, `inert`, and
  `pointer-events: none`, and the overlay is a modal dialog.
- The page is released once the check settles.

## 6 — Privacy defaults

`tests/scenario-4-6-gating-scrim-privacy.test.tsx`

Merchants open this at a market counter, in front of the person whose receipt is in question.

- The phone number is masked to its last three digits.
- **No** full phone number appears anywhere on the verdict.
- Recipient names stay truncated; the UI never expands what the ledger truncated at source.
- The comparison table does not leak a full name.

---

## Beyond the six

`tests/patterns-and-rest.test.tsx` backs the claims the build makes about its own construction:

- **Singleton** — one instance per session; two references contend for the *same* execution lock
  (the reason the pattern is load-bearing rather than decorative); a reset yields a genuinely new
  session.
- **Observer** — broadcasts to every observer, stops on unsubscribe, survives an observer that
  unsubscribes mid-broadcast, and drives the flow through `handshake → requesting → verified`.
- **REST consumption** — 404 maps to "no such operation" (not an error); a 200 parses; a non-JSON
  body claiming success is refused; a **500 raises rather than being read as not-found** (opposite
  meanings); an unvalidated operation number never reaches a URL; every request path is relative.
- **Provenance segregation** — staged and implemented claims sit in separately badged panels; the
  staged vocabulary never appears outside the panel that disclaims it; the panel states plainly that
  it measures nothing; the non-affiliation notice is present.
- **Step-up auth** — the ledger is not touched until the challenge clears, and a refused challenge
  abandons the verification with the lock released.

## What this protocol does not claim

These are automated assertions against a jsdom DOM and fabricated fixtures. They are a build record.
No part of this protocol involves people, and nothing here measures anyone's behaviour.
