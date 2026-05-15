const pool = require('./src/config/db');

async function testLogin() {
  try {
    const result = await pool.query('SELECT id, email, role, name FROM users WHERE email = $1', ['jonasjonas@gmail.com']);
    console.log('--- DADOS DO USUÁRIO ---');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    if (result.rows[0]) {
      const role = result.rows[0].role;
      console.log('Role literal:', role);
      console.log('Role type:', typeof role);
      console.log('Role length:', role ? role.length : 0);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

testLogin();
