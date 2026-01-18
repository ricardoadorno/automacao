# Onda 08 - Dominios, especialista e massa de testes

Data: 2026-01-15

## Objetivo
- Solidificar limites de dominios.
- Introduzir o dominio especialista para tarefas simples e recorrentes.
- Ampliar massa de testes e exemplos base.

## Decisoes
- Novo step `specialist` com tarefa `writeFile`.
- Documentacao de dominios em `docs/DOMAINS.md`.
- Exemplo quickstart para demonstrar CLI + specialist.

## O que foi feito
- `src/core/types.ts`
  - Adicionado `specialist` em StepType e config.
- `src/domains/specialist/specialist.ts`
  - Implementado `writeFile`.
- `src/core/runner.ts`
  - Execucao do step `specialist` e artifact `file`.
- `docs/DOMAINS.md` e `src/domains/README.md`
  - Limites de dominios.
- `examples/quickstart/`
  - Plano simples com CLI + specialist.
- `tests/TEST_MAP.md`
  - Atualizado com novos testes.
- `tests/p2-specialist.spec.ts`
  - Teste do step specialist.

## Como usar
```json
{
  "steps": [
    {
      "id": "write-file",
      "type": "specialist",
      "config": {
        "specialist": {
          "task": "writeFile",
          "outputPath": "note.txt",
          "content": "run {{runId}}"
        }
      }
    }
  ]
}
```

## Observacoes
- `outputPath` relativo grava dentro da pasta do step.
- Para `outputPath` absoluto, o artifact nao aparece no index de run.
