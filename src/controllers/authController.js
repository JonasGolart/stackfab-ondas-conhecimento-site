const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const telegram = require('../utils/telegramService');


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Sua inscrição está em análise. Você receberá um e-mail quando for aprovada.' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name
        } 
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
};

exports.register = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  try {
    // Verificar se o usuário existe
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      // Retornar sucesso fictício para evitar enumeração de e-mails (melhor prática de segurança)
      return res.json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação será enviado.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Sua inscrição ainda está em análise.' });
    }

    // Gerar token de redefinição
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expira em 1 hora

    // Salvar token no banco
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    // Gerar link de redefinição dinâmico (usa origin do request ou fallback)
    const origin = req.headers.referer ? new URL(req.headers.referer).origin : `${req.protocol}://${req.get('host')}`;
    const resetLink = `${origin}/reset-password.html?token=${token}`;

    // Construir corpo do e-mail premium em HTML
    const emailHtml = `
      <div style="font-family: 'Inter', sans-serif, Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #4CAF50; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">Ondas do Conhecimento 📡</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Recuperação de Acesso</p>
        </div>
        <div style="background-color: rgba(30, 41, 59, 0.7); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Olá,</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Recebemos uma solicitação para redefinir a senha da sua conta de acesso ao portal do participante e painel administrativo do **Ondas do Conhecimento**.</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Para criar uma nova senha, clique no botão abaixo (este link é válido por 1 hora):</p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 12px; box-shadow: 0 10px 20px -10px rgba(76, 175, 80, 0.5); font-size: 16px; transition: all 0.2s;">Redefinir Minha Senha</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0;">Se você não solicitou essa redefinição, por favor ignore este e-mail. Nenhuma alteração foi feita na sua conta.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 5px 0;">Este é um e-mail automático enviado pelo ecossistema StackFAB.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Ondas do Conhecimento. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    // Enviar e-mail usando Resend
    const emailSent = await emailService.sendEmail(email, 'Ondas do Conhecimento - Recuperação de Senha', emailHtml);

    // Notificar admin via Telegram
    await telegram.sendTelegramMessage(
      `🔑 <b>Solicitação de Recuperação de Senha</b>\n\n` +
      `📧 <b>E-mail:</b> ${email}\n` +
      `👤 <b>Usuário:</b> ${user.name || 'Sem nome'}\n` +
      `⏱️ Token válido por: 1 hora`
    );

    if (emailSent) {
      res.json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação será enviado.' });
    } else {
      res.status(500).json({ error: 'Erro ao enviar e-mail de recuperação.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao processar recuperação de senha' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    // Buscar usuário pelo token válido que ainda não expirou
    const userResult = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado. Por favor, solicite a recuperação novamente.' });
    }

    // Hashear a nova senha e atualizar o usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao redefinir a senha' });
  }
};
