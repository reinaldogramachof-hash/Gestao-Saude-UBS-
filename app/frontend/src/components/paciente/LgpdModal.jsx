// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: LgpdModal
// FUNCAO: Modal bloqueante exibido ao paciente que ainda nao aceitou o termo
//         ou cuja versao do aceite esta desatualizada. Impede qualquer
//         navegacao no app ate o aceite ser registrado no banco.
// PROPS:
//   - onAceite: function - chamada apos confirmacao bem-sucedida na API
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import api from '../../services/api';

export default function LgpdModal({ onAceite }) {
  const [concordo, setConcordo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const checkboxMarcado = concordo;

  const confirmarAceite = async () => {
    if (!checkboxMarcado || salvando) return;

    try {
      setSalvando(true);
      setErro('');
      await api.post('/paciente/lgpd/aceite');
      onAceite();
    } catch {
      setErro('Nao foi possivel registrar seu aceite agora. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-2xl font-extrabold text-slate-900">Termo de Uso e Privacidade</h2>

        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p>
            Coletamos seus dados cadastrais e informacoes de saude para mostrar
            solicitacoes, medicamentos, comunicados e atendimentos ligados a sua UBS.
          </p>
          <p>
            Esses dados sao usados apenas para o funcionamento do Portal do Paciente,
            com acesso restrito a voce e a equipe autorizada da unidade de saude.
          </p>
          <p>
            Protegemos essas informacoes com autenticacao, controle de acesso e
            registros de auditoria para manter a rastreabilidade do sistema.
          </p>
          <a
            href="/privacidade"
            target="_blank"
            rel="noreferrer"
            className="inline-flex font-bold text-sky-700 underline underline-offset-4"
          >
            Ler política completa
          </a>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={checkboxMarcado}
            onChange={(event) => setConcordo(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
          />
          <span className="text-sm font-medium text-slate-700">
            Li e concordo com os termos de uso e política de privacidade
          </span>
        </label>

        {erro && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={confirmarAceite}
          disabled={!checkboxMarcado || salvando}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-sky-700 px-4 font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {salvando ? 'Registrando aceite...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
