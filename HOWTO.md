# HOWTO

Guia rapido para rodar, testar e entender os cenarios disponiveis.

## 1) Instalar browsers do Playwright

Necessario para screenshots reais.

```
npx playwright install
```

Se aparecer "spawn EPERM", rode o terminal com permissao elevada.

## 2) Testes automatizados (Vitest)

Rodar todos os testes:

```
npm test
```

Cobertura principal:
- P0: browser basico + falha controlada
- P1: SQL evidence (hashes, HTML, expectRows)
- P2: contexto, exports, ordem/encadeamento
- P3: validacao OpenAPI
- P4: retries CloudWatch

## 3) Exemplo mock local (sem internet)

Usa data URLs e arquivos mock.

```
npm start -- --plan examples/plan.json --out runs
```

Saida: `runs/<runId>/index.html`

## 4) Exemplo com sites reais (prints simples)

```
npm start -- --plan examples/real/plan.json --out runs
```

Inclui Swagger UI real (Petstore) e um stand-in de CloudWatch.

## 5) JSONPlaceholder com payload/response

Faz GET direto no JSONPlaceholder e captura o response.

```
npm start -- --plan examples/jsonplaceholder/plan.json --out runs
```

O response eh capturado por `responseSelector: "body"` e aparece no `metadata.json` do step.

## 6) Cenarios de ordem (sequencias diferentes)

Planos prontos para validar encadeamento e ordem:

SQL -> POST -> CloudWatch:
```
npm start -- --plan examples/order/plan-sql-post-cloudwatch.json --out runs
```

Swagger GET -> CloudWatch:
```
npm start -- --plan examples/order/plan-swagger-get-cloudwatch.json --out runs
```

CloudWatch antes do Swagger (deve falhar cedo por requires):
```
npm start -- --plan examples/order/plan-cloudwatch-before-swagger.json --out runs
```

## 7) Onde ver os artefatos

Para cada run:
- `runs/<runId>/index.html` (com links para artifacts)
- `runs/<runId>/steps/<nn_stepId>/metadata.json`
- `runs/<runId>/steps/<nn_stepId>/screenshot.png`

SQL evidence adiciona:
- `query.sql`, `result.csv/json`, `evidence.html`, `hashes.json`

## 8) Problemas comuns

- "spawn EPERM": execute com permissao elevada.
- Timeout no Swagger UI: a UI pode variar; prefira o plano JSONPlaceholder para response detalhado.
- Falha por `requires`: indica que a ordem do plano nao satisfaz as dependencias do contexto.

## 9) GET -> SQLite -> filtro por data

Fluxo:
- GET no JSONPlaceholder via Swagger UI
- exporta `todoId`
- SELECT no SQLite usando `{todoId}`
- abre um site com filtro por data usando `{startedAt}`

Preparar o banco:
```
node examples/sqlite/init-db.js
```

Rodar:
```
npm start -- --plan examples/sqlite/plan.json --out runs
```
