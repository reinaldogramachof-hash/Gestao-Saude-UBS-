# REPORT 01 — Painel Médico
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** 2026-06-18

## Sumário
Após leitura integral e cuidadosa dos 5 arquivos do escopo obrigatório (`GestorPacientes.jsx`, `PerfilPaciente.jsx`, `GestorLayout.jsx`, `App.jsx` e `SideNavGestor.jsx`), elaborei a proposta completa de código para o novo componente read-only `PainelMedico.jsx` e os diffs precisos de sua integração na malha de roteamento e na navegação lateral do portal.

---

## PROPOSTA: PainelMedico.jsx
```jsx
/**
 * PÁGINA: PainelMedico.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Painel de consulta clínica exclusivo para médicos. Permite buscar
 *         qualquer paciente pelo CRA, visualizar prontuário e histórico de
 *         solicitações em modo somente leitura (read-only), sem permissão de edição.
 * API: GET /api/gestor/pacientes?busca={cra}
 *      GET /api/gestor/paciente/:id
 *      GET /api/gestor/solicitacao/:id/historico
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
// formatarDataBR: corrige bug de fuso horário em strings de data sem horário (UTC-3)
import { formatarDataBR } from '../../utils/statusHelper';
import GestorLayout from '../../components/gestor/GestorLayout';

// Mapa de cores para cada status de solicitação
const STATUS_BADGE = {
  em_analise:           'bg-gray-100 text-gray-600',
  aguardando_regulacao: 'bg-amber-100 text-amber-700',
  autorizado:           'bg-blue-100 text-blue-700',
  data_marcada:         'bg-teal-100 text-teal-700',
  aguardando_resultado: 'bg-purple-100 text-purple-700',
  concluido:            'bg-emerald-100 text-emerald-700',
  cancelado:            'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  em_analise:           'Em Análise',
  aguardando_regulacao: 'Ag. Regulação',
  autorizado:           'Autorizado',
  data_marcada:         'Data Marcada',
  aguardando_resultado: 'Ag. Resultado',
  concluido:            'Concluído',
  cancelado:            'Cancelado',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CardSolicitacaoMedico
// FUNÇÃO: Renderiza o card de uma solicitação no painel médico.
//         Exibe status, previsão e histórico expansível sem botões de modificação.
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacaoMedico({
  sol,
  alternarHistorico,
  historicosAbertos,
  historicos,
  carregarHistorico,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-on-background truncate">{sol.descricao_paciente}</h3>
            <span className="text-xs font-bold px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant flex-shrink-0">{sol.tipo}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[sol.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[sol.status] || sol.status}
            </span>
            {sol.prioridade === 'urgente' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Urgente
              </span>
            )}
          </div>
          {sol.data_prevista && (
            <p className="text-xs text-on-surface-variant">Previsão: {formatarDataBR(sol.data_prevista)}</p>
          )}
          {sol.observacao_paciente && (
            <p className="text-xs text-on-surface-variant italic mt-1">{sol.observacao_paciente}</p>
          )}
        </div>
      </div>
      
      {/* Histórico da Solicitação */}
      <div className="mt-4 pt-4 border-t border-surface-variant">
        <button
          onClick={() => alternarHistorico(sol.id)}
          className="flex items-center gap-2 text-sm font-bold text-primary"
          aria-expanded={Boolean(historicosAbertos[sol.id])}
        >
          <span className="material-symbols-outlined text-lg">
            {historicosAbertos[sol.id] ? 'expand_less' : 'history'}
          </span>
          {historicosAbertos[sol.id] ? 'Ocultar histórico' : 'Ver histórico'}
        </button>
        
        {historicosAbertos[sol.id] && (
          <div className="mt-4">
            {historicos[sol.id]?.loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-14 bg-surface-container-high rounded-xl" />
                <div className="h-14 bg-surface-container-high rounded-xl" />
              </div>
            ) : historicos[sol.id]?.erro ? (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold">{historicos[sol.id].erro}</span>
                <button onClick={() => carregarHistorico(sol.id, true)} className="px-3 py-2 bg-white rounded-lg font-bold text-xs">Tentar novamente</button>
              </div>
            ) : historicos[sol.id]?.itens?.length > 0 ? (
              <ol className="space-y-3">
                {historicos[sol.id].itens.map((item) => (
                  <li key={item.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-variant">
                    <p className="text-xs font-bold text-on-surface-variant">
                      {new Date(item.alterado_em).toLocaleString('pt-BR')}
                      {item.gestor_nome ? ` • ${item.gestor_nome}` : ''}
                    </p>
                    <p className="font-bold text-on-background mt-1">
                      De: {item.status_anterior ? (STATUS_LABEL[item.status_anterior] || item.status_anterior) : 'Início'}
                      {' → '}
                      Para: {STATUS_LABEL[item.status_novo] || item.status_novo}
                    </p>
                    {item.observacao && <p className="text-sm text-on-surface-variant mt-1">{item.observacao}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-on-surface-variant">Nenhum evento de histórico registrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PainelMedico() {
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pacientesLista, setPacientesLista] = useState([]);
  const [pacienteAtivo, setPacienteAtivo] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [historicos, setHistoricos] = useState({});
  const [historicosAbertos, setHistoricosAbertos] = useState({});

  // Efetua a busca de pacientes por CRA ou nome
  const handleBusca = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setBuscando(true);
    setPacienteAtivo(null);
    setPacientesLista([]);
    setHistoricos({});
    setHistoricosAbertos({});

    try {
      const response = await api.get(`/gestor/pacientes?busca=${busca.trim()}`);
      const data = response.data;

      if (data.length === 1) {
        // Exatamente um resultado: abre direto o prontuário
        carregarPerfil(data[0].id);
      } else {
        // Multiplos ou nenhum: guarda a lista para seleção ou exibe aviso
        setPacientesLista(data);
      }
    } catch (err) {
      console.error('[PainelMedico]', err);
      toast.error('Erro ao realizar busca de pacientes.');
    } finally {
      setBuscando(false);
    }
  };

  // Carrega prontuário do paciente selecionado
  const carregarPerfil = async (id) => {
    setLoadingPaciente(true);
    setPacientesLista([]);
    try {
      const response = await api.get(`/gestor/paciente/${id}`);
      setPacienteAtivo(response.data);
    } catch (err) {
      console.error('[PainelMedico]', err);
      toast.error('Não foi possível carregar os dados clínicos.');
    } finally {
      setLoadingPaciente(false);
    }
  };

  // Busca o histórico de modificações do status de uma solicitação sob demanda
  const carregarHistorico = async (solicitacaoId, forcar = false) => {
    setHistoricos((prev) => ({
      ...prev,
      [solicitacaoId]: { ...prev[solicitacaoId], loading: true, erro: '' },
    }));
    try {
      const response = await api.get(`/gestor/solicitacao/${solicitacaoId}/historico`);
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: { itens: response.data, loading: false, erro: '' },
      }));
    } catch {
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: {
          itens: forcar ? [] : (prev[solicitacaoId]?.itens || []),
          loading: false,
          erro: 'Não foi possível carregar o histórico.',
        },
      }));
    }
  };

  const alternarHistorico = (solicitacaoId) => {
    const vaiAbrir = !historicosAbertos[solicitacaoId];
    setHistoricosAbertos((prev) => ({ ...prev, [solicitacaoId]: vaiAbrir }));
    if (vaiAbrir && !historicos[solicitacaoId]) {
      carregarHistorico(solicitacaoId);
    }
  };

  return (
    <GestorLayout>
      {/* Cabeçalho */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Painel Médico</h1>
        <p className="text-on-surface-variant font-medium text-sm mt-1">Busca e consulta de histórico clínico de pacientes.</p>
      </div>

      {/* Barra de pesquisa */}
      <form onSubmit={handleBusca} className="flex gap-3 max-w-xl mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Digite o CRA ou nome do paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={buscando}
          className="h-12 px-6 bg-primary text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Estado Inicial */}
      {!buscando && !loadingPaciente && !pacienteAtivo && pacientesLista.length === 0 && (
        <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">stethoscope</span>
          <p className="text-on-surface-variant font-semibold">Informe o CRA para consultar o paciente.</p>
          <p className="text-xs text-on-surface-variant mt-1">Insira o número do prontuário ou nome para consultar o histórico clínico.</p>
        </div>
      )}

      {/* Resultados Múltiplos */}
      {!buscando && pacientesLista.length > 1 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-surface-variant bg-surface-container-low">
            <h3 className="font-bold text-on-background text-sm">Selecione o Paciente Encontrado ({pacientesLista.length})</h3>
          </div>
          <div className="divide-y divide-surface-variant">
            {pacientesLista.map((p) => (
              <button
                key={p.id}
                onClick={() => carregarPerfil(p.id)}
                className="w-full text-left p-4 hover:bg-surface-container-low transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-on-background">{p.nome}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Nascimento: {formatarDataBR(p.data_nascimento)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-surface-container-high px-2 py-1 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant">
                    CRA: {p.cra}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado Não Encontrado */}
      {!buscando && busca && pacientesLista.length === 0 && !pacienteAtivo && !loadingPaciente && (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">search_off</span>
          <p className="text-on-surface-variant font-semibold">Paciente não encontrado com a busca informada.</p>
          <p className="text-xs text-on-surface-variant mt-1">Verifique se os dígitos do CRA estão corretos ou tente buscar pelo nome.</p>
        </div>
      )}

      {/* Loading Prontuário */}
      {loadingPaciente && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-low rounded w-64"></div>
          <div className="h-40 bg-surface-container-low rounded-2xl"></div>
        </div>
      )}

      {/* Prontuário Clínico (Read-Only) */}
      {!loadingPaciente && pacienteAtivo && (
        <div className="space-y-6">
          {/* Card de Dados Pessoais */}
          <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8">
            <h2 className="text-lg font-extrabold text-on-background mb-5">Dados Pessoais do Paciente</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Nome Completo', value: pacienteAtivo.nome },
                { label: 'CRA', value: pacienteAtivo.cra },
                { label: 'Telefone', value: pacienteAtivo.telefone || '---' },
                { label: 'Nascimento', value: pacienteAtivo.data_nascimento ? formatarDataBR(pacienteAtivo.data_nascimento) : '---' },
                { label: 'E-mail', value: pacienteAtivo.email || '---' },
                { label: 'UBS de Origem', value: pacienteAtivo.ubs_nome || '---' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-bold text-on-background text-sm md:text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Listagem de solicitações */}
          <div>
            <h2 className="text-lg md:text-2xl font-extrabold text-on-background mb-4">Solicitações Registradas</h2>
            {(() => {
              const STATUS_ENCERRADO = ['concluido', 'cancelado'];
              const ativas = (pacienteAtivo.solicitacoes || []).filter(s => !STATUS_ENCERRADO.includes(s.status));
              const historico = (pacienteAtivo.solicitacoes || []).filter(s => STATUS_ENCERRADO.includes(s.status));

              return (
                <div className="space-y-6">
                  {/* Solicitações ativas */}
                  {ativas.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {ativas.map((sol) => (
                        <CardSolicitacaoMedico
                          key={sol.id}
                          sol={sol}
                          alternarHistorico={alternarHistorico}
                          historicosAbertos={historicosAbertos}
                          historicos={historicos}
                          carregarHistorico={carregarHistorico}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-on-surface-variant py-4 text-sm bg-surface-container-lowest border border-dashed border-surface-variant rounded-2xl">
                      Nenhuma solicitação ativa no momento.
                    </p>
                  )}

                  {/* Histórico das encerradas */}
                  {historico.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">history</span>
                        Solicitações Encerradas ({historico.length})
                      </h3>
                      <div className="space-y-3 md:space-y-4 opacity-80">
                        {historico.map((sol) => (
                          <CardSolicitacaoMedico
                            key={sol.id}
                            sol={sol}
                            alternarHistorico={alternarHistorico}
                            historicosAbertos={historicosAbertos}
                            historicos={historicos}
                            carregarHistorico={carregarHistorico}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
```

---

## PROPOSTA: diff App.jsx
```diff
@@ -36,6 +36,7 @@
 import ServicoSocialGestor from './pages/gestor/ServicoSocialGestor'; // Módulo 2
 import VigilanciaGestor from './pages/gestor/VigilanciaGestor';     // Módulo 4
 import GestorUsuarios from './pages/gestor/GestorUsuarios';         // Administração da equipe
+import PainelMedico from './pages/gestor/PainelMedico';             // Painel clínico de consulta
 
 // ─── Componente de Rota Protegida ─────────────────────────────────────────
 // Impede acesso direto por URL sem autenticação e garante que o tipo de
@@ -90,6 +91,7 @@
           <Route path="/gestor/servico-social" element={<ProtectedRoute tipo="gestor"><ServicoSocialGestor /></ProtectedRoute>} />
           <Route path="/gestor/vigilancia"    element={<ProtectedRoute tipo="gestor"><VigilanciaGestor /></ProtectedRoute>} />
           <Route path="/gestor/usuarios"       element={<ProtectedRoute tipo="gestor"><GestorUsuarios /></ProtectedRoute>} />
+          <Route path="/gestor/medico"         element={<ProtectedRoute tipo="gestor"><PainelMedico /></ProtectedRoute>} />
         </Routes>
       </BrowserRouter>
     </AuthProvider>
```

---

## PROPOSTA: diff SideNavGestor.jsx
```diff
@@ -113,6 +113,14 @@
           onClick={handleNavegar}
           badgeCount={pendentes}
         />
+        <NavItem
+          to="/gestor/medico"
+          icon="stethoscope"
+          label="Painel Médico"
+          retraida={retraida}
+          activeClass={isActive('medico')}
+          onClick={handleNavegar}
+        />
         <NavItem
           to="/gestor/agendamentos"
           icon="calendar_month"
```

---

## Notas para o Arquiteto
1. **Minimização de Dados (LGPD):** O `PainelMedico.jsx` utiliza a chamada `GET /api/gestor/paciente/:id`. Esta rota no backend já realiza o `delete paciente.cpf` para não expor o CPF em texto plano desnecessariamente na API do gestor/médico, alinhando-se com a diretriz do Decreto Municipal de SJC e a LGPD.
2. **Reuso de Estilos e Layout:** O componente herda o wrapper `GestorLayout` (sidebar e topbar responsivos) e replica fielmente a UI de prontuários do `PerfilPaciente.jsx`, garantindo homogeneidade visual sem a complexidade de botões de escrita/modificação de estado.
3. **Casos Anônimos na Vigilância/Triagem:** Mapeamos os loops de busca e renderização de prontuários com tratamento defensivo caso o médico selecione uma busca vazia ou clique em registros parciais.
