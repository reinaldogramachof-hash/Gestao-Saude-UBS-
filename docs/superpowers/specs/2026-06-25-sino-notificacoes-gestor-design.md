# Design — Sino de Notificações do Painel do Gestor

**Data:** 2026-06-25  
**Status:** Proposta aprovada verbalmente, aguardando revisão final do arquivo  
**Escopo:** Portal do Gestor (`GestorLayout`, `TopBarGestor`, `SideNavGestor`, `routes/gestor.js`, migrations e testes)

---

## 1. Objetivo

Implementar um sino de notificações operacional no painel do gestor, com histórico persistente, contador de não lidas e navegação direta para o contexto da demanda.

O sino deve preparar a equipe para agir conforme o evento recebido, incluindo:

- novos pacientes cadastrados
- eventos de unidades externas
- problemas escalados / urgências
- vigilância epidemiológica
- outros eventos operacionais relevantes da UBS

---

## 2. Decisão Arquitetural

### Escolha

Criar um subsistema próprio de notificações do gestor, separado de `comunicados` e separado de `push_subscriptions`.

### Motivo

`Comunicados` representam mural e comunicação formal da UBS.  
O sino do gestor representa fila operacional e contexto de trabalho.

Misturar os dois conceitos geraria:

- semântica confusa
- dificuldade de marcar leitura por gestor
- regras frágeis para múltiplos perfis na mesma UBS
- acoplamento ruim entre comunicação e operação

---

## 3. Modelo de Dados

### 3.1 Tabela `notificacoes_gestor`

Cada evento operacional gera um registro persistente.

Campos propostos:

- `id`
- `ubs_id`
- `tipo_evento`
- `titulo`
- `mensagem`
- `rota_destino`
- `entidade`
- `entidade_id`
- `metadata_json`
- `criado_em`

### 3.2 Tabela `notificacoes_gestor_leitura`

Controla leitura por usuário gestor, e não por UBS inteira.

Campos propostos:

- `id`
- `notificacao_id`
- `gestor_id`
- `lido_em`

### Motivo da separação

Dois gestores da mesma UBS podem ter rotinas diferentes.  
Uma notificação lida por um gestor não deve desaparecer automaticamente para outro.

---

## 4. Eventos da Primeira Versão

### 4.1 Novo paciente cadastrado

Origem atual: `POST /auth/cadastro-paciente`

Gera notificação para gestores ativos da UBS do paciente.

### 4.2 Novo encaminhamento criado

Origem: `POST /gestor/encaminhamento`

Ajuda a equipe a acompanhar entrada de demanda externa/regulação.

### 4.3 Atualização de status de encaminhamento

Origem: `PUT /gestor/encaminhamento/:id/status`

Inclui mudanças críticas como `AGENDADO`, `REALIZADO` e `CANCELADO`.

### 4.4 Atualização de unidade externa

Origem: rotas de `externa.js` já existentes que alteram encaminhamentos e retornos.

O gestor precisa ser avisado quando a unidade externa agenda, conclui ou devolve contexto clínico.

### 4.5 Escalada de prioridade

Origem: rota de escalada de solicitação já existente em `gestor.js`.

Eventos urgentes devem aparecer no sino com destaque visual.

### 4.6 Vigilância epidemiológica

Origens:

- `POST /gestor/vigilancia`
- `PUT /gestor/vigilancia/:id/status`

O sino deve contextualizar novos casos ou mudança de status de investigação.

---

## 5. API do Gestor

Adicionar ao backend do gestor:

- `GET /api/gestor/notificacoes`
- `GET /api/gestor/notificacoes/nao-lidas-count`
- `POST /api/gestor/notificacao/:id/lida`
- `POST /api/gestor/notificacoes/marcar-todas-lidas`

### Regras

- sempre usar `req.user.id` e `req.user.ubs_id`
- nunca aceitar `ubs_id` nem `gestor_id` do body
- listar apenas notificações da UBS do token
- marcar leitura apenas para o gestor autenticado

---

## 6. Serviço de Domínio

Criar um serviço dedicado, por exemplo `gestorNotificationService.js`, para centralizar:

- criação de notificações
- fan-out para gestores ativos da UBS
- normalização de payloads
- reutilização entre `auth.js`, `gestor.js` e `externa.js`

### Motivo

Evita espalhar lógica de insert de notificação em várias rotas e reduz risco de inconsistência.

---

## 7. Interface do Frontend

### 7.1 TopBarGestor

Adicionar sino no topo direito do `TopBarGestor`, ao lado da área de data/relógio.

Comportamento:

- badge vermelho com total de não lidas
- clique abre painel dropdown
- lista mostra título, mensagem curta, tipo e data/hora
- CTA para abrir o contexto correto

### 7.2 Painel de notificações

O painel deve permitir:

- abrir notificação
- marcar individualmente como lida
- marcar todas como lidas
- estado vazio amigável

### 7.3 SideNavGestor

Pode receber a mesma contagem para reforço visual, sem duplicar a origem de dados.

O sino será a entrada principal; o sidebar só pode mostrar apoio discreto, se necessário.

---

## 8. Atualização de Dados

### Primeira versão

Usar polling leve no frontend do gestor.

Proposta:

- contagem: a cada 15s ou 30s
- lista completa: carregar ao abrir o painel

### Motivo

Menor risco para a banca e menor superfície de regressão que websocket/realtime completo.

---

## 9. Segurança e LGPD

- não expor CPF em notificações
- evitar mensagens com dado clínico sensível em texto cru
- usar resumos operacionais curtos
- limitar `metadata_json` ao mínimo necessário para navegação/contexto
- respeitar isolamento por `ubs_id`

Exemplo seguro:

- `Novo paciente cadastrado`
- `Encaminhamento atualizado para AGENDADO`
- `Caso de vigilância marcado como CONFIRMADO`

---

## 10. Estratégia de Implementação

### Backend

1. Criar migrations das tabelas de notificações do gestor.
2. Criar serviço `gestorNotificationService`.
3. Adicionar rotas de leitura/marcação no `gestor.js`.
4. Instrumentar eventos em `auth.js`, `gestor.js` e `externa.js`.

### Frontend

1. Buscar contagem global no `GestorLayout` ou `TopBarGestor`.
2. Renderizar sino e painel no `TopBarGestor`.
3. Carregar lista sob demanda ao abrir o painel.
4. Marcar notificações como lidas e navegar para `rota_destino`.

### Testes

1. Migration contract
2. Route contracts do gestor
3. Contratos do sino no `TopBarGestor`
4. Contratos de isolamento por UBS e leitura por gestor

---

## 11. Riscos Conhecidos

- aumento do número de pontos que geram notificação
- risco de duplicidade se um mesmo evento for instrumentado duas vezes
- necessidade de manter textos curtos e seguros
- working tree atual já contém outras mudanças, exigindo atenção para não sobrescrever trabalho em andamento

Mitigação:

- centralizar criação em serviço único
- criar helper para deduplicação semântica simples quando necessário
- validar por testes de contrato e build

---

## 12. Fora de Escopo desta Versão

- push nativo do gestor
- realtime por websocket/Supabase channel
- preferências individuais de categoria de notificação
- arquivamento, filtros avançados e paginação sofisticada

Esses itens podem virar fase 2 após a banca.

---

## 13. Resultado Esperado

Ao entrar no painel, o gestor verá um sino com badge de não lidas.  
Ao abrir o painel, terá uma fila de eventos relevantes da UBS, poderá marcar como lido e navegar direto para o contexto de ação.

Isso transforma o sino em ferramenta operacional real, e não apenas em adorno visual.
