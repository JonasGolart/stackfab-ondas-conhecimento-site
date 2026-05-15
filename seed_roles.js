const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const password = '260778';
  const hashedPassword = await bcrypt.hash(password, 10);
  const jonasPassword = await bcrypt.hash('jonas260778', 10);

  try {
    // Admin
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4, password = $3",
      ['Jonas Admin', 'jonas@gmail.com', jonasPassword, 'admin']
    );

    // Participante (Escoteiro)
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4, password = $3",
      ['Jonas Participante', 'jonasjonas@gmail.com', hashedPassword, 'participant']
    );

    console.log(`✅ Usuários configurados com perfis distintos!`);
  } catch (err) {
    console.error('❌ Erro no seed:', err);
  } finally {
    await pool.end();
  }
}

seed();
