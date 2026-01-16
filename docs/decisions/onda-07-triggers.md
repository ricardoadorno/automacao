# Onda 07 - Dominio de gatilho (dashboard)

Data: 2026-01-15

## Objetivo
- Criar um cadastro simples de gatilhos com status observavel.
- Exibir links de logs e permitir parar/atualizar status.

## Decisoes
- Gatilhos sao gerenciados pela API do dashboard (`/api/triggers`).
- Persistencia simples em `runs/triggers.json`.
- Status suportados: idle, observing, success, error, stopped.
- A GUI permite atualizar status manualmente.

## O que foi feito
- `scripts/dashboard.js`
  - Novo endpoint `/api/triggers` com GET/POST/PATCH/DELETE.
  - Persistencia simples em `runs/triggers.json`.
- Frontend React (`frontend/`)
  - Nova aba Triggers com formulario e lista de gatilhos.
  - Acoes de Start/Stop/Success/Error/Delete.
- `HOWTO.md`
  - Secao de uso dos triggers.

## Como usar
- Inicie o dashboard: `npm run dashboard`.
- Abra a aba Triggers, preencha o formulario e clique em Create trigger.
- Use Start/Stop/Success/Error para ajustar o status e Logs para abrir o link.

## Observacoes
- A observacao e manual nesta fase (nao ha integracao com provedores externos).
- Os dados ficam em `runs/triggers.json`.
