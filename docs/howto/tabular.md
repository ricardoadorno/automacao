# Tabular (CSV/XLSX)

Use este step para visualizar documentos tabulados, aplicar filtros e gerar evidencia com screenshot.

## Quando usar
- Precisa abrir CSV/XLSX com busca e filtros simples.
- Quer gerar um HTML navegavel para revisar dados no browser.
- Precisa capturar print da visualizacao.

## Configuracao

```json
{
  "type": "tabular",
  "description": "Planilha de cadastro",
  "config": {
    "tabular": {
      "sourcePath": "scenarios/fluxo/data.csv",
      "format": "csv",
      "delimiter": ",",
      "maxRows": 500,
      "viewer": {
        "mode": "lite",
        "title": "Cadastro de clientes"
      },
      "capture": {
        "enabled": true,
        "fullPage": true
      }
    }
  }
}
```

## Campos principais

- `sourcePath` (obrigatorio): caminho para `.csv` ou `.xlsx`.
- `format` (opcional): `csv` ou `xlsx` (detectado pela extensao por padrao).
- `delimiter` (CSV): separador de colunas (default `,`).
- `sheet` (XLSX): nome ou indice da aba.
- `maxRows`: limita o numero de linhas renderizadas no viewer.
- `viewer.mode`: `lite` (sem dependencias externas) ou `tabulator` (mais recursos).
- `viewer.title`: titulo no topo do viewer.
- `capture.enabled`: default `true`.
- `capture.fullPage`: default `true`.

## Viewer e filtros

- Busca global (todas as colunas).
- Filtro por coluna (contém).
- Ordenacao clicando no cabecalho (modo `lite`).

Para automacoes no browser, o viewer expõe:

```js
window.tabularApi.setGlobalFilter("ana");
window.tabularApi.setColumnFilter(2, "SP");
window.tabularApi.clearFilters();
```

## Dependencias de rede

- `viewer.mode=tabulator` usa Tabulator via CDN.
- Arquivos `.xlsx` usam SheetJS via CDN.

Se sua execucao nao tiver acesso a internet, prefira `viewer.mode=lite` com `.csv`.

## Evidencias geradas

- `viewer.html`: visualizacao interativa.
- `screenshot.png`: captura do viewer (quando `capture.enabled`).
- copia do arquivo de origem dentro do step.
