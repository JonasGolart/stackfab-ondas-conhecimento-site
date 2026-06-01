const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const password = '260778';
  const hashedPassword = await bcrypt.hash(password, 10);
  const jonasPassword = await bcrypt.hash('jonas260778', 10);

  try {
    // Admin
    await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, 'approved') ON CONFLICT (email) DO UPDATE SET role = $4, password = $3, status = 'approved'",
      ['Jonas Admin', 'jonas@gmail.com', jonasPassword, 'admin']
    );

    // Participante (Escoteiro)
    await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, 'approved') ON CONFLICT (email) DO UPDATE SET role = $4, password = $3, status = 'approved'",
      ['Jonas Participante', 'jonasjonas@golart', hashedPassword, 'participant']
    );

    console.log(`✅ Usuários configurados com perfis distintos!`);
  } catch (err) {
    console.error('❌ Erro no seed:', err);
  } finally {
    await pool.end();
  }
}

seed();
