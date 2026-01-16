# Examples

Este diretorio guarda planos de exemplo usados para demonstracao e testes locais.

## Como usar

1) Leia o guia rapido:
   - `docs/howto/quickstart.md`
2) Rode um plan:
   - `npm start -- --plan examples/quickstart/plan.json --out runs`
3) Abra o resultado:
   - `runs/<runId>/index.html`
4) Consulte os guias detalhados:
   - `docs/howto/create-plans.md`
   - `docs/howto/browser-behaviors.md`
   - `docs/howto/sql-evidence.md`

## Exemplos disponiveis

### quickstart
- Caminho: `examples/quickstart/plan.json`
- O que faz: CLI simples + specialist (arquivo).

### api-basic
- Caminho: `examples/api-basic/plan.json`
- O que faz: requisicao HTTP basica via curl.

### browser-basic
- Caminho: `examples/browser-basic/plan.json`
- O que faz: abre example.com e captura screenshot.

### sqlite-basic
- Caminho: `examples/sqlite-basic/plan.json`
- O que faz: consulta SQLite e gera evidencias.
- Preparar: `node examples/sqlite-basic/init-db.js`

### cli-basic
- Caminho: `examples/cli-basic/plan.json`
- O que faz: executa um comando node simples.

### specialist-basic
- Caminho: `examples/specialist-basic/plan.json`
- O que faz: gera um arquivo via specialist.

### cache-basic
- Caminho: `examples/cache-basic/plan.json`
- O que faz: demonstra cache de steps.
- Rodar duas vezes para ver cache hit.

## Fluxo ilustrado

```
Plan -> Runner -> runs/<runId>/steps -> index.html -> Evidencias
```

## Dicas

- Use o dashboard para selecionar steps: `npm run dashboard`.
- Evite credenciais reais nos exemplos.
- Se adicionar um novo exemplo, crie um `README.md` local explicando o fluxo.
