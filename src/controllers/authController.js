const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const telegram = require('../utils/telegramService');


exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Sua inscrição está em análise. Você receberá um e-mail quando for aprovada.' });
    }

    const role = String(user.role || '').toLowerCase();
    const setupRequired = Boolean(user.password_setup_required) && !user.password_setup_completed_at;
    const firstTokenAlreadyUsed = Boolean(user.first_token_used_at);

    if (setupRequired) {
      if (firstTokenAlreadyUsed) {
        return res.status(403).json({ error: 'Esse token de primeiro acesso já foi utilizado. Entre com a senha cadastrada ou recupere o acesso.' });
      }

      await pool.query(
        'UPDATE users SET first_token_used_at = NOW(), updated_at = NOW() WHERE id = $1 AND first_token_used_at IS NULL',
        [user.id]
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      requiresPasswordSetup: setupRequired,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        passwordSetupRequired: setupRequired,
        firstTokenUsedAt: user.first_token_used_at || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
};

exports.register = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [normalizedEmail, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  try {
    // Verificar se o usuário existe
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
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
    const emailSent = await emailService.sendEmail(normalizedEmail, 'Ondas do Conhecimento - Recuperação de Senha', emailHtml);

    // Notificar admin via Telegram
    await telegram.sendTelegramMessage(
      `🔑 <b>Solicitação de Recuperação de Senha</b>\n\n` +
      `📧 <b>E-mail:</b> ${normalizedEmail}\n` +
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

exports.completeFirstAccessPassword = async (req, res) => {
  const userId = req.user?.userId;
  const { password, confirmPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!password || !confirmPassword) {
    return res.status(400).json({ error: 'Senha e confirmação são obrigatórias' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'As senhas informadas não conferem' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, password_setup_required, password_setup_completed_at FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!user.password_setup_required || user.password_setup_completed_at) {
      return res.status(400).json({ error: 'Não existe um primeiro acesso pendente para este usuário.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, password_setup_required = FALSE, password_setup_completed_at = NOW(), updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    const refreshedUser = await pool.query('SELECT id, email, role, name FROM users WHERE id = $1', [userId]);
    const currentUser = refreshedUser.rows[0];

    res.json({
      message: 'Senha cadastrada com sucesso!',
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: currentUser.name,
        passwordSetupRequired: false
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao cadastrar a senha inicial' });
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
