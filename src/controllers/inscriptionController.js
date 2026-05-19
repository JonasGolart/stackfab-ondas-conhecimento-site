const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

exports.createInscription = async (req, res) => {
  const { grupo, cidade, participantes, responsavel, email, telefone, observacoes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO inscriptions (group_name, city, participants_count, responsible_name, email, phone, observations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [grupo, cidade, participantes, responsavel, email, telefone, observacoes]
    );
    res.status(201).json({ message: 'Inscrição realizada com sucesso!', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar inscrição' });
  }
};

exports.getAllInscriptions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inscriptions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar inscrições' });
  }
};

exports.createIndividualInscription = async (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    // Generate a random 6-character access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(accessCode, 10);

    // Save user to database
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [nome, email, hashedPassword, 'participant']
    );

    // Also record in inscriptions for auditing (optional, but good for admin panel)
    await pool.query(
      'INSERT INTO inscriptions (group_name, city, participants_count, responsible_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Inscrição Individual', 'N/A', 1, nome, email, telefone]
    );

    // Send Email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'StackFAB <noreply@stackfab.com.br>',
          to: email,
          subject: 'Seu Acesso - Portal Ondas do Conhecimento',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e2720;">
              <h2 style="color: #2e7d32;">Olá, ${nome}!</h2>
              <p>Sua inscrição individual foi recebida com sucesso. Bem-vindo(a) ao projeto <strong>Ondas do Conhecimento</strong>!</p>
              <p>Você já pode acessar nossa Área do Participante e nosso Simulado utilizando suas credenciais exclusivas abaixo:</p>
              <div style="background-color: #faf6ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>URL de Acesso:</strong> <a href="https://ondas.stackfab.com.br/login.html">ondas.stackfab.com.br/login</a></p>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Código de Acesso (Senha):</strong> <span style="font-size: 18px; font-weight: bold; color: #2e7d32;">${accessCode}</span></p>
              </div>
              <p>Recomendamos que você anote este código. Ele será necessário sempre que for fazer login no portal.</p>
              <br>
              <p>Bons estudos e 73!</p>
              <p><strong>Equipe Ondas do Conhecimento</strong></p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Resend error:', emailErr);
        // We don't fail the request if email fails, but log it.
      }
    } else {
      console.warn('RESEND_API_KEY not configured. Access code generated but email not sent. Code:', accessCode);
    }

    res.status(201).json({ 
      message: 'Inscrição individual realizada! Acesso gerado com sucesso.', 
      accessCode: process.env.RESEND_API_KEY ? null : accessCode // Only return code in dev if no Resend
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar inscrição individual' });
  }
};
