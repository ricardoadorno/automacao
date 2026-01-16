# Referencias do repositorio

Use estes arquivos como fonte primaria para gerar cenarios:

- `docs/howto/create-plans.md` (formato de plan e estrutura)
- `docs/howto/steps.md` (tipos de step e configs)
- `docs/howto/browser-behaviors.md` (acoes Playwright)
- `docs/howto/inputs-context.md` (exports/requires/placeholders)
- `docs/howto/selection.md` (range e selecao de steps)
- `docs/howto/evidence.md` (artefatos por step)
- `docs/howto/report-template.md` (relatorio JSON/HTML/DOCX)
- `docs/howto/sql-evidence.md` (SQL evidence)
- `docs/howto/specialist.md` (tarefas specialist)
- `docs/howto/triggers.md` (dashboard triggers)
- `examples/README.md` e `scenarios/` (modelos existentes)

Padroes de busca rapidos:

- `rg --files -g "plan.json" scenarios examples`
- `rg --files -g "behaviors.json" scenarios examples`
- `rg --files -g "*.curl" scenarios examples`
- `rg --files -g "*.sql" scenarios examples`
- `rg --files -g "*.csv" scenarios examples`
