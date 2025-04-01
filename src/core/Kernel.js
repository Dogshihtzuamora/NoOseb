const http = require('http');
const fs = require('fs');
const path = require('path');

const HOME_DIR = path.join(__dirname, 'HOME-NoOseb');
if (!fs.existsSync(HOME_DIR)) {
  fs.mkdirSync(HOME_DIR);
  console.log('Pasta HOME-NoOseb criada.');
}

const kernelApi = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/ls-home') {
    fs.readdir(HOME_DIR, (err, files) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao listar diretório.');
        return;
      }
      
 const fileInfoPromises = files.map(file => {
        return new Promise((resolve) => {
          const filePath = path.join(HOME_DIR, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              resolve({ name: file, isFolder: false });
            } else {
              resolve({ name: file, isFolder: stats.isDirectory() });
            }
          });
        });
      });
      
      Promise.all(fileInfoPromises).then(fileInfos => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fileInfos));
      });
    });
    return;
  }

 if (req.method === 'GET' && req.url.startsWith('/ls-folder')) {
    const folderName = req.url.split('/ls-folder/')[1];
    const folderPath = path.join(HOME_DIR, folderName);

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao listar o conteúdo da pasta.');
        return;
      }
      
 const fileInfoPromises = files.map(file => {
        return new Promise((resolve) => {
          const filePath = path.join(folderPath, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              resolve({ name: file, isFolder: false });
            } else {
              resolve({ name: file, isFolder: stats.isDirectory() });
            }
          });
        });
      });
      
      Promise.all(fileInfoPromises).then(fileInfos => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fileInfos));
      });
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/read-file')) {
    const fileName = req.url.split('/read-file/')[1];
    const filePath = path.join(HOME_DIR, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Arquivo não encontrado.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/create-item') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { type, content, pathName } = JSON.parse(body);

        if (!pathName) {
          res.writeHead(400);
          res.end('Caminho (pathName) é obrigatório.');
          return;
        }

        const targetPath = path.join(HOME_DIR, pathName);

 if (type === 'folder') {
 if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
            res.writeHead(201);
            res.end('Pasta criada com sucesso.');
          } else {
            res.writeHead(409);
            res.end('Pasta já existe.');
          }
        } else if (type === 'file') {
          const folderPath = path.dirname(targetPath);

 if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          fs.writeFileSync(targetPath, content || '');
          res.writeHead(201);
          res.end('Arquivo criado com sucesso.');
        } else {
          res.writeHead(400);
          res.end('Tipo inválido, use "folder" ou "file".');
        }
      } catch (err) {
        res.writeHead(500);
        res.end('Erro interno: ' + err.message);
      }
    });
    return;
  }

  if (req.method === 'PUT' && req.url === '/update-file') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { filePath, content } = JSON.parse(body);
        if (!filePath) {
          res.writeHead(400);
          res.end('Caminho do arquivo é obrigatório.');
          return;
        }

        const targetPath = path.join(HOME_DIR, filePath);
        fs.writeFile(targetPath, content || '', (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro ao atualizar arquivo: ' + err.message);
            return;
          }
          res.writeHead(200);
          res.end('Arquivo atualizado com sucesso.');
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Erro interno: ' + err.message);
      }
    });
    return;
  }

  if (req.method === 'PUT' && req.url === '/rename-item') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { oldPath, newName } = JSON.parse(body);
        if (!oldPath || !newName) {
          res.writeHead(400);
          res.end('Caminho original e novo nome são obrigatórios.');
          return;
        }

        const srcPath = path.join(HOME_DIR, oldPath);
        const dirName = path.dirname(oldPath);
        const destPath = path.join(HOME_DIR, dirName === '.' ? newName : `${dirName}/${newName}`);

        fs.rename(srcPath, destPath, (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro ao renomear: ' + err.message);
            return;
          }
          res.writeHead(200);
          res.end('Item renomeado com sucesso.');
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Erro interno: ' + err.message);
      }
    });
    return;
  }

  if (req.method === 'DELETE' && req.url.startsWith('/delete-file')) {
    const fileName = req.url.split('/delete-file/')[1];
    const filePath = path.join(HOME_DIR, fileName);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404);
        res.end('Arquivo ou pasta não encontrado.');
        return;
      }

      if (stats.isDirectory()) {
        fs.rmdir(filePath, { recursive: true }, (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro ao excluir pasta.');
            return;
          }
          res.writeHead(200);
          res.end('Pasta excluída com sucesso.');
        });
      } else {
        fs.unlink(filePath, (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro ao excluir arquivo.');
            return;
          }
          res.writeHead(200);
          res.end('Arquivo excluído com sucesso.');
        });
      }
    });
    return;
  } else {
    res.writeHead(404);
    res.end('Rota não encontrada.');
  }
});

module.exports = kernelApi;
