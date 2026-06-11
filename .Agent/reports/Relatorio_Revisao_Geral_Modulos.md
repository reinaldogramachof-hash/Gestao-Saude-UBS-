# Relatorio de Revisao Geral de Modulos

**Projeto:** Gestao Saude UBS+  
**Data da revisao:** 11/06/2026  
**Escopo:** leitura estatica completa dos arquivos de backend, banco, frontend, componentes e paginas indicados no comando, confrontada com `CLAUDE.md`, requisitos funcionais e documentacao tecnica.  
**Natureza da entrega:** auditoria e plano de evolucao. Nenhuma funcionalidade foi alterada.

## Resumo executivo

O projeto possui uma base funcional relevante: autenticacao JWT, separacao dos portais, isolamento correto do paciente na maioria das consultas, CRUDs principais, layouts responsivos e bundle de producao compilando. Entretanto, o status registrado como "MVP completo" em `.Agent/Inicio_de_Sessao.md` nao e sustentado pelo codigo atual.

Os maiores bloqueadores sao:

1. Um gestor pode atualizar o status de uma solicitacao de outra UBS se conhecer o ID.
2. A API de detalhe do paciente devolve a linha inteira de `solicitacoes`, incluindo `observacao_gestor`, definida no modelo como nota interna.
3. Contas marcadas como inativas continuam autenticando.
4. Os perfis `recepcionista`, `gestor` e `admin` nao possuem autorizacao diferenciada.
5. Os logins nao possuem limitacao de tentativas.
6. Dependencias de producao apresentam vulnerabilidades classificadas como altas pelo `npm audit`.

Conclusao: a aplicacao esta em nivel **Parcial avancado**, demonstravel em ambiente controlado, mas ainda nao pronta para uso com dados reais nem para deploy publico.

## Metodologia e validacoes

- Leitura de `CLAUDE.md`, briefing da sessao, relatorio anterior, requisitos, arquitetura e modelo de dados.
- Leitura dos 8 arquivos de migration, seed, conexao Knex, middleware, servidor e rotas.
- Leitura do roteamento, contexto de autenticacao, cliente HTTP, layouts, componentes e 13 paginas React.
- `npm.cmd run build` no frontend: **aprovado**; 107 modulos transformados.
- `node --check` nos 17 arquivos JavaScript do backend: **aprovado**.
- `npm audit --omit=dev --audit-level=high`:
  - backend: 7 vulnerabilidades, sendo 3 altas e 4 moderadas;
  - frontend: 3 vulnerabilidades, sendo 1 alta e 2 moderadas.
- Nao existem scripts de teste ou lint nos `package.json`.
- Nao foi executado teste end-to-end contra o banco remoto, nem validacao visual real em 375 px.

# Secao 1 - Inventario de modulos

| Modulo | Backend | Frontend | Implementado e funcionando | Incompleto / placeholder | Cobertura |
|---|---|---|---|---|---|
| Login do gestor | `routes/auth.js:28-66` | `LoginGestor.jsx` | E-mail, bcrypt, JWT e feedback de erro | Nao verifica `ativo`, sem rate limit, sessao de 8h diverge da arquitetura (12h gestor) | Parcial |
| Login do paciente | `routes/auth.js:72-104` | `LoginPaciente.jsx` | CRA + nascimento, JWT e mensagem generica | Nao verifica `ativo`, sem rate limit, token de 12h diverge do requisito de 8h | Parcial |
| Dashboard do gestor | `routes/gestor.js:356-406` | `DashboardGestor.jsx` | Metricas reais e atividade recente | Erro e descartado; nao implementa relatorio RF-G09 completo | Parcial |
| Lista/cadastro de pacientes | `routes/gestor.js:54-79,241-307` | `GestorPacientes.jsx` | Busca, lista, cadastro e edicao via API | UI nao edita; filtros obrigatorios ausentes; so carrega primeira pagina; e-mail esperado pela UI nao vem da API | Parcial |
| Perfil e solicitacoes | `routes/gestor.js:85-156,313-350` | `PerfilPaciente.jsx` | Perfil, criacao e mudanca de status | Sem historico no perfil, sem comunicados, fluxo de status livre, criacao nao grava historico inicial | Parcial |
| Medicamentos do gestor | `routes/gestor.js:161-236` | `MedicamentosGestor.jsx` | Lista e alterna disponibilidade | UI nao adiciona medicamento nem edita observacao, apesar de a API suportar inclusao | Parcial |
| Comunicados do gestor | `routes/gestor.js:412-495` | `ComunicadosGestor.jsx` | Lista, cria geral/individual e exclui | Destinatarios limitados aos 20 primeiros; individual sem paciente pode virar registro invisivel; exclusao sem confirmacao | Parcial |
| Agenda do gestor | `routes/gestor.js:501-618` | `AgendamentosGestor.jsx` | Cria, lista, conclui, cancela e exclui slot livre | Sem validacao de data, duracao, status e responsavel; nao impede sobreposicao | Parcial |
| Dados/dashboard do paciente | `routes/paciente.js:39-99` | `DashboardPaciente.jsx` | Dados da UBS e solicitacoes do paciente | Urgentes nao sobem ao topo; concluidas ficam indefinidamente; texto tecnico e status bruto aparecem | Parcial |
| Detalhe da solicitacao | `routes/paciente.js:106-127` | `DetalheSolicitacao.jsx` | Detalhe e timeline | API expoe campos internos; solicitacao nasce sem evento inicial; falha de API deixa skeleton infinito | Parcial |
| Medicamentos do paciente | `routes/paciente.js:133-145` | `Medicamentos.jsx` | Lista por UBS e mostra disponibilidade | Sem busca parcial, sem data da atualizacao, sem estado de erro | Parcial |
| Comunicados do paciente | `routes/paciente.js:150-166` | `ComunicadosPaciente.jsx` | Gerais da UBS e individuais do paciente | Nao existe leitura/nao leitura nem feedback de erro | Parcial |
| Agenda do paciente | `routes/paciente.js:172-242` | `AgendamentosPaciente.jsx` | Lista slots, reservas e historico do paciente | Reserva sujeita a corrida; motivo e opcional contra RF-P05; falha de carga e silenciosa | Parcial |
| Layouts e roteamento | `server.js`, `App.jsx`, layouts | Ambos os portais | Rotas protegidas por tipo e layouts responsivos | Sem rota 404, expiracao nao e validada ao restaurar sessao, 401 sempre redireciona ao login do paciente | Parcial |
| Banco e migrations | migrations 001-008 | N/A | Entidades e relacionamentos principais existem | Constraints de dominio insuficientes, sem indices de consulta, sem controle de leitura de comunicados | Parcial |

# Secao 2 - Bugs e inconsistencias

## Criticos

| ID | Arquivo e linha | Problema | Correcao sugerida |
|---|---|---|---|
| C-01 | `app/backend/src/routes/gestor.js:123-146` | A atualizacao de status busca e altera a solicitacao apenas por `id`, sem `ubs_id`. Um gestor autenticado pode alterar solicitacao de outra UBS. | Buscar e atualizar com `id` + `ubs_id`; validar tambem o paciente; manter tudo na mesma transacao. |
| C-02 | `app/backend/src/routes/paciente.js:108-122`; `007_create_solicitacoes.js:25`; `DetalheSolicitacao.jsx:61-63` | A API retorna `solicitacoes.*`, incluindo `observacao_gestor`, definida como nota interna, alem da descricao tecnica. E violacao do contrato de minimizacao e pode expor informacao sensivel. | Usar `select` explicito apenas com campos destinados ao paciente e DTO separado. |
| C-03 | `app/backend/src/routes/auth.js:36-48,80-88` | Gestores e pacientes com `ativo = false` continuam conseguindo login. O mecanismo de revogacao cadastral nao funciona. | Incluir `ativo: true` nas consultas e retornar credencial generica invalida. |
| C-04 | `app/backend/src/routes/gestor.js:38-48` | O sistema carrega `perfil`, mas qualquer token do tipo gestor pode cadastrar, editar, excluir e concluir operacoes. `recepcionista`, `gestor` e `admin` sao equivalentes. | Implementar middleware de autorizacao por perfil e matriz de permissoes. |
| C-05 | `app/backend/src/routes/auth.js:28-104`; `server.js:27-29` | Nao ha rate limiting, atraso progressivo ou bloqueio para login. CRA + data de nascimento e um segredo de baixa entropia e permite tentativa automatizada contra dados pessoais. | Adicionar rate limit por IP e identificador, logs de tentativa e bloqueio temporario. |
| C-06 | `app/backend/package-lock.json`; `app/frontend/package-lock.json` | `npm audit` encontrou 3 vulnerabilidades altas no backend (`bcrypt`/`node-tar`) e 1 alta no frontend (`axios`), alem de vulnerabilidades moderadas. | Atualizar dependencias em branch propria, revisar breaking changes e repetir build/testes/audit. |

## Medios

| ID | Arquivo e linha | Problema | Correcao sugerida |
|---|---|---|---|
| M-01 | `app/backend/src/routes/paciente.js:213-235` | A reserva consulta o slot e depois atualiza por ID. Duas requisicoes simultaneas podem reservar o mesmo horario; o comentario de protecao contra corrida nao corresponde ao codigo. | Fazer `UPDATE ... WHERE id=? AND status='disponivel' AND ubs_id=? RETURNING *` e exigir uma linha alterada. |
| M-02 | `app/backend/src/routes/gestor.js:330-345` | A criacao de solicitacao nao grava o evento inicial em `historico_status`; a timeline nasce vazia. | Inserir solicitacao e historico inicial na mesma transacao. |
| M-03 | `app/backend/src/routes/paciente.js:84-94` | O comentario promete ocultar concluidas antigas, mas a query exclui apenas canceladas. Concluidas permanecem entre as "ativas". | Separar endpoint/consulta de ativas e historico, com regra temporal explicita. |
| M-04 | `app/backend/src/routes/gestor.js:115-154`; `PerfilPaciente.jsx:277-280` | O gestor pode saltar ou retroceder para qualquer status. `data_conclusao`, `data_prevista` e `observacao_paciente` nao sao atualizadas no fluxo. | Centralizar maquina de estados e campos obrigatorios por transicao. |
| M-05 | `app/backend/src/routes/*.js`; `app/backend/package.json` | Joi esta instalado e declarado na arquitetura, mas nenhuma rota usa schema. Tipos, tamanhos, datas e enums chegam sem validacao consistente. | Criar schemas Joi por operacao e middleware comum de validacao. |
| M-06 | `app/backend/src/routes/gestor.js:441-466` | `tipo='individual'` sem `paciente_id` e aceito e gera comunicado individual com destinatario nulo, invisivel ao paciente. Outros valores de `tipo` tambem passam. | Validar enum e exigir paciente para comunicacao individual. |
| M-07 | `app/backend/src/routes/gestor.js:536-582` | Agenda aceita horario passado, duracao invalida, status arbitrario e `gestor_responsavel_id` de outra UBS. | Validar dominio, futuro, responsavel da UBS e transicoes permitidas. |
| M-08 | `app/backend/src/routes/gestor.js:54-74`; `ComunicadosGestor.jsx:34-38` | Paginacao nao valida limites e o frontend nunca busca paginas seguintes. O seletor de comunicado individual enxerga, no maximo, 20 pacientes. | Limitar `limite`, retornar metadados e implementar paginacao/autocomplete remoto. |
| M-09 | `GestorPacientes.jsx:30-46,93-103` | RF-G02 exige filtros por status, prioridade e tipo; existe apenas busca por nome/CRA. | Implementar filtros na API e UI, com indices correspondentes. |
| M-10 | `MedicamentosGestor.jsx:33-45`; `routes/gestor.js:212-236` | O backend inclui cadastro e observacao, mas a pagina so alterna disponibilidade. RF-G05 fica incompleto. | Adicionar cadastro e edicao de observacao na UI. |
| M-11 | `Medicamentos.jsx:19-55`; `routes/paciente.js:133-140` | RF-P03 exige busca parcial e data da ultima atualizacao. A tela lista tudo e nao mostra `atualizado_em`. | Adicionar `?busca=`, filtro `ILIKE`, estado vazio e data formatada. |
| M-12 | `005_create_comunicados.js`; `ComunicadosPaciente.jsx:38-61` | Nao existe estrutura para "nao lido", exigida por RF-P04. | Criar tabela de leitura por paciente/comunicado ou campo associativo e endpoint para marcar leitura. |
| M-13 | `routes/gestor.js:85-103`; `PerfilPaciente.jsx:135-197` | RF-G08 pede dados, solicitacoes, historico e comunicados. Perfil retorna apenas paciente + solicitacoes. | Expandir endpoint ou carregar abas dedicadas de historico e comunicados. |
| M-14 | `routes/paciente.js:89-92`; `DashboardPaciente.jsx:47-73` | Solicitacoes urgentes nao sao ordenadas primeiro, contrariando RF-P02. | Ordenar por expressao de prioridade e depois por data. |
| M-15 | `DashboardPaciente.jsx:24-27`; `DetalheSolicitacao.jsx:32-47`; `ComunicadosPaciente.jsx:18-23`; `AgendamentosPaciente.jsx:41-53` | Erros sao ignorados. Em detalhe, a tela pode ficar em skeleton infinito; em outras paginas, falha aparece como lista vazia. | Manter estados `loading/error/empty`, exibir mensagem simples e acao de tentar novamente. |
| M-16 | `app/frontend/src/services/api.js:47-53` | Toda resposta 401 redireciona para `/login-paciente`, inclusive sessao de gestor. | Determinar o portal salvo ou rota atual e redirecionar ao login correto. |
| M-17 | `GestorPacientes.jsx:140-142`; `PerfilPaciente.jsx:140`; demais datas `DATE` | `new Date('YYYY-MM-DD')` e interpretado em UTC e pode exibir o dia anterior em `America/Sao_Paulo`. | Formatar datas puras sem conversao UTC ou usar parser local explicito. |
| M-18 | `app/backend/src/db/knex.js:12-16`; `knexfile.js:13-18` | O runtime da API nao reutiliza a configuracao SSL do `knexfile`. Em Neon/Supabase, a conexao pode falhar mesmo com migrations funcionando. | Exportar configuracao unica por ambiente, incluindo SSL e validacao de `DATABASE_URL`. |
| M-19 | `app/backend/server.js:28`; `docs/02_Arquitetura_Tecnica.md` | `cors()` libera qualquer origem, enquanto a arquitetura exige somente o dominio do frontend. | Configurar allowlist por ambiente e metodos/headers necessarios. |
| M-20 | `app/frontend/src/App.jsx:56-79`; ausencia de `vercel.json` | `BrowserRouter` depende de rewrite para `index.html`. Rotas profundas podem retornar 404 no Vercel. | Adicionar configuracao de rewrite SPA e testa-la no preview/deploy. |
| M-21 | `app/backend/package.json`; `app/frontend/package.json` | Nao ha testes automatizados nem lint. Regras de isolamento LGPD e fluxos transacionais ficam sem regressao automatica. | Adicionar testes de API/integracao e testes de componentes/fluxos criticos. |

## Menores

| ID | Arquivo e linha | Problema | Correcao sugerida |
|---|---|---|---|
| N-01 | `routes/gestor.js:59-64`; `GestorPacientes.jsx:130-133` | A UI tenta mostrar `p.email`, mas a API nao seleciona e-mail; sempre aparece "Sem e-mail". A API seleciona CPF sem uso na tela. | Selecionar e-mail e remover CPF da listagem. |
| N-02 | `DashboardPaciente.jsx:55-63`; `DetalheSolicitacao.jsx:61-63` | Nome tecnico e status burocratico/bruto sao exibidos ao paciente, contrariando linguagem simples. | Remover descricao interna e usar mapa central de textos explicativos. |
| N-03 | `AuthContext.jsx:38-49,71-72` | A sessao restaurada nao verifica a expiracao do JWT; a interface considera token expirado como autenticado ate a primeira chamada. | Decodificar `exp` ou validar sessao no backend antes de liberar rotas. |
| N-04 | `LoginGestor.jsx:29-31`; `LoginPaciente.jsx:29-31`; `AuthContext.jsx:56-60` | `res.data` inclui o token e e salvo inteiro como usuario, duplicando o JWT em `@UBS_User`. | Remover `token` antes de persistir os dados do usuario. |
| N-05 | `BottomNavPaciente.jsx:27-32` | A barra usa `absolute`, nao acompanha o viewport em paginas longas e so aparece no fim do conteudo. | Usar `sticky`/`fixed` limitado ao container ou validar conscientemente o comportamento desejado. |
| N-06 | `App.jsx:57-79` | Nao existe rota coringa/404; URLs invalidas renderizam pagina vazia. | Adicionar pagina de nao encontrado e retorno ao portal correto. |
| N-07 | `DashboardGestor.jsx`, `PerfilPaciente.jsx`, `DetalheSolicitacao.jsx`, paginas de agenda | Mapas de status, rotulos e cores estao duplicados e ja divergem em texto/cor. | Centralizar constantes por dominio. |
| N-08 | `app/frontend/index.html:8-20` | Fontes e icones dependem de Google Fonts em tempo de execucao, afetando disponibilidade, privacidade e CSP. | Hospedar fontes/icones localmente ou documentar politica externa e fallback. |
| N-09 | `docs/02_Arquitetura_Tecnica.md`, `docs/03_Modelo_de_Dados.md`, `docs/05_Roadmap.md` | Documentos ainda dizem "aguardando implementacao"/Fase 1, enquanto o briefing declara Fase 2 completa; tambem alternam Supabase, Railway e Neon. | Atualizar documentacao viva e escolher uma fonte oficial para infraestrutura. |

# Secao 3 - Gaps de funcionalidade

## Portal do paciente

1. **RF-P02:** falta ordenacao de urgentes, texto explicativo por status e separacao correta entre ativas e historico.
2. **RF-P03:** falta busca parcial, data da ultima atualizacao e estado de erro.
3. **RF-P04:** falta indicador e persistencia de lido/nao lido.
4. **RF-P05:** motivo deveria ser solicitado; hoje e opcional no frontend e backend.
5. **RF-P06:** nao existe pagina/endpoint separado de historico concluido/cancelado.
6. **RF-P07:** atualizacao de telefone/e-mail nao foi implementada.
7. Nao ha logout visivel no portal do paciente.
8. Nao ha recuperacao amigavel de falhas de rede nas paginas principais.

## Portal do gestor

1. **RF-G01:** perfis existem no token/banco, mas nao controlam permissoes.
2. **RF-G02:** faltam filtros por status, prioridade e tipo, alem de indicador de urgencia por paciente.
3. **RF-G04:** falta maquina de estados, historico inicial e atualizacao consistente de datas/observacao do paciente.
4. **RF-G05:** UI nao cadastra medicamento nem edita observacao.
5. **RF-G07:** nao ha validacao de conflitos/sobreposicao nem selecao segura de gestor responsavel.
6. **RF-G08:** perfil nao mostra historico nem comunicados e nao oferece edicao cadastral.
7. **RF-G09:** existe resumo parcial, mas nao ha distribuicao completa nem urgentes paradas ha mais de 7 dias.
8. Backend de edicao de paciente existe sem frontend correspondente.

## Validacoes e estados ausentes

- Datas futuras/passadas, formatos de CRA/CPF/telefone, tamanhos maximos e enums.
- Limite de payload JSON e sanitizacao/normalizacao de entradas.
- Constraints para `perfil`, `tipo`, `prioridade`, status de agenda e tipo de comunicado.
- Prevencao de duplicidade/sobreposicao de agenda.
- Estado de erro com nova tentativa em todas as consultas do paciente.
- Confirmacao antes de exclusoes destrutivas.
- Paginacao completa, total de registros e limite maximo.

# Secao 4 - Qualidade de codigo

## Comentarios

Os arquivos de codigo possuem comentarios em quantidade elevada e, em geral, cumprem a intencao didatica do `CLAUDE.md`. Ha, porem, comentarios incorretos ou desatualizados:

- `paciente.js:86` descreve regra de 30 dias que nao existe.
- `paciente.js:222` afirma proteger contra race condition sem update atomico.
- `auth.js:27,71` e a documentacao divergem sobre duracao dos tokens.
- `routes/index.js` descreve montagem que nao e usada por `server.js`.

Classificacao: **Parcial**. A presenca e boa, mas comentarios falsos elevam o risco para membros juniores.

## Duplicacao

- Mapas de status/cores aparecem em varias paginas.
- Estados de carregamento, chamadas `api.get` e tratamento de erro sao repetidos sem padrao.
- Modais repetem estrutura, overlay, cabecalho e botoes.
- Formatacao de datas e repetida com abordagens diferentes.

## Tratamento de erros

- Backend retorna majoritariamente `{ error }`, divergindo do formato documentado `{ success, error, message }`.
- Frontend alterna entre toast, mensagem inline, erro silencioso e skeleton infinito.
- Nao ha middleware global de erro no Express.
- Nao ha logs estruturados, ID de correlacao ou separacao de erro operacional.

## Seguranca

- Rotas dos portais exigem JWT e validam `tipo`, ponto positivo.
- Consultas do paciente normalmente usam `req.user.id`, ponto positivo.
- Ha quebra de isolamento por UBS na atualizacao de status.
- Nao ha RBAC, rate limit, verificacao de conta ativa ou CORS restrito.
- JWT fica em `localStorage`, ficando acessivel a qualquer XSS.
- Respostas usam `select *` em pontos sensiveis e devolvem mais dados que a UI necessita.
- Dependencias possuem vulnerabilidades altas conhecidas.

## Responsividade

O codigo usa breakpoints mobile-first, drawers, grids adaptativos, modais com largura maxima e tabelas com scroll. A estrutura aparenta suportar 375 px. Pontos pendentes:

- nao houve teste visual real em 375 px;
- tabelas de 480/640 px exigem scroll horizontal;
- barra inferior absoluta pode ficar fora do viewport;
- textos longos, teclado virtual e alturas pequenas de tela nao foram validados;
- botoes apenas com icone nao possuem `aria-label`.

# Secao 5 - Plano de evolucao

## Fase 2.1 - Correcoes imediatas

| Prioridade | Correcao | Esforco |
|---|---|---|
| 1 | Fechar atualizacao de solicitacao por `id + ubs_id` e criar testes de isolamento | Baixo |
| 2 | Criar DTOs/selects explicitos para paciente e remover campos internos | Medio |
| 3 | Bloquear login de contas inativas e implementar RBAC | Medio |
| 4 | Adicionar rate limit nos logins e CORS por allowlist | Baixo |
| 5 | Tornar reserva de agenda atomica | Medio |
| 6 | Aplicar validacao Joi em autenticacao e operacoes de escrita | Medio |
| 7 | Corrigir conexao SSL unica do Knex e validar variaveis no startup | Baixo |
| 8 | Atualizar dependencias vulneraveis com testes de regressao | Medio |
| 9 | Corrigir redirecionamento 401 por portal e estados de erro silenciosos | Baixo |
| 10 | Corrigir datas `DATE` e padronizar timezone | Medio |

## Fase 2.2 - Completar funcionalidades

1. Entregar primeiro a experiencia do paciente: busca de medicamentos, data de atualizacao, mensagens de erro e linguagem simples.
2. Implementar comunicados lidos/nao lidos.
3. Separar solicitacoes ativas do historico e ordenar urgentes.
4. Completar fluxo de solicitacao com maquina de estados, historico inicial e campos por transicao.
5. Completar perfil do gestor com historico, comunicados e edicao cadastral.
6. Implementar filtros RF-G02 e paginacao real.
7. Completar medicamentos do gestor com cadastro e observacao.
8. Validar agenda: motivo, conflitos, responsavel, datas e transicoes.
9. Implementar logout do paciente e pagina 404.
10. Completar dashboard RF-G09.

## Fase 2.3 - Melhorias de qualidade

1. Criar suite de testes:
   - autenticacao ativa/inativa;
   - isolamento entre UBSs;
   - isolamento entre pacientes;
   - transacao de status/historico;
   - concorrencia de reserva;
   - comunicados gerais/individuais.
2. Adicionar ESLint, formatacao e pipeline CI.
3. Centralizar status, textos simples, cores e formatadores.
4. Padronizar resposta da API e middleware de erros.
5. Criar componentes comuns para loading, erro, vazio e modal.
6. Revisar comentarios incorretos e reduzir comentarios que narram apenas JSX visual.
7. Adicionar indices para chaves de filtro e ordenacao.
8. Testar acessibilidade e telas reais em 375 px.
9. Atualizar toda a documentacao para refletir banco e hosting efetivos.

## Fase 3 - Deploy

### Frontend - Vercel

- Definir `VITE_API_URL` incluindo o prefixo `/api`.
- Adicionar rewrite SPA para `BrowserRouter`.
- Restringir origem no CORS do backend ao dominio Vercel e previews autorizados.
- Executar build limpo e teste das rotas profundas.
- Definir estrategia para Google Fonts/Material Symbols e CSP.
- Validar responsividade, acessibilidade e falhas de rede no ambiente publicado.

### Backend - Railway/Render

- Definir `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` forte e allowlist CORS.
- Falhar no startup se variaveis obrigatorias estiverem ausentes.
- Unificar SSL/pool do Knex e executar migrations como etapa controlada de release.
- Atualizar dependencias vulneraveis antes de publicar.
- Adicionar rate limit, limite de body, headers de seguranca e logs estruturados.
- Criar health check que teste, separadamente, processo e banco.
- Configurar backup, retencao, monitoramento e procedimento de restauracao.
- Nao executar seeds destrutivos em producao.

### Banco

- Confirmar provedor oficial: a documentacao cita Supabase, Railway e Neon.
- Aplicar constraints e indices antes de carga real.
- Usar usuario de banco com privilegios minimos.
- Definir politica de backup, descarte e auditoria compativel com LGPD.
- Homologar migrations em banco separado antes da producao.

# Tabela resumo

## Achados por severidade

| Severidade | Quantidade |
|---|---:|
| Critico | 6 |
| Medio | 21 |
| Menor | 9 |
| **Total** | **36** |

## Modulos por cobertura

| Cobertura | Quantidade |
|---|---:|
| Completo | 0 |
| Parcial | 15 |
| Esqueleto | 0 |
| **Total auditado** | **15** |

## Resultado das validacoes

| Validacao | Resultado |
|---|---|
| Build de producao do frontend | Aprovado |
| Sintaxe JavaScript do backend | Aprovado |
| Testes automatizados | Nao disponiveis |
| Lint | Nao disponivel |
| Auditoria de dependencias | Reprovada por vulnerabilidades altas |
| Teste end-to-end com banco | Nao executado |
| Validacao visual em 375 px | Nao executada |

## Parecer final

O codigo implementa a maior parte das telas e endpoints previstos, mas "arquivo existente" nao equivale a "modulo completo". Antes de deploy ou uso com dados reais, a Fase 2.1 deve ser tratada como bloqueadora, especialmente isolamento entre UBSs, minimizacao de dados, contas inativas, RBAC, protecao de login e dependencias vulneraveis.
