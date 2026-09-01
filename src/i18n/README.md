# src/i18n/

EN/ES language toggle for the app's 8 screen components.

- `translations.ts` — flat key → `{ EN, ES }` table. One entry per hardcoded UI string, including
  strings that already read as Spanish (receipt-field labels like "Monto") — the toggle controls
  those too, rather than assuming they're already done in one language.
- `LangContext.tsx` — `LangProvider`, `useLang()`. Persists the choice to `localStorage` under
  `jds-lang`, the same key designops' own `assets/js/core/i18n.js` engine uses, so the language
  choice is consistent if someone visits both.
- `LangToggle.tsx` — the EN/ES control in the page header.

Domain-layer strings (`src/domain/verdict.ts`, `src/domain/receipt.ts`) are deliberately out of
scope — that layer carries over unchanged from the source app.
