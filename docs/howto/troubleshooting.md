# Troubleshooting

## Erros comuns

### spawn EPERM
- Rode o terminal como admin.
- Verifique permissao de escrita em `runs/`.

### Executable doesn't exist (Chrome)
- Feche o Chrome e ajuste `userDataDir`.
- Rode `npx playwright install`.

### ECONNREFUSED (MySQL)
- Verifique host, porta e credenciais.

### AccessDeniedException (AWS)
- Ajuste credenciais e permissoes do IAM.

### Dashboard nao abre
- Verifique se `npm run dashboard` terminou sem erro.
- Confirme `http://localhost:3000`.
- Teste outra porta: `PORT=3001 npm run dashboard`.

### Plan nao encontrado
- Verifique o caminho passado em `--plan`.
- Use paths do repo (ex: `scenarios/...`).

### Inputs nao aplicam
- Verifique `inputs.envPrefix` e as variaveis no `.env`.
- Confira se os itens em `inputs.items` sao JSON valido.

### Run sem evidencias
- Abra `runs/<runId>/00_runSummary.json` e valide status.
- Para browser, confirme o `behaviorId` no `behaviors.json`.

## Logs uteis

- `runs/<runId>/00_runSummary.json`
- `runs/<runId>/steps/<nn_stepId>/metadata.json`
