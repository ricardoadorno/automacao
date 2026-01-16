# Criar plans do zero

## Quando usar
Use este guia para criar um plan novo do zero, estruturado e pronto para rodar.

## Onde colocar o plan

- `scenarios/`: fluxos reais, usados no dia a dia.
- `examples/`: demonstracoes e guias curtos.

Estrutura recomendada:

```
scenarios/<slug-do-plan>/
  README.md
  plan.json
  behaviors.json (se houver browser)
  request.curl (se houver api)
  queries/ (se houver sql)
  assets/ (opcional)
```

## Estrutura minima

```json
{
  "metadata": {
    "feature": "minha-feature",
    "ticket": "ABC-123",
    "env": "local"
  },
  "steps": [
    { "id": "api", "type": "api" }
  ]
}
```

## Passo a passo

1) Crie uma pasta em `scenarios/` (fluxo real) ou `examples/` (demo).
2) Crie o `plan.json` com `metadata` e `steps`.
3) Declare `behaviorsPath` e `curlPath` se houver browser ou api.
4) Se for browser, crie `behaviors.json`.
5) Se for API, crie um arquivo `.curl` e use `request` no step.
5) Rode:
   - `npm start -- --plan scenarios/seu-plan/plan.json --out runs`

## Caminhos relativos

- Sempre use caminhos a partir da raiz do repo.
- Exemplo: `scenarios/cadastro/request.curl`.
- Evite paths absolutos (falham em outros ambientes).

## Template completo

```json
{
  "metadata": {
    "feature": "cadastro-usuario",
    "ticket": "CAD-001",
    "env": "local"
  },
  "behaviorsPath": "behaviors.json",
  "curlPath": "request.curl",
  "inputs": {
    "defaults": { "baseUrl": "https://example.com" },
    "envPrefix": "AUTO_"
  },
  "steps": [
    {
      "id": "create-user",
      "type": "api",
      "request": "scenarios/cadastro-usuario/request.curl"
    },
    {
      "id": "check-user",
      "type": "sqlEvidence",
      "config": {
        "sql": {
          "adapter": "sqlite",
          "dbPath": "sample.db",
          "queryPath": "queries/user.sql"
        }
      }
    },
    {
      "id": "ui-check",
      "type": "browser",
      "behaviorId": "login"
    }
  ]
}
```

## Fields importantes em steps

- `id`: unico e curto.
- `type`: `api`, `sqlEvidence`, `browser`, `cli`, `specialist`.
- `label`: nome amigavel para o dashboard.
- `requires`: chaves de contexto obrigatorias.
- `exports`: campos exportados para o contexto global.

Veja detalhes completos em `docs/howto/steps.md`.

## Checklist de qualidade

- Definir `feature`, `ticket` e `env`.
- Nomear steps com `id` curto e claro.
- Usar `requires` para dependencias de contexto.
- Validar outputs no dashboard.
- Adicionar README do plan com pre-requisitos e resultado esperado.

## Dicas

- Evite usar paths absolutos.
- Coloque os assets no mesmo diretorio do plan.
- Documente cada exemplo com um `README.md` local.
- Se o plan usa loop, explique o formato de `inputs.items`.
