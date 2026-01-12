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

Mapa de testes: `tests/TEST_MAP.md`
E2E real usa Playwright e pode exigir `npx playwright install`.

Cobertura principal:
- P0: browser basico + falha controlada
- P1: SQL evidence (HTML, metadados simples, expectRows)
- P2: contexto, exports, ordem/encadeamento
- P3: validacao OpenAPI
- P4: retries CloudWatch
- P5: CLI (pipeline, heuristicas de erro, redacao, exports)

Status do backlog (versao estavel):
- OK: P0, P1, P2, P3, P4, P5.1, P5.2, P5.3, P5.4, P5.5

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
- `query.sql`, `result.csv`, `evidence.html`

Swagger e CLI adicionam:
- `evidence.html`

## 8) Exemplo CLI (sem browser)

Executa um comando simples e gera stdout/stderr como artefatos.

```
npm start -- --plan examples/cli/plan.json --out runs
```

Saida esperada:
- `runs/<runId>/steps/01_cli-echo/stdout.txt`
- `runs/<runId>/steps/01_cli-echo/stderr.txt`
- `runs/<runId>/steps/01_cli-echo/metadata.json`

## 9) Exemplo CLI com fluxo de arquivos

Fluxo:
- baixa um arquivo local para a pasta de trabalho
- transforma o conteudo e exporta `rowCount`
- apaga o arquivo transformado e exporta `payload`
- usa `payload` no step final para gerar `final.txt`

```
npm start -- --plan examples/cli-flow/plan.json --out runs
```

Artefatos:
- `runs/<runId>/steps/01_cli-get-file/stdout.txt`
- `runs/<runId>/steps/02_cli-transform/stdout.txt`
- `runs/<runId>/steps/03_cli-delete-pass/stdout.txt`
- `runs/<runId>/steps/04_cli-use-payload/stdout.txt`
- `examples/cli-flow/work/final.txt`

## 10) Problemas comuns

- "spawn EPERM": execute com permissao elevada.
- Timeout no Swagger UI: a UI pode variar; prefira o plano JSONPlaceholder para response detalhado.
- Falha por `requires`: indica que a ordem do plano nao satisfaz as dependencias do contexto.

## 11) GET -> SQLite -> filtro por data

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

## 12) JSONPlaceholder -> SQLite -> Search

Fluxo:
- GET no JSONPlaceholder
- CloudWatch stand-in com retries
- CLI cria arquivo JSON, apaga e repassa payload
- CLI atualiza o SQLite
- SQL evidence valida os dados
- busca em site publico usando o output do SQLite

Rodar:
```
npm start -- --plan examples/jsonplaceholder-sqlite/plan.json --out runs
```

## 13) Extensao do app (novo padrao)

O projeto agora segue separacao por dominios:
- `src/core/`: orquestracao e tipos compartilhados
- `src/domains/browser/`: Playwright, behaviors e steps baseados em browser
- `src/domains/api/`: Swagger/OpenAPI
- `src/domains/sql/`: SQL evidence

Para estender:
1) Crie o executor no dominio certo.
2) Registre o tipo/config em `src/core/types.ts`.
3) Encadeie no `src/core/runner.ts`.
4) Adicione testes `tests/pX-*.spec.ts`.
5) Documente o fluxo no `README.md`/`HOWTO.md`.
