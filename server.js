require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

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
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();

// Routes
app.use('/api', apiRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
