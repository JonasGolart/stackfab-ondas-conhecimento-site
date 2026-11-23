/**
 * Envia um e-mail utilizando a API SMTP do Hostinger.
 * Se nenhuma configuração SMTP estiver configurada, o e-mail será logado no console para fins de desenvolvimento.
 * 
 * @param {string} to - E-mail do destinatário.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} html - Conteúdo HTML do e-mail.
 * @returns {Promise<Object>} Retorna {ok: boolean, simulated?: boolean, error?: string}.
 */
exports.sendEmailDetailed = async (to, subject, html) => {
  const host = (process.env.EMAIL_HOST || '').trim();
  const portRaw = (process.env.EMAIL_PORT || '').trim();
  const port = parseInt(portRaw, 10);
  const secure = process.env.EMAIL_SECURE !== undefined && String(process.env.EMAIL_SECURE).trim() !== ''
    ? String(process.env.EMAIL_SECURE).trim().toLowerCase() === 'true'
    : port === 465;
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  const from = (process.env.EMAIL_FROM || user).trim();

  if (!host || !portRaw || !Number.isFinite(port) || !user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ [EMAIL SERVICE] Configuração SMTP ausente em produção.');
      return { ok: false, error: 'Configuração SMTP ausente em produção.' };
    }

    console.warn('⚠️ [EMAIL SERVICE] Configuração SMTP ausente no arquivo .env.');
    console.log('------------------ SIMULAÇÃO DE E-MAIL ------------------');
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo:\n${html}`);
    console.log('---------------------------------------------------------');
    return { ok: true, simulated: true };
  }

  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 [EMAIL SERVICE] E-mail enviado com sucesso para ${to}. ID: ${info.messageId}`);
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Erro ao tentar enviar e-mail via Hostinger SMTP:', error);
    return { ok: false, error: error?.message || 'Falha ao enviar e-mail via Hostinger SMTP.' };
  }
};

exports.sendEmail = async (to, subject, html) => {
  const result = await exports.sendEmailDetailed(to, subject, html);
  return !!result.ok;
};
