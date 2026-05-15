const http = require('http');

const data = JSON.stringify({
  email: 'jonasjonas@gmail.com',
  password: '260778'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('--- RESPOSTA DO SERVIDOR ---');
    console.log('Status:', res.statusCode);
    const parsed = JSON.parse(body);
    console.log('Corpo:', JSON.stringify(parsed, null, 2));
    
    if (parsed.user && parsed.user.role === 'participant') {
      console.log('✅ TESTE PASSOU: Usuário é reconhecido como participante.');
    } else {
      console.log('❌ TESTE FALHOU: Role não veio ou é diferente de participant.');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ ERRO DE CONEXÃO:', e.message);
});

req.write(data);
req.end();
