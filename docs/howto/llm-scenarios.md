# LLM: Como criar scenarios

Este guia serve para LLMs gerarem novos cenarios de forma consistente com o repositorio. Use este documento como checklist antes de criar arquivos.

## Objetivo

- Criar cenarios reais (fluxos de negocio) em `scenarios/`.
- Manter planos previsiveis, testaveis e fáceis de entender.
- Reaproveitar behaviors, curls, queries e assets existentes quando fizer sentido.

## Estrutura obrigatoria

Cada cenario deve ter uma pasta propria:

```
scenarios/<slug-do-cenario>/
  README.md
  plan.json
  behaviors.json (se houver steps browser)
  request.curl (se houver steps api com curl)
  query.sql / result.csv (se houver sqlEvidence)
  assets/ (opcional)
```

## Checklist minimo

- O nome da pasta e arquivos estao em kebab-case.
- `README.md` explica objetivo, pre-requisitos, como rodar e o que esperar nos resultados.
- `plan.json` referencia caminhos relativos a partir da raiz do repo.
- Steps tem `id` unico e `type` correto.
- Sem credenciais reais ou URLs privadas.

## Guia do plan.json (essencial)

Campos principais:

- `name`: nome do cenario.
- `description`: resumo curto do fluxo.
- `failPolicy`: `stop` ou `continue`.
- `cache`: `on` ou `off`.
- `inputs`: valores default e itens para loops.
- `steps`: lista ordenada de steps.

Exemplo base:

```json
{
  "name": "Onboarding de Cliente",
  "description": "Gera lead, valida e salva evidencias.",
  "failPolicy": "stop",
  "cache": "off",
  "inputs": {
    "defaults": {
      "env": "local"
    },
    "items": []
  },
  "steps": [
    { "id": "step-1", "type": "api", "label": "Criar lead", "request": "scenarios/onboarding/request.curl" }
  ]
}
```

## Tipos de step e arquivos esperados

- `api`: use `request` com caminho `.curl` (ex: `scenarios/<slug>/request.curl`).
- `browser`: use `behavior` com `behaviors.json`.
- `sqlEvidence`: use `query` e `result` com `.sql` e `.csv`.
- `cli`: use `command` e `args` simples.
- `specialist`: use `action` para tarefas internas (ex: escrever arquivo).

Veja detalhes em `docs/howto/steps.md`.

## Inputs e contexto

- Defina `inputs.defaults` com chaves simples (ex: `env`, `baseUrl`).
- Use `inputs.items` quando quiser loop por item.
- Use placeholders `{{chave}}` nos steps para consumir o contexto.
- Exporte valores em steps (ex: de SQL ou API) para usar depois.

Veja `docs/howto/inputs-context.md` e `docs/howto/selection.md`.

## Loops e selecao de steps

- Se o cenario tem loop, explique no `README.md` quais campos sao usados.
- Os steps devem funcionar mesmo com `selectedSteps` (execucao parcial).

Veja `docs/howto/selection.md`.

## Cache e evidencia

- Se o fluxo depende de evidencia, inclua `sqlEvidence` e descreva a expectativa.
- Para cache, evite dados que mudam a cada execucao se o objetivo e demonstrar cache.

Veja `docs/howto/cache.md` e `docs/howto/evidence.md`.

## README do cenario (modelo)

```md
# <Nome do cenario>

Resumo do objetivo do fluxo.

## Pre-requisitos
- Lista curta, ex: acesso a um endpoint mock.

## Como rodar
```
npm start -- --plan scenarios/<slug>/plan.json --out runs
```

## O que esperar
- O que a execucao cria em runs.
- O que deve aparecer nos logs ou evidencias.
```
```

## Regras de qualidade (para LLMs)

- Evite steps "inventados" sem suporte no runner.
- Use paths reais e consistentes (`scenarios/...`).
- Prefira exemplos pequenos e reais a fluxos gigantes.
- Nenhum asset deve depender de rede externa real.
- Sempre atualize `scenarios/README.md` com o novo cenario.

