# Relatorio de Sessao - Fix Login Gestor e Chaves de Sessao

**Data/Hora:** 2026-06-24 10:47
**Agente Executor:** Deep Think
**Arquiteto na Sessao:** Deep Think (substituto)
**Status da Sessao:** Concluida

---

## Objetivo da Sessao

Investigar a falha em que o Portal do Gestor abria apos o login, fechava em seguida e retornava para o login do paciente.

---

## O que foi executado

1. Lido o contexto obrigatorio de inicio de sessao e o relatorio mais recente.
2. Verificado que o backend de producao aceita login gestor e responde `/api/gestor/dashboard/stats` com token valido.
3. Inspecionado o bundle publicado do frontend para confirmar a regra de chaves de sessao em producao.
4. Identificada a causa raiz: `/login-gestor` nao era reconhecida como rota do portal gestor por `getTokenKey()`/`getUserKey()`.
5. Criado teste de contrato que falhava com o comportamento atual.
6. Corrigido o mapeamento de chaves por rota de login e a gravacao da sessao por `dadosUsuario.tipo`.
7. Corrigido o redirect de 401 do portal externo de `/externa/login` para `/login-externa`.
8. Validado login gestor local via navegador: apos autenticar, a URL permaneceu em `/gestor/dashboard` e o DOM exibiu o Portal do Gestor.
9. Executados testes automatizados e build do frontend.

---

## Arquivos Criados ou Modificados

| Arquivo | Acao | Descricao da mudanca |
|---|---|---|
| `app/frontend/src/services/api.js` | Modificado | `getTokenKey()` e `getUserKey()` agora reconhecem `/login-gestor` e `/login-externa`; redirect externo em 401 usa `/login-externa`. |
| `app/frontend/src/contexts/AuthContext.jsx` | Modificado | `login()` salva token e usuario pela chave correspondente ao `tipo` retornado pela API, evitando gravar sessao de gestor como paciente. |
| `tests/bloco1-contracts.test.mjs` | Modificado | Adicionado contrato para impedir regressao das chaves de sessao nas paginas de login. |
| `.Agent/reports/2026-06-24_fix_login_gestor_chaves_sessao.md` | Criado | Relatorio tecnico da investigacao e correcao. |

---

## Commits Realizados

| Hash | Mensagem | Branch |
|---|---|---|
| N/A | Nenhum commit solicitado nesta etapa. | `main` |

---

## Decisoes Tecnicas Tomadas

- **Decisao:** Corrigir tanto a deteccao por path quanto a gravacao por `tipo`.
  **Motivo:** A deteccao por path cobre restauracao/interceptor em paginas de login; a gravacao por `tipo` evita depender da URL momentanea durante `login()`.

- **Decisao:** Corrigir tambem o redirect externo de `/externa/login` para `/login-externa`.
  **Motivo:** A rota real declarada em `App.jsx` e `/login-externa`; manter a rota antiga causaria tela inexistente em sessoes externas expiradas.

---

## Problemas Encontrados

- **Problema:** Login gestor gravava token em `@UBS_Token_Paciente` porque `/login-gestor` caia no fallback de paciente.
  **Resolucao:** `/login-gestor` passou a mapear para chaves de gestor, e `AuthContext.login()` passou a salvar conforme `dadosUsuario.tipo`.

- **Problema:** Interceptor 401 do portal externo usava rota inexistente.
  **Resolucao:** Redirect ajustado para `/login-externa`.

---

## Pendencias para a Proxima Sessao

- [ ] Commitar esta correcao quando aprovado.
- [ ] Publicar/deployar para producao para substituir o bundle que ainda contem a regra antiga.
- [ ] Manter atencao as mudancas locais da TASK_30, que continuam separadas.

---

## Resultado dos Testes e Build

```bash
node --test tests\bloco1-contracts.test.mjs
# Sucesso: 8 pass, 0 fail

node --test
# Sucesso: 71 pass, 0 fail

cd app\frontend && npm.cmd run build
# Sucesso: build Vite concluido
# Observacao: permanece aviso existente sobre import dinamico/estatico de react-hot-toast.
```

---

## Notas Adicionais

Validacao local por navegador confirmou que o login gestor permanece em `/gestor/dashboard` e exibe o Portal do Gestor. Em producao, o backend foi validado como funcional; o problema estava no bundle frontend publicado, que ainda precisa receber este patch via commit/push/deploy.
