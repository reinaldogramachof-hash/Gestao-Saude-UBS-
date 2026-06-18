# Prompt — Agente Claude no Chrome: Pesquisa de APIs e Integrações
> Gerado por: Claude Sonnet 4.6 (Arquiteto)
> Data: 2026-06-17
> Objetivo: Alimentar documentação de integrações futuras (pós-25/06/2026)

---

# Missão: Pesquisa de APIs e Integrações para o Gestão Saúde UBS+

## Contexto do Projeto
Você está pesquisando para o projeto **Gestão Saúde UBS+**, uma aplicação web
acadêmica (extensão UFBRA) que melhora a comunicação entre UBSs (Unidades Básicas
de Saúde) de São José dos Campos – SP e seus pacientes. O sistema hoje alimenta
dados manualmente pela equipe gestora. A longo prazo, queremos integrar com fontes
externas de dados reais.

**Stack atual:** React + Node.js/Express + PostgreSQL (Supabase) + JWT

**Fase atual:** MVP em produção. As pesquisas abaixo alimentarão o planejamento
de integrações futuras (pós-25/06/2026).

---

## Fontes a Visitar e o que Buscar

### 1. API de Dados Abertos do Ministério da Saúde
URL inicial: https://apidadosabertos.saude.gov.br/v1/

Navegue pela documentação e liste:
- Todos os endpoints disponíveis, com descrição do que retornam
- Endpoints relacionados a: estabelecimentos de saúde, UBSs, CNES
  (Cadastro Nacional de Estabelecimentos de Saúde), regulação ambulatorial,
  medicamentos, filas e solicitações
- Formato de autenticação exigido (aberta, token, OAuth?)
- Formato de retorno (JSON, XML?)
- Limites de uso (rate limit, necessidade de cadastro?)
- Se houver endpoint de busca por município, testar com
  código IBGE de SJC: **3549904**

### 2. Portal de Dados Abertos do Ministério da Saúde
URL: https://dados.gov.br/dados/organizacoes/visualizar/ministerio-da-saude

Busque por:
- Datasets de estabelecimentos de saúde (UBSs, CNES)
- Datasets sobre regulação ambulatorial (SISREG relacionados)
- Datasets de medicamentos da rede pública (RENAME, REMUME)
- Datasets sobre São José dos Campos especificamente
- Qualquer conjunto de dados que possa alimentar nosso sistema
  com informações reais (nomes de UBSs, medicamentos, status de filas)

### 3. Site da Prefeitura de São José dos Campos
URL: https://www.sjc.sp.gov.br/

Navegue e localize:
- Página do programa **UBS Resolve** (coleta laboratorial nas UBSs)
- Informações sobre o **CRA** (Cadastro de Regulação Ambulatorial) —
  como é gerado, estrutura do número, quem emite
- Informações sobre o aplicativo **"Saúde na Mão"** (concorrente/referência)
- Decreto Municipal **18.855/2021** (proteção de dados dos munícipes)
- Qualquer API ou portal de dados abertos da prefeitura
- Contatos ou canais técnicos da Secretaria Municipal de Saúde
  (para eventual parceria/validação real com UBS)
- Informações sobre o **Central 156** (atendimento ao cidadão)
  e se há API disponível

### 4. Legislação de Transparência em Saúde
Busque em qualquer fonte confiável (Câmara Federal, Senado, Google):
- Status atual do **PL nº 335/2024** (transparência em filas de saúde)
- Lei **17.066/2017 de Santa Catarina** (referência que citamos nos docs)
- Se São José dos Campos possui legislação própria sobre transparência
  em filas ou atendimento de saúde

---

## Formato de Entrega

Retorne um relatório estruturado com as seguintes seções:

### A) APIs Disponíveis e Utilizáveis Agora
Para cada API encontrada:
- Nome e URL base
- O que retorna de útil para o projeto
- Como autenticar
- Exemplo de endpoint relevante (com parâmetros para SJC)
- Veredicto: [ ] Integrar no MVP pós-banca / [ ] Usar como fonte de dados estática / [ ] Irrelevante

### B) Datasets Estáticos Úteis
Arquivos CSV/JSON que possamos baixar e importar diretamente no banco:
- Nome do dataset
- URL de download
- O que contém
- Como usar no projeto

### C) Informações Institucionais de SJC
- O que descobriu sobre CRA, UBS Resolve, Saúde na Mão
- Canais de contato com a Secretaria de Saúde
- Qualquer parceria possível

### D) Contexto Legislativo
- Status do PL 335/2024
- O que a legislação atual exige ou recomenda para sistemas como o nosso

### E) Recomendações de Prioridade
Liste as 3 integrações de maior impacto para o projeto a longo prazo,
justificando cada uma com base no que encontrou.

---

## Notas de Execução
- Se uma página exigir JavaScript para carregar, aguarde o conteúdo renderizar
  antes de extrair dados
- Se encontrar documentação de API incompleta, anote o que está faltando
- Priorize informações verificáveis — não especule sobre o que uma API
  "provavelmente tem" sem ter confirmado na página
- Se algum site estiver fora do ar, registre e continue nas demais fontes
