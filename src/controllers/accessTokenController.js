const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateAccessCode(size = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < size; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function buildTokenEmailHtml({ tokenCode, portalUrl, expiresAt, customMessage }) {
  const expiresDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:2rem;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:1.4rem;font-weight:700;">Ondas do Conhecimento</h1>
        <p style="color:rgba(255,255,255,0.85);margin:0.5rem 0 0 0;font-size:0.88rem;">Token de acesso enviado pelo administrador</p>
      </td>
    </tr>

    <tr>
      <td style="padding:2rem 2rem 1rem 2rem;">
        <h2 style="color:#1e293b;margin:0 0 0.6rem 0;font-size:1.2rem;">Seu acesso foi liberado</h2>
        <p style="color:#64748b;margin:0;line-height:1.6;">
          Use o token abaixo para entrar no portal. No primeiro acesso, você precisará criar sua senha definitiva.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 2rem;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px dashed #3b82f6;border-radius:12px;margin:1rem 0;">
          <tr>
            <td style="padding:1.5rem;text-align:center;">
              <p style="color:#1e40af;margin:0 0 0.5rem 0;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Token de Acesso</p>
              <p style="color:#1e3a8a;margin:0;font-size:2rem;font-weight:800;letter-spacing:0.14em;font-family:'Courier New',monospace;">${tokenCode}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 2rem 1rem 2rem;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:1rem 1.5rem;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="color:#64748b;margin:0;font-size:0.75rem;font-weight:600;text-transform:uppercase;">Portal</p>
              <p style="color:#1e293b;margin:0.25rem 0 0 0;font-size:0.98rem;font-weight:700;">${portalUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:1rem 1.5rem;">
              <p style="color:#64748b;margin:0;font-size:0.75rem;font-weight:600;text-transform:uppercase;">Validade do token</p>
              <p style="color:#1e293b;margin:0.25rem 0 0 0;font-weight:600;">${expiresDate}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${customMessage ? `
    <tr>
      <td style="padding:0 2rem 1rem 2rem;">
        <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:1rem;">
          <p style="color:#92400e;margin:0;font-size:0.85rem;font-weight:600;">Mensagem do administrador:</p>
          <p style="color:#78350f;margin:0.5rem 0 0 0;font-size:0.85rem;line-height:1.5;white-space:pre-wrap;">${customMessage}</p>
        </div>
      </td>
    </tr>
    ` : ''}

    <tr>
      <td style="padding:0 2rem 1.5rem 2rem;">
        <h3 style="color:#1e293b;margin:0 0 0.8rem 0;font-size:1rem;">Como entrar:</h3>
        <p style="color:#475569;margin:0.2rem 0;font-size:0.9rem;">1. Acesse o portal pelo link acima.</p>
        <p style="color:#475569;margin:0.2rem 0;font-size:0.9rem;">2. Informe seu e-mail neste mesmo destinatario.</p>
        <p style="color:#475569;margin:0.2rem 0;font-size:0.9rem;">3. Use o token como senha de acesso.</p>
      </td>
    </tr>

    <tr>
      <td style="background-color:#1e293b;padding:1.4rem 2rem;text-align:center;">
        <p style="color:#94a3b8;margin:0;font-size:0.75rem;">
          E-mail automatico do ecossistema StackFAB. Nao responda esta mensagem.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

exports.sendAccessTokensByEmail = async (req, res) => {
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole !== 'admin' && requesterRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const rawEmails = Array.isArray(req.body?.emails) ? req.body.emails : [];
  const expiresInDays = Number(req.body?.expiresInDays || 7);
  const customMessage = String(req.body?.message || '').trim();

  const dedupedEmails = [...new Set(rawEmails.map(normalizeEmail).filter(Boolean))];

  if (dedupedEmails.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos um e-mail valido.' });
  }

  if (dedupedEmails.length > 200) {
    return res.status(400).json({ error: 'Limite maximo de 200 e-mails por envio.' });
  }

  if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
    return res.status(400).json({ error: 'A validade deve estar entre 1 e 30 dias.' });
  }

  const protocol = req.protocol || 'https';
  const host = req.get('host');
  const portalUrl = `${protocol}://${host}/login.html`;

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const results = [];

  for (const email of dedupedEmails) {
    try {
      const userLookup = await pool.query('SELECT id, role, password_setup_required, password_setup_completed_at, first_token_used_at FROM users WHERE LOWER(email) = $1', [email]);
      let userId = null;

      if (userLookup.rows.length > 0) {
        const existing = userLookup.rows[0];
        const existingRole = String(existing.role || '').toLowerCase();
        const setupCompleted = Boolean(existing.password_setup_completed_at);
        const firstTokenConsumed = Boolean(existing.first_token_used_at);

        if (existingRole === 'admin' || existingRole === 'developer') {
          const blockedCode = `BLOCKED-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          await pool.query(
            'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at, error_message) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)',
            [blockedCode, email, existing.id, req.user?.userId || null, 'blocked', expiresAt, 'Nao e permitido sobrescrever credenciais de administrador.']
          );
          results.push({ email, status: 'blocked', error: 'Nao e permitido sobrescrever credenciais de administrador.' });
          continue;
        }

        if (setupCompleted) {
          const blockedCode = `BLOCKED-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          await pool.query(
            'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at, error_message) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)',
            [blockedCode, email, existing.id, req.user?.userId || null, 'blocked', expiresAt, 'Este usuário já possui senha definitiva. Use a recuperação de senha se precisar redefinir o acesso.']
          );
          results.push({ email, status: 'blocked', error: 'Este usuário já possui senha definitiva. Use a recuperação de senha se precisar redefinir o acesso.' });
          continue;
        }

        if (firstTokenConsumed) {
          const blockedCode = `BLOCKED-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          await pool.query(
            'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at, error_message) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)',
            [blockedCode, email, existing.id, req.user?.userId || null, 'blocked', expiresAt, 'O token de primeiro acesso já foi consumido e não pode ser reenviado.']
          );
          results.push({ email, status: 'blocked', error: 'O token de primeiro acesso já foi consumido e não pode ser reenviado.' });
          continue;
        }

        const accessCode = generateAccessCode(8);
        const hashedPassword = await bcrypt.hash(accessCode, 10);
        await pool.query(
          'UPDATE users SET password = $1, status = $2, password_setup_required = TRUE, password_setup_completed_at = NULL, first_token_used_at = NULL, updated_at = NOW() WHERE id = $3',
          [hashedPassword, 'approved', existing.id]
        );
        userId = existing.id;

        const dispatchInsert = await pool.query(
          'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NULL) RETURNING id',
          [accessCode, email, userId, req.user?.userId || null, 'processing', expiresAt]
        );
        const dispatchId = dispatchInsert.rows[0].id;

        const html = buildTokenEmailHtml({ tokenCode: accessCode, portalUrl, expiresAt, customMessage });
        const sendResult = await emailService.sendEmailDetailed(
          email,
          'Token de acesso - Ondas do Conhecimento',
          html
        );

        if (!sendResult.ok) {
          await pool.query(
            'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
            ['failed', sendResult.error || 'Falha ao enviar e-mail.', dispatchId]
          );
          results.push({ email, token: accessCode, status: 'failed', error: sendResult.error || 'Falha ao enviar e-mail.' });
          continue;
        }

        await pool.query(
          'UPDATE email_access_tokens SET status = $1, sent_at = NOW(), error_message = NULL WHERE id = $2',
          ['sent', dispatchId]
        );
        results.push({ email, token: accessCode, status: 'sent', sent_at: new Date().toISOString() });
      } else {
        const defaultName = email.split('@')[0];
        const accessCode = generateAccessCode(8);
        const hashedPassword = await bcrypt.hash(accessCode, 10);
        const created = await pool.query(
          'INSERT INTO users (name, email, password, role, status, password_setup_required) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
          [defaultName, email, hashedPassword, 'participant', 'approved']
        );
        userId = created.rows[0].id;

        const dispatchInsert = await pool.query(
          'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NULL) RETURNING id',
          [accessCode, email, userId, req.user?.userId || null, 'processing', expiresAt]
        );
        const dispatchId = dispatchInsert.rows[0].id;

        const html = buildTokenEmailHtml({ tokenCode: accessCode, portalUrl, expiresAt, customMessage });
        const sendResult = await emailService.sendEmailDetailed(
          email,
          'Token de acesso - Ondas do Conhecimento',
          html
        );

        if (!sendResult.ok) {
          await pool.query(
            'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
            ['failed', sendResult.error || 'Falha ao enviar e-mail.', dispatchId]
          );
          results.push({ email, token: accessCode, status: 'failed', error: sendResult.error || 'Falha ao enviar e-mail.' });
          continue;
        }

        await pool.query(
          'UPDATE email_access_tokens SET status = $1, sent_at = NOW(), error_message = NULL WHERE id = $2',
          ['sent', dispatchId]
        );
        results.push({ email, token: accessCode, status: 'sent', sent_at: new Date().toISOString() });
      }
    } catch (err) {
      results.push({
        email,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Erro interno no envio.'
      });
    }
  }

  const sentCount = results.filter(r => r.status === 'sent').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return res.json({
    totalEmails: dedupedEmails.length,
    sent: sentCount,
    failed: failedCount,
    details: results
  });
};

exports.listAccessTokenDispatches = async (req, res) => {
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole !== 'admin' && requesterRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const limitRaw = Number(req.query?.limit || 100);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;

  try {
    const result = await pool.query(
      `SELECT id, code, email, status, error_message, expires_at, sent_at, created_at
       FROM email_access_tokens
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar histórico de envios.' });
  }
};

exports.resendAccessTokenDispatch = async (req, res) => {
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole !== 'admin' && requesterRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const id = Number(req.params?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de envio invalido.' });
  }

  try {
    const dispatchResult = await pool.query(
      'SELECT id, code, email, user_id, status, expires_at FROM email_access_tokens WHERE id = $1',
      [id]
    );

    if (dispatchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de envio nao encontrado.' });
    }

    const dispatch = dispatchResult.rows[0];
    if (dispatch.status === 'blocked') {
      return res.status(400).json({ error: 'Este registro foi bloqueado e nao pode ser reenviado.' });
    }

    const email = normalizeEmail(dispatch.email);
    const accessCode = String(dispatch.code || '').trim();
    if (!email || !accessCode) {
      return res.status(400).json({ error: 'Registro invalido para reenvio.' });
    }

    const userLookup = await pool.query('SELECT id, role, password_setup_required, password_setup_completed_at FROM users WHERE LOWER(email) = $1', [email]);
    let userId = dispatch.user_id || null;

    if (userLookup.rows.length > 0) {
      const existing = userLookup.rows[0];
      const existingRole = String(existing.role || '').toLowerCase();
      const setupCompleted = Boolean(existing.password_setup_completed_at);
      const firstTokenConsumed = Boolean(existing.first_token_used_at);
      if (existingRole === 'admin' || existingRole === 'developer') {
        await pool.query(
          'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
          ['blocked', 'Nao e permitido sobrescrever credenciais de administrador.', id]
        );
        return res.status(400).json({ error: 'Nao e permitido reenviar token para administrador.' });
      }

      if (setupCompleted) {
        await pool.query(
          'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
          ['blocked', 'Este usuário já possui senha definitiva. Use a recuperação de senha se precisar redefinir o acesso.', id]
        );
        return res.status(400).json({ error: 'Este usuário já possui senha definitiva. Use a recuperação de senha se precisar redefinir o acesso.' });
      }

      if (firstTokenConsumed) {
        await pool.query(
          'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
          ['blocked', 'O token de primeiro acesso já foi consumido e não pode ser reenviado.', id]
        );
        return res.status(400).json({ error: 'O token de primeiro acesso já foi consumido e não pode ser reenviado.' });
      }

      const hashedPassword = await bcrypt.hash(accessCode, 10);
      await pool.query(
        'UPDATE users SET password = $1, status = $2, password_setup_required = TRUE, password_setup_completed_at = NULL, first_token_used_at = NULL, updated_at = NOW() WHERE id = $3',
        [hashedPassword, 'approved', existing.id]
      );
      userId = existing.id;
    } else {
      const defaultName = email.split('@')[0];
      const hashedPassword = await bcrypt.hash(accessCode, 10);
      const created = await pool.query(
        'INSERT INTO users (name, email, password, role, status, password_setup_required) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
        [defaultName, email, hashedPassword, 'participant', 'approved']
      );
      userId = created.rows[0].id;
    }

    const protocol = req.protocol || 'https';
    const host = req.get('host');
    const portalUrl = `${protocol}://${host}/login.html`;
    const html = buildTokenEmailHtml({
      tokenCode: accessCode,
      portalUrl,
      expiresAt: dispatch.expires_at,
      customMessage: 'Reenvio solicitado pelo administrador.'
    });

    const sendResult = await emailService.sendEmailDetailed(
      email,
      'Token de acesso - Ondas do Conhecimento (Reenvio)',
      html
    );

    if (!sendResult.ok) {
      await pool.query(
        'UPDATE email_access_tokens SET status = $1, error_message = $2, user_id = $3 WHERE id = $4',
        ['failed', sendResult.error || 'Falha ao enviar e-mail.', userId, id]
      );
      return res.status(400).json({ error: sendResult.error || 'Falha ao reenviar e-mail.' });
    }

    await pool.query(
      'UPDATE email_access_tokens SET status = $1, sent_at = NOW(), error_message = NULL, user_id = $2 WHERE id = $3',
      ['sent', userId, id]
    );

    return res.json({ message: 'Token reenviado com sucesso.', id, email, token: accessCode });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao reenviar token.' });
  }
};
