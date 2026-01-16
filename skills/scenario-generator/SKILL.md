---
name: scenario-generator
description: Generate automation scenarios from natural-language requests by drafting `scenarios/<name>/plan.json` plus supporting files (behaviors, curl, SQL mocks). Use when a user asks to create or update a scenario or wants a plan built from requirements in plain Portuguese.
---

# Scenario Generator

Crie planos de execucao (scenarios) a partir de pedidos em linguagem natural. Gere o `plan.json` e os arquivos de apoio (behaviors, curl, SQL mock) seguindo o padrao do repositorio.

## Entrada minima a confirmar

- Nome da feature, ticket e ambiente (metadata).
- Quais evidencias sao esperadas (browser, api, sql, cli, specialist, logstream).
- Dependencias externas (endpoints, arquivos, credenciais) e se devem ser mockadas.
- Ordem do fluxo e regras de export/require entre steps.

Se faltar informacao critica, faca 1-2 perguntas objetivas e siga.

## Onde pesquisar primeiro

Leia `references/paths.md` para a lista de arquivos do repo e padroes de busca.

1) Reaproveitar padroes existentes:
   - `scenarios/` e `examples/` para planos similares
   - `docs/howto/steps.md` e `docs/howto/create-plans.md` para formato
   - `docs/howto/browser-behaviors.md` para actions Playwright
   - `docs/howto/inputs-context.md` para exports/requires
2) Usar `rg --files` para localizar `plan.json`, `behaviors.json`, `.curl`, `.sql`, `.csv`.

## Fluxo de trabalho recomendado

1) Resumir o pedido do usuario em steps declarativos.
2) Mapear cada step para o dominio correto:
   - `browser`, `api`, `sqlEvidence`, `cli`, `specialist`, `logstream`
3) Definir estrutura de pasta:
   - `scenarios/<slug>/plan.json`
   - `scenarios/<slug>/behaviors.json` (se houver browser)
   - `scenarios/<slug>/requests/*.curl` (se houver api)
   - `scenarios/<slug>/sql/*.sql` e `scenarios/<slug>/sql/*.csv` (se houver sqlEvidence)
4) Escrever `plan.json` com metadata, steps e referencias de arquivos.
5) Aplicar exports/requires para encadear dados.
6) Validar rapidamente com `npm start -- --plan <path> --out runs`.

## Modelo base de plan.json

```json
{
  "metadata": { "feature": "minha-feature", "ticket": "ABC-123", "env": "local" },
  "behaviorsPath": "behaviors.json",
  "curlPath": "requests/requests.curl",
  "steps": [
    { "id": "login", "type": "browser", "behaviorId": "login" },
    {
      "id": "get-itens",
      "type": "api",
      "exports": {
        "itemId": { "source": "responseData", "jsonPath": "items[0].id" }
      }
    },
    {
      "id": "sql-count",
      "type": "sqlEvidence",
      "config": {
        "sql": {
          "queryPath": "sql/count.sql",
          "resultPath": "sql/count.csv",
          "expectRows": 1
        }
      }
    }
  ]
}
```

## Behaviors (browser)

- Sempre nomear `behaviorId` conforme o objetivo do step.
- Preferir actions declarativas (click, fill, waitForResponse, waitForRequest).
- Evitar waits arbitrarios; usar `waitForRequest`/`waitForResponse` quando houver eventos de API.

Exemplo de trecho:

```json
{
  "behaviors": {
    "login": {
      "actions": [
        { "type": "goto", "url": "https://app.exemplo.com" },
        { "type": "fill", "selector": "#email", "text": "{userEmail}" },
        { "type": "click", "selector": "button[type=submit]" },
        { "type": "waitForResponse", "url": "/api/session", "status": 200 }
      ]
    }
  }
}
```

## SQL evidence

- Use arquivos mock por padrao: `query.sql` e `result.csv`.
- Configure `expectRows` quando o resultado precisa validar quantidade.

## Curl (API)

- Centralize chamadas em `.curl` e use `curlPath` no plan.
- Use placeholders `{{variavel}}` no curl e exports no step `api`.

## Checklist de entrega

- `plan.json` com steps em ordem e metadata completa.
- Arquivos auxiliares criados e referenciados corretamente.
- `exports` e `requires` coerentes.
- `npm start -- --plan <path> --out runs` executa sem erro de schema.

## Regras e limites

- Nao adicionar credenciais reais no repo.
- Preferir mocks para SQL e API quando nao houver ambiente real.
- Manter comentarios minimos e arquivos em ASCII.
