# REPORT — Análise Card "Atenção Imediata"
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** 2026-06-18

## Sumário Executivo
Após auditoria minuciosa nas camadas de frontend e backend, o card "Atenção Imediata" e a rota `/alertas` foram validados. Identificamos **1 bug confirmado** (botão "Ver todos" inerte no frontend) e **descaratamos as suspeitas** de duplicidade de registros, desvio de tipo decimal no cálculo de tempo e vulnerabilidade de segurança (a rota está devidamente protegida). Recomendo uma única implementação cirúrgica de interface para corrigir a navegação do botão inerte.

---

## Item 1 — dias_parado decimal
**Status:** Descartado
**Evidência:**
- **Backend:** `app/backend/src/routes/gestor.js` (linha 659)
  ```js
  knex.raw('EXTRACT(DAY FROM NOW() - solicitacoes.atualizado_em) AS dias_parado')
  ```
- **Frontend:** `app/frontend/src/pages/gestor/DashboardGestor.jsx` (linha 154)
  ```jsx
  <td className="p-4 text-red-600 font-semibold">Parado há {item.dias_parado} dias</td>
  ```
**Impacto:** Sem impacto visual. Embora o PostgreSQL retorne `double precision` para a função `EXTRACT`, o driver `pg` do Node.js entrega o valor como número JavaScript. No JS, representações numéricas de inteiros (como `2.0`) não exibem casas decimais ao serem stringificadas ou interpoladas na UI (exibe "2" em vez de "2.0"). Portanto, o frontend renderiza o valor corretamente sem requerer formatação extra.

---

## Item 2 — Duplicatas na query
**Status:** Descartado
**Evidência:** `app/backend/src/routes/gestor.js` (linhas 630-668)
**Impacto:** Sem impacto/Inexistente. A query do banco de dados aplica filtros lógicos em um único `SELECT` sobre a tabela principal `solicitacoes` (fazendo apenas join de 1-para-1 com `pacientes`). Em bancos relacionais baseados em SQL, a cláusula `WHERE` contendo múltiplos `OR` avalia a expressão lógica como verdadeira ou falsa para cada linha. Se uma solicitação atende a mais de uma regra simultaneamente (ex: Regra A e Regra C), o banco a retornará **apenas uma vez** no conjunto de resultados. Logo, não há risco de duplicatas no card.

---

## Item 3 — Botão "Ver todos" sem navegação
**Status:** Confirmado bug
**Evidência:** `app/frontend/src/pages/gestor/DashboardGestor.jsx` (linhas 168-175)
  ```jsx
  {alertas.total > 5 && (
    <div className="p-4 bg-white/50 border-t border-red-100 text-center">
      <button className="text-red-700 font-bold text-sm hover:underline">
        Ver todos os {alertas.total} casos
      </button>
    </div>
  )}
  ```
**Proposta de correção:**
O botão não possui nenhum manipulador `onClick`, tornando-se inerte. Como a listagem de alertas trata do fluxo de regulação de exames e consultas pendentes, a ação ideal é redirecionar o gestor para a tela de regulação (`/gestor/regulacao`).

```diff
<<<<
          {alertas.total > 5 && (
            <div className="p-4 bg-white/50 border-t border-red-100 text-center">
              <button className="text-red-700 font-bold text-sm hover:underline">
                Ver todos os {alertas.total} casos
              </button>
            </div>
          )}
====
          {alertas.total > 5 && (
            <div className="p-4 bg-white/50 border-t border-red-100 text-center">
              <button 
                onClick={() => navigate('/gestor/regulacao')}
                className="text-red-700 font-bold text-sm hover:underline"
              >
                Ver todos os {alertas.total} casos
              </button>
            </div>
          )}
>>>>
```

---

## Item 4 — Desvio "Ver Paciente" vs "Atualizar"
**Status:** Intencional (Adequado)
**Evidência:** `app/frontend/src/pages/gestor/DashboardGestor.jsx` (linhas 156-161)
**Recomendação:** **Manter**. Navegar para a página de perfil completo do paciente (`/gestor/paciente/${item.paciente_id}`) é a melhor decisão funcional. Ali, o gestor possui contexto completo da situação do munícipe (todas as solicitações deste paciente e histórico anterior), evitando a tomada de decisões ou alterações isoladas sem histórico clínico.

---

## Item 5 — Autenticação da rota /alertas
**Status:** Protegida (Segura)
**Evidência:**
- **Roteador:** `app/backend/src/routes/gestor.js` (linha 53)
  ```js
  router.use(soGestor);
  ```
- **Servidor:** `app/backend/server.js` (linha 74)
  ```js
  app.use('/api/gestor',   authMiddleware, rotasGestor);
  ```
**Impacto:** A rota está segura. Ela é exposta através do caminho global `/api/gestor/alertas`, que obrigatoriamente passa pelo `authMiddleware` do Express, decodificando o JWT. No escopo interno do arquivo de rotas, a linha 53 assegura que apenas usuários com `tipo === 'gestor'` prossigam para os controllers, impedindo acesso de pacientes ou usuários não autenticados.

---

## Próximos Passos Recomendados
1. **[UI/Frontend] Correção do botão "Ver todos":** Aplicar o evento `onClick` na linha 170 do arquivo `DashboardGestor.jsx` para redirecionar para a rota de regulação de forma integrada. (Criticidade: 🟢 Baixa/Média — Ajuste cosmético de usabilidade).
2. Nenhuma alteração backend é necessária nas rotas de alertas ou na autenticação.
