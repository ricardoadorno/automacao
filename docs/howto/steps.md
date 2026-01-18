# Steps e dominios

## Quando usar
Use este guia para entender o que cada tipo de step faz e como configurar.

## Tipos disponiveis

### API (`api`)
- Usa curl para requisicoes HTTP.
- Evidencia em `evidence.html`.
- Requer `request` apontando para `.curl`.

### SQL Evidence (`sqlEvidence`)
- Executa query em SQLite ou MySQL.
- Gera `query.sql`, `result.csv` e `evidence.html`.
- Requer `queryPath` e configuracao do adapter.

### Tabular (`tabular`)
- Visualiza CSV/XLSX em HTML interativo.
- Gera `viewer.html` e opcionalmente `screenshot.png`.
- Requer `config.tabular.sourcePath`.

### Browser (`browser`)
- Executa behaviors e gera screenshot.
- Suporta `reuseSession` para reaproveitar o browser.
- Requer `behaviorId` e `behaviorsPath`.

### CLI (`cli`)
- Executa comandos com stdout/stderr.
- Suporta pipeline simples com pre/script/post.
- Requer `command` e `args`.

### Specialist (`specialist`)
- Tarefas utilitarias como `writeFile`, `appendFile`, `writeJson`.
- Requer `task` no config.

### Logstream (`logstream`)
- Registra link de logstream como evidencia.
- Gera `evidence.html`.
- Requer `config.logstream.url`.

## Configuracoes comuns

- `retries` e `retryDelayMs` em `config`.
- `requires` para garantir contexto.
- `exports` para propagar dados.
- `label` para descricao amigavel no dashboard.
- Variaveis: use sempre `{{chave}}` para interpolar contexto.

## Erros e validacoes

- Falhas de API por rede/timeout geram `FAIL` e `error.json`.
- HTTP 4xx/5xx nao falham automaticamente; valide via `exports` + `requires` ou regras externas.
- SQL falha quando `expectRows` nao bate ou query invalida.
- CLI pode falhar por `exitCode` ou `errorPatterns`.

## Exemplos

Browser:
```json
{ "type": "browser", "behaviorId": "login" }
```

CLI:
```json
{ "type": "cli", "config": { "cli": { "command": "node", "args": ["script.js"] } } }
```

Specialist:
```json
{ "type": "specialist", "config": { "specialist": { "task": "writeFile", "outputPath": "note.txt", "content": "run {{runId}}" } } }
```

Logstream:
```json
{ "type": "logstream", "config": { "logstream": { "url": "https://logs.example.com/stream/123", "title": "AWS logs" } } }
```

API:
```json
{ "type": "api", "request": "scenarios/fluxo/request.curl" }
```

SQL Evidence:
```json
{
  "type": "sqlEvidence",
  "config": { "sql": { "adapter": "sqlite", "dbPath": "scenarios/fluxo/sample.db", "queryPath": "scenarios/fluxo/query.sql" } }
}
```

Tabular:
```json
{
  "type": "tabular",
  "config": {
    "tabular": {
      "sourcePath": "scenarios/fluxo/data.csv",
      "viewer": { "mode": "lite", "title": "Planilha de entrada" },
      "maxRows": 200
    }
  }
}
```
