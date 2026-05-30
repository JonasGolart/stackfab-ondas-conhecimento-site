/**
 * Script de reset e migração das inscrições
 * Uso: node reset_inscricoes.js
 * Requer DATABASE_URL no .env ou na variável de ambiente
 */
require('dotenv').config();
const pool = require('./src/config/db');

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectado ao banco de dados...');

    // 1. Adicionar coluna guardian_name se não existir
    await client.query(`
      ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS guardian_name TEXT;
    `);
    console.log('✅ Coluna guardian_name garantida na tabela inscriptions');

    // 2. Adicionar cidade na tabela users se não existir
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
    `);
    console.log('✅ Coluna city garantida na tabela users');

    // 3. Contar registros antes
    const beforeIns = await client.query('SELECT COUNT(*) FROM inscriptions');
    const beforeUsers = await client.query("SELECT COUNT(*) FROM users WHERE role = 'participant'");
    console.log(`\n📊 Estado atual:`);
    console.log(`   Inscrições: ${beforeIns.rows[0].count}`);
    console.log(`   Usuários participantes: ${beforeUsers.rows[0].count}`);

    // 4. Zerar inscrições
    await client.query('DELETE FROM inscriptions');
    console.log('\n🗑️  Tabela inscriptions zerada com sucesso.');

    // 5. Zerar usuários participantes
    await client.query("DELETE FROM users WHERE role = 'participant'");
    console.log('🗑️  Usuários participantes removidos com sucesso.');

    // 6. Verificar
    const afterIns = await client.query('SELECT COUNT(*) FROM inscriptions');
    const afterUsers = await client.query("SELECT COUNT(*) FROM users WHERE role = 'participant'");
    console.log(`\n✅ Estado após reset:`);
    console.log(`   Inscrições: ${afterIns.rows[0].count}`);
    console.log(`   Usuários participantes: ${afterUsers.rows[0].count}`);

    console.log('\n🎉 Script concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
