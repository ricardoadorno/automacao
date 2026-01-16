# Evidencias e artefatos

## Quando usar
Use este guia para localizar evidencias e entender o que cada step gera.

## Estrutura do run

- `runs/<runId>/index.html` lista artefatos.
- `runs/<runId>/00_runSummary.json` resume o run.
- `runs/<runId>/steps/<nn_stepId>/` guarda os arquivos do step.

## Artefatos por step

- API: `evidence.html`
- SQL Evidence: `query.sql`, `result.csv`, `evidence.html`
- Browser: `screenshot.png`
- CLI: `stdout.txt`, `stderr.txt`, `metadata.json`, `evidence.html`
- Specialist: arquivo gerado pelo step

## Como abrir

- `index.html` mostra links por step.
- O dashboard possui acesso rapido em Runs.

## Validando resultado

- Compare `status` e `durationMs` no `metadata.json`.
- Em SQL, confira `result.csv` e `expectRows`.
- Em API, valide o `evidence.html` e `response.json` quando existir.

## Dicas

- Evidencias sao HTML para facilitar leitura e compartilhamento.
- Use `index.html` para navegar entre steps rapidamente.
