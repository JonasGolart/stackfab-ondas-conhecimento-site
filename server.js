require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const apiRoutes = require('./src/routes/api');
const pool = require('./src/config/db');

// Ensure uploads directory exists for Multer
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database initialization
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inscriptions (
        id SERIAL PRIMARY KEY,
        group_name TEXT NOT NULL,
        city TEXT NOT NULL,
        participants_count INTEGER NOT NULL,
        responsible_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'participant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_group TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS guardian_name TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_required BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_completed_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_token_used_at TIMESTAMP;
      
      ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS guardian_name TEXT;
      ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
      
      -- Garante que admin e usuários já existentes não fiquem bloqueados
      UPDATE users SET status = 'approved' WHERE status = 'pending' AND role = 'admin';
      UPDATE users SET status = 'approved' WHERE status = 'pending' AND role = 'developer';
      UPDATE users SET password_setup_required = TRUE
        WHERE role = 'participant'
          AND password_setup_completed_at IS NULL
          AND id IN (SELECT DISTINCT user_id FROM email_access_tokens WHERE user_id IS NOT NULL);

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_path TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_access_tokens (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'active',
        expires_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE materials ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE email_access_tokens ADD COLUMN IF NOT EXISTS error_message TEXT;
    `);
    
    // Seed default categories if table is empty
    const categoriesCheck = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name) VALUES 
        ('Apostila'), 
        ('Legislação'), 
        ('Técnica')
      `);
      console.log('Default categories seeded');
    }

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Admin utility: reset all inscriptions and participant users (DELETE)
app.delete('/api/admin/reset-all', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const jwtSecret = process.env.JWT_SECRET;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Servidor mal configurado: JWT_SECRET ausente.' });
  }
  const jwt = require('jsonwebtoken');
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== 'admin' && decoded.role !== 'developer') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await pool.query('DELETE FROM inscriptions');
    await pool.query("DELETE FROM users WHERE role = 'participant'");
    res.json({ message: 'Inscrições e usuários participantes removidos com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao resetar dados: ' + err.message });
  }
});

// Global Error Handler for Multer & generic exceptions
app.use((err, req, res, next) => {
  console.error('❌ Global error handler caught:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Erro no upload do arquivo: ${err.message}` });
  }
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
