# Cache basic

## Como rodar

1) Primeira execucao (gera cache):
   - `npm start -- --plan examples/cache-basic/plan.json --out runs`

2) Segunda execucao (cache hit):
   - `npm start -- --plan examples/cache-basic/plan.json --out runs`

## O que esperar

- No segundo run, o step deve aparecer como `SKIPPED` com `cache hit`.
- Os artefatos sao restaurados a partir do cache.

## Limpar cache

- Remova `.cache/steps` para forcar reexecucao.
