# Diretrizes do projeto

Este README define o que o produto faz e como devemos implementar. Use como guia unico para decisoes de design, estrutura e backlog.

## 1) Objetivo do produto

Construir um executor de evidencias que le um plano declarativo e gera um pacote de evidencias por feature, com:

- evidencias de navegacao em browser (Front, Swagger UI, CloudWatch)
- evidencias de SQL por anexos (query + resultado) com print padronizado
- encadeamento entre steps por variaveis extraidas (id, correlationId, timestamps)
- modularidade por arquivos de configuracao (behaviors Playwright, selects SQL, OpenAPI)

## 2) Conceitos principais

### 2.1 Plano de evidencias

O plano descreve:

- metadata do run, feature, ticket, ambiente
- lista ordenada de steps
- referencias para configs externas: behaviors do Playwright, OpenAPI e SQL presets

O plano nao descreve cliques detalhados. Ele descreve intencao, dependencias e artefatos esperados.

### 2.2 Tipos de step

O agente deve suportar, no minimo:

- browser: executa um behavior Playwright e captura screenshots
- swagger: valida OpenAPI, executa behavior no Swagger UI, captura screenshots e pode extrair variaveis do response
- cloudwatch: step browser especializado com filtros e retries
- sqlEvidence: recebe query.sql + result.csv e gera evidencia verificavel com HTML renderizado, metadados simples e print
- cli: executa um comando local, grava stdout/stderr e metadados simples

Config basica por step (exemplos de campos):

- browser: behaviorId
- swagger: behaviorId, config.operationId ou config.path+config.method, config.responseSelector
- cloudwatch: behaviorId, config.retries, config.retryDelayMs
- sqlEvidence: config.sql.queryPath, config.sql.resultPath, config.sql.expectRows
- cli: config.cli.command, config.cli.args, config.cli.cwd, config.cli.timeoutMs

### 2.3 Contexto do run e variaveis

O agente mantem um objeto context em memoria durante a execucao do plano.

- cada step pode declarar exports (regras para extrair valores e publicar no contexto)
- cada step pode declarar requires (valores que precisam existir para executar)
- qualquer string de configuracao pode usar placeholders do contexto

Exemplos de placeholders:

- {pedidoId}
- {correlationId}
- {startedAt}

Export rules (exemplos):

- SQL: exports.pedidoId = { source: "sql", column: "id", row: 0 }
- Swagger: exports.pedidoId = { source: "responseText", regex: "\"id\":\"(\\w+)\"" }
- Swagger JSON: exports.pedidoId = { source: "responseText", jsonPath: "id" }
- CLI: exports.rowCount = { source: "stdout", jsonPath: "rows" }

### 2.4 Artefatos por step

Para cada step, gerar no minimo:

- metadata.json com status, timestamps, inputs resolvidos e variaveis usadas
- screenshot.png (ou multiplos prints conforme definido)
- em erro: error.json e error.png

Para SQL evidence, adicionalmente:

- query.sql e result.csv copiados
- evidence.html (inclui metadados simples como hora e tabela inferida)

## 3) Entradas e modularidade

### 3.1 Behaviors (Playwright)

- arquivo de behaviors define como navegar
- cada behavior e uma lista de acoes declarativas
- permite placeholders do contexto nos valores das acoes
- behaviors devem ser reutilizaveis entre features

### 3.2 OpenAPI JSON

Usar o OpenAPI para:

- validar se operationId ou path+method existe
- ajudar a localizar a operacao no Swagger UI
- reduzir risco de evidencia errada

### 3.3 SQL presets

Um preset SQL define:

- quais arquivos de query e resultado sao esperados
- regras de validacao (ex: deve retornar 1 linha)
- regras de extracao (ex: pegar coluna id)
- regras de mascaramento (ex: ocultar cpf)

Por padrao, a execucao SQL usa arquivos de query e resultado (mock). O acesso a banco e desacoplado por adapters, com sqlite como opcao de entrada.

## 4) Fluxo de execucao do agente

### 4.1 Preparacao

- carregar plan
- validar schema do plan
- carregar behaviors e indexar por behaviorId
- carregar OpenAPI, se houver steps swagger
- verificar existencia de arquivos SQL anexados, se houver
- inicializar context com feature, ticket, env, runId e startedAt

### 4.2 Execucao step a step

Para cada step na ordem:

- resolver placeholders usando context
- verificar requires
- executar step
- capturar artefatos
- rodar exports e atualizar context
- gravar metadata.json do step com status, inputs, variaveis consumidas/produzidas e referencias de arquivos

Se qualquer step falhar:

- gerar error.json e error.png
- marcar step como FAIL
- encerrar ou continuar conforme failPolicy do plan

### 4.3 Finalizacao

- gerar index.html com todos os steps, status e links
- gerar runSummary.json com contexto final e resultados

## 5) Status do backlog (versao estavel)

Implementado:
- P0: runner basico, outputs, report e falha controlada
- P1: SQL evidence por arquivos e SQLite, HTML + screenshot, expectRows
- P2: contexto, exports, requires e resolucao de placeholders
- P3: validacao OpenAPI + captura de response; evidencia HTML do Swagger
- P4: retries no CloudWatch com attempts
- P5.1/P5.2: CLI executa comando, logs, metadata, exports via stdout/stderr e evidencia HTML
- P5.3: pipeline pre/script/post no CLI
- P5.4: heuristica de erro (exitCode, stderr patterns, successCriteria)
- P5.5: redacao de segredos e validacao de credenciais para AWS CLI

## 6) Saida esperada (artefatos)

Para cada run:

- pasta runId/
- 00_runSummary.json
- index.html
- steps/
- 01_<id>/...
- 02_<id>/...

Para cada step:

- metadata.json padronizado
- prints solicitados
- em caso de erro: error.json e error.png
- swagger evidencia: evidence.html com dados da requisicao e response
- cli evidencia: evidence.html com comando, stdout e stderr

Para sqlEvidence:

- query.sql
- result.csv
- evidence.html
- screenshot.png

Para cli:

- stdout.txt
- stderr.txt

## 7) Exemplo completo (mock local)

Este exemplo usa data URLs e arquivos mock para exercitar browser, sqlEvidence, swagger (OpenAPI) e cloudwatch.

Rodar:

```
npx playwright install
npm start -- --plan examples/plan.json --out runs
```

Verifique os artefatos em `runs/<runId>/index.html` e `runs/<runId>/steps/`.

## 8) Exemplo com sites reais (requer internet)

Este exemplo usa sites publicos para as capturas de tela, incluindo Swagger UI real.

Rodar:

```
npx playwright install
npm start -- --plan examples/real/plan.json --out runs
```

Notas:
- O step swagger abre `https://petstore.swagger.io/` e tira print da UI real.
- O step cloudwatch usa um site publico como stand-in para demonstrar retries e prints.

## 9) JSONPlaceholder com payload/response detalhado

Este exemplo faz GET direto no JSONPlaceholder e captura o response completo.

Rodar:

```
npx playwright install
npm start -- --plan examples/jsonplaceholder/plan.json --out runs
```

Notas:
- O response e capturado com `responseSelector: "body"` e aparece no metadata do step.

## 10) Cenarios de ordem (SQL -> POST -> CloudWatch, etc.)

Planos prontos para exercitar diferentes ordens e dependencias com Swagger UI real e filtros via URL.

Rodar:

```
npx playwright install
npm start -- --plan examples/order/plan-sql-post-cloudwatch.json --out runs
npm start -- --plan examples/order/plan-swagger-get-cloudwatch.json --out runs
npm start -- --plan examples/order/plan-cloudwatch-before-swagger.json --out runs
```

Notas:
- Os planos usam a Swagger UI publica do Petstore para GET/POST (mais estavel para automacao).
- O "cloudwatch" usa `https://httpbin.org/anything` como stand-in para filtros e prints.
- O plano `plan-cloudwatch-before-swagger.json` deve falhar cedo por `requires` (exemplo de ordem invalida).

## 11) JSONPlaceholder -> SQLite -> Search (requer internet)

Fluxo:
- GET no JSONPlaceholder
- CloudWatch stand-in com retries
- CLI cria arquivo JSON, apaga e repassa payload
- CLI atualiza o SQLite
- SQL evidence valida os dados
- busca em site publico usando o output do SQLite

Rodar:
```
npx playwright install
npm start -- --plan examples/jsonplaceholder-sqlite/plan.json --out runs
```

## 12) Exemplo CLI (sem browser)

Executa um comando simples e gera stdout/stderr como artefatos.

Rodar:

```
npm start -- --plan examples/cli/plan.json --out runs
```

## 13) Exemplo CLI com fluxo de arquivos

Fluxo: baixa um arquivo local, transforma, apaga e usa o conteudo no step final.

```
npm start -- --plan examples/cli-flow/plan.json --out runs
```

## 14) Arquitetura por dominios (novo padrao)

O codigo agora e organizado por dominios, para facilitar debug e extensao:

- `src/core/`: orquestracao e utilitarios (runner, plan, types, context, exports, errors, utils)
- `src/domains/browser/`: acoes Playwright, behaviors e steps baseados em browser (browser, cloudwatch)
- `src/domains/api/`: validacao OpenAPI e step swagger
- `src/domains/sql/`: SQL evidence e renderizacao

## 15) Como estender daqui para frente

## 16) Testes

Mapa de cobertura: `tests/TEST_MAP.md`
E2E real usa Playwright e pode exigir `npx playwright install`.

Padrao para adicionar um novo step ou comportamento:

1) Defina o executor no dominio correto (`src/domains/<dominio>/`).
2) Atualize `src/core/types.ts` com o novo tipo/config.
3) Conecte o executor no `src/core/runner.ts`.
4) Escreva testes em `tests/` seguindo o padrao `pX-*.spec.ts`.
5) Documente o novo fluxo aqui e no `HOWTO.md` se for um exemplo executavel.
