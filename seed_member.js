const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const name = 'Escoteiro Teste';
  const email = 'jonasjonas@gmail.com';
  const password = '260778';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $3, name = $1',
      [name, email, hashedPassword]
    );
    console.log(`✅ Usuário ${email} criado/atualizado com sucesso!`);
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err);
  } finally {
    await pool.end();
  }
}

seed();
