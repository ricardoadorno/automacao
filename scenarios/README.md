# Scenarios

Planos reais e fluxos maiores usados como referencia principal no dashboard.

## Como usar

- `npm start -- --plan scenarios/full-flow/plan.json --out runs`

## Scenarios disponiveis

### full-flow
- Caminho: `scenarios/full-flow/plan.json`
- O que faz: loop de API + SQL evidence + browser.
- Preparar: `node scenarios/full-flow/init-db.js`

### inputs-exports
- Caminho: `scenarios/inputs-exports/plan.json`
- O que faz: inputs, exports e requires.

## Dicas

- Use o dashboard na aba Scenarios para executar.
- Mantenha credenciais fora do repositorio.
