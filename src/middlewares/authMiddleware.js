const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await pool.query(
      'SELECT id, role, password_setup_required, password_setup_completed_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const setupRequired = Boolean(user.password_setup_required) && !user.password_setup_completed_at;
    const setupRoute = String(req.path || '').toLowerCase();
    if (setupRequired && setupRoute !== '/auth/complete-first-access') {
      return res.status(403).json({ error: 'Finalize seu primeiro acesso criando uma senha antes de continuar.' });
    }

    req.user = { ...decoded, passwordSetupRequired: setupRequired };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
