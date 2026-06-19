# Panorama Tecnológico e Arquitetura de Software na Gestão de Saúde
## Análise de Funcionalidades em Hospitais, Clínicas e Unidades Básicas no Brasil

> **Data de incorporação:** 2026-06-19  
> **Relevância para o UBS+:** Alta — fundamenta decisões de roadmap, posicionamento e arquitetura futura  
> **Panorama executivo elaborado por:** Claude Sonnet 4.6

---

## Síntese Executiva para o UBS+ (leitura obrigatória antes do relatório completo)

### O que este relatório confirma sobre o posicionamento do UBS+

Os sistemas SUS (e-SUS APS, PEC, SISAB) são orientados completamente para dentro — para o gestor, o auditor federal e o financiamento municipal. Nenhuma dessas plataformas tem interface voltada ao paciente como usuário ativo. O e-SUS é ferramenta de registro e prestação de contas, não de comunicação. **Isso valida a existência do UBS+ como camada complementar, não concorrente.**

### Insight mais relevante para o roadmap

A seção de clínicas privadas é a mais acionável. O mercado privado resolveu exatamente o problema de engajamento e comunicação que o SUS ainda não resolveu: chatbots via WhatsApp API, notificações push em tempo real, feedback imediato de status. O paciente do plano privado tem tudo isso. O paciente do SUS tem fila e incerteza. **O UBS+ está construindo a versão pública desse ecossistema.**

### O que é arquiteturalmente importante para a Fase 2

1. **Offline-first (e-SUS Território):** o padrão foi escolhido por necessidade real — população sem conectividade estável. Para escalar, o UBS+ precisará de PWA com service worker ou app nativo.
2. **HL7 FHIR e RNDS (Decreto 12.560/2025):** se o UBS+ eventualmente buscar dados do prontuário nacional, a API obrigatória é FHIR R4 com OAuth2 + ICP-Brasil. A arquitetura atual não deve fechar essa porta.

### O que é ruído para o projeto atual
IA Ambiental, DataMatrix GS1, Protocolo de Manchester, TISS/TUSS — pertencem a sistemas clínicos hospitalares. Sem aplicação imediata no UBS+.

### Lacuna identificada pelo relatório
Nenhuma solução existente faz o que o UBS+ faz: interface digital de rastreamento de solicitações de regulação ambulatorial voltada ao próprio paciente do SUS. Isso pode significar oportunidade — ou que o problema é difícil de monetizar no modelo público.

---

## Relatório Completo

### 1. Sistemas de Gestão para UBS (Atenção Primária)

**e-SUS APS / Prontuário Eletrônico do Cidadão (PEC)**
- Prontuário longitudinal multiprofissional (não episódico)
- Prescrição digital com certificado ICP-Brasil
- Videochamada integrada para telemedicina
- CDS (Coleta de Dados Simplificada) para áreas sem conectividade

**e-SUS Território (app mobile para ACS/ACE)**
- Funciona offline-first — dados sincronizados via Wi-Fi local
- Georreferenciamento de imóveis
- Fichas: FCDT, FCI, FVDT
- Protocolo thrift para transmissão comprimida

**Financiamento condicionado ao software (Portaria 3.493/2024)**
- 15 indicadores de qualidade extraídos do e-SUS determinam repasses municipais
- Registro incompleto = corte de verba = software é auditor financeiro da prefeitura
- IED (Índice de Equidade e Dimensionamento) ajusta repasse por vulnerabilidade social

---

### 2. Sistemas de Informação Hospitalar (HIS)

**Triagem — Protocolo de Manchester**
- 5 níveis cromáticos: Vermelho (0min), Laranja (10min), Amarelo (60min), Verde (120min), Azul (240min)
- IA (metodologia Lean/Fast Track) reduz tempo de triagem para <1,5 min
- Portaria nº 082/2024 SP: uso obrigatório em portas de entrada municipais

**Gestão de Leitos (Giro de Leito)**
- NIR (Núcleo Interno de Regulação) centraliza painéis do HIS
- App móvel para higienização: colaborador registra início/fim da limpeza
- Status em tempo real: Alta Médica → Aguardando Higienização → Higienizando → Vago

**Segurança de Medicamentos (GS1 DataMatrix)**
- Código 2D com até 2.335 caracteres + correção de erros Reed-Solomon (30% de dano tolerado)
- 5 conferências na beira do leito: paciente, medicamento, via, dose, horário
- Redução de 50% em erros de medicação; 75% em eventos adversos graves

---

### 3. Software para Clínicas Privadas

**Modelos de negócio dominantes (SaaS):**
- Feegow Clinic: +200 funcionalidades, TISS completo
- ByDoctor: R$147/mês fixo, WhatsApp API nativo, IA de transcrição
- Amplimed: chatbot WhatsApp oficial, iOS/Android nativos
- iClinic: foco UX, ideal para digitalização inicial
- Clínica nas Nuvens: TISS robusto, contrato anual

**Chatbots e WhatsApp API**
- Automação de agendamento 24/7 via WhatsApp
- Redução drástica de no-show
- Sincronização em tempo real na agenda da clínica

**TISS/TUSS (Faturação de Convênios)**
- TISS: padrão XML para comunicação prestador ↔ operadora
- TUSS: tabela de 8 dígitos para todos os procedimentos e materiais
- Glosa técnica: 30% dos casos por código TUSS errado ou desatualizado
- Impacto: R$5.000–15.000/mês de perda para clínica com faturamento de R$50.000

---

### 4. Interoperabilidade — RNDS e HL7 FHIR

**RNDS (Rede Nacional de Dados em Saúde)**
- Decreto 12.560/2025 — obrigatório para todos os níveis do SUS e saúde suplementar
- Barramento de interoperabilidade (não banco de dados estático)
- Processa: exames, vacinas (SIPNI), resultados, sumários de alta

**HL7 FHIR R4.0.1**
- Padrão internacional de interoperabilidade clínica
- RESTful API: GET/POST com autenticação OAuth2 + certificado ICP-Brasil
- Formato JSON com validação de cardinalidade
- Diferente do TISS (faturação) — FHIR é para dados assistenciais
- Todo sistema que integrar à RNDS deve implementar FHIR R4

---

### 5. Inteligência Artificial Generativa em Saúde

**IA Ambiental (Ambient Clinical Intelligence)**
- Captura e transcreve consulta com consentimento do paciente
- Motor NLP organiza texto em formato SOAP (Subjetivo, Objetivo, Avaliação, Plano)
- Transfere automaticamente para o prontuário eletrônico
- Players: HiDoctor LIVE, MedClaw, Lya (CTC Tech)
- Impacto: elimina digitação pós-consulta, médico foca no paciente

**Regulação (ANVISA/SaMD)**
- Softwares de IA clínica precisam de dossiê SaMD (Software as a Medical Device)
- IA atua como apoio à decisão, nunca substitui autoridade diagnóstica do médico

---

## Conclusões do relatório

1. Software público virou instrumento de sobrevivência fiscal municipal
2. Gestão hospitalar eliminou intuições — tudo é determinístico e auditável
3. Clínicas privadas sobrevivem pela automação TISS/TUSS e chatbots
4. RNDS/FHIR cria o primeiro data lake real de saúde populacional do Brasil
5. IA Ambiental resolve o "muro digital" entre médico e paciente

---

*Documento incorporado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
