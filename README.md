# Diretrizes do projeto

Este README define o que o produto faz e como devemos implementar. Use como guia unico para decisoes de design, estrutura e backlog.

## 1) Objetivo do produto

Construir um executor de evidencias que le um plano declarativo e gera um pacote de evidencias por feature, com:

- evidencias de navegacao em browser (Front, dashboards com filtros)
- evidencias de API via curl (.curl)
- evidencias de SQL por anexos (query + resultado) com print padronizado
- encadeamento entre steps por variaveis extraidas (id, correlationId, timestamps)
- modularidade por arquivos de configuracao (behaviors Playwright, curl, SQL presets)

## 2) Conceitos principais

### 2.1 Plano de evidencias

O plano descreve:

- metadata do run, feature, ticket, ambiente
- lista ordenada de steps
- referencias para configs externas: behaviors do Playwright, curl e SQL presets

O plano nao descreve cliques detalhados. Ele descreve intencao, dependencias e artefatos esperados.

### 2.2 Tipos de step

O agente deve suportar, no minimo:

- browser: executa um behavior Playwright e captura screenshots
- api: executa um curl, gera evidence HTML e exporta response
- browser: step de navegacao com filtros, retries e captura configuravel
- sqlEvidence: recebe query.sql + result.csv e gera evidencia verificavel com HTML renderizado, metadados simples e print
- cli: executa um comando local, grava stdout/stderr e metadados simples

Config basica por step (exemplos de campos):

- browser: behaviorId
- api: usa curlPath no plan e exports de responseData/responseText
- browser: behaviorId, config.retries, config.retryDelayMs, config.browser.capture
- sqlEvidence: config.sql.queryPath, config.sql.resultPath, config.sql.expectRows
- cli: config.cli.command, config.cli.args, config.cli.cwd, config.cli.timeoutMs

Captura de telas (exemplo para tabelas horizontais):

```json
"config": {
  "retries": 1,
  "browser": {
    "capture": {
      "mode": "tiles",
      "tiles": {
        "direction": "horizontal",
        "overlapPx": 120,
        "waitMs": 200
      }
    }
  }
}
```

### 2.3 Contexto do run e variaveis

O agente mantem um objeto context em memoria durante a execucao do plano.

- cada step pode declarar exports (regras para extrair valores e publicar no contexto)
- cada step pode declarar requires (valores que precisam existir para executar)
- qualquer string de configuracao pode usar placeholders do contexto

Exemplos de placeholders no plan:

- {pedidoId}
- {correlationId}
- {startedAt}

No curl, use `{{variavel}}` para interpolar valores no comando.

Export rules (exemplos):

- SQL: exports.pedidoId = { source: "sql", column: "id", row: 0 }
- API JSON: exports.pedidoId = { source: "responseData", jsonPath: "id" }
- API regex: exports.pedidoId = { source: "responseText", regex: "\"id\":\"(\\w+)\"" }
- CLI: exports.rowCount = { source: "stdout", jsonPath: "rows" }

### 2.4 Artefatos por step

Para cada step, gerar no minimo:

- metadata.json com status, timestamps, inputs resolvidos e variaveis usadas
- screenshot.png (ou multiplos prints conforme definido)
- em erro: error.json e error.png

Para API:
- evidence.html com request/response

Para SQL evidence:
- query.sql e result.csv copiados
- evidence.html (inclui metadados simples como hora e tabela inferida)

## 3) Entradas e modularidade

### 3.1 Behaviors (Playwright)

- arquivo de behaviors define como navegar
- cada behavior e uma lista de acoes declarativas
- permite placeholders do contexto nos valores das acoes
- behaviors devem ser reutilizaveis entre features

### 3.2 Curl (.curl)

Usar `.curl` para definir chamadas de API:

- `curlPath` no plan aponta para um arquivo `.curl`
- cada step `api` usa o curl com interpolacao de `{{variavel}}`

### 3.3 SQL presets

Um preset SQL define:

- quais arquivos de query e resultado sao esperados
- regras de validacao (ex: deve retornar 1 linha)
- regras de extracao (ex: pegar coluna id)
- regras de mascaramento (ex: ocultar cpf)

Por padrao, a execucao SQL usa arquivos de query e resultado (mock). O acesso a banco e desacoplado por adapters, com sqlite e mysql como opcoes.

## 4) Fluxo de execucao do agente

### 4.1 Preparacao

- carregar plan
- validar schema do plan
- carregar behaviors e indexar por behaviorId
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
- P1: SQL evidence por arquivos, SQLite e MySQL, HTML + screenshot, expectRows
- P2: contexto, exports, requires e resolucao de placeholders
- P3: API via curl + evidencia HTML
- P4: retries no browser com attempts
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

Para api:
- evidence.html com request/response

Para sqlEvidence:

- query.sql
- result.csv
- evidence.html
- screenshot.png

Para cli:

- stdout.txt
- stderr.txt
- evidence.html

## 7) Exemplos principais

API com curl:

```
npm start -- --plan examples/api/plan.json --out runs
```

API -> SQLite -> Browser:

```
npm start -- --plan examples/sqlite/plan.json --out runs
```

CLI simples:

```
npm start -- --plan examples/cli/plan.json --out runs
```

MySQL + Chrome com sessao persistente:

```
npm start -- --plan examples/testando/plan.json --out runs
```

## 8) Dashboard (interface grafica)

Para executar e monitorar runs pela interface grafica:

```
npm run dashboard
```

Abra `http://localhost:3000` e escolha um plano em `examples/`.

## 9) Arquitetura por dominios (novo padrao)

O codigo agora e organizado por dominios, para facilitar debug e extensao:

- `src/core/`: orquestracao e utilitarios (runner, plan, types, context, exports, errors, utils)
- `src/domains/browser/`: acoes Playwright, behaviors e captura de telas no browser
- `src/domains/api/`: execucao de curl e evidence HTML
- `src/domains/sql/`: SQL evidence e renderizacao
- `src/domains/cli/`: CLI runner e evidencia HTML

## 10) Testes

Mapa de cobertura: `tests/TEST_MAP.md`
E2E real usa Playwright e pode exigir `npx playwright install`.

Padrao para adicionar um novo step ou comportamento:

1) Defina o executor no dominio correto (`src/domains/<dominio>/`).
2) Atualize `src/core/types.ts` com o novo tipo/config.
3) Conecte o executor no `src/core/runner.ts`.
4) Escreva testes em `tests/` seguindo o padrao `pX-*.spec.ts`.
5) Documente o novo fluxo aqui e no `HOWTO.md` se for um exemplo executavel.
