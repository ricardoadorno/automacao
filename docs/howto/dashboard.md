# Dashboard (frontend React)

## Quando usar
Use o dashboard para executar planos, acompanhar execucoes e gerenciar triggers.

## Como abrir

- `npm run dashboard`
- Acesse `http://localhost:3000`

## Conceito de paginas

- Plans: lista principal de cenarios reais.
- Examples: demos e planos de referencia.
- Executions: execucoes em andamento.
- Runs: historico e evidencias.
- Triggers: configuracoes manuais.

## O que voce encontra

- Plans: lista de cenarios (scenarios/) com detalhes e selecao de steps.
- Examples: exemplos de referencia (examples/).
- Executions: status e logs segmentados por step.
- Runs: historico com evidencias e cache hits.
- Triggers: cadastro e status manual.

## Como executar um plan

1) Abra a aba Plans.
2) Marque os steps que deseja executar.
3) Clique em **Run selected steps**.
4) Acompanhe em Executions.

## Inputs no dashboard

- Defaults/Overrides: pares `chave = valor`.
- Items: JSON por item (objeto completo por linha).
- Env prefix: aplica variaveis do `.env` conforme `inputs.envPrefix`.

Exemplo de item:

```json
{ "userId": "u-1", "amount": 10 }
```

## Ver detalhes do plan

1) Em Plans (cenarios) ou Examples, clique em **View plan**.
2) Veja detalhes completos de cada step.
3) Ajuste inputs e items de loop antes de rodar.
   - Defaults/Overrides sao pares chave/valor.
   - Items usam JSON por item (objeto).

## Como reexecutar um run

1) Abra a aba Runs.
2) Clique em **Run again** para repetir o mesmo conjunto de steps.

## Cache e selecao de steps

- Se o plan tem cache ligado, steps podem ser pulados.
- A selecao de steps roda somente os itens marcados.
- Se um step depende de outro, use `requires` no plan para falhar rapido.

## Runs index

- `http://localhost:3000/runs/index.html`

## Dicas

- Se aparecer erro de porta, use `PORT=3001 npm run dashboard`.
- Use o botao **Run selected steps** para debug rapido.
- O modal de detalhes mostra inputs e loop em tempo real.
