# handoff/v2 — the language toggle and the Spanish interface

Deploy `P-CC-S5B-ESToggleFix-v1_0`, 01 Sep 2026. Closes the two defects that held freeze condition
B2's Spanish clause false: the `EN | ES` toggle did nothing when activated, and the mast header, the
four sample chip labels and the document title stayed English while the rest of the interface was
Spanish.

| Document | What it holds |
|---|---|
| [PLAN-P-CC-S5B-ESToggleFix-v1_0.md](PLAN-P-CC-S5B-ESToggleFix-v1_0.md) | The plan as approved, with the diagnosis and the approved fix filled into the slot left open for the gate. |
| [COMPLETION-REPORT-P-CC-S5B-ESToggleFix-v1_0.md](COMPLETION-REPORT-P-CC-S5B-ESToggleFix-v1_0.md) | Outcome, commit list, criteria table with evidence, deviations, decisions, and the open items carried forward. |

**The finding, in one line:** `.mast__kicker`'s `opacity: 0.82` promoted it into the same painting
step as the absolutely positioned `.langtoggle`, where later DOM order wins — so the kicker's
paragraph box lay over the toggle and swallowed every click. The buttons were never broken, and were
operable by keyboard the whole time. `z-index: 1` on `.langtoggle` closes it, changing no pixel.

Nine commits on `deploy/v2-es-toggle-fix`, plus this archive. Suite 45 → 52. Pull request #1, opened
against `main` and left unmerged.
