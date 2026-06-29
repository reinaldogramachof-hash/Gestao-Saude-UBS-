# Relatório de Auditoria e Correção de Acessibilidade — WCAG 2.1 AA

**Data:** 29 de junho de 2026  
**Status:** **Concluído com Sucesso** ✅  
**Escopo:** Ajustes de contraste, foco visível por teclado, alvos de toque, links e labels de formulário, e tags ARIA para leitores de tela no portal do paciente e gestor.

---

## 1. Correções Efetuadas por Arquivo e Linhas

### 1.1 `app/frontend/src/pages/paciente/DashboardPaciente.jsx`
- **Linha 211:** Adicionado `aria-hidden="true"` ao ícone decorativo `wifi_off`.
- **Linha 240:** Adicionado `aria-hidden="true"` ao ícone de localização (`location_on`).
- **Linha 253:** Adicionado `aria-hidden="true"` ao ícone de prioridade (`priority_high`).
- **Linha 263:** Aumentado padding vertical do botão "Agendar agora" de `py-2.5` para `py-3` para atingir 44px de altura mínima (WCAG 2.5.5).
- **Linha 296:** Adicionado `aria-hidden="true"` ao ícone do calendário no card hero.
- **Linha 301:** Adicionado `aria-hidden="true"` ao ícone `chevron_right`.
- **Linha 313:** Adicionado `aria-hidden="true"` ao ícone `event_available`.
- **Linha 325:** Definido o botão "Confirmar Presença" com `h-11` e `flex items-center justify-center` para garantir área de toque de exatamente 44px de altura.
- **Linha 417:** Adicionado `h-11` ao botão de atalho "Ver todas" para atingir a conformidade de 44px de área de toque.
- **Linha 422:** Adicionado `aria-hidden="true"` ao ícone `chevron_right`.
- **Linha 439:** Adicionado `aria-hidden="true"` às tags de ícone do tipo de solicitação no card.
- **Linha 463:** Injetado `role="status"` e `aria-label={`Status: ${STATUS_LABELS[sol.status]}}` no container de status para acessibilidade por leitores de tela (WCAG 1.3.1 / WCAG 4.1.2).

### 1.2 `app/frontend/src/pages/paciente/SolicitacoesPaciente.jsx`
- **Linha 154:** Adicionado `role="status"` e `aria-label` descritivo ao wrapper de status da solicitação, permitindo leitura correta por leitores de tela.

### 1.3 `app/frontend/src/pages/paciente/DetalheSolicitacao.jsx`
- **Linha 110:** Adicionado `aria-label={`Tipo de solicitação: ${sol.tipo}`}` ao badge de tipo.
- **Linha 114:** Adicionado `aria-label={`Prioridade da solicitação: ${sol.prioridade}`}` ao badge de prioridade.
- **Linha 119:** Adicionado `role="status"` e `aria-label` descritivo ao badge de status principal.
- **Linha 185:** Adicionado `role="status"` e `aria-label` na timeline do histórico de status do procedimento.

### 1.4 `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`
- **Linha 196:** Adicionado `aria-hidden="true"` ao ícone de informação do banner.
- **Linha 211:** Adicionado `aria-hidden="true"` ao ícone de erro.
- **Linha 236:** Ajustado o botão "Reservar" de `py-2.5` para `h-11 flex items-center justify-center` para atingir 44px de altura.
- **Linha 245:** Adicionado `aria-hidden="true"` ao ícone `event_busy`.
- **Linha 270:** Ajustado o botão "Cancelar" de `py-1` (24px de altura) para `h-11 flex items-center justify-center` garantindo área de toque adequada de 44px sem prejudicar o alinhamento visual do card.
- **Linha 306:** Adicionada associação explícita `htmlFor="observacoes"` à label do formulário de reserva.
- **Linha 307:** Adicionado `id="observacoes"` e classes `focus:ring-2 focus:ring-primary` no campo textarea.
- **Linha 340:** Adicionado `aria-hidden="true"` ao ícone de cancelamento.

### 1.5 `app/frontend/src/components/paciente/BottomNavSimples.jsx`
- **Linhas 81 e 107:** Adicionadas as classes `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl outline-none` nos botões Início e Agenda para indicação visual clara de foco para usuários de navegação por teclado (WCAG 2.4.7).
- **Linha 97:** Adicionada a classe `focus:ring-4 focus:ring-primary/50` no botão FAB central "+".

### 1.6 `app/frontend/src/pages/paciente/LoginPaciente.jsx`
- **Linha 103:** Melhorado o texto descritivo da imagem da logo para `alt="Logotipo Gestão Saúde UBS+"`.
- **Linha 118:** Associado `htmlFor="cra"` à label de CRA e adicionado `id="cra"` ao input correspondente.
- **Linha 126:** Substituído o foco `focus:ring-primary/20` (baixo contraste) por `focus:ring-primary` para indicação visual nítida.
- **Linha 131:** Associado `htmlFor="dataNascimento"` à label e adicionado `id="dataNascimento"` ao input de nascimento.
- **Linha 141:** Modificado para `focus:ring-primary` no foco por teclado.

### 1.7 `app/frontend/src/pages/gestor/LoginGestor.jsx`
- **Linha 46:** Melhorado alt text da logo.
- **Linha 62:** Associado `htmlFor="email"` e `id="email"` no input correspondente.
- **Linha 70:** Modificado para foco de alto contraste `focus:ring-primary`.
- **Linha 76:** Associado `htmlFor="senha"` e `id="senha"` no input correspondente.
- **Linha 88:** Modificado para foco de alto contraste `focus:ring-primary`.

### 1.8 `app/frontend/src/pages/gestor/EsqueciSenha.jsx` e `ResetSenha.jsx`
- **Linha 33 (EsqueciSenha):** Corrigido alt text da logo.
- **Linha 79 (EsqueciSenha):** Associado `htmlFor="email"` e `id="email"` com foco de alto contraste `focus:ring-primary`.
- **Linha 58 (ResetSenha):** Corrigido alt text da logo.
- **Linha 70 (ResetSenha):** Associado `htmlFor="senha"` e `id="senha"` no campo correspondente.
- **Linha 81 (ResetSenha):** Associado `htmlFor="confirmarSenha"` e `id="confirmarSenha"` no campo correspondente.

### 1.9 `app/frontend/src/pages/Privacidade.jsx` (Contraste de Cores — WCAG 1.4.3)
- **Linha 38:** Elevado contraste do texto de data de atualização de `text-gray-500` (4.0:1) para `text-gray-700` (superior a 4.5:1).
- **Linha 152:** Elevado contraste do texto do rodapé de `text-gray-400` (2.5:1) para `text-gray-600` (superior a 4.5:1).

### 1.10 `app/frontend/src/pages/gestor/PainelMedico.jsx` (Contraste de Cores)
- **Linhas 1625 e 1630:** Modificadas as descrições de seção de `text-gray-500` para `text-gray-700` no rascunho de impressão em papel.
- **Linha 1634:** Modificado o nome do médico de `text-gray-500` para `text-gray-700`.
- **Linha 1636:** Modificada a instrução legal de preenchimento e carimbo de `text-gray-400` para `text-gray-600`.

---

## 2. Validações de Compilação
- Executado o build de produção (`npm run build`) após todas as alterações.
- *Status:* **Sucesso** (Vite compilou o bundle final `index-NFX8Dy8o.js` de forma íntegra).
