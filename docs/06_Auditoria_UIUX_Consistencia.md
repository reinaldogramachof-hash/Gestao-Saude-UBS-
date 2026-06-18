# Auditoria UI/UX — Consistência Visual entre Módulos
**Projeto:** Gestão Saúde UBS+  
**Data:** 17/06/2026  
**Perspectiva:** UX Manager / Gerente de UBS  
**Status:** Arquivado — backlog pós-banca (25/06/2026)

---

> **Decisão Arquitetural (Claude Sonnet 4.6 — 17/06/2026):**  
> Os problemas descritos são reais, mas o plano de ação de Fase 1 foi avaliado como
> fora de escopo para a sprint da banca. Gestor e Paciente têm públicos radicalmente
> diferentes (densidade vs. simplicidade) e a "inconsistência" em parte reflete
> design intencional. Trabalho estimado em 20–40h — não elegível para sprint de 8 dias.
> Documento preservado para o roadmap do próximo semestre.

---

## 🏥 Cenário Real Adotado
> **UBS Vila Nova — Atendimento de Suporte ao Paciente**  
> **Personagens:** Dra. Maria Aparecida (Gerente) e Sr. Benedito (Paciente, 68 anos)
>
> **Quarta-feira, 14h00.** Sr. Benedito vai à recepção da UBS porque não está
> conseguindo ver o resultado do seu exame no celular. A Dra. Maria abre o
> **Portal do Gestor** no seu monitor (24 polegadas) para verificar a conta dele.
> Em seguida, ela acessa o **Portal do Paciente** em uma aba anônima no mesmo monitor
> para guiá-lo passo a passo no que ele deve clicar no celular dele.
>
> **O Atrito:** Ao colocar as duas telas lado a lado, a Dra. Maria se confunde.
> Os sistemas parecem ter sido feitos por empresas diferentes. O painel dela é 
> expansivo, cinza/branco, com menu lateral e tabelas. O painel do Sr. Benedito 
> é espremido no centro da tela, tem um cabeçalho verde gigante e botões arredondados. 
> Ela tem dificuldade de traduzir a linguagem visual do seu sistema para o dele.

---

## 🔍 ANÁLISE DE INCONSISTÊNCIAS IDENTIFICADAS

Foi identificada uma fratura clara no Design System da aplicação. Existem dois paradigmas paralelos competindo dentro do mesmo produto.

### 1. Paradigma de Layout e Navegação
- **Portal do Gestor (`GestorLayout`):** Adota um padrão *Admin Dashboard* clássico. Usa 100% da largura da tela (`w-full`), possui uma barra de navegação lateral fixa no desktop (retrátil entre `w-72` e `w-16`) e que vira um *drawer* oculto no mobile.
- **Portal do Paciente (`PacienteLayout`):** Adota um padrão *Mobile-First Restrito*. No desktop, ele não expande; o conteúdo fica "preso" em um card centralizado (`max-w-md shadow-2xl`), forçando o usuário de PC a usar uma interface de celular. A navegação usa uma barra inferior fixa (`BottomNavPaciente`), ignorando convenções de desktop.
- **Veredito:** O abismo entre os layouts quebra a unidade da marca. O paciente que acessa pelo computador tem uma experiência subaproveitada e visualmente estranha (uma tripa estreita no meio do monitor).

### 2. Uso de Cores e Identidade Visual (Topography)
- **Portal do Gestor:** Abordagem utilitária. O fundo geral é `bg-surface` (cinza muito claro). O cabeçalho é branco/transparente. A cor primária (Primary) é usada com muita moderação, apenas em botões de ação principal e nos ícones de menu ativo.
- **Portal do Paciente:** Abordagem expressiva. Possui um "Hero Header" enorme na cor primária com bordas excessivamente arredondadas (`bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem]`). Letras brancas (`text-on-primary`).
- **Veredito:** O portal do paciente tenta ser mais amigável, mas o contraste com a sobriedade do gestor faz parecerem dois aplicativos distintos.

### 3. Estrutura de Cards e Botões
- **Portal do Gestor:** Cards de métricas são horizontais (`flex items-center gap-4`), com bordas sutis (`border-outline-variant`) e sem sombra aparente. Botões são retangulares com bordas suavizadas (`rounded-2xl`). O formato de lista foca em tabelas (`<table>`).
- **Portal do Paciente:** Cards de itens são verticais, com sombras maiores (`shadow-sm border-surface-variant`). Todos os botões ocupam 100% da largura (`w-full`). O formato de lista é feito de blocos de cards empilhados.
- **Veredito:** Inconsistência nos *design tokens*. O que no gestor é uma linha de tabela minimalista, no paciente vira um card massivo de 4 linhas.

### 4. Linguagem e "Tone of Voice" Visual
- **Portal do Gestor:** Exibe labels técnicos e literais: "Em Análise", "Ag. Regulação", "Exame". Foco em densidade de informação.
- **Portal do Paciente:** Usa caixas de destaque grandes para informações que no Gestor são apenas pequenas *badges*.

---

## 🎯 IMPACTO NO USUÁRIO (UX)

1. **Curva de Aprendizado Dupla:** Se um membro da equipe gestora precisar testar o fluxo do paciente ou auxiliar um munícipe no balcão, a interface do paciente não é intuitiva para quem usa o portal do gestor 8 horas por dia.
2. **Percepção de Qualidade:** Para o cidadão (paciente), a restrição a `max-w-md` no desktop passa a sensação de um sistema incompleto ou não-responsivo.
3. **Manutenibilidade (Dev Experience):** A equipe precisa manter duas arquiteturas de componentes totalmente diferentes.

---

## 🛠️ RECOMENDAÇÕES DE PADRONIZAÇÃO

### Fase 1: Correções de Alto Impacto — **BACKLOG PÓS-BANCA** (estimativa: 20–40h)
- **Redesign do `PacienteLayout` para Desktop:** Manter o *bottom nav* apenas para telas `< md`. Para telas maiores, transacionar para *top bar* ou *side nav* compacto, removendo a restrição `max-w-md`.
- **Harmonização de Cards:** Adotar estilo único: `rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-sm`.
- **Suavização do Header do Paciente:** Reduzir a área de fundo verde do DashboardPaciente, aproximando do visual tipográfico do DashboardGestor.

### Fase 2: Unificação de Design Tokens — **ROADMAP PRÓXIMO SEMESTRE**
- **Componentes Universais:** Criar `/components/ui/` com botões, badges, inputs e modais rigorosamente iguais para os dois portais.
- **Tabelas vs. Cards Responsivos:** Padronizar — Desktop = Tabela; Mobile = Cards Empilhados — usando o mesmo componente.
- **Refinar Design PWA do Gestor:** Unificar navegação mobile (hamburguer vs. bottom nav).

---

## 🚦 RESUMO EXECUTIVO

O sistema sofre da "Síndrome de Duas Cabeças". Foi focado muito em isolar os papéis (segurança de rotas) e acabou-se isolando também a identidade visual. A unificação trará uma interface mais premium, menor custo de manutenção e maior confiança para a equipe da UBS ao dar suporte aos cidadãos.

**Nota do Arquiteto:** Parte da inconsistência é design intencional — densidade para o gestor, simplicidade para o paciente de 68 anos. A unificação não deve nivelar os dois para o mesmo padrão, mas criar uma linguagem visual compartilhada (tokens, bordas, sombras) preservando os paradigmas de navegação específicos de cada público.
