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
