# Onda 01 - Plans detalhados na API + GUI cards + docs basicas

Data: 2026-01-15

## Objetivo
- Expor detalhes de steps na API do dashboard para a GUI explicar cada plan sem abrir o codigo.
- Mostrar steps, descricoes e artifacts na tela de plans.
- Registrar como interpretar os dados e como usar no futuro.

## Decisoes
- A rota `/api/plans` agora inclui `steps[]` com `index`, `id`, `type`, `description`, `details` e `artifacts`.
- Quando o plan nao define `description`, a API gera uma descricao automatica por tipo.
- `details` sao calculados a partir de:
  - `behaviorsPath` (browser actions) quando disponivel.
  - `curlPath` (method/url) quando disponivel.
  - `config.sql` e `config.cli` para SQL e CLI.
- `artifacts` sao inferidos por tipo de step e usados apenas para UI/guia.

## O que foi feito
- `scripts/dashboard.js`
  - Enriquecimento de `/api/plans` com passos detalhados e descricoes automaticas.
  - Resolvers seguros para `behaviorsPath` e `curlPath`.
  - Extracao simples de method/url do curl.
- Frontend React (`frontend/`)
  - Cards de plan mostram lista de steps com tipo, descricao, detalhes e artifacts.
  - Lista fica dentro de um bloco colapsavel para nao poluir a tela.

## Como usar
- Inicie o dashboard:
  - `npm run dashboard`
- Abra `http://localhost:3000` e va em Plans.
- Cada card mostra os steps, o tipo de artefato esperado e um resumo do que o step faz.
- Se um plan nao tiver `description`, a GUI exibira uma descricao automatica.

## Observacoes
- Se `behaviorsPath` ou `curlPath` estiverem faltando, os detalhes ficam vazios e o fallback e aplicado.
- A descricao automatica e apenas informativa, nao substitui documentacao de negocio.
