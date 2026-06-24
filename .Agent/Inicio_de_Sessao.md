# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.
> **Última atualização:** 2026-06-24 — Claude Sonnet 4.6 (Arquiteto)
> Próximo evento: **Banca UFBRA — 26/06/2026 às 20h**

---

## Estado atual

**Testes:** 86/86 passando ✅  
**Branch:** `main` — working tree com mudanças prontas para commit  
**Bloqueio ativo:** `.git/index.lock` impede commits

Leia o relatório completo da sessão:
`.Agent/reports/TASK_32_33_Perfil_Medico_Validacao.md`

---

## Primeira ação do Codex

### Passo 1 — Verificar index.lock

```bash
ls -la .git/index.lock
```

Se existir, peça ao Reinaldo para executar no PowerShell:
```powershell
Remove-Item "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+\.git\index.lock" -Force
```

### Passo 2 — Commit

```bash
git add -u
git add app/backend/src/middleware/authorization.js
git add app/backend/src/db/migrations/027_add_segmentacao_clinica_comunicados.js
git add app/backend/src/db/seeds/008_slots_banca.js
git add app/backend/test_contrato_rbac.js
git add app/frontend/src/pages/gestor/RelatoriosGestor.jsx
git add app/frontend/src/pages/gestor/PainelMedico.jsx
git add tests/task33-relatorios.test.mjs
git commit -m "feat: TASK_32/33 agenda + fluxo comunicação + perfil médico RBAC + relatórios"
git push origin main
```

### Passo 3 — Migration 027 em produção

```bash
cd app/backend
NODE_ENV=production npx knex migrate:latest
```

Confirme que `027_add_segmentacao_clinica_comunicados` aparece.

### Passo 4 — Verificar deploy Vercel

- Build sem erro de compilação
- Slots da banca visíveis: UBS Vila Maria, 26/06/2026, 19h–21h

---

## Aviso crítico — Sync do Linux mount

O sandbox Linux mostra versões stale de arquivos modificados pelo Antigravity via Windows.
Ao validar qualquer arquivo, use sempre:

```bash
node -e "const s=require('fs').readFileSync('arquivo','utf8'); console.log('lines:',s.split('\n').length,'last:',JSON.stringify(s.split('\n').slice(-2)))"
```

Nunca confie no output do Read tool como prova do estado real do disco.

---

## Módulos entregues (status para a banca)

| Módulo | Status |
|---|---|
| Agenda lote (TASK_32) | ✅ 86/86 |
| Fluxo comunicação vivo (TASK_33) | ✅ |
| Portal externo visual | ✅ |
| Perfil médico RBAC + receituário | ✅ |
| Segmentação clínica comunicados | ✅ |
| Relatórios RF-G09 | ✅ |
| Migration 027 em **PRODUÇÃO** | ⚠️ Pendente |
| Commit + push + deploy | ⚠️ Pendente (aguarda index.lock) |

---

## Regras invioláveis

- `ubs_id` e `gestor_id` vêm sempre do JWT — nunca do body
- Nenhuma rota expõe pacientes sem autenticação (LGPD)
- Médicos bloqueados via `soNaoMedico` em POST/PUT de regulação e vigilância
- Todos os arquivos precisam de comentários explicativos
