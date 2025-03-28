const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const HOME_DIR = path.join(process.cwd(), 'HOME-NoOseb');
const DOCUMENTS_DIR = path.join(HOME_DIR, 'documents');

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Erro ao criar diretório ${dirPath}:`, error);
        }
    }
}

async function initializeHomeDirectory() {
    await ensureDirectoryExists(HOME_DIR);
    await ensureDirectoryExists(DOCUMENTS_DIR);
}

async function getFolderStructure(basePath) {
    try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        return entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? '📁' : '📄',
            path: path.relative(HOME_DIR, path.join(basePath, entry.name))
        }));
    } catch (error) {
        console.error('Erro ao listar diretório:', error);
        return [];
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    try {
        if (parsedUrl.pathname === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            const content = await fs.readFile(path.join(__dirname, 'menu.html'), 'utf8');
            res.end(content);
        } 
        else if (parsedUrl.pathname === '/init') {
            await initializeHomeDirectory();
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ message: 'Diretórios inicializados' }));
        }
        else if (parsedUrl.pathname === '/list-folders') {
            const { dir = HOME_DIR } = parsedUrl.query;
            const fullPath = path.join(HOME_DIR, dir);
            const folders = await getFolderStructure(fullPath);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(folders));
        }
        else if (parsedUrl.pathname === '/create-folder' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                const { parentPath = '', folderName } = JSON.parse(body);
                const newFolderPath = path.join(HOME_DIR, parentPath, folderName);
                
                try {
                    await fs.mkdir(newFolderPath, { recursive: true });
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ 
                        message: 'Pasta criada com sucesso', 
                        path: path.relative(HOME_DIR, newFolderPath) 
                    }));
                } catch (error) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ error: 'Erro ao criar pasta' }));
                }
            });
        }
        else if (parsedUrl.pathname === '/create-file' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                const { parentPath = '', fileName } = JSON.parse(body);
                const newFilePath = path.join(HOME_DIR, parentPath, fileName)
                
                try {
                    await fs.writeFile(newFilePath, '');
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ 
                        message: 'Arquivo criado com sucesso', 
                        path: path.relative(HOME_DIR, newFilePath) 
                    }));
                } catch (error) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ error: 'Erro ao criar arquivo' }));
                }
            });
        }
        else if (parsedUrl.pathname === '/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                const { itemPath } = JSON.parse(body);
                const fullPath = path.join(HOME_DIR, itemPath);
                
                try {
                    const stat = await fs.stat(fullPath);
                    if (stat.isDirectory()) {
                        await fs.rm(fullPath, { recursive: true, force: true });
                    } else {
                        await fs.unlink(fullPath);
                    }
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ message: 'Item excluído com sucesso' }));
                } catch (error) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ error: 'Erro ao excluir item' }));
                }
            });
        }
        else {
            res.writeHead(404);
            res.end('Não encontrado');
        }
    } catch (error) {
        res.writeHead(500);
        res.end('Erro interno do servidor');
    }
});

server.listen(5000, async () => {
    await initializeHomeDirectory();
    console.log('Servidor rodando na porta 5000');
});
