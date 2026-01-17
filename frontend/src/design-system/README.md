# Design System

Biblioteca de componentes e tokens do dashboard de automacao. Este sistema foca em consistencia visual, reutilizacao e velocidade de manutencao, sem marketing UI e sem graficos.

## Tokens

Tokens vivem em:
- `src/styles/tokens.css`
- `src/styles/theme.css`

Use `var(--token)` em todos os componentes (cores, tipografia, radius e sombras).

## Conceito

- Fonte unica de verdade: tokens CSS como base para cor, tipografia, espacamento, radius e sombra.
- Componentes desacoplados: cada componente possui CSS proprio e API pequena.
- Fidelidade ao UI.md: nao inventar paletas novas e manter estados e proporcoes.
- Foco em app interno: listas, tabelas, cards, filtros, modais e drawers.

## O que foi implementado

- Tokens oficiais e tema base aplicados no global (`styles.css` importa tokens + theme).
- AppShell com Topbar e Sidebar, incluindo comportamento responsivo do menu lateral.
- Componentes base (Button, Badge, Card, Input, Select, Table, Modal).
- Toast com layout rico, tons semanticos e auto-dismiss.
- Roteamento via `react-router-dom` com navegação no sidebar.

## Componentes

Importe do index:

```
import { Button, Card, Badge, Input, Select, Table, Modal, Topbar, Sidebar, AppShell } from "../design-system";
```

### Button

```
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost" size="sm">Editar</Button>
<Button variant="danger" size="sm">Excluir</Button>
```

### Card + Badge

```
<Card>
  <div className="card__header">
    <Badge variant="success">Ativo</Badge>
    <h3 className="card__title">Automacao</h3>
  </div>
</Card>
```

### Input + Select

```
<Input label="Nome" placeholder="Digite" />
<Select label="Status">
  <option value="ativo">Ativo</option>
  <option value="pausado">Pausado</option>
</Select>
```

### Modal

```
<Modal open={open} title="Detalhes" onClose={() => setOpen(false)}>
  <p>Conteudo do modal.</p>
</Modal>
```

### AppShell

```
<AppShell
  topbar={<Topbar>...</Topbar>}
  sidebar={<Sidebar>...</Sidebar>}
>
  <div>Conteudo</div>
</AppShell>
```

### Toast

Uso em `App.tsx` com helper `showToast`:

```
showToast({ title: "Sucesso", message: "Execucao iniciada.", tone: "success", durationMs: 5000 });
showToast({ title: "Erro", message: "Falha ao carregar.", tone: "error", durationMs: 7000 });
```

## Regras

- Sem cores novas dominantes; use tokens.
- Labels em PT-BR.
- Sem charts e sem marketing UI.
 - Evitar HEX direto em componentes (so quando o UI.md ja usa).
 - Componentes devem respeitar estados hover/focus/disabled.

## Estrutura

- `src/design-system/components/*` componentes e estilos locais
- `src/design-system/layout/AppShell/*` layout base
- `src/design-system/index.ts` export centralizado

## Decisoes e alinhamento

- Topbar nao e sticky; acompanha o fluxo da pagina.
- Sidebar vira drawer no mobile, com backdrop e botao de navegacao no topbar.
- Toast fica no canto superior direito com z-index alto para nao ser escondido.
