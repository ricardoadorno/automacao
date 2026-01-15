# HOWTO

Guia rapido para rodar, testar e entender o repositorio.

## 1) Instalar dependencias e browsers

Instale deps do Node:

```
npm install
```

Para screenshots reais do browser:

```
npx playwright install
```

Se aparecer "spawn EPERM", rode o terminal com permissao elevada.

## 2) Comandos principais

- Build + executar um plan:
  - `npm start -- --plan examples/api/plan.json --out runs`
- Rodar testes:
  - `npm test`
- Dashboard (GUI + API simples):
  - `npm run dashboard`
- Gerar o indice de runs (index.html na raiz):
  - `npm run runs:index`
- Servir o visualizador de runs:
  - `npm run runs:serve`
- Gerar indice + servir runs:
  - `npm run runs:view`

## 3) Mapa do repositorio (o que cada coisa faz)

### Pastas principais
- `src/`: codigo TypeScript do executor (core + dominios).
  - `src/core/`: runner, contexto, exports, errors e parse de plan.
  - `src/domains/`: implementacoes de steps (api, sql, browser, cli).
- `tests/`: testes Vitest por prioridade (`p0-*.spec.ts`, etc).
- `examples/`: planos e assets de exemplo.
- `scripts/`: utilitarios de dashboard, run viewer e geracao de indice.
- `scenarios/`: documentacao de fluxos grandes (narrativas).
- `dist/`: build do TypeScript (gerado pelo `npm run build`).
- `runs/`: resultados das execucoes (gerado pelo runner).
- `chrome-profile/`: perfil persistente do Chrome (gerado quando usado).

### Arquivos de raiz
- `README.md`: visao geral e roadmap TDD.
- `BACKLOG.md`: backlog consolidado de produto e GUI.
- `AGENTS.md`: regras para agentes e contribuicao.
- `dashboard.html`: UI estatica servida pelo dashboard.
- `index.html`: indice de runs (gerado por `npm run runs:index`).

### Scripts
- `scripts/dashboard.js`: servidor do dashboard + API (`/api/plans`, `/api/run`, `/api/status`, `/api/runs`).
- `scripts/generate-run-index.js`: gera `index.html` com lista de runs.
- `scripts/serve.js`: servidor simples para visualizar `index.html` e runs.

## 4) Exemplos disponiveis

- `examples/api/`: fluxo simples de API via curl.
- `examples/sqlite/`: API + SQLite + browser (chain com exports).
- `examples/cli/`: step CLI com stdout/stderr e metadata.
- `examples/cloudwatch/`: extracao de logs do CloudWatch com evidencias.
- `examples/dbt-pm/`: fluxo completo DBT PM (API, SQL, CLI, browser, batches).
- `examples/brcap000690/`: planos multiplos para consulta de cobranca analitico.
- `examples/pm-pu-consultas/`: planos de consulta PM/PU com browser.

Cada pasta tem seus assets (`plan.json`, `behaviors.json`, `*.curl`, `*.sql`) e README local quando aplicavel.

## 5) Como rodar os principais exemplos

### API basico
```
npm start -- --plan examples/api/plan.json --out runs
```

### API -> SQLite -> Browser
```
npm start -- --plan examples/sqlite/plan.json --out runs
```

Se quiser recriar o banco SQLite:
```
node examples/sqlite/init-db.js
```

### CLI (sem browser)
```
npm start -- --plan examples/cli/plan.json --out runs
```

Saida esperada:
- `runs/<runId>/steps/01_cli-echo/stdout.txt`
- `runs/<runId>/steps/01_cli-echo/stderr.txt`
- `runs/<runId>/steps/01_cli-echo/metadata.json`

### CloudWatch
```
npm start -- --plan examples/cloudwatch/plan.json --out runs
```

Pre-requisitos:
- AWS CLI configurado (`aws configure`)
- IAM com `logs:StartQuery` e `logs:GetQueryResults`

### DBT PM (fluxo completo)
```
npm start -- --plan examples/dbt-pm/plan.json --out runs
```

Veja detalhes em:
- `examples/dbt-pm/README.md`
- `examples/dbt-pm/QUICKSTART.md`
- `examples/dbt-pm/FLUXO.md`

## 6) Dashboard e visualizacao de runs

Dashboard (GUI com API e execucao por clique):
```
npm run dashboard
```

Visualizar runs ja geradas:
```
npm run runs:view
```

## 7) Onde ver os artefatos

Para cada run:
- `runs/<runId>/index.html` (links para artifacts)
- `runs/<runId>/steps/<nn_stepId>/metadata.json`
- `runs/<runId>/steps/<nn_stepId>/screenshot.png`

SQL evidence adiciona:
- `query.sql`, `result.csv`, `evidence.html`

API e CLI adicionam:
- `evidence.html`

## 8) Captura horizontal com tiles

Para tabelas muito largas, use tiles horizontais:

```json
"config": {
  "browser": {
    "capture": {
      "mode": "tiles",
      "tiles": { "direction": "horizontal", "overlapPx": 120, "waitMs": 200 }
    }
  }
}
```

Importante: o modo tiles funciona apenas quando a pagina inteira tem scroll (window.scrollWidth > window.innerWidth). Se a tabela estiver dentro de um container com overflow-x, use a acao `evaluate`.

### Scroll em containers especificos

```json
{
  "type": "evaluate",
  "script": "const table = document.querySelector('table#table'); let el = table; while (el && el !== document.body) { if (el.scrollWidth > el.clientWidth) { el.scrollLeft = 1200; break; } el = el.parentElement; }"
}
```

## 9) Destacar texto na pagina (Search/Find)

Use a acao `search` para destacar texto antes da captura:

```json
{
  "type": "search",
  "text": "ID123456"
}
```

## 10) Problemas comuns

- "spawn EPERM": execute com permissao elevada.
- Falha por `requires`: a ordem do plan nao satisfaz dependencias do contexto.
- "ECONNREFUSED" no MySQL: verifique host, porta e credenciais.
- "Executable doesn't exist" no Chrome: feche o Chrome e ajuste `userDataDir`.
- "Unable to locate credentials" no AWS CLI: rode `aws configure`.
- "AccessDeniedException" no CloudWatch: verifique as permissoes IAM.
