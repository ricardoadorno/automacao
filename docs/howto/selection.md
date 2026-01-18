# Selecao de steps e range

## Quando usar
Use selecao de steps para executar apenas partes do plan sem alterar o arquivo.

## Selecionar steps (Dashboard)

- Abra o card do plan.
- Marque os steps desejados.
- Clique em **Run selected steps**.
- Por padrao, todos os steps estao selecionados.

## Selecionar steps (CLI)

```bash
npm start -- --plan scenarios/full-flow/plan.json --out runs --steps 1,3,5
```

## Executar por range

```bash
npm start -- --plan scenarios/full-flow/plan.json --out runs --from 2 --to 4
```

## Prioridade

- Se voce enviar `--steps`, apenas esses steps sao executados.
- O range ainda e validado, mas os steps fora da lista nao rodam.

## Boas praticas

- Use `requires` para garantir dependencias de contexto.
- Documente no README do plan quais steps podem ser isolados.
- Combine com cache para reexecutar partes do fluxo com velocidade.

## Reexecutar usando contexto anterior

Use `--resume` para carregar o contexto do ultimo run e executar apenas alguns steps.

```bash
npm start -- --plan scenarios/full-flow/plan.json --out runs --steps 4 --resume run-123
```

## Dicas

- O dashboard salva a selecao no run summary e o **Run again** reutiliza.
- Use steps para debug rapido e reducao de tempo.
