# Comecar rapido

## Quando usar
Use este passo a passo para rodar um plan real pela primeira vez e entender onde ficam os resultados.

## Pre-requisitos

- Node.js LTS instalado.
- Dependencias do projeto instaladas via `npm install`.

## Passo a passo

1) Instale dependencias:
   - `npm install`

2) Rode um plan (cenarios ou examples):
   - `npm start -- --plan scenarios/full-flow/plan.json --out runs`
   - `npm start -- --plan examples/quickstart/plan.json --out runs`

3) Encontre o run gerado:
   - `runs/<runId>/index.html`

4) Abra o dashboard:
   - `npm run dashboard`
   - `http://localhost:3000`

## O que esperar

- Um novo diretorio em `runs/` com artefatos.
- Logs no terminal indicando o inicio e o fim de cada step.
- Evidencias HTML e screenshots quando aplicavel.

## Verificando o resultado

- Abra `runs/<runId>/index.html`.
- Clique nos artefatos do step para ver a evidencia.
- Confira `00_runSummary.json` para status e metadados.

## Executar pelo dashboard

1) `npm run dashboard`
2) Abra `http://localhost:3000`
3) Em Plans, clique em **Run selected steps** ou marque steps especificos.

## Dica para primeira execucao

- Use um example simples primeiro (`examples/quickstart/plan.json`).
- Depois rode um scenario real para validar o fluxo principal.

## Scenarios e examples relacionados

- `scenarios/full-flow/plan.json`
- `examples/quickstart/plan.json`

## Dicas

- Se aparecer `spawn EPERM`, rode o terminal como admin.
- Para testes de browser, instale os browsers:
  - `npx playwright install`
