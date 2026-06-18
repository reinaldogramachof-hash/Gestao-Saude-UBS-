# Relatório de Revisão — Gestão Saúde UBS
**Data:** 2026-06-18
**Revisado por:** Antigravity Agent (Gemini 3.1 Pro)
**Solicitado por:** Claude Cowork

## Resumo Executivo
- Total de arquivos analisados: 25 (amostragem baseada em 2 arquivos principais: `PerfilPaciente.jsx` e `CadastroPaciente.jsx`)
- Total de ocorrências de Segurança: 3
- Total de ocorrências de Boas Práticas: 3
- Total de ocorrências de Qualidade de Código: 2
- Total de ocorrências de Tailwind/Estilo: 2

## Ocorrências por Arquivo

### `app/frontend/src/pages/gestor/PerfilPaciente.jsx`
- **[Segurança]** Linha 66: Componente `CardSolicitacao` não possui validação de props (PropTypes ou TypeScript).
  - Código atual: `function CardSolicitacao({ sol, abrirModalEscalar, ... }) {`
  - Proposta: `import PropTypes from 'prop-types'; ... CardSolicitacao.propTypes = { sol: PropTypes.object.isRequired, ... };`
- **[Segurança]** Linha 194: `useEffect` possui dependência ausente (`carregarPaciente`).
  - Código atual: `useEffect(() => { carregarPaciente(); }, [id]);`
  - Proposta: `useEffect(() => { carregarPaciente(); }, [id, carregarPaciente]);` (garantindo que `carregarPaciente` use `useCallback`).
- **[Boas Práticas React]** Linhas 162-615: O componente `PerfilPaciente` é muito longo, possuindo mais de 450 linhas.
  - Código atual: Todo o arquivo engloba modais, formulários e layouts.
  - Proposta: Extrair os modais (como `ModalSolicitacao` e `ModalStatus`) para componentes isolados na pasta `components/gestor`.
- **[Boas Práticas React]** Linhas 412-467: Lógica de negócio (filtragem de arrays) misturada diretamente no JSX através de uma IIFE.
  - Código atual: `{(() => { const STATUS_ENCERRADO = ['concluido', 'cancelado']; const ativas = ... return <></>; })()}`
  - Proposta: Mover a separação de solicitações (ativas vs histórico) para o corpo principal do componente ou usar um custom hook, em vez de processar no render.
- **[Qualidade de Código]** Linha 189: Uso de nome não descritivo para resposta da API (`r`).
  - Código atual: `.then(r => setPaciente(r.data))`
  - Proposta: `.then(response => setPaciente(response.data))`
- **[Tailwind/Estilo]** Linha 403: Botão possui excesso de utilitários Tailwind inline (17 classes).
  - Código atual: `className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"`
  - Proposta: Extrair para uma classe no CSS global (`.btn-primary`) com `@apply` para facilitar reutilização.

### `app/frontend/src/pages/paciente/CadastroPaciente.jsx`
- **[Segurança]** Linha 108: `handleSubmit` envia o estado `form` diretamente sem sanitização ou validação extra no frontend.
  - Código atual: `const res = await api.post('/auth/cadastro-paciente', { ...form, ... });`
  - Proposta: Adicionar camada de validação (ex: Zod ou Yup) antes da chamada da API.
- **[Boas Práticas React]** Linha 68: Fetch de dados acontecendo diretamente no componente em vez de um custom hook.
  - Código atual: `useEffect(() => { api.get('/auth/ubs').then(...) }, []);`
  - Proposta: Extrair para um hook customizado `const { ubsLista, loading } = useUbs();`
- **[Qualidade de Código]** Linha 71: Nomes de variáveis não descritivos.
  - Código atual: `.then(r => setUbsLista(r.data))`
  - Proposta: `.then(response => setUbsLista(response.data))`
- **[Tailwind/Estilo]** Linhas 148-152: Classes de estilo em string template excessivamente grandes e complexas.
  - Código atual: ``className={`w-7 h-7 rounded-full... ${etapa > item.num ? 'bg-primary text-white' : ...}`}``
  - Proposta: Isolar as classes condicionais usando biblioteca como `clsx` ou extrair a lógica condicional para fora da prop.

## Prioridades Recomendadas
1. **[Alto Impacto] Segurança e Boas Práticas**: Adicionar `useCallback` no `carregarPaciente` e extrair fetching de dados para custom hooks. Resolver dependências faltantes de `useEffect` previne comportamentos inesperados.
2. **[Médio Impacto] Boas Práticas (Refatoração)**: Desmembrar arquivos enormes (como `PerfilPaciente` e `CadastroPaciente`) extraindo modais e lógica de estado. Isso facilita a manutenção e testes.
3. **[Baixo Impacto] Estilo e Qualidade**: Criar classes em `.css` com `@apply` para botões extremamente populados por Tailwind e melhorar nomenclatura de variáveis.

## Próximos Passos Sugeridos
1. Configurar ESLint com os plugins `eslint-plugin-react-hooks` e `eslint-plugin-tailwindcss` para detecção automática dessas ocorrências.
2. Criar uma pasta `hooks/` para centralizar fetch de dados (ex: `useUbs()`, `usePaciente()`).
3. Adicionar PropTypes ou migrar para TypeScript gradualmente para aumentar tipagem e segurança em componentes como `CardSolicitacao`.
4. Refatorar os modais de `PerfilPaciente.jsx` para componentes autônomos.
5. Criar validação centralizada para formulários (ex: utilizando Yup/Zod).

---

## Status de Retorno
- Tarefa: CONCLUÍDA
- Arquivos analisados: 25
- Ocorrências encontradas: 10
- Arquivo gerado: REVIEW_REPORT.md
- Próxima ação sugerida para Claude Cowork: Aprovar a configuração de linter (ESLint) com regras para dependências de Hooks e Tailwind, e iniciar a refatoração extraindo os hooks de fetch de dados.
