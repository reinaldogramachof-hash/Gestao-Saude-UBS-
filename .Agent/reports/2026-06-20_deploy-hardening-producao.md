# Relatorio de Deploy - Hardening de Seguranca em Producao

**Data/Hora:** 2026-06-20
**Agente Executor:** Codex
**Status:** Deploy validado

---

## Commit

| Hash | Mensagem | Branch |
|---|---|---|
| `fe500f4` | `feat(security): hardening HTTP, token_version, auditoria LGPD e RLS — TASK_24` | `main` |

Push realizado para `origin/main`:

```bash
git push origin main
# a9536e8..fe500f4  main -> main
```

---

## Resultado dos Testes

Comando executado na raiz do projeto para descobrir a suite completa:

```bash
node --test
```

Resultado:

```text
# tests 36
# pass 36
# fail 0
```

Observacao: os testes ficam na pasta raiz `tests/`, por isso a execucao foi feita na raiz do repositorio para obter os 36 contratos esperados.

---

## Smoke Test da API

Comando:

```bash
curl.exe https://gestao-saude-ubs-api.vercel.app/api/ping
```

Resultado:

```json
{"status":"ok","message":"API Gestão Saúde UBS+ funcionando!"}
```

Status: aprovado.

---

## Validacao de Login Pos-Deploy

Credencial de teste usada conforme orientacao:

```text
centro@gestaoubs.dev / senha123
```

Validacoes executadas:

1. Frontend de producao respondeu HTTP 200 em `https://gestao-saude-ubs.vercel.app`.
2. Login de gestor em `POST https://gestao-saude-ubs-api.vercel.app/api/auth/login-gestor` retornou token.
3. Chamada autenticada ao dashboard em `GET https://gestao-saude-ubs-api.vercel.app/api/gestor/dashboard/stats` retornou metricas reais:
   - `total_pacientes`
   - `em_analise`
   - `autorizados`
   - `data_marcada`
   - `medicamentos_indisponiveis`
   - `encaminhamentos_pendentes`
   - `atividade_recente`

Status: aprovado.

---

## Observacoes

A automacao do navegador interno falhou por restricao do ambiente Windows (`CreateProcessAsUserW failed: 5`). Para nao bloquear o deploy, a validacao pos-deploy foi feita pelo fluxo HTTP real de producao: frontend disponivel, login autenticado e dashboard consultado com token JWT.
