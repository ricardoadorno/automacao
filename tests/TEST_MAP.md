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
- ordem e encadeamento (SQL -> Swagger -> CloudWatch): `tests/p2-order.spec.ts`
- exports via responseText/stdout/stderr: `tests/p2-exports.spec.ts`
- e2e flow (CLI pipeline -> SQL -> browser): `tests/p2-e2e.spec.ts`

## P3 - OpenAPI integrado com Swagger UI
- valida operationId + response capture: `tests/p3-openapi.spec.ts`
- evidencia HTML do Swagger (snapshot): `tests/p3-evidence.spec.ts`

## P4 - CloudWatch robusto
- retries e attempts: `tests/p4-cloudwatch.spec.ts`

## P5 - CLI runner
- comando simples + logs + evidence: `tests/p5-cli.spec.ts`
- exports por stdout/stderr: `tests/p2-exports.spec.ts`
- pipeline pre/script/post: `tests/p5-cli.spec.ts`
- heuristica de erro + successCriteria: `tests/p5-cli.spec.ts`
- redacao de segredos + validacao AWS: `tests/p5-cli.spec.ts`
- evidencia HTML do CLI (snapshot): `tests/p3-evidence.spec.ts`
