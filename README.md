# Payment-confirmation trust & verification

**Brief 04 · an independent case study. Not affiliated with, endorsed by, or connected to Yape or
BCP.** A front-end demonstration built against fabricated fixtures. No real payment, account, or
ledger is involved, and no real payment can be verified here.

## The one job

A merchant is shown a payment confirmation and has to decide, in a few seconds, whether to hand over
the goods. This app does one thing: it checks whether that confirmation describes a payment that
actually happened.

Peru's *"Yape falso"* fraud works because a shared receipt is a static image. Every field printed on
it — amount, recipient, timestamp, and even the *código de seguridad* shipped in April 2025 — is
text whoever made the image can set. Looking harder at the receipt cannot settle it, because the
forger reproduces exactly what you are looking at.

One field on the receipt is different. `Nro. de operación` is written by the ledger, not by the
sending device, so it is the only field that can be checked against an authority. That asymmetry is
the whole design:

- **enter the operation number** — the one field a forger cannot invent into existence;
- **check it against the ledger**, not against the image;
- **show the field-by-field reasoning**, so the merchant leaves knowing *why*, not just *what*.

The optional fields default to *"not shown"*. The security code is printed on every receipt but is
absent from the public anti-fraud guidance, so a merchant may not know to look for it — and a tool
that demands a field its user has never heard of fails exactly the person it is for. A verdict stays
reachable regardless, and the app discloses what it did not check.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173  (add --host to reach it from a phone)
npm test           # the testing protocol — see TESTING.md
npm run typecheck
npm run build      # regenerates the checked-in index.html + assets/
```

Requires Node 24+.

## How it is put together

| Path | What |
|---|---|
| `src/` | Source. React + TypeScript. |
| `src/domain/` | Receipt field model, verdict logic. No React, no network — plain and directly testable. |
| `src/patterns/Observer.ts` | The Observer implementation. |
| `src/services/` | The session singleton, the REST client, React's binding to the subject. |
| `src/components/` | Screens and controls. |
| `api/` | Mock REST fixtures, committed where they are served from. |
| `tests/` | The testing protocol. |
| `index.html`, `assets/` | **Built output, checked in.** |

### Why the build output is committed

The site around this app is zero-build vanilla HTML/CSS/JS, deployed by uploading the repository
as-is. This sub-app needs a build step — React and TypeScript require one — but that requirement
must not leak onto the rest of the site. So the build runs here, at commit time, and its output is
checked in. Pages serves it as static files and needs no build step of its own. CI asserts the
committed output still matches a fresh build of `src/`, so the deployed app cannot drift from the
source.

All asset paths are relative: the site is served from a project path, and a leading-slash path would
resolve against the domain root.

### Singleton — `VerificationSessionService`

One instance per session, via `getInstance()`. This is not a stylistic choice: the object owns the
**execution lock**, and a lock only works if every caller contends for the same one. Two instances
would mean two locks, which is the same as no lock. It also owns session identity, the audit trail,
and the observable flow state — all per-session, not per-component.

### Observer — `ObservableSubject`

The flow has several independent readers — the verdict panel, the handshake log, the busy scrim —
and none needs to know the others exist. The subject holds the state and broadcasts each transition
once. React attaches through `useSyncExternalStore`, the supported way to read a store that lives
outside React.

The two compose: because the lock lives in the singleton, the subject never emits a duplicate
in-flight state.

### REST consumption

There is no backend. The endpoints are static JSON fetched over HTTPS, so the consumption path —
request, status handling, content negotiation, parsing, error mapping — is real even though the
origin is static hosting.

```
GET api/operations/{operationNumber}.json   200 ledger record | 404 no such operation
GET api/session/handshake.json              200 staged transport-security material
GET api/session/handshake-elevated.json     200 staged material, elevated risk
```

A 404 maps to "no such operation" — not an error, but the most informative verdict the tool
produces. A 500 raises, because "the lookup failed" and "this payment does not exist" mean opposite
things and must never be collapsed.

## The security layer

Two kinds of claim, kept in **separate, separately badged panels** so neither borrows credibility
from the other:

**SIMULATED** — demonstrated against fabricated fixtures. Nothing here measures anything, no
credential is checked, and no certificate is issued by any authority. HTTPS/SSL/TLS 1.2 record
layer, negotiated cipher suite, ECDHE with RSA-2048 asymmetric keys, mutual authentication (both
sides present and validate a certificate), digital certificates with fingerprints, and RSA Adaptive
risk scoring that gates the ledger call behind a step-up challenge when a session scores elevated.
The page's actual transport security is whatever its host provides — the panel describes a staged
exchange, not that connection.

**IMPLEMENTED** — controls that genuinely run in this client code and can be exercised on the page:
the in-app secure keypad (so a third-party keyboard never sees the input), its shuffled digits (so
the finger path does not spell the value to anyone watching), the execution lock, the blocking
scrim's `inert` + `aria-hidden` treatment, privacy masking, and the single-session instance.

## Styling

The palette and type rules follow an **approximate** reference extracted from screen inspection for
the selection dossier — four colour tokens and a monetary-scale rule. They are approximations, not
anyone's design tokens. The interface they build is this tool, not a reproduction of any real
product.
