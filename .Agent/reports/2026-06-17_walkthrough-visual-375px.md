# Entrega e Validação Visual — Bloco de Segurança

Este documento apresenta o resumo das alterações de segurança realizadas e a validação do fluxo visual do sistema em resolução mobile-first (**375px**), executada de forma automatizada através do Puppeteer local.

---

## 🛠️ Alterações Executadas

1. **C-01 — Isolamento de UBS na Atualização de Status (Resolvido):**
   - Rota modificada: `PUT /api/gestor/solicitacao/:id/status` em [gestor.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/src/routes/gestor.js).
   - A query agora filtra explicitamente por `solicitacoes.ubs_id` correspondente à UBS do gestor autenticado.
   - Retorno alterado para **404 (Not Found)** para ocultar a existência do recurso caso o gestor tente atualizar um ID de solicitação pertencente a outra UBS.

2. **C-05 — Rate Limit nas Rotas de Login (Resolvido):**
   - Rota modificada: `/api/auth/login-gestor` e `/api/auth/login-paciente` em [auth.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/src/routes/auth.js).
   - Implementado middleware `loginRateLimiter` com limite máximo de 10 tentativas por IP a cada 15 minutos.
   - Retorno amigável em português para os munícipes sem expor dados sensíveis do servidor.

3. **C-02 — Análise de Vazamento de Notas Internas (Validado):**
   - Rota sob análise: `GET /api/paciente/solicitacao/:id` em [paciente.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/src/routes/paciente.js).
   - Atestado que a API já utiliza o array explícito `CAMPOS_SOLICITACAO_PACIENTE` na consulta ao banco, excluindo `observacao_gestor` e `descricao` técnica de toda a interface do paciente.

---

## 📸 Galeria de Validação Visual (375px)

Abaixo está o fluxo percorrido pela automação de validação visual simulando a tela de um smartphone de 375px:

````carousel
![01 - Tela Inicial](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/01_tela_inicial.png)
**01 - Tela Inicial (Landing Page)**: Landing page limpa e direta, com botões para os dois portais em destaque.
<!-- slide -->
![02 - Login Gestor](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/02_login_gestor_form.png)
**02 - Login do Gestor**: Formulário de autenticação para equipe da UBS (E-mail e Senha) com design mobile-first refinado.
<!-- slide -->
![03 - Dashboard Gestor](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/03_dashboard_gestor.png)
**03 - Dashboard do Gestor**: Painel administrativo principal exibindo indicadores (cards) e o menu hambúrguer para controle lateral.
<!-- slide -->
![04 - Lista Pacientes](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/04_lista_pacientes.png)
**04 - Lista de Pacientes**: Visualização de pacientes da UBS para triagem de cadastros e agendamentos.
<!-- slide -->
![05 - Perfil Paciente](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/05_perfil_paciente.png)
**05 - Perfil do Paciente**: Detalhamento do paciente (ID 1) no portal do gestor, exibindo informações e dados cadastrais.
<!-- slide -->
![06 - Login Paciente](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/06_login_paciente_form.png)
**06 - Login do Paciente**: Interface simplificada mobile-first exigindo apenas o CRA e a Data de Nascimento para acesso facilitado.
<!-- slide -->
![07 - Login Paciente Erro](/C:/Users/reina/.gemini/antigravity/brain/7e42771d-95ad-467e-a3f7-b04ddbecd909/07_login_paciente_erro.png)
**07 - Login com Erro**: Mensagem amigável de erro de credenciais inválidas em português sem expor detalhes técnicos.
````

---

## 🔍 Anomalias Visuais Identificadas
- **Dashboard Gestor (Card 3):** No layout mobile-first em 375px (Screenshot 03), o menu hambúrguer de cabeçalho está centralizado e as margens da sidebar estão corretas. Não foi detectado vazamento de texto ou botões quebrados.
- **Formulário de Login (CRA):** Identificada e corrigida a falta do atributo `name="cra"` no input text do login do paciente (o que causou a falha no seletor da automação inicial, mas agora está mapeado corretamente).

---

## 🏗️ Relatório de Sessão & Deploy
*Os servidores locais continuam ativos para qualquer teste complementar.*
- **Backend:** [http://localhost:3001](http://localhost:3001)
- **Frontend:** [http://localhost:5173](http://localhost:5173)
