const pool = require('../config/db');

exports.createInscription = async (req, res) => {
  const { grupo, cidade, participantes, responsavel, email, telefone, observacoes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO inscriptions (group_name, city, participants_count, responsible_name, email, phone, observations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [grupo, cidade, participantes, responsavel, email, telefone, observacoes]
    );
    res.status(201).json({ message: 'Inscrição realizada com sucesso!', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar inscrição' });
  }
};

exports.getAllInscriptions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inscriptions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar inscrições' });
  }
};
