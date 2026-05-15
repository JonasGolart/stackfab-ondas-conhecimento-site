const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Dica de resiliência do Armazém: connection_limit pode ser adicionado na URL ou aqui
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
