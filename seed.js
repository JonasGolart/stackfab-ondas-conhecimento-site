const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  // Usuário admin padrão extraído do Armazém StackFAB
  const name = 'Jonas';
  const email = 'jonas@gmail.com';
  const password = 'jonas260778';
  const role = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Inserir ou atualizar o usuário admin, incluindo o campo 'name' e definindo a role como 'admin'
    await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, 'approved') ON CONFLICT (email) DO UPDATE SET name = $1, password = $3, role = $4, status = 'approved'",
      [name, email, hashedPassword, role]
    );

    console.log(`✅ Admin padrão criado/atualizado com sucesso: ${email}`);
    console.log('⚠️  Lembre-se de alterar a senha no primeiro acesso em produção.');
  } catch (err) {
    console.error('❌ Erro ao criar admin padrão:', err);
  } finally {
    await pool.end();
  }
};

seed();
