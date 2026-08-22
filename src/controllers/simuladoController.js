const pool = require('../config/db');

/**
 * POST /api/simulados/submit
 * Salva a pontuação do participante no Simulado Especial de Fim de Curso
 */
exports.submitSimulado = async (req, res) => {
  const userId = req.user?.userId;
  const { score, totalQuestions, percentage, passed, details } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Validação da janela oficial de realização do Simulado Especial:
  // 22 de Agosto de 2026 das 01:00 às 23:59:59 (Horário de Brasília UTC-3)
  const now = new Date();
  const examStart = new Date('2026-08-22T01:00:00-03:00');
  const examEnd = new Date('2026-08-22T23:59:59-03:00');

  if (now < examStart || now > examEnd) {
    return res.status(403).json({
      error: 'O Simulado Especial Oficial só pode ser realizado e enviado no dia 22/08/2026.'
    });
  }

  if (typeof score !== 'number' || typeof percentage !== 'number') {
    return res.status(400).json({ error: 'Dados de pontuação inválidos' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO simulado_grades (user_id, score, total_questions, percentage, passed, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, score, total_questions, percentage, passed, details, created_at`,
      [
        userId,
        score,
        totalQuestions || 20,
        percentage,
        Boolean(passed),
        details ? JSON.stringify(details) : null
      ]
    );

    res.status(201).json({
      message: 'Simulado especial salvo com sucesso!',
      grade: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao salvar nota do simulado:', err);
    res.status(500).json({ error: 'Erro interno ao salvar nota do simulado' });
  }
};

/**
 * GET /api/simulados/my-grade
 * Retorna a melhor ou última nota do aluno logado
 */
exports.getMyGrade = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const result = await pool.query(
      `SELECT id, score, total_questions, percentage, passed, details, created_at
       FROM simulado_grades
       WHERE user_id = $1
       ORDER BY percentage DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ grade: null });
    }

    res.json({ grade: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar nota do aluno:', err);
    res.status(500).json({ error: 'Erro ao buscar nota do aluno' });
  }
};

/**
 * GET /api/admin/simulados/grades
 * Retorna o Quadro de Notas com dados de todos os participantes para o Dashboard Admin
 */
exports.getAllGrades = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        sg.id,
        sg.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.scout_group,
        u.city,
        sg.score,
        sg.total_questions,
        sg.percentage,
        sg.passed,
        sg.details,
        sg.created_at
       FROM simulado_grades sg
       INNER JOIN users u ON u.id = sg.user_id
       ORDER BY sg.created_at DESC`
    );

    // Métricas resumidas
    const totalTaken = result.rows.length;
    const passedCount = result.rows.filter(r => r.passed).length;
    const avgScore = totalTaken > 0 
      ? (result.rows.reduce((acc, curr) => acc + Number(curr.score), 0) / totalTaken).toFixed(1)
      : 0;
    const passRate = totalTaken > 0
      ? Math.round((passedCount / totalTaken) * 100)
      : 0;

    res.json({
      grades: result.rows,
      kpis: {
        totalTaken,
        passedCount,
        failedCount: totalTaken - passedCount,
        avgScore: Number(avgScore),
        passRate
      }
    });
  } catch (err) {
    console.error('Erro ao buscar quadro de notas:', err);
    res.status(500).json({ error: 'Erro ao buscar quadro de notas' });
  }
};

/**
 * POST /api/admin/simulados/insert-grade
 * Permite ao Administrador registrar/homologar a nota de um participante manualmente
 */
exports.adminInsertGrade = async (req, res) => {
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole !== 'admin' && requesterRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { userId, score, totalQuestions, percentage, passed, details } = req.body;

  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Parâmetros inválidos. userId e score são obrigatórios.' });
  }

  try {
    const total = totalQuestions || 20;
    const pct = typeof percentage === 'number' ? percentage : Math.round((score / total) * 100);
    const isPassed = passed !== undefined ? Boolean(passed) : pct >= 70;

    const result = await pool.query(
      `INSERT INTO simulado_grades (user_id, score, total_questions, percentage, passed, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, score, total_questions, percentage, passed, details, created_at`,
      [
        userId,
        score,
        total,
        pct,
        isPassed,
        details ? JSON.stringify(details) : null
      ]
    );

    res.status(201).json({
      message: 'Nota homologada com sucesso pelo administrador!',
      grade: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao inserir nota administrativamente:', err);
    res.status(500).json({ error: 'Erro ao registrar nota.' });
  }
};

