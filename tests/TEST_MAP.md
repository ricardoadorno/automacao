# Test Map

This file maps backlog goals to automated tests.

## P0 - sistema minimo funcionando
- P0.1 run + artifacts + index: `tests/p0-browser.spec.ts`
- P0.2 falha controlada + error artifacts + failPolicy: `tests/p0-error.spec.ts`
- E2E real com Playwright: `tests/p0-e2e-real.spec.ts`

## P1 - SQL verificavel
- P1.0/P1.1 SQL por arquivos + evidence HTML + screenshot: `tests/p1-sql.spec.ts`
- P1.2 expectRows e diagnostico: `tests/p1-sql.spec.ts`
- SQLite adapter: `tests/p1-sqlite.spec.ts`

## P2 - variaveis e encadeamento
- exports/requires + placeholders: `tests/p2-context.spec.ts`
- ordem e encadeamento (SQL -> API -> Browser): `tests/p2-order.spec.ts`
- exports via responseText/stdout/stderr: `tests/p2-exports.spec.ts`
- e2e flow (CLI pipeline -> SQL -> browser): `tests/p2-e2e.spec.ts`
- captura com tiles horizontais: `tests/p2-browser-capture.spec.ts`
- execucao por range: `tests/p2-run-range.spec.ts`
- cache de steps: `tests/p2-cache.spec.ts`
- inputs (defaults/overrides/env): `tests/p2-inputs.spec.ts`
- loop de tarefas: `tests/p2-loop.spec.ts`
- browser reuseSession: `tests/p2-browser-reuse.spec.ts`
- specialist writeFile: `tests/p2-specialist.spec.ts`
- logstream evidence: `tests/p2-logstream.spec.ts`
- browser waitFor request/response: `tests/p2-browser-wait.spec.ts`
- dashboard e2e headless: `tests/p2-dashboard-e2e.spec.ts`

## P3 - API com Curl
- parse/interpolacao de curl + execucao: `tests/p2-api.spec.ts`
- evidencia HTML do API/CLI: `tests/p3-evidence.spec.ts`
- docs HTML/docx (relatorio): `tests/p3-docs.spec.ts`

## P4 - Browser robusto
- retries e attempts: `tests/p4-browser.spec.ts`

## P5 - CLI runner
- comando simples + logs + evidence: `tests/p5-cli.spec.ts`
- exports por stdout/stderr: `tests/p2-exports.spec.ts`
- pipeline pre/script/post: `tests/p5-cli.spec.ts`
- heuristica de erro + successCriteria: `tests/p5-cli.spec.ts`
- redacao de segredos + validacao AWS: `tests/p5-cli.spec.ts`
- evidencia HTML do CLI (snapshot): `tests/p3-evidence.spec.ts`
