// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: Privacidade
// FUNÇÃO: Página pública de Política de Privacidade do Gestão Saúde UBS+.
//         Apresenta de forma clara e acessível (linguagem simples) como o sistema
//         trata os dados pessoais dos usuários em conformidade com a LGPD
//         (Lei Geral de Proteção de Dados - Lei nº 13.709/2018) e o Decreto
//         Municipal 18.855/2021 de São José dos Campos.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6faf6] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Principal */}
      <main className="max-w-3xl w-full bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 sm:p-10">
        
        {/* Cabeçalho */}
        <header className="border-b border-emerald-50 pb-6 mb-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <img src="/logo.webp" alt="UBS+ Logo" className="h-10 w-auto object-contain" />
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"
              aria-label="Voltar para a página anterior"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>VOLTAR</span>
            </button>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-6 tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Última atualização: 29 de junho de 2026
          </p>
        </header>

        {/* Conteúdo Informativo */}
        <div className="space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
          
          {/* Seção 1 */}
          <section aria-labelledby="quem-somos">
            <h2 id="quem-somos" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              1. Quem Somos?
            </h2>
            <p>
              O <strong>Gestão Saúde UBS+</strong> é um projeto de Extensão Multidisciplinar da Graduação de Engenharia de Software da <strong>UFBRA</strong>. 
              Trata-se de uma aplicação acadêmica desenvolvida para facilitar e dar transparência à comunicação entre os pacientes e a equipe gestora das Unidades Básicas de Saúde (UBS) de São José dos Campos (SP).
            </p>
          </section>

          {/* Seção 2 */}
          <section aria-labelledby="dados-coletados">
            <h2 id="dados-coletados" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              2. Quais Dados Coletamos?
            </h2>
            <p className="mb-3">
              Para possibilitar as consultas e o acompanhamento de suas solicitações, o sistema armazena as seguintes informações básicas fornecidas por você ou consultadas no cadastro da UBS:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dados de Identificação:</strong> Nome completo, CPF, Cadastro de Regulação Ambulatorial (CRA) e Data de Nascimento.</li>
              <li><strong>Dados de Contato:</strong> Número de telefone celular e endereço de e-mail (opcionais).</li>
              <li><strong>Dados de Localização:</strong> Nome do seu bairro (para indicação de sua UBS de referência).</li>
              <li><strong>Dados de Saúde:</strong> Informações de solicitações ativas como consultas, exames, procedimentos, disponibilidade de medicamentos e agendamentos de atendimento com a gestão.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section aria-labelledby="uso-dados">
            <h2 id="uso-dados" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              3. Para que Usamos Seus Dados?
            </h2>
            <p className="mb-3">
              A coleta e o processamento de dados têm objetivos estritamente informativos e de facilitação de acesso, tais como:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Visualizar a posição aproximada e o andamento de suas solicitações de consultas e exames de forma descomplicada.</li>
              <li>Agendar horários de atendimento presencial com a equipe de gestão de sua UBS de referência.</li>
              <li>Consultar a disponibilidade de medicamentos de uso contínuo em sua UBS.</li>
              <li>Receber comunicados importantes da administração ou alertas individuais de saúde.</li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section aria-labelledby="compartilhamento">
            <h2 id="compartilhamento" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              4. Com quem Compartilhamos Seus Dados?
            </h2>
            <p>
              Seus dados de saúde e cadastrais <strong>nunca são exibidos publicamente</strong> e não são vendidos ou compartilhados com fins comerciais. 
              O acesso aos seus dados é restrito unicamente à equipe gestora autenticada da sua UBS de referência e a unidades especializadas da rede de saúde (como AMEs e hospitais municipais) que receberem encaminhamentos médicos expressamente autorizados.
            </p>
          </section>

          {/* Seção 5 */}
          <section aria-labelledby="seguranca">
            <h2 id="seguranca" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              5. Como Protegemos Seus Dados?
            </h2>
            <p className="mb-3">
              Adotamos medidas rígidas de segurança técnica e organizacional para garantir a integridade das informações armazenadas no sistema:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Criptografia forte na transmissão de dados via conexões seguras HTTPS.</li>
              <li>Armazenamento seguro de senhas através de algoritmos de dispersão criptográfica (bcrypt).</li>
              <li>Autenticação rigorosa e controle de sessões por meio de Tokens JWT.</li>
              <li>Registro de auditoria interna para monitoramento de acessos a dados sensíveis de pacientes.</li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section aria-labelledby="direitos-titular">
            <h2 id="direitos-titular" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              6. Seus Direitos (Art. 18 da LGPD)
            </h2>
            <p className="mb-3">
              Como titular dos dados pessoais, você possui o direito de solicitar a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirmação da existência de tratamento de seus dados.</li>
              <li>Acesso rápido e gratuito aos seus dados mantidos no sistema.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Exclusão ou anonimização de dados desnecessários ou tratados em desconformidade.</li>
            </ul>
          </section>

          {/* Seção 7 */}
          <section aria-labelledby="como-exercer">
            <h2 id="como-exercer" className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              7. Como Exercer Seus Direitos?
            </h2>
            <p>
              Para atualizar informações incorretas ou solicitar a exclusão de seu registro de paciente no sistema, você deve entrar em contato direto com a recepção ou equipe gestora de sua Unidade Básica de Saúde (UBS) de referência para a validação presencial de seus documentos originais.
            </p>
          </section>

        </div>

        {/* Rodapé Interno */}
        <footer className="border-t border-emerald-50 mt-10 pt-6 text-center text-xs text-gray-400 font-semibold">
          <p>© 2026 Gestão Saúde UBS+ | Projeto de Extensão UFBRA</p>
          <p className="mt-1">Desenvolvido em conformidade com as diretrizes de proteção de dados de São José dos Campos (SP).</p>
        </footer>

      </main>
    </div>
  );
}
