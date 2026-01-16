# Browser behaviors

## Quando usar
Use behaviors para automatizar interacoes de browser com acoes declarativas.

## Onde definir

- `behaviors.json` (no mesmo diretorio do plan ou em caminho configurado).
- O plan aponta com `behaviorsPath`.

Exemplo no plan:
```json
{
  "behaviorsPath": "behaviors.json",
  "steps": [
    { "id": "login", "type": "browser", "behaviorId": "login" }
  ]
}
```

## Estrutura basica

```json
{
  "behaviors": {
    "login": {
      "actions": [
        { "type": "goto", "url": "https://example.com" },
        { "type": "fill", "selector": "#email", "text": "{{email}}" },
        { "type": "fill", "selector": "#password", "text": "{{password}}" },
        { "type": "click", "selector": "button[type=submit]" }
      ]
    }
  }
}
```

## Acoes comuns

- `goto`: abre uma URL.
- `fill`: preenche um campo.
- `click`: clica em um elemento.
- `waitFor`: espera um selector existir.
- `expectText`: valida texto na pagina.
- `search`: destaca texto antes da captura.
- `screenshot`: captura tela.
- `waitMs`: pausa por um tempo fixo.

## Placeholders e contexto

- Use `{{chave}}` para interpolar valores do contexto.
- Combine com `inputs.defaults`, `inputs.items` e `exports`.

## Captura

- Padrao: screenshot por step.
- Para tiles horizontais:
```json
{
  "config": {
    "browser": {
      "capture": {
        "mode": "tiles",
        "tiles": { "direction": "horizontal", "overlapPx": 120, "waitMs": 200 }
      }
    }
  }
}
```

## Reuse session

- Evita reabrir browser a cada step.

```json
{
  "browser": { "reuseSession": true }
}
```

## Dicas

- Use `requires` para garantir contexto antes do behavior.
- Verifique selectors com devtools.
- Para tables com overflow, use `evaluate`.
- Prefira seletores estaveis (data-testid, ids).
