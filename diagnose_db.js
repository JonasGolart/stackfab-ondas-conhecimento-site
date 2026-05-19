const pool = require('./src/config/db');
require('dotenv').config();

const diagnose = async () => {
  try {
    console.log('Conectando ao banco de dados...');
    
    // Verificar tabelas existentes
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tabelas encontradas:', tables.rows.map(r => r.table_name));

    // Verificar colunas da tabela materials
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'materials'
    `);
    console.log('\nColunas da tabela materials:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable})`);
    });

    // Listar materiais cadastrados
    const materials = await pool.query('SELECT * FROM materials ORDER BY created_at DESC');
    console.log(`\nMateriais cadastrados (${materials.rows.length}):`);
    materials.rows.forEach(m => {
      console.log(`ID: ${m.id} | Título: ${m.title} | Categoria: ${m.category} | Caminho: ${m.file_path} | Criado: ${m.created_at}`);
    });

    // Listar categorias cadastradas
    const categories = await pool.query('SELECT * FROM categories');
    console.log(`\nCategorias cadastradas (${categories.rows.length}):`);
    categories.rows.forEach(c => {
      console.log(`ID: ${c.id} | Nome: ${c.name}`);
    });

  } catch (err) {
    console.error('❌ Erro no diagnóstico:', err);
  } finally {
    await pool.end();
  }
};

diagnose();
