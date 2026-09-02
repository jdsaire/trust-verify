# PLAN — P-CC-S5B-ESToggleFix-v1_0

The plan as approved before implementation began. Two things were filled in after the initial
approval, both approved in turn before any code was written: the D-S5-1 root cause and fix,
established at the diagnosis gate and left deliberately open here until then, and the shape of the
toggle's regression test.

---

## Context

Amendment F4 §1.3 rewrote freeze condition B2 so it points at `jdsaire/trust-verify` at
`https://jdsaire.github.io/trust-verify/`, and §1.4 refuses to forgive the two defects measured on
01 Sep 2026 that hold B2's ES clause false:

- **D-S5-1** — the in-app `EN | ES` toggle has no effect; ES renders only when `jds-lang` already
  reads `ES` at page load.
- **D-S5-2** — the mast header, the four sample-receipt chip labels and the document `<title>` stay
  English while the rest of the interface is Spanish. Cause known: missing keys, hardcoded JSX, a
  domain-layer label field, a static `<title>`.

F4 §3: "B2 closes when D-S5-1 and D-S5-2 close. Nothing else stands between this stage and its exit
condition." This run closes both and nothing else, and leaves a pull request open to be merged by
hand.

---

## Preflight

| Check | Result |
|---|---|
| GitHub access | `gh` v2.96.0, authenticated as `jdsaire`. No credential printed or referenced. |
| `S5B-ESCopyLock-v1_0.md` | Present, 8/8 keys — every string this plan needs is locked. |
| `AMENDMENT-F4-TrustVerifyRelocation-v1_0.md` | Present; §1.3 and §1.4 read. |
| HEAD of `main` | `7facc7fa5306a9d797918f6f5cc2062df1b5500a` — matches the pinned SHA, zero drift. 49 tracked files. |
| Node | v24.20.0 (24+ required) |
| Baseline | `npm ci`, typecheck, 45/45 tests, production build — all clean on the untouched checkout. |
| Deployed bundle is current | Confirmed twice: the deployed JS and CSS contain the current source, and a local build of `main` emits `index-BJqq1xVh.js` / `index-BAdg08qx.css` — the same hashes the live page loads. Staleness ruled out. |

---

## Operational hazard (affects every build)

`vite.config.ts` sets `build.outDir: '..'` with `emptyOutDir: false`, so `npm run build` overwrites
the tracked root `index.html` with fresh asset hashes. That file is tracked, is *not* gitignored, and
is an explicit out-of-scope item.

Standing rule: after every build, `git restore index.html`; never `git add -A` or `git commit -a` —
stage explicit paths only.

---

## D-S5-1 — diagnosis, then fix

Source, deployed JS and deployed CSS all read correctly, so the cause is runtime and the gate is a
live-browser exercise: real pointer events at the button's own coordinates rather than
`element.click()`, `document.elementFromPoint()` at that point, focus read from
`document.activeElement` rather than inferred from appearance, and temporary instrumentation on the
handler, the setter, the provider and a consumer. Run against the deployed URL and a local dev build
separately, and both engines covered — automated Chromium, driven from a scratchpad install that
never enters the repository or `package.json`, with a Safari console pass held in reserve if
Chromium came back clean.

**Root cause, established at the gate.** `.mast__kicker` carries `opacity: 0.82`. An element with
opacity below 1 is painted as if it were positioned at z-index 0, which put it in the same painting
step as the absolutely positioned `.langtoggle` (`z-index: auto`); ties there break on DOM order, and
the kicker comes later. Its full-width paragraph box covered the toggle and took every pointer event
aimed at it. `document.elementFromPoint()` at the ES button's centre returned `p.mast__kicker`, and a
real click there reached a capturing document listener with the paragraph as its target. Reproduced
identically on the deployed build and locally. Keyboard activation was never broken — the earlier
soft keyboard evidence was mistaken.

**Approved fix.** `z-index: 1` on `.langtoggle` in `src/styles/app.css`. Verified by runtime
injection before being written: with it, `elementFromPoint` returns the button and both directions
switch on both environments. Byte-identical screenshots of the mast before and after — the kicker's
background is transparent, so the toggle always showed through. Touches no file in the mechanical
invariant and no out-of-scope item; changes no pixel, no markup, no class, no DOM order.

**Regression test.** jsdom performs no layout and no hit-testing, so no test rendered there can fail
against this defect. The file therefore carries both: behavioural tests asserting the rendered
language changes on activation by mouse and by keyboard, and a stylesheet assertion — the only one
that fails against the pre-fix build — that the toggle out-ranks the opacity-promoted mast text.

---

## D-S5-2 — the eight keys

English quoted from source character for character; Spanish verbatim from the copy lock. Zero
Spanish authored.

| key | EN (from source) | ES (from lock) |
|---|---|---|
| `mast_kicker` | `Brief 04 · Case study` | `Brief 04 · Estudio de caso` |
| `mast_h` | `Is this payment real?` | `¿Este pago es real?` |
| `mast_sub` | `A merchant is shown a payment confirmation. This checks whether it happened.` | `A un comerciante le muestran una confirmación de pago. Esto verifica si ocurrió.` |
| `sample_genuine_title` | `A genuine receipt` | `Un comprobante genuino` |
| `sample_forged_amount_title` | `A real payment, edited` | `Un pago real, editado` |
| `sample_fabricated_title` | `A payment that never happened` | `Un pago que nunca ocurrió` |
| `sample_unknown_code_title` | `A receipt you can't fully read` | `Un comprobante difícil de leer` |
| `doc_title` | `Is this payment real? — Brief 04 case study` | `¿Este pago es real? — Brief 04, estudio de caso` |

`translations.ts` declares `const es: Record<keyof typeof en, string>`, so the compiler itself
enforces EN/ES parity.

**(a) Mast** — `App` renders `<LangProvider>` and so cannot call `useLang()` itself; the header moves
into `src/components/Mast.tsx` inside the provider. Markup, classes and order unchanged.

**(b) Chip labels** — resolved in the component layer from the sample's stable id, through a map in
`src/i18n/sampleTitles.ts`. i18n may import domain; domain may never import i18n. `id` narrows from
`string` to a four-member union — type-only, no fixture data changed, no import added — because under
`noUncheckedIndexedAccess` a string-keyed lookup is possibly-undefined, and the ways out of that are
an assertion or an English fallback, the second being the defect itself.

**(c) Document title** — a `useEffect` in `LangProvider`, which owns the language, setting
`document.title` from the table and `document.documentElement.lang` alongside it. `src/index.html`
keeps its English pair: EN is the load-time default and what renders with JS off.

---

## Commits

Conventional, scoped, one discrete item each, author and committer `jdsaire`. Branch
`deploy/v2-es-toggle-fix`, created by that exact name. Typecheck, full suite and production build
clean after every commit, verified individually.

1. `fix(i18n)` the toggle · 2. `test(i18n)` its coverage · 3. `feat(i18n)` mast · 4. `test(i18n)` mast
· 5. `feat(i18n)` chip labels · 6. `test(i18n)` chip labels · 7. `feat(i18n)` document title ·
8. `test(i18n)` document title · 9. `docs(i18n)` the i18n README, whose scope sentence item (b)
falsified · 10. `docs` the archive.

---

## Verification

Typecheck, suite count before and after, production build, every ES surface enumerated screen by
screen, toggle by mouse and keyboard, persistence across reload, `jds-lang` still the shared key,
every out-of-scope item confirmed untouched by diff, and `git log` showing `jdsaire` alone with no
attribution leakage in any message or in the branch name.

A localhost review gate precedes it: the running site, the commits, the check results and the
hand-verification steps, including one end-to-end verification per language with the URL updating per
step and a cold load of `#/step/step-up` returning to the entry screen — behaviour F4 §2.3 makes a
requirement.

---

## Pull request and archive

Push the branch, open a pull request against `main`, report its number and URL, and stop. It is not
merged by this run.

The repository has no `handoff/` and no `docs/` at the pinned HEAD — inspected, not assumed — so
`handoff/v2/` is created for the plan, the completion report and a folder index, with
`handoff/README.md` as the parent index.

---

## Decisions settled before implementation

| Question | Decision |
|---|---|
| Browser D-S5-1 was measured in | Not certain, so both engines covered; Chromium reproduced it, so the Safari pass was not needed. |
| Diagnosis tooling | Chromium driven from a session scratchpad — never in the repository, never in `package.json`, nothing committed. |
| Chip-label mechanism | Narrow `Sample['id']` to a union; map lives in `src/i18n/sampleTitles.ts`. |
| `<html lang>` | Included alongside the document title — a deliberate step past the strict scope ceiling. |
| D-S5-1 regression test | Behavioural tests plus a stylesheet stacking assertion, since jsdom cannot fail on a hit-test defect. |

---

## Risks carried into execution

1. **The defect might not reproduce.** It did, in both environments, on the first pass.
2. **`mast_kicker` grows 21 → 26 characters** on an 11px uppercase single-line kicker. The lock
   installs verbatim regardless; the CSS may be adjusted to fit the copy, never the reverse.
3. **Every build dirties the tracked root `index.html`** — mitigated by the standing restore rule.
4. **i18n failures here are runtime-only**, invisible to typecheck, build and unit tests. Which is
   why the review gate looks at a running site and why the pull request is left unmerged.
