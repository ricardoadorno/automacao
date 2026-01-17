---
name: automation-design-system
description: Criar ou evoluir um Design System reutilizavel no frontend do app de automacao com base no artefato UI.md (tokens + HTML/CSS do Stitch). Use quando for necessario implementar tokens globais, componentizar UI (Button, Card, Modal, Table, Sidebar/Topbar), padronizar estilos ou criar paginas de exemplo sem marketing UI ou graficos.
---

# Automation Design System

## Overview

Evoluir o Design System do app a partir do artefato `UI.md`, garantindo fidelidade visual, componentes reutilizaveis e uso de tokens como fonte unica de verdade. Produzir codigo pronto para producao, com paginas demo focadas em app interno de automacao.

## Entradas obrigatorias

- Ler o artefato `UI.md` na raiz do repositorio.
- Ler `references/ui-artifact.md` para tokens e seletores base.
- Inspecionar o frontend atual para identificar stack e padrao de estilos (Vite/React, Tailwind, CSS Modules, Styled, etc).

## Saidas esperadas

- `src/styles/tokens.css` com variaveis CSS (fonte unica).
- `src/styles/theme.css` com estilos base (body, headings, links).
- `src/design-system/` com componentes, layout e `index.ts`.
- Paginas demo em PT-BR, sem backend real, usando os componentes.
- `src/design-system/README.md` com guia minimo de uso.

## Workflow

1) Detectar stack
- Ler `package.json` e a entrada do app (`main.tsx`, `_app.tsx`, etc).
- Identificar se existe Tailwind, CSS Modules, Styled Components ou outro.

2) Consolidar tokens
- Extrair tokens de `UI.md` e registrar em `src/styles/tokens.css`.
- Evitar duplicacao de paletas (especialmente Tailwind).
- Mapear quaisquer utilitarios para usar `var(--token)` ao inves de hex direto.
- Se houver hex em estados nos snippets, criar tokens derivados ou manter local sem expandir a paleta.

3) Aplicar tema base
- Criar `src/styles/theme.css` com estilos globais usando tokens.
- Garantir importacao global no ponto correto do app.

4) Construir componentes base
- Implementar Button, Card, Badge, Input, Select, Table, Modal, Topbar, Sidebar.
- Usar variaveis CSS para cor, fonte, radius, sombra e espacamento.
- Incluir estados hover, focus, disabled e active.
- Manter acessibilidade minima (aria, focus visivel).

5) Implementar AppShell
- Criar layout com Sidebar + Topbar + conteudo.
- Sidebar fixa no desktop e drawer no mobile.

6) Criar paginas demo
- Automacoes, Fila de Execucao, Historico e Logs.
- Sem charts, sem marketing, sem Kanban.

7) Validar consistencia
- Nenhum HEX hardcoded (exceto status previstos).
- Tipografia, radius e sombras vindos de tokens.
- Labels em PT-BR.

## Contratos minimos de componentes

- Button
  - variantes: `primary | secondary | ghost`
  - tamanhos: `sm | md`
  - `disabled` e icone opcional
- Card
  - borda + `shadow-subtle` + `radius-md`
- Badge
  - variantes `success | error | warning`
- Modal
  - overlay semitransparente + `shadow-modal` + scroll interno

## Regras obrigatorias

- Fidelidade visual total ao `UI.md`.
- Sem novas cores dominantes e sem trocar fonte base.
- Sem Kanban, sem hero banners, sem secoes promocionais, sem charts.
- Foco em listas, tabelas, cards, filtros, modais e drawers.

## Referencias

- Ler `references/ui-artifact.md` antes de tocar nos tokens e componentes.

## Checklist final

- `tokens.css` aplicado globalmente.
- Biblioteca em `src/design-system` com index exportando componentes.
- AppShell integrado nas paginas demo.
- Pelo menos 3 paginas demo usando os componentes.
