# Backlog Unico - Produto + GUI

Objetivo geral: evoluir o produto com foco em confiabilidade, reuso e observabilidade, e tornar a GUI autoexplicativa para usuarios nao tecnicos.

Principios
- Clareza: cada plan e step precisa explicar o que faz sem abrir codigo.
- Determinismo: execucao previsivel, com cache e logs segmentados.
- Observabilidade: evidencias e status visiveis em tempo quase real.
- Modularidade: dominios com limites claros e extensao segura.

## Epicos e prioridades

### P0 (prioridade alta) - Fundacao e controle
1) Dashboard interativo
- Rodar passos no click (start/stop e range de steps).
- Melhorar feedback: status por step, tempo decorrido, logs parciais, erros e retries.
- Running segmentado por step, com bloco visual destacado e logs agrupados.

2) Dominio de gatilho (event-driven)
- Criar dominio separado para configurar gatilhos (ex: EventBridge, cron externo).
- Observacao ativa do status com atualizacao em quase tempo real.
- Exibir links do logstream no dashboard.
- Encerrar observacao automaticamente ao sucesso/erro e permitir parar manualmente.

3) Cache de passos
- Evitar reexecucao quando entrada/estado nao mudou.
- Definir estrategia de hash para inputs + artefatos utilizados.
- Exibir no dashboard quando um step foi pulado por cache.

### P1 (prioridade media) - Qualidade e escala
4) Documentos e evidencias
- Gerar docs automaticamente a partir de plans e steps.
- Usar output de evidencias para montar resultados customizados.
- Padrao de template para relatorios simples e exportavel.

5) Customizacao de input
- Suporte a env e overrides por plan.
- Precedencia clara: env > plan > defaults.
- Validacao e mensagens de erro amigaveis.

6) Fluxo do browser
- Reduzir uso de wait.
- Evitar fechar/abrir em scroll; fluxo mais unificado.
- Instrumentar tempo de cada acao para diagnostico.

7) Loop de tarefas
- Repeticao de passos com lista de inputs.
- Mecanismo de iteracao simples e seguro.
- Relatorio por item processado.

### P2 (prioridade baixa) - Organizacao e especializacao
8) Dominios e subdominios
- Solidificar limites entre dominios.
- Criar subdominios especializados (ex: CLI para logs AWS).

9) Dominio "especialista"
- API para tarefas muito especificas e recorrentes.
- Evitar sobrecarregar o dominio de CLI.
- Catalogo de funcoes utilitarias com exemplos.

10) Massa de teste
- Criar exemplos mais solidos e realistas.
- Padronizar implementacao de exemplos e fixtures.

## Backlog detalhado por area

### GUI/Dashboard
- Cards de plan com lista de steps: tipo, descricao e artefatos usados.
- Painel Running com blocos por step e logs associados.
- Controles de execucao por range no card do plan.
- Feedback visual de cache hit/miss.
- Indicador de status do gatilho (observando, sucesso, erro, parado).
- Links para evidencias e logstream.
- Filtros basicos de log por step e por nivel.

### API
1) /api/plans
- Incluir steps detalhados: index, id, type, description, details, artifacts.
- Gerar descricao automatica quando o plan nao fornece description.
- Carregar behaviors e curl para enriquecer detalhes (actions, metodo/url quando possivel).

2) /api/run
- Aceitar fromStep/toStep (1-based) para execucao parcial.
- Validar range e anexar ao comando npm start.
- Retornar metadados do range no response.

3) /api/triggers (novo)
- CRUD de gatilhos: criar, pausar, remover.
- Status atual e historico recente.
- Link para logs externos.

### Runner/CLI
- Adicionar flags --from/--to no CLI.
- Executar somente o range solicitado e manter numeracao original do plan.
- Integrar cache de passos com indicacao de skip.
- Expor metadados de execucao por step para a GUI.

### Evidencias e docs
- Padrao de evidencias por tipo (sql, curl, script, behavior).
- Templates de relatorio simples por plan.
- Opcao de exportar resultado consolidado.

### Dominios
- Especificar fronteiras e contratos de cada dominio.
- Subdominios especializados onde fizer sentido.
- Dominio "especialista" com funcoes utilitarias frequentes.

### Testes
- Teste automatizado: executar range e garantir que apenas steps dentro do range rodam.
- Testes de cache: mesma entrada nao reexecuta.
- Testes de docs/evidencias: relatorio gerado com artefatos.
- Testes de gatilhos (mock): status e atualizacao.
- Smoke manual: dashboard exibindo detalhes e rodando range.

## Fora de escopo
- Editor visual de plans.
- Execucao em paralelo.

## Criterios de pronto (geral)
- Requisitos documentados e revisados.
- Testes cobrindo comportamento novo.
- Demo simples via exemplos.
- Logs e evidencias acessiveis na GUI.

## Entregaveis por fase
- P0: dashboard interativo + dominio de gatilho + cache de passos.
- P1: docs/evidencias + inputs + browser flow + loop.
- P2: dominios + especialista + massa de teste.

## Riscos e dependencias
- Integracao com provedores de gatilho externos.
- Overhead de cache e invalidacao incorreta.
- Mudancas de API impactando a GUI.

## Perguntas em aberto
- Quais provedores de gatilho sao prioritarios?
- Qual formato de relatorio e mais util para evidencias?
- Ate onde vai o dominio "especialista" sem virar um monolito?
