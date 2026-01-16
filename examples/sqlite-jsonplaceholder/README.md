# SQLite + JSONPlaceholder (offline)

Este exemplo usa um banco SQLite local com dados inspirados no JSONPlaceholder (users e posts).

## O que tem no banco

- 3 usuarios
- 5 posts

## Como rodar

```
npm start -- --plan examples/sqlite-jsonplaceholder/plan.json --out runs
```

## O que esperar

- `runs/<runId>/steps/01_posts-with-users/result.csv`
- `runs/<runId>/steps/01_posts-with-users/evidence.html`

## Observacoes

- Os dados sao estaticos e offline (nao dependem de rede).
- Use este exemplo para validar SQL evidence e joins simples.
