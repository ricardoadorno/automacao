# Inputs e context

## Quando usar
Use este guia para injetar dados nos plans, criar defaults e usar variaveis de ambiente.

## Precedencia

1) `env` (com prefixo)
2) `context` do plan
3) `inputs.overrides`
4) `inputs.defaults`

## Campos suportados

- `inputs.defaults`: valores padrao aplicados sempre.
- `inputs.overrides`: substitui defaults no runtime (dashboard/CLI).
- `inputs.envPrefix`: prefixo de variaveis de ambiente.
- `inputs.items`: lista de objetos para loop.
- `context`: contexto inicial do plan (statico).

## Exemplo de inputs

```json
{
  "inputs": {
    "defaults": { "baseUrl": "https://example.com" },
    "overrides": { "timeout": 60000 },
    "envPrefix": "AUTO_"
  },
  "context": {
    "tenant": "dev"
  }
}
```

## Variaveis de ambiente

- `AUTO_TOKEN=abc` vira `{ "TOKEN": "abc" }`.
- Prefixo e configurado em `inputs.envPrefix`.

Com `.env`:
- O CLI carrega `dotenv/config` automaticamente.
- O dashboard carrega `.env` com `require("dotenv").config()`.

Exemplo `.env`:
```
AUTO_BASEURL=https://api.exemplo.local
AUTO_TENANT=dev
```

Resultado esperado no contexto:

```json
{
  "BASEURL": "https://api.exemplo.local",
  "TENANT": "dev"
}
```

## Exports

Exporte dados de um step para o context do proximo.

Exemplo (SQL):
```json
"exports": {
  "userId": { "source": "sql", "column": "id", "row": 0 }
}
```

Exemplo (API):
```json
"exports": {
  "token": { "source": "responseText", "regex": "token=(\\w+)" }
}
```

## Loop com inputs.items

Quando `inputs.items` tiver mais de um objeto, o runner executa os steps para cada item.

```json
{
  "inputs": {
    "items": [
      { "userId": "u-1", "amount": 10 },
      { "userId": "u-2", "amount": 15 }
    ]
  }
}
```

Cada item vira parte do contexto durante o loop.

## Using requires

- `requires` impede que o step rode se o contexto nao tiver a chave.
- Use para falhar rapido quando faltar dados.

## Dicas

- Garanta que o step anterior gere o dado antes de usar `requires`.
- Use `requires` para falhar rapido caso a variavel nao exista.
- Evite chaves com espacos ou caracteres especiais.
