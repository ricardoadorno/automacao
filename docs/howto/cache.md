# Cache

## Quando usar
Use cache para pular steps quando nada mudou e acelerar execucoes repetidas.

## Como habilitar

```json
{
  "cache": { "enabled": true, "dir": ".cache/steps" }
}
```

## Campos suportados

- `cache.enabled`: ativa ou desativa o cache do plan.
- `cache.dir`: diretorio onde as chaves sao salvas.

## Como desabilitar em um step

```json
{ "id": "step-1", "type": "api", "cache": false }
```

## Como funciona

- Cache e opt-in por plan.
- Cada step gera uma chave baseada no conteudo resolvido.
- Em cache hit, o step vira `SKIPPED` com `notes: "cache hit"`.

## Quando limpar o cache

- Mudou algum arquivo externo (ex: behaviors, curl, query).
- Mudou a versao do navegador ou dependencias.
- O resultado esperado mudou mas o step nao tem entradas novas.

Exemplo:
```
Remove-Item -Recurse -Force .cache/steps
```

## Dicas

- Limpe `.cache/steps` quando mudar arquivos externos.
- Cache funciona melhor em steps deterministas.
- Use `cache: false` em steps com dados variaveis.
