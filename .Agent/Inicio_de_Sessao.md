# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.

---

## Status Atual do Projeto

**Fase:** 0 — Fundação / Documentação
**Data de início:** 2026-04-20
**Próxima etapa:** Criar estrutura de pastas do projeto e inicializar repositórios frontend e backend

---

## O que foi feito até agora

- [x] Análise completa do ecossistema de saúde de SJC (e-SUS, SISREG, CROSS, UBS Resolve, Saúde na Mão)
- [x] Definição do escopo do projeto (camada de transparência, não substituição de sistemas)
- [x] Definição de stack tecnológica (React + Node.js + PostgreSQL)
- [x] Definição das entidades core e fluxo de status
- [x] Criação do `CLAUDE.md` (instrução master)
- [x] Criação da documentação acadêmica (`docs/`)
- [x] Criação deste arquivo de início de sessão

---

## O que está pendente agora

- [ ] Inicializar projeto React (frontend)
- [ ] Inicializar projeto Node.js + Express (backend)
- [ ] Criar schema inicial do PostgreSQL
- [ ] Criar wireframes das telas core (Stitch MCP)

---

## Contexto Essencial para o Agente

**Projeto:** Aplicação web acadêmica (UFBRA) para UBSs de São José dos Campos (SP).

**Dois portais:**
- **Gestor da UBS:** cadastra e atualiza status de pacientes, exames, consultas, medicamentos, comunicados
- **Paciente:** visualiza suas informações, status de solicitações, disponibilidade de medicamentos, agenda atendimento com gestão

**NÃO faz:** Integração com e-SUS, SISREG, CROSS ou qualquer sistema do SUS. O gestor alimenta manualmente.

**Autenticação:** Paciente usa CRA + Data de Nascimento. Gestor usa e-mail + senha.

**Regra crítica:** TODO arquivo de código deve ter comentários explicativos (equipe tem membros júniores).

**Desenvolvedor líder:** Reinaldo — toda decisão arquitetural passa por ele.

**Leia também:** `CLAUDE.md` na raiz do projeto para regras completas.

---

## Último Relatório de Sessão

Nenhum relatório de execução gerado ainda (fase de documentação — isenta de relatório técnico).

---

## Próximas Ações para o Arquiteto Retomarem

1. Validar documentação gerada com Reinaldo
2. Inicializar estrutura de código (frontend + backend)
3. Briefar Stitch MCP para gerar wireframes das telas core
