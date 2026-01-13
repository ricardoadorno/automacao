# HOWTO

Guia rapido para rodar, testar e entender os cenarios principais.

## 1) Instalar browsers do Playwright

Necessario para screenshots reais.

```
npx playwright install
```

Se aparecer "spawn EPERM", rode o terminal com permissao elevada.

## 2) Testes automatizados (Vitest)

Rodar todos os testes:

```
npm test
```

Mapa de testes: `tests/TEST_MAP.md`
E2E real usa Playwright e pode exigir `npx playwright install`.

## 3) Exemplo API com curl

```
npm start -- --plan examples/api/plan.json --out runs
```

## 4) API -> SQLite -> Browser

Fluxo:
- API via curl
- SQL evidence com SQLite
- Browser com retries e captura

Rodar:

```
npm start -- --plan examples/sqlite/plan.json --out runs
```

Se quiser recriar o banco SQLite:

```
node examples/sqlite/init-db.js
```

## 5) Exemplo CLI (sem browser)

```
npm start -- --plan examples/cli/plan.json --out runs
```

Saida esperada:
- `runs/<runId>/steps/01_cli-echo/stdout.txt`
- `runs/<runId>/steps/01_cli-echo/stderr.txt`
- `runs/<runId>/steps/01_cli-echo/metadata.json`

## 6) MySQL + Chrome com sessao (perfil persistente)

Este exemplo demonstra:
- Conexao real com MySQL usando driver `mysql2`
- Browser Chrome com perfil persistente (mantem login entre execucoes)
- Captura de tela de dashboards autenticados

Rodar:
```
npm start -- --plan examples/testando/plan.json --out runs
```

### Configuracao MySQL

O plan usa `adapter: "mysql"` com credenciais diretas:

```json
"sql": {
  "adapter": "mysql",
  "query": "SELECT 1;",
  "mysql": {
    "host": "seu_host",
    "port": 3306,
    "user": "seu_usuario",
    "password": "sua_senha",
    "database": "seu_banco"
  }
}
```

### Perfil persistente do Chrome

Para manter sessoes e logins entre execucoes:

```json
"browser": {
  "channel": "chrome",
  "headless": false,
  "userDataDir": "chrome-profile"
}
```

**Importante:**
- Use um diretorio separado do seu Chrome pessoal (ex: `chrome-profile/` na raiz do projeto)
- Na primeira execucao, faca login manualmente no site durante o timeout
- Nas proximas execucoes, o login estara salvo automaticamente
- Nao use o perfil do Chrome principal (`User Data`) se ele estiver aberto

## 7) Dashboard (interface grafica)

```
npm run dashboard
```

Abra `http://localhost:3000` para listar planos e executar runs por clique.

Se quiser apenas visualizar runs existentes:

```
npm run runs:view
```

## 8) Onde ver os artefatos

Para cada run:
- `runs/<runId>/index.html` (com links para artifacts)
- `runs/<runId>/steps/<nn_stepId>/metadata.json`
- `runs/<runId>/steps/<nn_stepId>/screenshot.png`

SQL evidence adiciona:
- `query.sql`, `result.csv`, `evidence.html`

API e CLI adicionam:
- `evidence.html`

## 9) Captura horizontal com tiles

Para tabelas muito largas, use tiles horizontais:

```json
"config": {
  "browser": {
    "capture": {
      "mode": "tiles",
      "tiles": { "direction": "horizontal", "overlapPx": 120, "waitMs": 200 }
    }
  }
}
```

## 10) Problemas comuns

- "spawn EPERM": execute com permissao elevada.
- Falha por `requires`: indica que a ordem do plano nao satisfaz as dependencias do contexto.
- "ECONNREFUSED" no MySQL: verifique host, porta e credenciais.
- "Executable doesn't exist" no Chrome: feche o Chrome e ajuste `userDataDir`.
