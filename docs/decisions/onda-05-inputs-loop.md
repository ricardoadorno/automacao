# Onda 05 - Inputs e loop de tarefas

Data: 2026-01-15

## Objetivo
- Permitir customizar inputs por plan com defaults, overrides e env.
- Repetir steps para listas de inputs com relatorio por item.

## Decisoes
- Inputs seguem precedencia: env > plan (context + overrides) > defaults.
- Env usa prefixo configuravel (padrao: AUTO_).
- Loop pode usar `inputs.items` do plan ou `loop.items` no step.
- Cada iteracao gera um step separado com sufixo `__NN`.
- O loop adiciona `loopIndex`, `loopTotal` e `loopItem` nos outputs.

## O que foi feito
- `src/core/types.ts`
  - Adicionado `inputs` no plan e `loop` no step.
- `src/core/runner.ts`
  - Montagem do contexto com defaults/overrides/env.
  - Loop de steps com itens e ids unicos.
  - Suporte a logs por iteracao.
- `HOWTO.md`
  - Exemplos de inputs e loop.
- `tests/p2-inputs.spec.ts`
  - Verifica precedencia dos inputs.
- `tests/p2-loop.spec.ts`
  - Verifica execucao por item e ids dos steps.

## Como usar
- Inputs:
  ```json
  {
    "inputs": {
      "defaults": { "FOO": "base" },
      "overrides": { "FOO": "plan" },
      "envPrefix": "AUTO_"
    }
  }
  ```
- Loop por itens do plan:
  ```json
  {
    "inputs": { "items": [{ "item": "a" }, { "item": "b" }] },
    "steps": [{ "id": "step-loop", "type": "api", "loop": { "usePlanItems": true } }]
  }
  ```

## Observacoes
- Os itens sao convertidos para string no contexto.
- O cache considera o item do loop na chave de cache.
