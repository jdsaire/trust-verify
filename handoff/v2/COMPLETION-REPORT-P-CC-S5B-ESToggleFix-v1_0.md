# COMPLETION REPORT — P-CC-S5B-ESToggleFix-v1_0

**Repository** `jdsaire/trust-verify` · **Branch** `deploy/v2-es-toggle-fix` · **Base** `main` at
`7facc7fa5306a9d797918f6f5cc2062df1b5500a` · **Pull request** #1, open and unmerged ·
**Date** 01 Sep 2026

---

## Outcome

Both defects are closed, and the finding this run existed to produce is a single CSS interaction.

**The toggle was never broken. The clicks never reached it.** `.mast__kicker` carries
`opacity: 0.82`, and an element with opacity below 1 is painted as though it were positioned at
z-index 0 rather than sitting in the normal flow. That put the kicker in the same painting step as
the absolutely positioned `.langtoggle`, which had `z-index: auto` — and ties in that step break on
DOM order, where the kicker, rendered after the toggle, wins. Its full-width paragraph box lay over
the toggle and absorbed every pointer event aimed at it. The evidence is direct:
`document.elementFromPoint()` at the ES button's own bounding-box centre returned `p.mast__kicker`,
and a real mouse click at that point arrived at a capturing document listener with the paragraph as
its target — no handler, no state change, no restyle. Reproduced identically on the deployed build
and in a local dev build, with zero console or page errors in either. `z-index: 1` on `.langtoggle`
closes it; screenshots of the mast before and after are byte-identical, because the kicker's
background is transparent and the toggle always showed through it.

One correction to the defect record: the toggle was always operable by keyboard. Both `Enter` and
`Space` switched the language before the fix, in both environments, with focus read from
`document.activeElement` rather than inferred from the button's rendered focus state. The keyboard
evidence in the governing prompt was marked soft, and it was wrong.

The remaining English came from three separate causes and was closed against a locked copy source:
three mast strings that had no keys at all, four chip labels read from a domain-layer `title` field,
and a static document title. All eight Spanish strings were installed verbatim from
`S5B-ESCopyLock-v1_0.md`; zero Spanish was authored during the run, and all eight English values
match their pre-run source character for character. Both facts were verified programmatically, not
by eye.

**The invariants held.** `src/domain/verdict.ts`, `src/domain/receipt.ts`,
`src/services/VerificationSessionService.ts`, `src/patterns/Observer.ts`, `src/router/` and `api/`
are unchanged in the diff. `src/domain/` still imports nothing but `./receipt.ts` — no React, no
i18n — so the chip labels are resolved in the component layer from a stable identifier, exactly as
required. The execution lock, the singleton, the observer, the REST consumption path, the
404-to-"no such operation" mapping, the step-up challenge and the router's one-way binding all behave
as they did: the cold-load return to the entry screen was re-measured against the unmodified
deployed build and matches it. The tracked root `index.html` — which every local build overwrites —
is untouched in the diff.

---

## Commits

| # | SHA | Commit |
|---|---|---|
| 1 | `aa7b989` | `fix(i18n): lift the language toggle above the mast kicker` |
| 2 | `7e4b390` | `test(i18n): cover EN/ES toggle activation by mouse and keyboard` |
| 3 | `a28ec82` | `feat(i18n): route the mast header through the translation table` |
| 4 | `c2983c6` | `test(i18n): cover the mast header in Spanish` |
| 5 | `e0c1365` | `feat(i18n): resolve sample chip labels through the translation table` |
| 6 | `05e1e35` | `test(i18n): cover sample chip labels in Spanish` |
| 7 | `f33215b` | `feat(i18n): follow the selected language in the document title` |
| 8 | `ab27462` | `test(i18n): cover the document title and lang attribute in Spanish` |
| 9 | `77d308e` | `docs(i18n): describe the sample-title mapping` |
| 10 | — | `docs: archive the ES toggle fix plan and completion report` (this document) |

Checks replayed at every commit individually, not only at the end:

```
aa7b989  typecheck=PASS  build=PASS  45 passed (45)
7e4b390  typecheck=PASS  build=PASS  49 passed (49)
a28ec82  typecheck=PASS  build=PASS  49 passed (49)
c2983c6  typecheck=PASS  build=PASS  50 passed (50)
e0c1365  typecheck=PASS  build=PASS  50 passed (50)
05e1e35  typecheck=PASS  build=PASS  51 passed (51)
f33215b  typecheck=PASS  build=PASS  51 passed (51)
ab27462  typecheck=PASS  build=PASS  52 passed (52)
77d308e  typecheck=PASS  build=PASS  52 passed (52)
```

---

## Success criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | D-S5-1's root cause named with evidence, approved at gate-1 before any fix code | **PASS** | Cause and evidence above. Reported at the gate and approved before commit `aa7b989`, the first code written in the run. |
| 2 | `ES` switches to Spanish and `EN` back — mouse and keyboard — on the deployed build; choice persists across reload; `jds-lang` stays the shared key | **PASS** | Verified on the production build served locally (the deployed site rebuilds from `main`, which this run does not merge): `elementFromPoint` returns the button, both directions switch, `Enter` switches by keyboard with focus read programmatically, reload keeps ES, `jds-lang` unchanged as the storage key. |
| 3 | With ES selected, mast kicker/h1/sub, four chip labels and document title all Spanish | **PASS** | Screen-by-screen sweep against the translation table on idle, handshake scrim, step-up challenge and all four verdict outcomes: no English from the table renders. |
| 4 | Every Spanish string verbatim from the copy lock; zero Spanish authored | **PASS** | All 8 keys compared programmatically against the lock table: 8/8 exact. |
| 5 | Every English string moved into the table matches pre-run source character for character | **PASS** | All 8 compared programmatically against `main`'s `App.tsx`, `samples.ts` and `index.html`: 8/8 exact, including the middle dot, the straight apostrophe and the spaced em dash. |
| 6 | `src/domain/` free of React and i18n; verification core unchanged | **PASS** | `grep` over `src/domain/` shows one import, `./receipt.ts`. `verdict.ts`, `receipt.ts`, `VerificationSessionService.ts`, `Observer.ts`, `src/router/`, `api/` absent from the diff. |
| 7 | Typecheck, suite and build clean after every commit; count reported; new tests cover the toggle and all three surfaces | **PASS** | Replay table above. 45 → 52. Four tests for the toggle, three for the string surfaces. |
| 8 | Every out-of-scope item untouched | **PASS** | Root `index.html`, `src/index.html`, `README.md`, `.gitignore`, `src/router/`, `readStoredLang()` all absent from or unchanged in the diff. Cold-load behaviour re-measured against the unmodified deployed build: identical. |
| 9 | Work on `deploy/v2-es-toggle-fix`, PR opened against `main` and left unmerged, authored solely as `jdsaire`, zero attribution leakage anywhere | **PASS** | Branch created by that exact name. PR #1 open, unmerged. `git log` shows one author and committer identity, `jdsaire <jdsaire@users.noreply.github.com>`. Scan of every commit message for third-party or generator references: zero hits. None in the branch name, PR title, PR body or any archived file. |
| 10 | Both gates hit, reported and approved before their successor began; localhost URL supplied at gate-2; PR not opened before that approval | **PASS** | Gate-1 reported before any code; gate-2 reported with `http://localhost:5173/`, the nine commits, the check results and hand-verification steps. The PR was opened only after gate-2 was approved. |
| 11 | Work performed in a single execution context; no credential requested, printed or referenced | **PASS** | No work delegated elsewhere at any point. All GitHub access through `gh`; no token value read, printed or passed. |
| 12 | Plan and completion report archived with a folder README and a parent index; no attribution in either | **PASS** | `handoff/v2/` with this report, the approved plan and a folder README; `handoff/README.md` as parent index. Scanned clean. |

---

## Authorized deviations

1. **The document's `lang` attribute is set alongside the title.** Beyond the strict scope ceiling —
   it is not a rendered string and so not in D-S5-2's inventory — and authorized before
   implementation. One line, in the effect that was being written anyway. A page rendering Spanish
   should not still declare itself English to assistive tech.
2. **A browser was installed to a session scratchpad for the diagnosis.** The guardrail forbids
   introducing a tool the project does not have; this one never entered the project. Nothing was
   added to `package.json`, nothing was committed, and the repository's dependency set is unchanged.
   Authorized before the gate. Without it the cause was not findable: it is invisible to source
   reading, to typecheck, to the build and to the entire unit suite.
3. **The toggle's regression test is split in two.** The prompt asks for a test that fails against
   pre-fix behaviour *and* asserts the rendered language changes. In this stack those cannot be the
   same test: jsdom performs no layout and no hit-testing, so the behavioural tests pass identically
   before and after the fix — confirmed by running the file against the previous commit's
   stylesheet, where three passed and only the stylesheet assertion failed. Approved at gate-1.
4. **A tenth-item documentation commit.** `src/i18n/README.md` stated that all domain-layer strings
   were deliberately out of translation scope, which the chip-label change falsified. Flagged in the
   plan and approved; the amendment outranks the README.
5. **`src/domain/samples.ts` was edited.** Not an invariant file, but a domain file. The change is
   type-only — `id: string` narrows to a four-member union — with no fixture data altered and no
   import added. Authorized before implementation.
6. **No third-party or generator attribution was added to commits or the pull request**, contrary
   to the standing default of the environment this run executed in. The governing prompt forbids it
   explicitly and repeatedly; the prompt governs.

---

## Decisions taken during the run

- **The mast moved into its own component.** `App` renders `<LangProvider>`, so it sits outside its
  own provider and cannot call `useLang()`. `src/components/Mast.tsx` is the smallest way to give
  the three strings the language, and it keeps `App.tsx`'s own header comment accurate.
- **The title effect lives in `LangProvider`.** The provider owns the language; the document's
  chrome follows from one place rather than from a consumer that happens to be mounted.
- **`git restore index.html` after every build.** `build.outDir` is the repository root with
  `emptyOutDir: false`, so every local build rewrites a tracked, non-gitignored file that is an
  explicit out-of-scope item. Paths were staged explicitly; `git add -A` was never used.
- **A repository-local git identity was set.** No `user.name` or `user.email` was configured on the
  machine, locally or globally. Set to `jdsaire <jdsaire@users.noreply.github.com>`, matching the
  identity on every existing commit in the repository.
- **New test files clear `localStorage`.** Twelve existing assertions across five files select
  sample chips by their English names; they hold only while EN remains the load-time default and no
  ES value leaks between tests.
- **Key placement follows the table's existing grouping.** New keys sit in `// Mast`,
  `// Sample receipts` and `// Document chrome` groups; the ES object mirrors the EN order, as it
  already did.

---

## Open items carried forward

1. **Domain-layer English in the Spanish interface.** With ES selected, eight provenance rationales
   on the verdict screen (`.prov__why` — *"Text on an image. A forger sets any amount."*, *"Written
   by the ledger, not by the sending device…"*, and six more) and the security panel's risk band
   (`Low risk · 12/100`) still render English. They come from `rationale` fields in
   `src/domain/receipt.ts` and from `api/session/handshake.json`, both named in the mechanical
   invariant. Translating them in the component layer would avoid the invariant entirely — the
   technique used for the chip labels applies unchanged — but needs sixteen Spanish strings the copy
   lock does not contain, and inventing them is forbidden. Reported at gate-2 and assigned to the
   parking lot. This is the difference between D-S5-2's exit sentence, which asks for no English
   anywhere, and success criterion 3, which enumerates the mast, the chips and the title — the
   enumerated set is closed.
2. **The tracked root `index.html`.** A committed build artifact referencing hashed bundles that
   `.gitignore` excludes, rewritten by every local build and overwritten by CI at deploy time.
   Deliberately left alone; logged again here because anyone building locally will see it appear as
   a modification.
3. **The README's "shareable URL" claim.** A shared step URL lands the recipient on `idle`.
   Excluded by scope, unchanged.
4. **`readStoredLang()` defaults to `EN` while the designops site defaults to `ES`.** Out of scope
   for this run; the two properties disagree on first visit until one is chosen.
5. **`mast_kicker` length.** The locked Spanish is 24% longer than the English (21 → 26 characters).
   Measured in the browser: it renders on a single line at the same 13px height as the English, so
   no CSS adjustment was needed. Flagged as the copy lock asked, and closed.

---

## What this run did not do

It did not merge the pull request. It did not author a word of Spanish. It did not touch the
verification core, the router's one-way binding, the cold-load return to the entry screen, the
tracked root `index.html`, or `readStoredLang()`'s default. It added no dependency, no i18n library,
no bundler and no test framework.
