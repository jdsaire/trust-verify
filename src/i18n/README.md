# src/i18n/

EN/ES language toggle for the app's 8 screen components.

- `translations.ts` — flat key → `{ EN, ES }` table. One entry per hardcoded UI string, including
  strings that already read as Spanish (receipt-field labels like "Monto") — the toggle controls
  those too, rather than assuming they're already done in one language.
- `LangContext.tsx` — `LangProvider`, `useLang()`. Persists the choice to `localStorage` under
  `jds-lang`, the same key designops' own `assets/js/core/i18n.js` engine uses, so the language
  choice is consistent if someone visits both.
- `LangToggle.tsx` — the EN/ES control in the page header.
- `sampleTitles.ts` — sample id → translation key for the four entry-screen chip labels.

Domain-layer strings in `src/domain/verdict.ts` and `src/domain/receipt.ts` are deliberately out of
scope — that layer carries over unchanged from the source app.

The four sample receipts in `src/domain/samples.ts` are a different case. Their chip labels are
presentation, and an English chip inside a Spanish interface is a visible gap, so the labels are
translated — but in the component layer, not in the domain: `EntryScreen` maps a sample's stable
`id` to a translation key through `sampleTitles.ts`. `src/domain/` keeps its fixture data, and
still carries no React, no network and no i18n import, which is what makes it directly testable.
The `title` field remains on each sample as the source of the English wording; it is no longer
what gets rendered.
