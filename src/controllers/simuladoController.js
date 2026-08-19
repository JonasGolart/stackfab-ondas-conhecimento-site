const pool = require('../config/db');

exports.saveScore = async (req, res) => {
  const userId = req.user?.userId;
  const { mode, questionsCount, score } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!mode || questionsCount === undefined || score === undefined) {
    return res.status(400).json({ error: 'Parâmetros inválidos: mode, questionsCount e score são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO simulado_scores (user_id, mode, questions_count, score)
       VALUES ($1, $2, $3, $4)
       RETURNING id, mode, questions_count AS "questionsCount", score, created_at AS "createdAt"`,
      [userId, mode, questionsCount, score]
    );

    res.status(201).json({
      message: 'Pontuação gravada com sucesso!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao salvar pontuação:', err);
    res.status(500).json({ error: 'Erro interno ao salvar pontuação do simulado.' });
  }
};

exports.getRanking = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.mode,
        s.questions_count AS "questionsCount",
        s.score,
        s.created_at AS "createdAt",
        COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS "userName",
        COALESCE(NULLIF(u.scout_group, ''), 'Não informado') AS "scoutGroup",
        ROUND((s.score::float / s.questions_count) * 100) AS "percentage"
      FROM simulado_scores s
      JOIN users u ON s.user_id = u.id
      ORDER BY percentage DESC, s.questions_count DESC, s.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    res.status(500).json({ error: 'Erro interno ao buscar ranking do simulado.' });
  }
};
