# Documento 06 — Pesquisa de APIs e Integrações
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-06-17
**Pesquisador:** Agente Claude no Chrome
**Status:** Concluído — base para planejamento pós-25/06/2026

---

## Resumo Executivo

Pesquisa extensiva sobre APIs, datasets e fontes de dados para integração futura do sistema. Foram identificadas oportunidades reais de integração com o Ministério da Saúde, dados institucionais de São José dos Campos e o contexto legislativo relevante.

---

## A) APIs Disponíveis e Utilizáveis

### 1. API DEMAS — Dados Abertos do Ministério da Saúde

**URL Base:** https://apidadosabertos.saude.gov.br/v1/

**O que retorna de útil:**
- Dados de estabelecimentos de saúde, UBSs, hospitais e leitos
- Informações de medicamentos da rede pública (BNAFAR/Horus)
- Dados de vacinação por ano
- Dados sobre regulação e controle de demandas

**Autenticação:**
- Tipo: Token Bearer (OAuth-like)
- Endpoint: `POST /autenticacao/login` → obtém access token
- Alguns endpoints são abertos (sem autenticação)

**Formato de retorno:** JSON

**Limites de uso:**
- Paginação via `limit` e `offset` (limit máximo: 1000)
- Rate limits não explicitamente documentados
- Sem necessidade de cadastro para endpoints abertos

**Endpoints prioritários para o projeto:**

| Endpoint | O que retorna |
|---|---|
| `GET /assistencia-a-saude/unidade-basicas-de-saude` | UBSs cadastradas no CNES |
| `GET /cnes/estabelecimentos` | Todos os estabelecimentos de saúde |
| `GET /cnes/estabelecimentos/{codigo_cnes}` | Busca por código CNES específico |
| `GET /daf/estoque-medicamentos-bnafar-horus` | Medicamentos e estoque da rede pública |
| `GET /assistencia-a-saude/hospitais-e-leitos` | Hospitais com contatos e leitos |

**Filtro por SJC:** Código IBGE `3549904`

**Veredicto:**
- ✅ Integrar no MVP pós-banca (`/unidade-basicas-de-saude` e `/cnes/estabelecimentos`)
- ✅ Usar como fonte de dados estática (extrair UBSs e medicamentos para seed no Supabase)

---

## B) Datasets Estáticos Úteis

### 1. CNES — Cadastro Nacional de Estabelecimentos de Saúde
- **Disponível via:** API DEMAS + Portal dados.gov.br
- **O que contém:** Código CNES, nome, endereço, telefone, especialidades, leitos, serviços
- **Como usar:** Extrair via API filtrado por SJC (IBGE 3549904), importar para tabela `ubs` no Supabase com campos: `cnes`, `nome`, `endereco`, `telefone`, `email`, `servicos`, `coordenadas`

### 2. BNAFAR — Base Nacional de Medicamentos
- **Disponível via:** API DEMAS `/daf/estoque-medicamentos-bnafar-horus`
- **O que contém:** Medicamentos disponíveis na rede pública, estoque por unidade
- **Como usar:** Importar para tabela `medicamentos` no banco; usar para popular seleções e buscas no sistema

### 3. Dados de SJC via CNES
- A API DEMAS retorna todos os estabelecimentos; necessário filtrar pelo código IBGE `3549904`
- As 47 UBSs do seed atual (`001_ubs_sjc.js`) podem ser enriquecidas com dados reais do CNES (endereço oficial, código CNES, telefone)

---

## C) Informações Institucionais de SJC

### Secretaria Municipal de Saúde

| Campo | Informação |
|---|---|
| Secretário | George Zenha |
| Telefone | +55 (12) 3212-1200 |
| E-mail | saude@sjc.sp.gov.br |
| Endereço | Rua Óbidos, 140 — Parque Industrial — CEP 12235-651 |
| Expediente | Segunda a sexta, 8h–12h e 13h30–17h |

### Programas e Iniciativas Identificados

**UBS Resolve** — Confirmado no site da Secretaria de Saúde.
Programa de coleta laboratorial nas próprias UBSs (~4.000 exames/mês por unidade populosa). Possível integração futura com sistema de coleta.

**Regulação Ambulatorial (CRA)**
Mencionado como "Regulação e controle — Autorizações para exames e cirurgias". Sistema que controla autorizações e encaminhamentos. Potencial de integração para visualizar filas e status de solicitações em tempo real.

**Ouvidoria da Saúde**
Sistema de registro de manifestações, denúncias, reclamações e sugestões. Relevante como canal de feedback de pacientes sobre UBSs.

**Escala Médica**
Serviço que publica escala de atendimento de médicos nas unidades básicas. Potencial de integração para mostrar disponibilidade de profissionais no portal do paciente.

**"Saúde na Mão"** — Aplicativo municipal de referência/concorrente. Não possui API pública identificada.

**Central 156** — Atendimento ao cidadão. Não foi identificada API disponível.

---

## D) Contexto Legislativo

### PL nº 335/2024 — Transparência em Filas de Saúde
- **Status:** Não foi possível acessar câmaras legislativas durante a pesquisa.
- **O que se sabe:** Lei que visa exigir transparência sobre filas de espera em sistemas de saúde públicos.
- **Alinhamento:** O Gestão Saúde UBS+ antecipa exatamente o que este PL busca exigir.
- **Ação pós-25/06:** Verificar status em www4.camara.leg.br e www25.senado.leg.br.

### Lei SC 17.066/2017 (Santa Catarina)
Lei de referência citada na documentação do projeto (transparência em filas de saúde). Modelo legislativo para o que pode ser replicado em SJC.

### Legislação de Proteção de Dados (Vigente)
- **LGPD (Lei 13.709/2018):** Obrigatória — sistema já foi desenhado em conformidade.
- **Lei 12.965/2014 (Marco Civil da Internet):** Aplicável a sistemas digitais de saúde.
- **Portaria MS nº 2.979/2019:** Referenciada nos dados DEMAS.
- **Decreto Municipal 18.855/2021 (SJC):** Citado na documentação do projeto; texto completo não localizado na pesquisa — contatar Secretaria de Saúde.

---

## E) Recomendações de Prioridade

### Prioridade 1 — API DEMAS: UBSs e CNES
**Impacto:** Alto | **Esforço:** Médio | **Timeline:** MVP pós-banca

- API aberta, documentada e com dados alinhados ao core do projeto
- Elimina alimentação manual dos dados das unidades de saúde
- Permite sincronização automática com atualizações do Ministério da Saúde
- **Implementação:** `GET /assistencia-a-saude/unidade-basicas-de-saude?limit=1000&offset=0` → filtrar por IBGE 3549904 → popular tabela `ubs` no Supabase → cron semanal no backend

### Prioridade 2 — Integração com CRA de SJC
**Impacto:** Altíssimo | **Esforço:** Alto (depende de parceria) | **Timeline:** Fase 2+

- Endereça o problema central: transparência em filas de solicitações com dados reais
- Diferencia o projeto do "Saúde na Mão" (concorrente)
- **Desafio:** CRA pode ser sistema interno da prefeitura, sem API pública
- **Ação imediata:** E-mail para saude@sjc.sp.gov.br apresentando o projeto como iniciativa acadêmica UFBRA e solicitando acesso ou parceria

### Prioridade 3 — Dados de Medicamentos (BNAFAR) + Conformidade Legislativa
**Impacto:** Médio | **Esforço:** Baixo | **Timeline:** Paralelo ao MVP

- Download periódico de BNAFAR via API DEMAS para popular tabela `medicamentos`
- Documenta conformidade com LGPD e legislações de transparência no próprio sistema
- Após 25/06: integrar referência ao PL 335/2024 quando sancionado

---

## F) Próximas Ações Recomendadas

1. **Imediato:** Testar conectividade real com `GET /assistencia-a-saude/unidade-basicas-de-saude` e validar estrutura do retorno para SJC (filtro por IBGE 3549904)
2. **Pré-MVP:** E-mail para saude@sjc.sp.gov.br — solicitar acesso ao sistema CRA / documentação da Regulação Ambulatorial
3. **Pós-25/06:** Pesquisa legislativa completa (PL 335/2024, Lei SJC) e avaliação de datasets em massa no dados.gov.br

---

*Pesquisa realizada por: Agente Claude no Chrome*
*Gerado em: 2026-06-17*
*Versão do documento: 1.0 — base para planejamento pós-demo*
