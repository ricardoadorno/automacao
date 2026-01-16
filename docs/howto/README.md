# HOWTO

Este guia e o ponto de entrada para usuarios do Automacao. Aqui voce encontra o basico para rodar planos e navegar pelos resultados, alem de links para tutoriais especificos.

## Rotas principais

- Comecar rapido: `docs/howto/quickstart.md`
- Rodar planos: `docs/howto/runs.md`
- Inputs, context e variaveis: `docs/howto/inputs-context.md`
- Steps e dominios: `docs/howto/steps.md`
- Cache e reexecucao: `docs/howto/cache.md`
- Execucao por range ou steps selecionados: `docs/howto/selection.md`
- Evidencias e artefatos: `docs/howto/evidence.md`
- Browser behaviors: `docs/howto/browser-behaviors.md`
- SQL evidence: `docs/howto/sql-evidence.md`
- Criar plans do zero: `docs/howto/create-plans.md`
- Dashboard (frontend React): `docs/howto/dashboard.md`
- LLM: criar scenarios: `docs/howto/llm-scenarios.md`
- Triggers: `docs/howto/triggers.md`
- Problemas comuns: `docs/howto/troubleshooting.md`

## Conceitos rapidos

- Plan: arquivo JSON declarativo com `metadata`, `steps` e configuracoes globais.
- Step: unidade de execucao. Pode ser `api`, `sqlEvidence`, `browser`, `cli` ou `specialist`.
- Run: cada execucao gera uma pasta em `runs/` com artefatos e `00_runSummary.json`.
- Context: dados compartilhados entre steps para exportar e reutilizar valores.

## Fluxo de uso (visao geral)

```
Escolher plan -> Rodar (CLI ou Dashboard) -> Ver logs -> Abrir evidencias -> Ajustar plan
```

## Quando usar CLI vs Dashboard

- CLI: ideal para automacao em batch, scripts e debug rapido.
- Dashboard: ideal para explorar planos, selecionar steps e acompanhar execucao.

## Onde ficam os resultados

- `runs/<runId>/index.html` (hub de evidencias)
- `runs/<runId>/00_runSummary.json` (resumo)
- `runs/<runId>/steps/<nn_stepId>/` (artefatos do step)

## O basico para usar

1) Instale dependencias:
   - `npm install`
2) Rode um plan (cenarios ou examples):
   - `npm start -- --plan scenarios/full-flow/plan.json --out runs`
   - `npm start -- --plan examples/quickstart/plan.json --out runs`
3) Veja os resultados:
   - Abra `runs/<runId>/index.html`
4) Use o dashboard:
   - `npm run dashboard`
   - Acesse `http://localhost:3000`

## Scenarios e Examples

- Scenarios (principal): `scenarios/README.md`
- Examples (apoio): `examples/README.md`

## Estrutura dos documentos

Cada sub-howto contem:
- Quando usar
- Como configurar
- Passo a passo
- Exemplos
- Dicas e erros comuns

## Sobre este guia

Este HOWTO e orientado para usuarios finais e operadores de planos. Para detalhes internos e de contribuicao, veja `README.md` e `AGENTS.md`.
