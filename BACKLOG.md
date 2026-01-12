# Backlog guiado por cenarios (TDD)

A ordem e a ordem de implementacao.

## P0 - sistema minimo funcionando

Cenario P0.1: Run gera pacote com 1 step browser

- Dado um plano com 1 step browser simples
- Quando o agente executa
- Entao cria pasta do run com print e metadata
- E cria index.html com 1 item OK

Implementa: loader, validacao, output, report, step browser basico

Cenario P0.2: Falha controlada gera evidencia de erro

- Dado um selector invalido no behavior
- Quando o agente executa
- Entao gera error.json + error.png
- E report marca FAIL
- E exit code indica falha

Implementa: captura de erro, screenshot em falha, fail policy

## P1 - SQL verificavel

Cenario P1.0: SQL desacoplado por arquivos (mock)

- Dado query.sql e result.csv anexados no step
- Quando step sqlEvidence executa
- Entao processa os arquivos sem conectar a banco
- E deixa claro que adapters de banco sao opcionais

Implementa: leitura de arquivos, normalizacao de formatos, interface de adapter (sem dependencia)

Cenario P1.1: SQL evidence gera print e metadados simples

- Dado query.sql e result.csv
- Quando step sqlEvidence executa
- Entao copia arquivos, gera HTML, tira print
- E inclui metadados simples (hora da query, tabela inferida)

Implementa: renderizacao HTML, screenshot de file URL

Cenario P1.2: SQL valida expectativa de resultado

- Dado preset dizendo "deve retornar 1 linha"
- Quando result tem 0 ou >1 linhas
- Entao step falha com diagnostico claro

Implementa: validacoes de CSV e mensagens uteis

## P2 - variaveis e encadeamento

Cenario P2.1: Step exporta variavel de SQL e step seguinte consome

- Dado sqlEvidence exporta pedidoId do CSV
- E step browser requer pedidoId
- Quando executa
- Entao o browser preenche filtro com {pedidoId} e tira print

Implementa: context, requires, exports, template resolver

Cenario P2.2: Step swagger exporta id do response

- Dado behavior do Swagger executa uma operacao
- E exports extrai id do texto do response por regex/JSONPath
- Quando executa
- Entao pedidoId fica no contexto
- E proximo step usa esse valor

Implementa: extractors para texto do DOM e parsing JSON

Cenario P2.3: Dependencia ausente falha cedo

- Dado step requer correlationId
- Quando ela nao existe no contexto
- Entao falha imediatamente e registra motivo

Implementa: verificacao de requires antes de abrir pagina

## P3 - OpenAPI integrado com Swagger UI

Cenario P3.1: valida operationId

- Dado step swagger com operationId inexistente
- Quando roda
- Entao falha sem abrir browser e escreve error.json

Implementa: leitura OpenAPI e validacao

Cenario P3.2: localizar operacao e capturar print

- Dado operationId valido
- Quando roda
- Entao comportamento abre e evidencia o endpoint no Swagger UI

Implementa: behaviors swagger e convencoes de navegacao

## P4 - CloudWatch robusto

Cenario P4.1: usar startedAt e retries

- Dado startedAt foi capturado no step POST
- Quando step cloudwatch roda
- Entao aplica time range e filtro por correlationId
- E tenta N vezes ate encontrar logs ou expirar
- E gera print final

Implementa: retry policy por behavior, esperas e recarregamentos

## P5 - CLI runner (novo dominio)

Cenario P5.1: Executar comando simples e registrar logs

- Dado step cli com command e cwd
- Quando executa
- Entao roda o comando no diretorio indicado
- E gera stdout.txt, stderr.txt e metadata com exitCode e duracao

Implementa: executor de comando, timeout, artefatos de log

Cenario P5.2: Inputs de contexto e exports por log

- Dado step cli com command usando {placeholders}
- E exports extrai valores de stdout por regex/JSONPath
- Quando executa
- Entao context recebe os outputs

Implementa: template resolver + export rules para logs

Cenario P5.3: Pipeline de comandos em um unico step

- Dado step cli com sequencia de comandos (pre, script, post)
- Quando pre baixa arquivo do S3 (aws s3 cp)
- E script transforma o arquivo
- E post faz upload para o S3
- Entao o step conclui como OK se todas as etapas sucedem

Implementa: sequenciamento dentro do step, compartilhamento de cwd e artefatos

Cenario P5.4: Heuristica de erro robusta

- Dado um comando que retorna exitCode != 0
- Ou stderr contem padroes de erro (error, failed, fatal, exception)
- Ou successCriteria nao e atendido
- Quando step cli executa
- Entao marca FAIL e nao continua o fluxo

Implementa: regras de erro configuraveis e classificacao do erro

Cenario P5.5: AWS CLI e credenciais

- Dado step cli que usa aws cli com variaveis de ambiente
- Quando executa
- Entao redige segredos dos logs
- E falha com mensagem clara se credenciais estiverem faltando

Implementa: redacao de segredos e validacao de env
