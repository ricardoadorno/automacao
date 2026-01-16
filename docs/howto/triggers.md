# Triggers

## Quando usar
Use triggers para registrar integracoes e acompanhar status manualmente.

## Como criar

1) Abra o dashboard.
2) Va para a aba Triggers.
3) Preencha nome, provider, target e logs.
4) Clique em Create.

Campos comuns:

- `name`: identificador amigavel.
- `provider`: origem do evento.
- `target`: sistema destino ou link.
- `status`: estado atual.
- `logs`: lista de links ou notas.

## Status suportados

- idle
- observing
- success
- error
- stopped

## Onde fica salvo

- `runs/triggers.json`

## Estrutura do arquivo

Exemplo:
```json
[
  {
    "name": "webhook-erp",
    "provider": "erp",
    "target": "https://example.com",
    "status": "observing",
    "logs": ["https://logs.example.com/123"]
  }
]
```

## Dicas

- Este recurso e manual, sem integracao automatica.
- Use Logs para abrir links externos.
