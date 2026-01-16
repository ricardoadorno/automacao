# Onda 06 - Fluxo do browser (sessao reutilizada)

Data: 2026-01-15

## Objetivo
- Evitar abrir/fechar o browser a cada step quando nao necessario.
- Tornar o fluxo mais unificado para steps sequenciais.

## Decisoes
- `browser.reuseSession` e opt-in no plan.
- Quando ativo, a sessao e criada uma vez por run e reutilizada nos steps browser.
- Em caso de erro, o comportamento de retry permanece dentro do step.

## O que foi feito
- `src/core/types.ts`
  - Adicionado `browser.reuseSession`.
- `src/domains/browser/browser.ts`
  - Nova funcao `executeBrowserStepWithSession` que reutiliza a sessao.
- `src/core/runner.ts`
  - Cria e fecha uma sessao compartilhada quando `reuseSession` esta ativo.
- `HOWTO.md`
  - Exemplo de uso de `reuseSession`.
- `tests/p2-browser-reuse.spec.ts`
  - Teste de escolha da sessao compartilhada.

## Como usar
```json
{
  "browser": { "reuseSession": true }
}
```

## Observacoes
- Se `reuseSession` estiver ativo, as paginas podem manter estado entre steps.
- Use com cuidado quando o step depende de estado limpo.
