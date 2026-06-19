# TASK_16 — Perfil: Segurança CPF + Polish Visual
## Para o Agente Antigravity

> **Prioridade:** 🟢 Menor — mas impacta profissionalismo e LGPD
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Arquivo:** `app/frontend/src/pages/paciente/PerfilPaciente.jsx`

---

## ITEM 1 — SEGURANÇA: Mascarar CPF

### Problema
O CPF é exibido completo: `123.456.789-10`. Viola boas práticas de LGPD — dado
sensível não deve aparecer integralmente em tela (risco de shoulder surfing).

### Fix: Função de mascaramento

```jsx
// Aplica máscara parcial ao CPF: "123.456.789-10" → "***.***.789-10"
// Mantém os últimos 5 dígitos visíveis (suficiente para conferência)
const mascaraCPF = (cpf) => {
  if (!cpf) return '—';
  const nums = cpf.replace(/\D/g, ''); // remove pontuação
  if (nums.length !== 11) return cpf;  // formato inesperado: exibe como está
  return `***.***.\${nums.substring(6, 9)}-\${nums.substring(9, 11)}`;
};
```

Aplicar no JSX:
```jsx
{/* ANTES: */}
<p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.cpf}</p>

{/* DEPOIS: */}
<p className="font-semibold text-on-surface mt-0.5 text-sm font-mono tracking-wider">{mascaraCPF(perfil.cpf)}</p>
```

---

## ITEM 2 — POLISH: Botão "Solicitar atualização de dados"

O paciente não pode editar o próprio perfil (MVP read-only). Mas precisa de uma saída quando
os dados estão errados. Adicionar botão que navega para agendamentos (onde pode pedir ao gestor).

Adicionar ao final da `<main>`, após os dois blocos de seção:

```jsx
{/* ── Ação: Solicitar correção de dados ── */}
{!loading && !erro && (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
    <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">info</span>
    <div className="flex-1">
      <p className="text-sm font-bold text-amber-800">Dados incorretos ou desatualizados?</p>
      <p className="text-xs text-amber-700 mt-0.5">
        Seus dados são gerenciados pela equipe da UBS. Agende um atendimento para solicitar correções.
      </p>
      <button
        onClick={() => navigate('/paciente/agendamentos')}
        className="mt-3 text-sm font-bold text-amber-800 border border-amber-400 px-4 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
      >
        Agendar atendimento
      </button>
    </div>
  </div>
)}
```

Adicionar `useNavigate` ao import se ainda não existir.

---

## ITEM 3 — POLISH: Campo vazio mais claro

Campos com valor `—` são tecnicamente corretos mas frios. Melhorar a experiência quando
dados clínicos não estão preenchidos:

```jsx
// Helper: exibe valor ou placeholder cinza "Não informado"
const valorOuPlaceholder = (valor) => {
  if (!valor || valor === '—') {
    return <span className="text-on-surface-variant/50 italic text-xs">Não informado</span>;
  }
  return <span className="font-medium text-on-surface text-sm whitespace-pre-wrap">{valor}</span>;
};
```

Aplicar nas 4 seções de saúde (alergias, comorbidades, medicamentos contínuos, obs clínicas):

```jsx
{/* ANTES: */}
<p className="font-medium text-on-surface mt-1 text-sm whitespace-pre-wrap">{perfil.alergias}</p>

{/* DEPOIS: */}
<div className="mt-1">{valorOuPlaceholder(perfil.alergias)}</div>
```

---

## ITEM 4 — POLISH: Peso e Altura como IMC

Se peso E altura estiverem preenchidos, calcular e exibir o IMC:

```jsx
const calcularIMC = (peso, altura) => {
  if (!peso || !altura || peso === '—' || altura === '—') return null;
  const alturaM = parseFloat(altura) / 100;
  const imc = (parseFloat(peso) / (alturaM * alturaM)).toFixed(1);
  const classificacao =
    imc < 18.5 ? 'Abaixo do peso' :
    imc < 25   ? 'Peso normal' :
    imc < 30   ? 'Sobrepeso' : 'Obesidade';
  return { imc, classificacao };
};
```

Adicionar um 4º card colorido ao grid de métricas (ao lado de Peso e Altura):

```jsx
{calcularIMC(perfil.peso_kg, perfil.altura_cm) && (() => {
  const { imc, classificacao } = calcularIMC(perfil.peso_kg, perfil.altura_cm);
  return (
    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
      <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">IMC</label>
      <p className="font-extrabold text-amber-600 mt-1 text-base">{imc}</p>
      <p className="text-[10px] text-amber-700 mt-0.5">{classificacao}</p>
    </div>
  );
})()}
```

**Importante:** o IMC aqui é apenas para contexto informativo do paciente. Nunca exibir como
diagnóstico ou recomendação médica. Só aparece quando ambos os campos estão preenchidos.

---

## VALIDAÇÃO

1. CPF exibido como `***.***.789-10` (parcialmente mascarado)
2. Banner âmbar "Dados incorretos?" visível ao final da página
3. Clicar "Agendar atendimento" navega para `/paciente/agendamentos`
4. Campos vazios mostram "Não informado" em itálico cinza
5. IMC calculado e visível quando peso + altura preenchidos
6. Sem erros de runtime (NaN, null, undefined) nos cálculos
7. Build limpo, git commit + push

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
