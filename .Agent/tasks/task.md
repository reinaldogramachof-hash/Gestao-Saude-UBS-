# TASK — Revisão de Boas Práticas
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS
**Tipo:** Leitura + Proposta de Código (sem execução)
**Data:** 2026-06-18

---

## CONTEXTO DO PROJETO

Stack: React + Tailwind CSS + Node.js/Express + Supabase
Deploy: Vercel (frontend) → Supabase (backend/DB)
Padrão de arquitetura: componentes funcionais React com hooks
Convenções: seguir regras definidas em AGENTS.md se presente na raiz

---

## OBJETIVO DA TAREFA

Realizar uma revisão de boas práticas nos arquivos frontend do projeto,
identificando problemas e propondo correções sem modificar nenhum arquivo.

---

## INSTRUÇÕES DE EXECUÇÃO

### Passo 1 — Leitura e mapeamento
Leia os seguintes arquivos/diretórios na ordem abaixo:
1. `AGENTS.md` na raiz (se existir)
2. `CLAUDE.md` na raiz (se existir) — use como referência de convenções
3. Todos os arquivos `.jsx` e `.tsx` em `src/components/`
4. Todos os arquivos `.jsx` e `.tsx` em `src/pages/`

### Passo 2 — Análise por categoria
Para cada arquivo lido, verifique e anote ocorrências de:

**Segurança:**
- Props sem validação de tipo (ausência de PropTypes ou TypeScript)
- Dados sensíveis hardcoded (tokens, URLs de API, credenciais)
- Inputs sem sanitização antes de enviar ao backend
- useEffect com dependências ausentes ou incorretas

**Boas Práticas React:**
- Componentes com mais de 150 linhas (candidatos a decomposição)
- Lógica de negócio misturada diretamente no JSX
- Estado sendo mutado diretamente em vez de via setter
- Keys ausentes ou usando índice de array em listas renderizadas
- Fetch de dados direto no componente sem custom hook

**Qualidade de Código:**
- Funções sem nenhum comentário em lógicas complexas
- Nomes de variáveis não descritivos (ex: `data`, `res`, `temp`)
- Imports não utilizados
- Console.log esquecidos no código

**Tailwind/Estilo:**
- Classes Tailwind inline com mais de 8 utilitários sem extração para @apply
- Estilos inline misturados com Tailwind sem justificativa

### Passo 3 — Entrega do relatório
Gere um arquivo `REVIEW_REPORT.md` na raiz do projeto com a seguinte estrutura:

```
# Relatório de Revisão — Gestão Saúde UBS
**Data:** [data atual]
**Revisado por:** Antigravity Agent (Gemini 3.1 Pro)
**Solicitado por:** Claude Cowork

## Resumo Executivo
[Total de arquivos analisados, total de ocorrências por categoria]

## Ocorrências por Arquivo
[Para cada arquivo com problema:]
### `src/components/NomeDoArquivo.jsx`
- **[CATEGORIA]** Linha X: [descrição do problema]
  - Código atual: `[trecho]`
  - Proposta: `[trecho corrigido]`

## Prioridades Recomendadas
[Lista ordenada por impacto: Alto / Médio / Baixo]

## Próximos Passos Sugeridos
[Máximo 5 ações concretas para o desenvolvedor]
```

---

## RESTRIÇÕES

- NÃO modificar nenhum arquivo do projeto
- NÃO executar nenhum comando npm, git ou bash
- NÃO instalar dependências
- Apenas ler, analisar e propor no relatório

---

## CRITÉRIO DE CONCLUSÃO

Tarefa concluída quando `REVIEW_REPORT.md` estiver gerado na raiz do projeto
com pelo menos uma ocorrência documentada por categoria analisada,
ou confirmação explícita de que a categoria está sem ocorrências.

---

## RETORNO PARA O ARQUITETO

Após gerar o relatório, registre no final do `REVIEW_REPORT.md`:

```
## Status de Retorno
- Tarefa: CONCLUÍDA
- Arquivos analisados: [N]
- Ocorrências encontradas: [N]
- Arquivo gerado: REVIEW_REPORT.md
- Próxima ação sugerida para Claude Cowork: [sua recomendação]
```
