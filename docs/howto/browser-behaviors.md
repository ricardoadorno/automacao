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
- `waitForSelector`: espera um selector existir.
- `waitForRequest`: espera por request com URL ou regex.
- `waitForResponse`: espera por response com URL/regex e status opcional.
- `search`: destaca texto antes da captura.
- `waitForTimeout`: pausa por um tempo fixo.

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

- Para evitar `waitMs`, use `waitForNetworkIdle`:
```json
{
  "config": {
    "browser": {
      "capture": {
        "mode": "tiles",
        "tiles": { "direction": "vertical", "waitForNetworkIdle": true }
      }
    }
  }
}
```

## Reuse session

- Evita reabrir browser a cada step.
- Padrao: ativo quando o plan possui mais de um step browser.

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
- Evite `waitForTimeout` quando puder usar `waitForResponse` ou `waitForRequest`.

## Exemplos

Esperar response da API:
```json
{ "type": "waitForResponse", "urlRegex": "api.example.com/users", "status": 200, "timeoutMs": 15000 }
```

Esperar request especifica:
```json
{ "type": "waitForRequest", "url": "/orders", "timeoutMs": 15000 }
```
