const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');
const telegram = require('../utils/telegramService');

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
 * E-mail 2: Boas-vindas com código de acesso — Inscrição INDIVIDUAL
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

  if (!nome || !email || !telefone || !grupo_escoteiro || !cidade) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    // Verificar duplicidade
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    // Gerar código de acesso de 6 caracteres alfanumérico maiúsculo
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(accessCode, 10);

    // Salvar usuário
    await pool.query(
      'INSERT INTO users (name, email, password, role, scout_group, city, guardian_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [nome, email, hashedPassword, 'participant', grupo_escoteiro || null, cidade || null, responsavel_menor || null]
    );

    // Registrar na tabela inscriptions (auditoria)
    await pool.query(
      'INSERT INTO inscriptions (responsible_name, group_name, city, participants_count, email, phone, guardian_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [nome, grupo_escoteiro || 'Individual', cidade || 'N/A', 1, email, telefone, responsavel_menor || null]
    );

    // ── E-mail de boas-vindas com código de acesso ──
    const htmlEmail = emailBoasVindasIndividual({
      nome,
      email,
      grupoEscoteiro: grupo_escoteiro,
      responsavelMenor: responsavel_menor,
      accessCode
    });
    await emailService.sendEmail(
      email,
      '🔑 Seu acesso ao Portal Ondas do Conhecimento',
      htmlEmail
    );

    // ── Notificação Telegram para o admin ──
    await telegram.notifyNovaInscricaoIndividual({
      nome,
      grupoEscoteiro: grupo_escoteiro,
      cidade,
      telefone,
      email,
      responsavelMenor: responsavel_menor
    });

    res.status(201).json({
      message: 'Inscrição realizada! Verifique seu e-mail para acessar o portal.',
      // Retorna o código apenas em ambiente sem Resend configurado (desenvolvimento)
      accessCode: process.env.RESEND_API_KEY ? null : accessCode
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar inscrição individual' });
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
