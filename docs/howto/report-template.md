# Template de relatorio (JSON)

Use este formato para montar um documento com blocos (h1, h2, p e evidencia).

## Estrutura basica

```
{
  "name": "Relatorio mensal",
  "runId": "20260116-123045",
  "blocks": [
    { "id": "title", "type": "h1", "text": "Relatorio de Evidencias" },
    { "id": "note", "type": "small", "text": "Gerado automaticamente pelo dashboard." },
    { "id": "intro", "type": "p", "text": "Resumo do que foi executado." },
    {
      "id": "ev-login",
      "type": "evidence",
      "label": "Login API",
      "caption": "Resposta completa do endpoint de login.",
      "runId": "20260116-123045",
      "stepId": "login-api",
      "filename": "evidence.html",
      "enabled": true
    }
  ]
}
```

## Campos por bloco

- `id`: identificador unico no template.
- `type`: `h1`, `h2`, `p`, `small` ou `evidence`.
- `text`: texto do bloco (para h1/h2/p).
- `label`: titulo do bloco de evidencia.
- `caption`: observacao opcional da evidencia.
- `runId`: run onde a evidencia foi gerada (para usar evidencias de outros runs).
- `stepId`: id do step no `00_runSummary.json`.
- `filename`: arquivo de evidencia do step (ex: `evidence.html`, `screenshot.png`).
- `enabled`: quando `false`, o bloco nao entra no documento final.

## Multiplos runs

Um relatorio pode misturar evidencias de runs diferentes. Use `runId` em cada bloco de evidencia para apontar o run correto.

## Onde salvar

Quando gerado pela GUI, o arquivo fica em:

```
runs/<runId>/reports/<name>.json
```
