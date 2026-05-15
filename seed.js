const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  // Usuário admin padrão extraído do Armazém StackFAB
  const name = 'Jonas';
  const email = 'jonas@gmail.com';
  const password = 'jonas260778';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Inserir ou atualizar o usuário admin, incluindo o campo 'name' exigido pelo schema do banco compartilhado
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1, password = $3',
      [name, email, hashedPassword]
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
