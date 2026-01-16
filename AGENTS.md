# Repository Guidelines

This guide describes how to work in this repository. Keep changes small, follow the structure, and add tests for new behavior.

## Project Structure & Module Organization

- `src/`: TypeScript source code (runner, steps, helpers).
- `frontend/`: React dashboard (Vite build).
- `tests/`: Vitest tests, named by priority (`p0-*.spec.ts`, `p1-*.spec.ts`, etc.).
- `README.md`: product and TDD roadmap.
- `scenarios/`: real-world plans and flows (primary).
- `examples/`: demo plans and quick references.
- `docs/howto/`: end-user documentation and guides.
- `docs/decisions/`: implementation decisions.
- `package.json`, `tsconfig.json`: build and runtime configuration.
- `scripts/`: dashboard server and auxiliary tooling.

## Build, Test, and Development Commands

- `npm start -- --plan path/to/plan.json --out runs`
  - Compiles TypeScript and runs the CLI executor.
- `npm run dashboard`
  - Starts the GUI dashboard for running plans and browsing results.
- `npm --prefix frontend run build`
  - Builds the React dashboard into `public/dashboard`.
- `npm test`
  - Runs Vitest in node mode.

Example plan run:
```
npm start -- --plan scenarios/full-flow/plan.json --out runs
```

## Coding Style & Naming Conventions

- Language: TypeScript, CommonJS output.
- Indentation: 2 spaces.
- Filenames: kebab-case for tests (example: `tests/p2-context.spec.ts`).
- Functions and variables: `camelCase`.
- Types and interfaces: `PascalCase`.
- Keep comments minimal and only for non-obvious logic.

## Testing Guidelines

- Framework: Vitest (node environment).
- Test naming: `tests/<priority>-<topic>.spec.ts`.
- Cover business rules (e.g., failPolicy, exports, SQL evidence).
- Use mocks for Playwright to keep tests fast and deterministic.
- Update dashboard e2e tests when UI selectors change.

Run all tests:
```
npm test
```

## Commit & Pull Request Guidelines

- No commit message convention is defined in this repository. Use clear, imperative messages (example: "Add SQL evidence hashes").
- PRs should include:
  - A short summary of changes
  - Related issue or ticket (if applicable)
  - Test results (command + outcome)

## Security & Configuration Tips

- Plans and behaviors are JSON files; keep them under version control where possible.
- SQL evidence uses files (mock) by default; do not add live DB credentials to the repo.
