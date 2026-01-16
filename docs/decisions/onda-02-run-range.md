# Onda 02 - Execucao parcial por range (CLI/API/GUI)

Data: 2026-01-15

## Objetivo
- Permitir executar apenas um intervalo de steps sem alterar a numeracao do plan.
- Expor o range na API, na CLI e na GUI.

## Decisoes
- Range e 1-based e validado contra o total de steps do plan.
- Steps fora do range nao sao executados e nao entram no summary.
- A numeracao do step segue o indice original do plan (ex: step 02 gera pasta 02_*).

## O que foi feito
- `src/core/runner.ts`
  - `executePlan` agora aceita `{ fromStep, toStep }`.
  - Validacao de range com erros claros.
  - Loop ignora steps fora do intervalo.
- `src/index.ts`
  - CLI aceita `--from` e `--to`.
- `scripts/dashboard.js`
  - `/api/run` aceita `fromStep` e `toStep` e valida range.
  - Flags sao repassadas para o `npm start`.
- Frontend React (`frontend/`)
  - Inputs de range nos cards de plan.
  - Range enviado ao executar.
- `HOWTO.md`
  - Exemplo de uso de range na CLI.

## Como usar
- CLI:
  - `npm start -- --plan examples/api/plan.json --out runs --from 2 --to 4`
- Dashboard:
  - Abrir `http://localhost:3000`
  - No card do plan, preencher From/To e clicar em Run.

## Observacoes
- Se o range for invalido (ex: 0 ou maior que total), a API retorna erro.
- Se `fromStep` ou `toStep` estiver vazio, o valor e assumido automaticamente.
