const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { userId: user.id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );
      res.json({ token, user: { id: user.id, email: user.email } });
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
