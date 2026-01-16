# Inputs + exports

## Como rodar

- `npm start -- --plan scenarios/inputs-exports/plan.json --out runs`

## O que esperar

- Step 1: CLI gera token e exporta para o contexto.
- Step 2: Specialist escreve um arquivo usando inputs + token.
- Step 3: Browser roda com `requires` validando contexto.

## Variaveis de ambiente

- `AUTO_NAME=dev` substitui o `name` em runtime.

## O que ilustra

- Inputs defaults/overrides/env
- Exports via stdout
- Requires para dependencias
