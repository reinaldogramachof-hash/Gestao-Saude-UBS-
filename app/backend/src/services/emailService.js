// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇO: emailService
// FUNÇÃO: Abstrai o envio de e-mails do sistema via Resend.
//         Desabilitado em desenvolvimento (loga no console em vez de enviar).
//         Em produção, exige a variável de ambiente RESEND_API_KEY configurada.
// ─────────────────────────────────────────────────────────────────────────────
const { Resend } = require('resend');

// O Resend SDK é inicializado se houver a chave configurada nas variáveis de ambiente
const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

/**
 * Envia um e-mail de redefinição de senha para o gestor.
 * @param {Object} params
 * @param {string} params.email - E-mail do destinatário
 * @param {string} params.nome - Nome do gestor
 * @param {string} params.linkReset - URL completa para a página de redefinição
 */
async function enviarEmailResetSenha({ email, nome, linkReset }) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Se não estiver em produção ou se a chave não estiver configurada, simulamos o envio no console.
  // Isso evita desperdício de cota do Resend localmente e facilita o teste rápido.
  if (!isProduction || !resend) {
    console.log('\n[EMAIL DEV - SIMULADOR RESEND]');
    console.log(`Para: ${email}`);
    console.log(`Assunto: Redefinição de Senha — Gestão Saúde UBS+`);
    console.log(`Conteúdo: Olá ${nome}, acesse o link para criar uma nova senha: ${linkReset}\n`);
    return { dev: true };
  }

  try {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669; font-family: 'Manrope', sans-serif;">Gestão Saúde UBS+</h2>
        <p>Olá, <strong>${nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir a senha do seu acesso institucional de gestor.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora:</p>
        <div style="margin: 24px 0;">
          <a href="${linkReset}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Redefinir Senha</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 12px; color: #059669; word-break: break-all;">${linkReset}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8;">UFBRA — Projeto de Extensão Multidisciplinar Gestão Saúde UBS+. Se você não solicitou essa mudança, ignore este e-mail.</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'Gestao Saude UBS+ <onboarding@resend.dev>',
      to: [email],
      subject: 'Redefinição de Senha — Gestão Saúde UBS+',
      html: htmlContent,
    });

    return response;
  } catch (error) {
    console.error('[emailService] Erro ao disparar e-mail via Resend:', error.message);
    throw error;
  }
}

module.exports = {
  enviarEmailResetSenha,
};
