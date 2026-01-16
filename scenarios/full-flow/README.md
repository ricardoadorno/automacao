# Full flow

## Como preparar

- `node scenarios/full-flow/init-db.js`

## Como rodar

- `npm start -- --plan scenarios/full-flow/plan.json --out runs`

## O que esperar

- Step 1: API loop para `alpha` e `beta`.
- Step 2: SQL evidence com total de items.
- Step 3: Browser com screenshot.

## O que ilustra

- Loop de items
- SQLite + evidence
- Browser com reuseSession
