# Onda 04 - Cache de passos

Data: 2026-01-15

## Objetivo
- Evitar reexecucao quando o step e seus insumos nao mudaram.
- Marcar visualmente quando um step foi pulado por cache.

## Decisoes
- Cache e opt-in via `plan.cache.enabled`.
- Cache e aplicado a todos os steps por padrao, com opt-out via `step.cache: false`.
- Chave de cache usa o step resolvido + artifacts relevantes (curl/SQL/behavior).
- Cache hit marca o step como SKIPPED com `notes: "cache hit"`.

## O que foi feito
- `src/core/types.ts`
  - Adicionado `plan.cache` e `step.cache`.
- `src/core/runner.ts`
  - Hash estavel para decidir cache hit/miss.
  - Persistencia em `.cache/steps` (ou dir custom) com artifacts e outputs.
  - Aplicacao de exports mesmo quando o step e pulado por cache.
  - Log de cache hit no console.
- `scripts/dashboard.js`
  - Contagem de cache hits em `/api/runs`.
- Frontend React (`frontend/`)
  - Exibe cache hits na lista de runs.
- `.gitignore`
  - Ignora `.cache/`.
- `HOWTO.md`
  - Como habilitar/desabilitar cache.
- `tests/p2-cache.spec.ts`
  - Teste basico de cache hit.

## Como usar
- Ative no plan:
  ```json
  {
    "cache": { "enabled": true, "dir": ".cache/steps" }
  }
  ```
- Desative para um step:
  ```json
  { "id": "step-1", "type": "api", "cache": false }
  ```

## Observacoes
- A chave de cache inclui conteudo de curl, queries SQL e actions de behavior.
- Cache hit preserva exports para steps seguintes.
- Se artifacts mudarem fora da execucao, limpe `.cache/steps` manualmente.
