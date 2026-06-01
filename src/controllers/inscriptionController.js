const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');
const telegram = require('../utils/telegramService');
const { generateAccessCode, buildTokenEmailHtml } = require('./accessTokenController');

/* ═══════════════════════════════════════════════════
   TEMPLATES DE E-MAIL
   ═══════════════════════════════════════════════════ */

/**
 * Template base: wrapper visual dos e-mails
 */
function emailWrapper(conteudo) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f0e6d2;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0e6d2;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(46,39,32,0.1);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#2e7d32 0%,#1b5e20 100%);padding:36px 40px;text-align:center;">
                <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.03em;">📡 Ondas do Conhecimento</h1>
                <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:8px 0 0 0;">Projeto de Educação Escoteira em Radioamadorismo</p>
              </td>
            </tr>
            <!-- Body -->
            <tr><td style="padding:40px;">${conteudo}</td></tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#faf6ee;padding:24px 40px;text-align:center;border-top:1px solid #e8ddd0;">
                <p style="color:#9e8f80;font-size:12px;margin:0;line-height:1.6;">
                  Este é um e-mail automático. Por favor, não responda a esta mensagem.<br>
                  © ${new Date().getFullYear()} Ondas do Conhecimento · Ecossistema StackFAB
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * E-mail 1: Confirmação de recebimento — Inscrição de GRUPO
 */
function emailConfirmacaoGrupo({ grupo, cidade, responsavel, participantes }) {
  return emailWrapper(`
    <h2 style="color:#2e7d32;font-size:22px;font-weight:800;margin:0 0 8px 0;">Inscrição Recebida! 🎉</h2>
    <p style="color:#7d7060;font-size:14px;margin:0 0 28px 0;">Confirmamos o recebimento da solicitação do seu grupo.</p>

    <p style="color:#2e2720;font-size:16px;line-height:1.7;margin:0 0 24px 0;">
      Olá, <strong>${responsavel}</strong>!<br><br>
      Recebemos com sucesso a inscrição do <strong>${grupo}</strong> no projeto
      <strong>Ondas do Conhecimento</strong>. Ficamos felizes com o interesse da equipe!
    </p>

    <!-- Resumo da inscrição -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ee;border-radius:16px;border:1px solid #e8ddd0;overflow:hidden;margin:0 0 28px 0;">
      <tr><td style="padding:20px 24px;">
        <p style="color:#9e8f80;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 14px 0;">Resumo da Inscrição</p>
        <table width="100%">
          <tr>
            <td style="padding:6px 0;color:#7d7060;font-size:14px;width:40%">🏕️ Grupo</td>
            <td style="padding:6px 0;color:#2e2720;font-size:14px;font-weight:600">${grupo}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7d7060;font-size:14px">🏙️ Cidade</td>
            <td style="padding:6px 0;color:#2e2720;font-size:14px;font-weight:600">${cidade}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7d7060;font-size:14px">👥 Participantes</td>
            <td style="padding:6px 0;color:#2e2720;font-size:14px;font-weight:600">${participantes} pessoa(s)</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="color:#2e2720;font-size:15px;line-height:1.7;margin:0 0 28px 0;">
      Nossa equipe irá analisar a inscrição e entrar em contato em breve com as próximas etapas.
      Fique atento ao e-mail cadastrado.
    </p>

    <p style="color:#2e2720;font-size:15px;font-weight:600;margin:0;">Bons estudos e 73! 📻</p>
    <p style="color:#7d7060;font-size:14px;margin:4px 0 0 0;">Equipe Ondas do Conhecimento</p>
  `);
}

/**
 * E-mail 2: Confirmação de recebimento — Inscrição INDIVIDUAL
 */
function emailRecebimentoIndividual({ nome }) {
  return emailWrapper(`
    <h2 style="color:#2e7d32;font-size:22px;font-weight:800;margin:0 0 8px 0;">Solicitação Recebida! 🎉</h2>
    <p style="color:#7d7060;font-size:14px;margin:0 0 28px 0;">Sua inscrição está em análise.</p>

    <p style="color:#2e2720;font-size:16px;line-height:1.7;margin:0 0 24px 0;">
      Olá, <strong>${nome}</strong>!<br><br>
      Recebemos sua solicitação de inscrição individual no projeto <strong>Ondas do Conhecimento</strong>.
    </p>
    
    <p style="color:#2e2720;font-size:15px;line-height:1.7;margin:0 0 28px 0;">
      Sua inscrição passará por uma rápida revisão. Assim que for aprovada, você receberá um novo e-mail contendo seu Código de Acesso exclusivo para o Portal do Participante.
    </p>

    <p style="color:#2e2720;font-size:15px;font-weight:600;margin:0;">Aguarde e 73! 📻</p>
    <p style="color:#7d7060;font-size:14px;margin:4px 0 0 0;">Equipe Ondas do Conhecimento</p>
  `);
}

/**
 * E-mail 3: Boas-vindas com código de acesso — Inscrição INDIVIDUAL (Pós Aprovação)
 */
function emailBoasVindasIndividual({ nome, email, grupoEscoteiro, responsavelMenor, accessCode }) {
  const menorSection = responsavelMenor ? `
    <tr>
      <td style="padding:6px 0;color:#7d7060;font-size:14px;width:40%">👨‍👧 Responsável</td>
      <td style="padding:6px 0;color:#2e2720;font-size:14px;font-weight:600">${responsavelMenor}</td>
    </tr>` : '';

  return emailWrapper(`
    <h2 style="color:#2e7d32;font-size:22px;font-weight:800;margin:0 0 8px 0;">Bem-vindo(a)! Seu acesso está pronto 🔑</h2>
    <p style="color:#7d7060;font-size:14px;margin:0 0 28px 0;">Inscrição individual confirmada com sucesso.</p>

    <p style="color:#2e2720;font-size:16px;line-height:1.7;margin:0 0 24px 0;">
      Olá, <strong>${nome}</strong>!<br><br>
      Sua inscrição no projeto <strong>Ondas do Conhecimento</strong> foi confirmada.
      Abaixo estão seus dados de acesso exclusivo ao Portal do Participante e ao Simulado.
    </p>

    <!-- Credenciais de Acesso -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#2e7d32,#1b5e20);border-radius:16px;overflow:hidden;margin:0 0 28px 0;">
      <tr><td style="padding:28px;">
        <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 16px 0;">Suas Credenciais de Acesso</p>
        <table width="100%">
          <tr>
            <td style="padding:5px 0;color:rgba(255,255,255,0.7);font-size:14px;width:35%">🌐 Portal</td>
            <td style="padding:5px 0;font-size:14px;font-weight:600">
              <a href="https://ondas.stackfab.com.br/login.html" style="color:#a5d6a7;text-decoration:none">ondas.stackfab.com.br/login</a>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:rgba(255,255,255,0.7);font-size:14px">📧 E-mail</td>
            <td style="padding:5px 0;color:#ffffff;font-size:14px;font-weight:600">${email}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 5px;color:rgba(255,255,255,0.7);font-size:14px">🔐 Código de Acesso</td>
            <td style="padding:12px 0 5px;">
              <span style="font-family:monospace;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:0.15em;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:10px;display:inline-block">${accessCode}</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Dados da inscrição -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ee;border-radius:16px;border:1px solid #e8ddd0;overflow:hidden;margin:0 0 28px 0;">
      <tr><td style="padding:20px 24px;">
        <p style="color:#9e8f80;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 14px 0;">Dados da Inscrição</p>
        <table width="100%">
          <tr>
            <td style="padding:6px 0;color:#7d7060;font-size:14px;width:40%">🏕️ Grupo Escoteiro</td>
            <td style="padding:6px 0;color:#2e2720;font-size:14px;font-weight:600">${grupoEscoteiro}</td>
          </tr>
          ${menorSection}
        </table>
      </td></tr>
    </table>

    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:12px;padding:16px 20px;margin:0 0 28px 0;">
      <p style="color:#795548;font-size:13px;margin:0;line-height:1.6;">
        ⚠️ <strong>Guarde este código!</strong> Ele será necessário para acessar o portal.
        Você pode alterá-lo a qualquer momento pela opção "Esqueci minha senha".
      </p>
    </div>

    <a href="https://ondas.stackfab.com.br/login.html"
       style="display:inline-block;background:linear-gradient(135deg,#2e7d32,#1b5e20);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.01em;">
      Acessar o Portal →
    </a>

    <p style="color:#2e2720;font-size:14px;font-weight:600;margin:32px 0 4px 0;">Bons estudos e 73! 📻</p>
    <p style="color:#7d7060;font-size:14px;margin:0">Equipe Ondas do Conhecimento</p>
  `);
}

/* ═══════════════════════════════════════════════════
   CONTROLLERS
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/inscriptions — Inscrição de GRUPO
 */
exports.createInscription = async (req, res) => {
  const { grupo, cidade, participantes, responsavel, email, telefone, observacoes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO inscriptions (group_name, city, participants_count, responsible_name, email, phone, observations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [grupo, cidade, participantes, responsavel, email, telefone, observacoes]
    );

    // ── E-mail de confirmação de recebimento ──
    if (email) {
      const htmlEmail = emailConfirmacaoGrupo({ grupo, cidade, responsavel, participantes });
      await emailService.sendEmail(
        email,
        `✅ Inscrição do ${grupo} recebida — Ondas do Conhecimento`,
        htmlEmail
      );
    }

    // ── Notificação Telegram para o admin ──
    await telegram.notifyNovaInscricaoGrupo({
      grupo,
      cidade,
      responsavel,
      participantes,
      email,
      telefone
    });

    res.status(201).json({ message: 'Inscrição do grupo realizada com sucesso! Um e-mail de confirmação foi enviado.', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar inscrição' });
  }
};

/**
 * GET /api/admin/inscriptions — Lista todas as inscrições (admin)
 */
exports.getAllInscriptions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inscriptions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar inscrições' });
  }
};

/**
 * GET /api/admin/users — Lista usuários participantes (admin)
 */
exports.getAllIndividualUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, scout_group, city, guardian_name, created_at FROM users WHERE role = 'participant' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários individuais' });
  }
};

/**
 * POST /api/inscriptions/individual — Inscrição INDIVIDUAL
 */
exports.createIndividualInscription = async (req, res) => {
  const { nome, email, telefone, grupo_escoteiro, cidade, responsavel_menor } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!nome || !normalizedEmail || !telefone || !grupo_escoteiro || !cidade) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    // Verificar duplicidade
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    // Senha temporária, pois a real será gerada na aprovação
    const hashedPassword = await bcrypt.hash('PENDING_' + Date.now(), 10);

    // Salvar usuário
    await pool.query(
      'INSERT INTO users (name, email, password, role, scout_group, city, guardian_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [nome, normalizedEmail, hashedPassword, 'participant', grupo_escoteiro || null, cidade || null, responsavel_menor || null, 'pending']
    );

    // Registrar na tabela inscriptions (auditoria)
    await pool.query(
      'INSERT INTO inscriptions (responsible_name, group_name, city, participants_count, email, phone, guardian_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [nome, grupo_escoteiro || 'Individual', cidade || 'N/A', 1, normalizedEmail, telefone, responsavel_menor || null, 'pending']
    );

    // ── E-mail de recebimento (em análise) ──
    const htmlEmail = emailRecebimentoIndividual({ nome });
    await emailService.sendEmail(
      normalizedEmail,
      '⏳ Inscrição Recebida — Ondas do Conhecimento',
      htmlEmail
    );

    // ── Notificação Telegram para o admin ──
    await telegram.notifyNovaInscricaoIndividual({
      nome,
      grupoEscoteiro: grupo_escoteiro,
      cidade,
      telefone,
      email: normalizedEmail,
      responsavelMenor: responsavel_menor
    });

    res.status(201).json({
      message: 'Inscrição realizada! Ela está em análise, você receberá um e-mail quando for aprovada.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar inscrição individual' });
  }
};

/**
 * PUT /api/admin/inscriptions/:id/approve — Aprova uma inscrição
 */
exports.approveInscription = async (req, res) => {
  const { id } = req.params;

  try {
    const inscriptionCheck = await pool.query('SELECT * FROM inscriptions WHERE id = $1', [id]);
    if (inscriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    const insc = inscriptionCheck.rows[0];
    if (insc.status === 'approved') {
      return res.status(400).json({ error: 'Esta inscrição já está aprovada' });
    }

    await pool.query('UPDATE inscriptions SET status = $1 WHERE id = $2', ['approved', id]);

    res.json({ message: 'Inscrição aprovada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aprovar a inscrição' });
  }
};

/**
 * POST /api/admin/inscriptions/:id/send-token
 * Aprova inscrição individual e envia token de acesso pelo mesmo fluxo de e-mail
 */
exports.sendTokenFromInscription = async (req, res) => {
  const { id } = req.params;

  try {
    const inscriptionCheck = await pool.query('SELECT * FROM inscriptions WHERE id = $1', [id]);
    if (inscriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    const insc = inscriptionCheck.rows[0];
    if (!insc.email) {
      return res.status(400).json({ error: 'Esta inscrição não possui e-mail individual.' });
    }

    const email = String(insc.email).trim().toLowerCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const protocol = req.protocol || 'https';
    const host = req.get('host');
    const portalUrl = `${protocol}://${host}/login.html`;

    // Bloqueia reenvio se já completou o primeiro acesso
    const userLookup = await pool.query(
      'SELECT id, name, role, password_setup_required, password_setup_completed_at, first_token_used_at FROM users WHERE LOWER(email) = $1',
      [email]
    );

    let userId;

    if (userLookup.rows.length > 0) {
      const existing = userLookup.rows[0];
      const existingRole = String(existing.role || '').toLowerCase();
      if (existingRole === 'admin' || existingRole === 'developer') {
        return res.status(403).json({ error: 'Não é permitido sobrescrever credenciais de administrador.' });
      }
      if (existing.password_setup_completed_at) {
        return res.status(409).json({ error: 'Este usuário já possui senha definitiva. Use a recuperação de senha se precisar redefinir o acesso.' });
      }
      if (existing.first_token_used_at) {
        return res.status(409).json({ error: 'O token de primeiro acesso já foi consumido.' });
      }

      const accessCode = generateAccessCode(8);
      const hashedPassword = await bcrypt.hash(accessCode, 10);
      await pool.query(
        'UPDATE users SET name = $1, password = $2, status = $3, password_setup_required = TRUE, password_setup_completed_at = NULL, first_token_used_at = NULL, updated_at = NOW() WHERE id = $4',
        [insc.name || existing.name, hashedPassword, 'approved', existing.id]
      );
      userId = existing.id;

      const dispatchInsert = await pool.query(
        'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NULL) RETURNING id',
        [accessCode, email, userId, req.user?.userId || null, 'processing', expiresAt]
      );
      const dispatchId = dispatchInsert.rows[0].id;

      const html = buildTokenEmailHtml({ tokenCode: accessCode, portalUrl, expiresAt, customMessage: '' });
      const sendResult = await emailService.sendEmailDetailed(email, 'Token de acesso - Ondas do Conhecimento', html);

      if (!sendResult.ok) {
        await pool.query(
          'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', sendResult.error || 'Falha ao enviar e-mail.', dispatchId]
        );
        return res.status(400).json({ error: sendResult.error || 'Falha ao enviar e-mail.' });
      }

      await pool.query(
        'UPDATE email_access_tokens SET status = $1, sent_at = NOW(), error_message = NULL WHERE id = $2',
        ['sent', dispatchId]
      );
    } else {
      // Cria novo usuário
      const accessCode = generateAccessCode(8);
      const hashedPassword = await bcrypt.hash(accessCode, 10);
      const created = await pool.query(
        'INSERT INTO users (name, email, password, role, status, password_setup_required) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
        [insc.name || email.split('@')[0], email, hashedPassword, 'participant', 'approved']
      );
      userId = created.rows[0].id;

      const dispatchInsert = await pool.query(
        'INSERT INTO email_access_tokens (code, email, user_id, created_by, status, expires_at, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NULL) RETURNING id',
        [accessCode, email, userId, req.user?.userId || null, 'processing', expiresAt]
      );
      const dispatchId = dispatchInsert.rows[0].id;

      const html = buildTokenEmailHtml({ tokenCode: accessCode, portalUrl, expiresAt, customMessage: '' });
      const sendResult = await emailService.sendEmailDetailed(email, 'Token de acesso - Ondas do Conhecimento', html);

      if (!sendResult.ok) {
        await pool.query(
          'UPDATE email_access_tokens SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', sendResult.error || 'Falha ao enviar e-mail.', dispatchId]
        );
        return res.status(400).json({ error: sendResult.error || 'Falha ao enviar e-mail.' });
      }

      await pool.query(
        'UPDATE email_access_tokens SET status = $1, sent_at = NOW(), error_message = NULL WHERE id = $2',
        ['sent', dispatchId]
      );
    }

    // Marca inscrição como aprovada
    await pool.query('UPDATE inscriptions SET status = $1 WHERE id = $2', ['approved', id]);

    res.json({ message: 'Token enviado com sucesso! Inscrição aprovada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar token.' });
  }
};

/**
 * DELETE /api/admin/inscriptions/:id — Recusa/Exclui silenciosamente uma inscrição
 */
exports.deleteInscription = async (req, res) => {
  const { id } = req.params;
  try {
    const inscriptionCheck = await pool.query('SELECT * FROM inscriptions WHERE id = $1', [id]);
    if (inscriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    const insc = inscriptionCheck.rows[0];

    // Se for individual e tiver e-mail, deleta também da tabela users
    if (insc.email) {
      await pool.query('DELETE FROM users WHERE email = $1', [insc.email]);
    }

    await pool.query('DELETE FROM inscriptions WHERE id = $1', [id]);

    res.json({ message: 'Inscrição excluída com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir a inscrição' });
  }
};

/**
 * GET /api/admin/inscriptions/stats — Estatísticas para gráficos
 */
exports.getInscriptionStats = async (req, res) => {
  try {
    const byCity = await pool.query(`
      SELECT city, SUM(participants_count) as total
      FROM inscriptions
      WHERE city != 'N/A'
      GROUP BY city
      ORDER BY total DESC
      LIMIT 15
    `);

    const overTime = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(participants_count) as participants
      FROM inscriptions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const groupCount = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(participants_count), 0) as total
      FROM inscriptions
      WHERE city != 'N/A'
    `);
    const individualCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM inscriptions
      WHERE city = 'N/A'
    `);

    const topGroups = await pool.query(`
      SELECT group_name, city, participants_count
      FROM inscriptions
      WHERE city != 'N/A'
      ORDER BY participants_count DESC
      LIMIT 10
    `);

    const totalGroups      = await pool.query(`SELECT COUNT(*) FROM inscriptions WHERE city != 'N/A'`);
    const totalParticipants = await pool.query(`SELECT COALESCE(SUM(participants_count), 0) as total FROM inscriptions`);
    const totalCities      = await pool.query(`SELECT COUNT(DISTINCT city) FROM inscriptions WHERE city != 'N/A'`);
    const totalIndividuals = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'participant'`);

    res.json({
      byCity: byCity.rows,
      overTime: overTime.rows,
      distribution: {
        groups: parseInt(groupCount.rows[0].count),
        groupParticipants: parseInt(groupCount.rows[0].total || 0),
        individuals: parseInt(individualCount.rows[0].count)
      },
      topGroups: topGroups.rows,
      kpis: {
        totalGroups:       parseInt(totalGroups.rows[0].count),
        totalParticipants: parseInt(totalParticipants.rows[0].total),
        totalCities:       parseInt(totalCities.rows[0].count),
        totalIndividuals:  parseInt(totalIndividuals.rows[0].count)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
