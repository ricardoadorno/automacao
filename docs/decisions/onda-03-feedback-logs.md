# Onda 03 - Feedback de execucao e logs segmentados

Data: 2026-01-15

## Objetivo
- Melhorar visibilidade durante execucoes na GUI.
- Agrupar logs por step e mostrar tempo decorrido.

## Decisoes
- A segmentacao de logs usa as linhas que contem "Step NN/" geradas pelo runner.
- O status de cada bloco e inferido pela presenca de "OK" ou "FAIL" na linha.
- O tempo decorrido e calculado no front-end usando startedAt/finishedAt.

## O que foi feito
- Frontend React (`frontend/`)
  - Rendering de blocos por step no painel Executions.
  - Meta de execucao com inicio, elapsed e range.
  - Estilos para destacar status por step (running/ok/fail).

## Como usar
- Inicie o dashboard com `npm run dashboard`.
- Abra a aba Executions para ver logs agrupados por step.
- O cabecalho do bloco indica o step e o status inferido.

## Observacoes
- Se os logs nao tiverem o padrao "Step NN/", os blocos ficam em "General logs".
- O status e heuristico (baseado em texto), nao uma fonte oficial do runner.
