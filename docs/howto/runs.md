# Rodar planos

## Quando usar
Use este guia para executar um plan, escolher a pasta de saida e validar os resultados.

## Rodar um plan

- Comando basico:
  - `npm start -- --plan scenarios/full-flow/plan.json --out runs`

- Saida em outra pasta:
  - `npm start -- --plan scenarios/full-flow/plan.json --out runs-local`

## Estrutura gerada

Cada execucao cria um run com:
- `runs/<runId>/00_runSummary.json`
- `runs/<runId>/index.html`
- `runs/<runId>/steps/<nn_stepId>/...`

## Como ler o summary

Campos comuns em `00_runSummary.json`:
- `feature`, `ticket`, `env`: metadados do plan.
- `steps[]`: status de cada step (OK/FAIL/SKIPPED).
- `selectedSteps`: lista de steps executados quando voce seleciona manualmente.
- `startedAt` e `finishedAt`: timestamps do run.

## Artefatos do step

Cada step gera uma pasta com:
- `metadata.json` com status, duracao e outputs.
- Evidencias especificas (ver `docs/howto/evidence.md`).

## Fail policy

- `stop` (padrao): interrompe no primeiro erro.
- `continue`: segue executando mesmo com falhas.

Exemplo:
```json
{
  "failPolicy": "continue"
}
```

## Reutilizar outputs

Use `exports` para exportar dados e reutilizar em steps seguintes. Consulte `docs/howto/inputs-context.md`.

## Onde abrir evidencias

- Abra `runs/<runId>/index.html` no navegador.
- Use o dashboard para navegar pelos runs.
