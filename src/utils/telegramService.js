/**
 * Telegram Notification Service — Ondas do Conhecimento
 * Usa a Bot API do Telegram diretamente (sem dependências externas).
 *
 * Variáveis de ambiente necessárias (Coolify):
 *   TELEGRAM_BOT_TOKEN  — token do bot (ex: 8658806936:AAEq...)
 *   TELEGRAM_CHAT_ID    — ID do chat/grupo a receber as notificações
 */

const TELEGRAM_API = 'https://api.telegram.org';

/**
 * Envia uma mensagem via Telegram Bot API.
 * @param {string} text  — Texto da mensagem (suporta HTML básico: <b>, <i>, <code>)
 * @returns {Promise<boolean>}
 */
async function sendTelegramMessage(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️ [TELEGRAM] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados — notificação ignorada.');
    console.log('[TELEGRAM SIMULADO]', text);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();

    if (data.ok) {
      console.log(`📨 [TELEGRAM] Mensagem enviada (message_id: ${data.result.message_id})`);
      return true;
    } else {
      console.error('❌ [TELEGRAM] Erro da API:', data.description);
      return false;
    }
  } catch (err) {
    console.error('❌ [TELEGRAM] Falha na requisição:', err.message);
    return false;
  }
}

/**
 * 🆕 Nova inscrição INDIVIDUAL recebida
 */
async function notifyNovaInscricaoIndividual({ nome, grupoEscoteiro, cidade, telefone, email, responsavelMenor }) {
  const menor = responsavelMenor ? `\n👨‍👧 <b>Responsável:</b> ${responsavelMenor}` : '';
  const msg =
    `📡 <b>Nova Inscrição Individual — Ondas do Conhecimento</b>\n\n` +
    `👤 <b>Nome:</b> ${nome}\n` +
    `🏕️ <b>Grupo Escoteiro:</b> ${grupoEscoteiro}${menor}\n` +
    `🏙️ <b>Cidade:</b> ${cidade || '—'}\n` +
    `📱 <b>Tel:</b> ${telefone}\n` +
    `📧 <b>Email:</b> ${email}\n\n` +
    `<i>Acesse o painel admin para visualizar os detalhes.</i>`;
  return sendTelegramMessage(msg);
}

/**
 * 🆕 Nova inscrição de GRUPO recebida
 */
async function notifyNovaInscricaoGrupo({ grupo, cidade, responsavel, participantes, email, telefone }) {
  const msg =
    `📡 <b>Nova Inscrição de Grupo — Ondas do Conhecimento</b>\n\n` +
    `🏕️ <b>Grupo:</b> ${grupo}\n` +
    `🏙️ <b>Cidade:</b> ${cidade}\n` +
    `👤 <b>Responsável:</b> ${responsavel}\n` +
    `👥 <b>Participantes declarados:</b> ${participantes}\n` +
    `📱 <b>Tel:</b> ${telefone || '—'}\n` +
    `📧 <b>Email:</b> ${email}\n\n` +
    `<i>Acesse o painel admin para visualizar os detalhes.</i>`;
  return sendTelegramMessage(msg);
}

module.exports = {
  sendTelegramMessage,
  notifyNovaInscricaoIndividual,
  notifyNovaInscricaoGrupo
};
