require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const seed = async () => {
  const email = 'admin@projeto.com';
  const password = 'admin'; // O usuário deve trocar isso depois
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Garantir que a tabela existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inserir usuário se não existir
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING id, email',
      [email, hashedPassword]
    );

    if (result.rows.length > 0) {
      console.log('Usuário admin criado com sucesso!');
      console.log('Email:', email);
      console.log('Senha:', password);
    } else {
      console.log('O usuário admin já existe ou não pôde ser criado.');
    }
  } catch (err) {
    console.error('Erro ao seedar banco:', err);
  } finally {
    await pool.end();
  }
};

seed();
