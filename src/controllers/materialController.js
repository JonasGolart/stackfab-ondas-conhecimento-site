const pool = require('../config/db');

exports.createMaterial = async (req, res) => {
  const { title, description, category } = req.body;
  
  console.log('📂 [MaterialController] Recebida solicitação para criar material:', { title, category });
  console.log('📂 [MaterialController] Dados do arquivo Multer (req.file):', req.file);

  const filePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!filePath) {
    console.warn('⚠️ [MaterialController] Falha: Nenhum arquivo foi enviado ou Multer não processou.');
    return res.status(400).json({ error: 'Arquivo é obrigatório' });
  }

  try {
    console.log('💾 [MaterialController] Tentando inserir material no banco de dados...');
    const result = await pool.query(
      'INSERT INTO materials (title, description, file_path, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, filePath, category]
    );
    console.log('✅ [MaterialController] Material salvo com sucesso no banco de dados:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ [MaterialController] Erro ao salvar material no banco de dados:', err);
    res.status(500).json({ error: 'Erro ao salvar material' });
  }
};

exports.getAllMaterials = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materials ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
};

exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ message: 'Material removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover material' });
  }
};
