# Backlog Unico - Produto + GUI

Objetivo geral: evoluir o produto com foco em confiabilidade, reuso e observabilidade, e tornar a GUI autoexplicativa para usuarios nao tecnicos.

Principios
- Clareza: cada plan e step precisa explicar o que faz sem abrir codigo.
- Determinismo: execucao previsivel, com cache e logs segmentados.
- Observabilidade: evidencias e status visiveis em tempo quase real.
- Modularidade: dominios com limites claros e extensao segura.

## Epicos e prioridades
Legenda de status: [DONE] concluido, [PARTIAL] parcial, [TODO] pendente.

### P0 (prioridade alta) - Fundacao e controle
1) Dashboard interativo
- [DONE] Rodar passos no click (start/stop e range de steps).
- [DONE] Melhorar feedback: status por step, tempo decorrido, logs parciais, erros e retries.
- [DONE] Running segmentado por step, com bloco visual destacado e logs agrupados.

2) Dominio de gatilho (event-driven)
- [DONE] Criar dominio separado para configurar gatilhos (ex: EventBridge, cron externo).
- [DONE] Observacao ativa do status com atualizacao em quase tempo real.
- [DONE] Exibir links do logstream no dashboard.
- [DONE] Encerrar observacao automaticamente ao sucesso/erro e permitir parar manualmente.

3) Cache de passos
- [DONE] Evitar reexecucao quando entrada/estado nao mudou.
- [DONE] Definir estrategia de hash para inputs + artefatos utilizados.
- [DONE] Exibir no dashboard quando um step foi pulado por cache.

### P1 (prioridade media) - Qualidade e escala
4) Documentos e evidencias
- [DONE] Usar output de evidencias para montar resultados customizados.
- [DONE] Padrao de template para relatorios simples e exportavel.

5) Customizacao de input
- [DONE] Suporte a env e overrides por plan.
- [DONE] Precedencia clara: env > plan > defaults.
- [DONE] Validacao e mensagens de erro amigaveis.

6) Fluxo do browser
- [DONE] Reduzir uso de wait.
- [DONE] Evitar fechar/abrir em scroll; fluxo mais unificado.
- [DONE] Instrumentar tempo de cada acao para diagnostico.

7) Loop de tarefas
- [DONE] Repeticao de passos com lista de inputs.
- [DONE] Mecanismo de iteracao simples e seguro.
- [DONE] Relatorio por item processado.

### P2 (prioridade baixa) - Organizacao e especializacao
8) Dominios e subdominios
- [DONE] Solidificar limites entre dominios.
- [DONE] Criar subdominios especializados (ex: CLI para logs AWS).

9) Dominio "especialista"
- [DONE] API para tarefas muito especificas e recorrentes.
- [DONE] Evitar sobrecarregar o dominio de CLI.
- [DONE] Catalogo de funcoes utilitarias com exemplos.

10) Massa de teste
- [DONE] Criar exemplos mais solidos e realistas.
- [DONE] Padronizar implementacao de exemplos e fixtures.

## Backlog detalhado por area

### GUI/Dashboard
- Cards de plan com lista de steps: tipo, descricao e artefatos usados.
- Painel Running com blocos por step e logs associados. [DONE]
- Controles de execucao por range no card do plan. [DONE]
- Feedback visual de cache hit/miss. [DONE]
- Montador de relatorio com preview e selecao de evidencias multi-run. [DONE]
- Indicador de status do gatilho (observando, sucesso, erro, parado). [DONE]
- Links para evidencias e logstream. [DONE]
- Filtros basicos de log por step e por nivel. [DONE]

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
- Adicionar flags --from/--to no CLI. [DONE]
- Executar somente o range solicitado e manter numeracao original do plan. [DONE]
- Integrar cache de passos com indicacao de skip. [DONE]
- Expor metadados de execucao por step para a GUI. [DONE]

### Evidencias e docs
- Padrao de evidencias por tipo (sql, curl, script, behavior). [DONE]
- Templates de relatorio simples por plan (JSON + HTML/DOCX). [DONE]
- Opcao de exportar resultado consolidado (HTML/DOCX) a partir do template. [DONE]

### Dominios
- Especificar fronteiras e contratos de cada dominio.
- Subdominios especializados onde fizer sentido.
- Dominio "especialista" com funcoes utilitarias frequentes.

### Testes
- Teste automatizado: executar range e garantir que apenas steps dentro do range rodam.
- Testes de cache: mesma entrada nao reexecuta.
- Testes de docs/evidencias: relatorio gerado com artefatos. [DONE]
- Testes de gatilhos (mock): status e atualizacao. [DONE]
- Smoke manual: dashboard exibindo detalhes e rodando range. [DONE]

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
