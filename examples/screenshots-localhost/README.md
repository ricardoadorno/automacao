# Screenshots localhost

Este exemplo abre o app em `http://localhost:3000` e gera screenshots PNG de cada tela e modal via steps `browser`.

## Como rodar

```
npm start -- --plan examples/screenshots-localhost/plan.json --out runs
```

Os PNGs ficam em `runs/<runId>/steps/<stepId>/screenshot.png`.

## Ajustes obrigatorios

Atualize os seletores em `examples/screenshots-localhost/plan.json` conforme o app:

- `tabPlansSelector`, `tabExamplesSelector`, `tabExecutionsSelector`
- `tabRunsSelector`, `tabReportsSelector`, `tabTriggersSelector`
- `plansGridSelector`, `planCardSelector`, `planModalSelector`
- `executionsReadySelector`, `runsReadySelector`, `reportsReadySelector`
- `reportsAddEvidenceSelector`, `reportsChooseEvidenceSelector`, `reportEvidenceModalSelector`
- `triggersReadySelector`

Se preferir, sobrescreva via env:

```
AUTO_BASEURL=http://localhost:3000
```

## Seletor sugerido

Para estabilidade, use `data-testid` nos elementos principais (tabs, grids, cards e modais).
