/**
 * Envia um e-mail utilizando a API REST do Resend.
 * Se nenhuma chave RESEND_API_KEY estiver configurada, o e-mail será logado no console para fins de desenvolvimento.
 * 
 * @param {string} to - E-mail do destinatário.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} html - Conteúdo HTML do e-mail.
 * @returns {Promise<boolean>} Retorna true se enviado com sucesso ou simulado localmente.
 */
exports.sendEmailDetailed = async (to, subject, html) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Ondas do Conhecimento <noreply@stackfab.com.br>';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ [EMAIL SERVICE] RESEND_API_KEY não configurada em produção.');
      return { ok: false, error: 'RESEND_API_KEY ausente em produção.' };
    }

    console.warn('⚠️ [EMAIL SERVICE] RESEND_API_KEY não configurada no arquivo .env.');
    console.log('------------------ SIMULAÇÃO DE E-MAIL ------------------');
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo:\n${html}`);
    console.log('---------------------------------------------------------');
    return { ok: true, simulated: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`📧 [EMAIL SERVICE] E-mail enviado com sucesso para ${to}. ID: ${data.id}`);
      return { ok: true, id: data.id };
    } else {
      console.error('❌ [EMAIL SERVICE] Erro retornado pela API Resend:', data);
      return { ok: false, error: data?.message || data?.error || 'Erro da API Resend.' };
    }
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Erro ao tentar conectar com a API Resend:', error);
    return { ok: false, error: error?.message || 'Falha de conexão com Resend.' };
  }
};

exports.sendEmail = async (to, subject, html) => {
  const result = await exports.sendEmailDetailed(to, subject, html);
  return !!result.ok;
};
