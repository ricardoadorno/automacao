# UI Artifact Reference

Use `UI.md` (repo root) as the single source for tokens, component HTML/CSS, and layout examples. Focus on:

- `:root { ... }` variables for colors, typography, spacing, radius, shadows.
- BEM-like component classes (`.btn`, `.card`, `.badge`, `.modal`, etc).
- Layout examples (topbar, sidebar, grids, modals) for fidelity checks.

Ignore duplicated Tailwind configs in `UI.md`. Keep a single token source in `src/styles/tokens.css` and map any utility usage to CSS variables.

## Tokens from UI.md

- Colors: `--color-primary`, `--color-primary-hover`, `--color-navy`, `--color-navy-dark`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text-main`, `--color-text-secondary`, `--color-success`, `--color-error`, `--color-warning`
- Typography: `--font-family`, `--font-size-h1`, `--font-size-h2`, `--font-size-body`, `--font-size-small`, `--font-weight-bold`, `--font-weight-regular`
- Spacing: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
- Radius and shadow: `--radius-md`, `--radius-sm`, `--shadow-subtle`, `--shadow-modal`

## Component selectors in UI.md

- Buttons: `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`
- Card: `.card`, `.card__header`, `.card__title`, `.card__body`, `.card__footer`
- Badge: `.badge`, `.badge--success`, `.badge--error`
- Layout: `.app-layout`, topbar, sidebar, grids, modals (see the assembled screen section)

## Non-token hex values used in snippets

- Disabled button: `#EEE`, `#AAA`
- Secondary hover: `#FAFAFA`
- Badge backgrounds: `#E8F5E9`, `#FFEBEE`

Prefer mapping these to derived tokens if the app needs stricter token-only enforcement, but keep visual fidelity to UI.md.
