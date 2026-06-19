# AVALIAÇÃO UX — PORTAL DO PACIENTE
## Instrução para o Agente Claude do Chrome

> **Versão:** 1.0 — 2026-06-19  
> **Contexto:** Portal do paciente já aberto em 375px (formato smartphone) e logado como **Reinaldo Gramacho**.  
> **Objetivo:** Avaliar a experiência do paciente de ponta a ponta, identificar problemas de UX/UI, mapear lacunas de funcionalidade e levantar requisitos para um futuro app mobile.

---

## SEU PAPEL NESTA SESSÃO

Você é um **especialista em UX de saúde digital** com experiência em produtos para o SUS e em design para populações com baixo letramento digital. Seu público-alvo é o paciente típico das UBSs: muitas vezes acima de 40 anos, acesso à internet via celular, pouca familiaridade com apps.

Você vai navegar pelo portal do paciente como se fosse esse usuário real, tomando nota de tudo que gera dúvida, frustração, ou que simplesmente poderia ser melhor. Ao final, você vai produzir um relatório com achados + sugestões de melhorias + lista de módulos ausentes que fariam diferença real.

---

## ROTEIRO DE AVALIAÇÃO

### PARTE 1 — TELA INICIAL E ONBOARDING

1. Observe a tela inicial após o login. Sem ler nada do código ou configuração, responda: **O que este sistema faz?** Ficou claro para o paciente?
2. A identidade visual remete a saúde? Ou parece genérica?
3. O menu/navegação é intuitivo em 375px? Os ícones são autoexplicativos?
4. Existe alguma mensagem de boas-vindas ou contexto? O paciente sabe que está olhando dados da sua UBS específica?

---

### PARTE 2 — SOLICITAÇÕES ATIVAS

5. Navegue até **Minhas Solicitações** (ou equivalente)
6. A lista de solicitações é clara? O paciente entende o que cada item significa?
7. O status está em linguagem simples? (ex: "Em análise pela equipe" vs "em_analise")
8. Existe diferenciação visual entre status: urgente, aguardando, concluído? As cores/ícones ajudam?
9. O paciente consegue entender o que precisa fazer a partir do status? (ex: "Data marcada — compareça em 15/07 às 09h")
10. Clique em uma solicitação (se houver tela de detalhe). O histórico de mudanças de status é visível? O paciente consegue acompanhar a jornada?
11. **O que está faltando aqui?** Liste funcionalidades que um paciente real provavelmente perguntaria.

---

### PARTE 3 — COMUNICADOS

12. Navegue até **Comunicados** (ou equivalente)
13. A distinção entre comunicados gerais e individuais está clara para o paciente?
14. Comunicados não lidos têm destaque visual? Existe badge/indicador?
15. O texto dos comunicados está em linguagem acessível?
16. O paciente sabe quem enviou o comunicado e de qual UBS?
17. Existe histórico de comunicados antigos? O paciente consegue voltar atrás?

---

### PARTE 4 — MEDICAMENTOS

18. Navegue até **Medicamentos** (ou equivalente)
19. O paciente consegue entender rapidamente quais medicamentos estão disponíveis na sua UBS?
20. A distinção disponível/indisponível é clara visualmente?
21. Existe informação sobre como retirar (horário, documentos necessários, procedimento)?
22. O paciente consegue filtrar ou buscar um medicamento específico?
23. **O que está faltando aqui?** (ex: notificar quando o medicamento voltar ao estoque?)

---

### PARTE 5 — AGENDAMENTOS

24. Navegue até **Agendar Atendimento** (ou equivalente)
25. O paciente entende o que é "atendimento com a gestão"? Fica claro que não é consulta médica?
26. O processo de agendamento é simples? Quantos passos são necessários?
27. Após agendar, o paciente tem confirmação clara (data, horário, local, o que levar)?
28. Existe possibilidade de cancelar ou reagendar? Se não, o paciente sabe o que fazer?

---

### PARTE 6 — PERFIL E DADOS PESSOAIS

29. Navegue até **Perfil** ou **Meus Dados** (se existir)
30. O paciente consegue ver seus dados cadastrais (nome, UBS, contato)?
31. Existe opção de editar informações de contato?
32. O paciente consegue ver suas informações de saúde (tipo sanguíneo, alergias, comorbidades)?
33. **Essas informações são apresentadas de forma útil?** Ou são só campos técnicos?

---

### PARTE 7 — ESTADOS EXTREMOS (TESTE DE ROBUSTEZ)

34. Navegue para uma tela que provavelmente não tem dados (ex: solicitações se não houver nenhuma)
   - O **estado vazio** é amigável? Explica o que fazer?
   - Ou só aparece uma lista vazia sem contexto?
35. Simule uma tela com erro: desative a internet no DevTools → recarregue → reconecte
   - O erro é comunicado de forma amigável?
   - Existe botão "Tentar novamente"?

---

### PARTE 8 — AVALIAÇÃO TÉCNICA MOBILE

36. Em 375px, existe scroll horizontal indesejado em alguma tela?
37. Algum botão ou área clicável é pequena demais para toque? (mínimo 44x44px recomendado)
38. O teclado virtual (DevTools) empurra conteúdo para fora da tela em campos de input?
39. Fontes estão legíveis sem zoom? (mínimo 16px para texto de corpo)
40. Contraste de cores parece adequado? (texto cinza claro sobre fundo cinza claro = problema)

---

## PARTE 9 — LEVANTAMENTO DE MÓDULOS AUSENTES

Com base em tudo que você navegou, liste os módulos/funcionalidades que **não existem** no portal atual mas que um paciente real provavelmente precisaria. Para cada um, classifique:

- **MUST HAVE** — bloqueio real para adoção em escala
- **SHOULD HAVE** — valor alto, sem bloquear
- **NICE TO HAVE** — qualidade de vida, para fases futuras

Exemplos de categorias para avaliar:
- Notificações push ou por WhatsApp quando o status muda
- Busca por nome de exame ou medicamento
- Histórico completo de atendimentos anteriores
- Download de comprovante de agendamento
- Chat/mensagem direta com a gestão
- FAQ com perguntas frequentes sobre o processo de regulação
- Mapa ou endereço da UBS de referência
- Acompanhamento de fila (posição na fila de regulação)

---

## PARTE 10 — VISÃO DE APP MOBILE

Ao final da avaliação, produza uma seção descrevendo como o sistema se traduziria para um **aplicativo mobile nativo** (iOS/Android). Considere:

1. **Qual o diferencial de ser um app vs site responsivo?**
   (ex: notificações push, acesso ao câmera para documentos, offline mode)

2. **Quais funcionalidades ganhariam mais com o app nativo?**

3. **Qual seria a tela home do app?** O que o paciente veria primeiro ao abrir?

4. **Existe necessidade de modo offline?** O paciente sem internet precisa de alguma funcionalidade?

5. **Como seria o onboarding do app?** O paciente que nunca usou sabe como cadastrar seu CRA?

---

## FORMATO DO RELATÓRIO FINAL

```
# RELATÓRIO DE AVALIAÇÃO UX — Portal do Paciente
Data: [hoje]

## NOTA GERAL DO PORTAL
[Nota de 0-10 com justificativa em 2 linhas]

## PONTOS FORTES
[O que funciona bem — seja honesto, não liste coisas que não funcionam]

## PROBLEMAS CRÍTICOS (bloqueia uso real)
### [Título do problema]
- Onde: [tela]
- Impacto: [o que o paciente pensa/sente]
- Sugestão: [o que deveria ser feito]

## PROBLEMAS RELEVANTES (prejudica mas não bloqueia)
[Mesmo formato]

## MELHORIAS DE UX (oportunidades)
[Lista com descrição curta e impacto esperado]

## MÓDULOS AUSENTES
| Módulo | Classificação | Justificativa |
|--------|---------------|---------------|
| ...    | MUST HAVE     | ...           |

## VISÃO DE APP MOBILE
[Prosa estruturada respondendo as 5 perguntas do Parte 10]

## RESUMO PARA A BANCA
[3-5 bullets do que mostrar, o que omitir, o que preparar]
```

---

## CREDENCIAIS DE REFERÊNCIA

| Campo | Valor |
|---|---|
| Paciente — CRA | `992191018` (Reinaldo Gramacho) |
| Paciente — Data Nasc. | `19/12/1989` |
| URL Portal | `https://gestao-saude-ubs.vercel.app/paciente` |
| Largura da janela | **375px** (modo responsivo no DevTools) |

---

*Gestão Saúde UBS+ — UFBRA — roteiro gerado por Claude Sonnet 4.6*
