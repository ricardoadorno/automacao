# SQL evidence

## Quando usar
Use `sqlEvidence` para rodar consultas e gerar evidencias em HTML e CSV.

## Campos principais

- `adapter`: `sqlite` ou `mysql`.
- `dbPath`: caminho do banco (sqlite).
- `queryPath`: arquivo `.sql` com a consulta.
- `expectRows`: quantidade esperada de linhas.

## SQLite

Exemplo:
```json
{
  "type": "sqlEvidence",
  "config": {
    "sql": {
      "adapter": "sqlite",
      "dbPath": "examples/sqlite/sample.db",
      "queryPath": "examples/sqlite/query.sql",
      "expectRows": 1
    }
  }
}
```

## MySQL

Exemplo:
```json
{
  "type": "sqlEvidence",
  "config": {
    "sql": {
      "adapter": "mysql",
      "queryPath": "queries/users.sql",
      "expectRows": 10,
      "mysql": {
        "host": "localhost",
        "port": 3306,
        "user": "root",
        "password": "secret",
        "database": "app"
      }
    }
  }
}
```

## Artefatos gerados

- `query.sql`
- `result.csv`
- `evidence.html`

## Expect rows

- Se `expectRows` estiver definido e nao bater, o step falha.

## Placeholders

- Use `{{chave}}` na query para interpolar contexto.
- Garanta que a chave exista via `requires`.

## Dicas

- Evite credenciais reais em repositorios.
- Use `inputs` para interpolar variaveis na query.
- Para queries longas, prefira `queryPath`.
- Para validar schema, comece com `expectRows` pequeno.
