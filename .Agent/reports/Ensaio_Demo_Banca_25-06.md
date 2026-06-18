# Ensaio — Fluxo Completo da Demo
**Banca:** 25/06/2026  
**Duração estimada:** 8–12 minutos  
**Preparação mínima necessária:** ver seção "Antes de começar"

---

## Antes de começar (D-1 ou manhã do dia)

- [ ] Gestor criou 2–3 horários disponíveis em "Agendamentos" (datas futuras)
- [ ] Gestor criou 2–3 solicitações para o paciente de demo (ex: Ana Clara Souza / DEMO-0001)
- [ ] SQL rodado no Supabase (`UPDATE comunicados SET titulo = REPLACE(titulo, '[DEMO] ', '') WHERE titulo LIKE '[DEMO]%'`)
- [ ] Celular com portal do paciente aberto (ou Chrome DevTools em 375px)
- [ ] Monitor com portal do gestor aberto em outra aba/janela

---

## Roteiro de Demo

### Cena 1 — Portal do Gestor: visão geral (1–2 min)

**O que mostrar:** Dashboard do Gestor

1. Abrir `[URL do gestor]/gestor/login` → login com e-mail + senha
2. Mostrar o **Painel Principal**:
   - Cards de métricas em tempo real (pacientes ativos, em análise, autorizados)
   - Badge âmbar de cadastros pendentes
   - Bloco "Atenção Imediata" com alertas por dias parados
   - Chip "Atualizado às HH:MM" no subtítulo

**Frase de apoio:** *"O gestor abre o sistema de manhã e em segundos sabe o que precisa de atenção — sem abrir nenhuma outra tela."*

---

### Cena 2 — Gestor: cadastro e aprovação de paciente (1–2 min)

**O que mostrar:** Lista de Pacientes → Aba "Aguardando Aprovação"

1. Navegar para "Pacientes"
2. Mostrar **aba "Aguardando Aprovação"** com badge de contagem
3. Clicar em "Aprovar" num paciente pendente (ou mostrar o modal de confirmação clicando em "Rejeitar")
4. Toast de sucesso

**Frase de apoio:** *"Quando um cidadão faz o auto-cadastro pelo portal, o gestor aprova ou rejeita com um clique — com confirmação antes de qualquer exclusão."*

---

### Cena 3 — Gestor: perfil do paciente e nova solicitação (2–3 min)

**O que mostrar:** Perfil do paciente de demo

1. Buscar "Ana Clara" (ou DEMO-0001) na lista
2. Abrir o perfil → mostrar dados + alerta de contato (se aplicável)
3. Mostrar **seções separadas**: "Solicitações em andamento" acima, "Histórico" abaixo com opacidade reduzida
4. Clicar em "Nova Solicitação" → preencher:
   - Tipo: Exame
   - Nome técnico: "Hemograma Completo"
   - Explicação ao paciente: "Exame de sangue de rotina"
   - Prioridade: Rotina
5. Salvar → solicitação aparece na seção "Em andamento"

**Frase de apoio:** *"O gestor cria a solicitação e já escolhe como explicar o procedimento ao paciente — sem jargão médico."*

---

### Cena 4 — Gestor: atualização de status (1 min)

**O que mostrar:** Botão "Atualizar Status" na solicitação recém-criada

1. Na solicitação criada, clicar em "Atualizar Status"
2. Mudar status para "Autorizado" → observação: "Solicitação aprovada pela regulação"
3. Salvar → status atualizado no card

**Frase de apoio:** *"Cada mudança de status fica registrada no histórico — transparência total para a equipe."*

---

### Cena 5 — Portal do Paciente: login e dashboard (1–2 min)

**O que mostrar:** Celular (ou 375px no Chrome) com o portal do paciente

1. Abrir `[URL do frontend]/` → tela de login
2. Preencher: CRA `DEMO-0001` + Data de nascimento de Ana Clara
3. Entrar → Dashboard com cabeçalho verde, nome e UBS
4. Ver a solicitação "Exame de sangue de rotina" com status "Autorizado — aguardando agendamento"

**Frase de apoio:** *"O paciente vê exatamente o que o gestor atualizou — em linguagem simples, sem termos técnicos."*

---

### Cena 6 — Paciente: navegação pelo app (1 min)

**O que mostrar:** Navegação pelo BottomNav

1. Tocar em **Medicamentos** → lista de disponibilidade
2. Tocar em **Avisos** → comunicados gerais da UBS (Campanha de Vacinação etc.)
3. Tocar em **Agenda** → horários disponíveis criados pelo gestor
4. Tocar em "Início" → voltar ao dashboard

**Frase de apoio:** *"O cidadão tem tudo que precisa em um único lugar — sem precisar ligar para a UBS para saber se o medicamento está disponível."*

---

### Cena 7 — Paciente: detalhe da solicitação e histórico (1 min)

**O que mostrar:** Detalhe de uma solicitação

1. No dashboard, clicar em "Ver Detalhes" de uma solicitação
2. Mostrar a **timeline de status** — cada etapa com data e observação
3. Voltar com o botão de seta

**Frase de apoio:** *"O histórico completo fica visível para o paciente — ele sabe exatamente o que aconteceu com o pedido dele em cada etapa."*

---

### Encerramento (30 seg)

Retornar ao Portal do Gestor e mostrar o Dashboard novamente.

*"O sistema resolve o problema central: a desinformação. O paciente não precisa mais ir pessoalmente à UBS para saber o status de um exame — e a equipe gestora não precisa mais responder ligações sobre isso. A informação flui em tempo real, nos dois sentidos."*

---

## Perguntas prováveis da banca e respostas

**"Como garantem a privacidade dos dados?"**  
→ Autenticação JWT, cada paciente acessa apenas os próprios dados, sem listas públicas. Seguimos o Decreto Municipal 18.855/2021 de SJC e a LGPD.

**"Por que não integram com o e-SUS ou SISREG?"**  
→ Decisão arquitetural deliberada: integração burocrática com sistemas governamentais está fora do escopo do MVP. O gestor alimenta manualmente — o foco é a transparência da informação, não substituir sistemas existentes.

**"Isso poderia escalar para outras UBSs?"**  
→ Sim. O banco de dados já é multi-UBS (`ubs_id` em todas as entidades). Cada UBS teria seu próprio conjunto de gestores e pacientes isolados.

**"Testaram com usuários reais?"**  
→ O sistema está em produção na Vercel com banco real no Supabase. As screenshots apresentadas foram tiradas em dispositivos reais.

**"Quais são os próximos passos?"**  
→ Notificações via WhatsApp Business API (Fase 2), filtros avançados na lista de pacientes, e validação com a equipe de uma UBS real de SJC.
