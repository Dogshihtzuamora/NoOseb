const http = require('http');  
const fs = require('fs');  
const path = require('path');  
const crypto = require('crypto');  
const url = require('url');  
const querystring = require('querystring');  

const ADM_DIR = path.join(__dirname, 'ADM');
if (!fs.existsSync(ADM_DIR)) {
  fs.mkdirSync(ADM_DIR);
}

const LOG_FILE = path.join(ADM_DIR, 'cont.log');

const sessions = new Map();

function gerarToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function lerUsuarios() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return fs.readFileSync(LOG_FILE, 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [username, senhaHash] = line.split(':');
      return { username, senhaHash };
    });
}

function registrarUsuario(username, password) {
  const usuarios = lerUsuarios();

  if (usuarios.some(u => u.username === username)) {
    return { success: false, message: 'Usuário já existe' };
  }

  const senhaHash = hashPassword(password);
  fs.appendFileSync(LOG_FILE, `${username}:${senhaHash}\n`);
  return { success: true, message: 'Usuário registrado com sucesso' };
}

function fazerLogin(username, password) {
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.username === username);

  if (!usuario) return { success: false, message: 'Usuário não encontrado' };

  if (usuario.senhaHash !== hashPassword(password)) {
    return { success: false, message: 'Senha incorreta' };
  }

  const token = gerarToken();
  sessions.set(token, username);
  return { success: true, message: 'Login bem-sucedido', token };
}

function verificarSessao(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  return sessions.has(cookies.token) ? cookies.token : null;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const { username, password } = querystring.parse(body);
      const resultado = registrarUsuario(username, password);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resultado));
    });
    return;
  }

  if (pathname === '/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const { username, password } = querystring.parse(body);
      const resultado = fazerLogin(username, password);

      if (resultado.success) {    
        res.writeHead(200, {    
          'Content-Type': 'application/json',    
          'Set-Cookie': `token=${resultado.token}; HttpOnly; Path=/`    
        });    
      } else {    
        res.writeHead(200, { 'Content-Type': 'application/json' });    
      }    

      res.end(JSON.stringify(resultado));    
    });    
    return;
  }

  if (pathname === '/menu.html') {
    const sessionToken = verificarSessao(req);
    if (!sessionToken) {
      res.writeHead(302, { 'Location': '/' });
      res.end();
      return;
    }

    fs.readFile(path.join(__dirname, 'menu.html'), (err, content) => {    
      if (err) {    
        res.writeHead(500);    
        res.end('Erro ao carregar a página');    
        return;    
      }    
      res.writeHead(200, { 'Content-Type': 'text/html' });    
      res.end(content);    
    });    
    return;
  }

  if (pathname === '/' || pathname === '/cont.html') {
    fs.readFile(path.join(__dirname, 'cont.html'), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar a página');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  res.writeHead(404);
  res.end('Página não encontrada');
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});