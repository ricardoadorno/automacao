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

### Browser (`browser`)
- Executa behaviors e gera screenshot.
- Suporta `reuseSession` para reaproveitar o browser.
- Requer `behaviorId` e `behaviorsPath`.

### CLI (`cli`)
- Executa comandos com stdout/stderr.
- Suporta pipeline simples com pre/script/post.
- Requer `command` e `args`.

### Specialist (`specialist`)
- Tarefas utilitarias como `writeFile`.
- Requer `task` no config.

## Configuracoes comuns

- `retries` e `retryDelayMs` em `config`.
- `requires` para garantir contexto.
- `exports` para propagar dados.
- `label` para descricao amigavel no dashboard.

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
{ "type": "specialist", "config": { "specialist": { "task": "writeFile", "outputPath": "note.txt", "content": "run {runId}" } } }
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
