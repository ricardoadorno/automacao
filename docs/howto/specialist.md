# Specialist

## Quando usar
Use o step `specialist` para tarefas utilitarias pequenas que nao sao CLI nem API.

## Tasks disponiveis

- `writeFile`: escreve um arquivo com `content`.
- `appendFile`: adiciona `content` ao final de um arquivo.
- `writeJson`: grava `data` como JSON formatado.

## Exemplos

Write file:
```json
{
  "type": "specialist",
  "config": {
    "specialist": {
      "task": "writeFile",
      "outputPath": "note.txt",
      "content": "run {runId}"
    }
  }
}
```

Append file:
```json
{
  "type": "specialist",
  "config": {
    "specialist": {
      "task": "appendFile",
      "outputPath": "notes.txt",
      "content": "linha extra"
    }
  }
}
```

Write JSON:
```json
{
  "type": "specialist",
  "config": {
    "specialist": {
      "task": "writeJson",
      "outputPath": "data.json",
      "data": { "status": "ok", "count": 3 }
    }
  }
}
```
