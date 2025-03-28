const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const { 
    HOME_DIR, 
    initializeHomeDirectory, 
    getFolderStructure 
} = require('./filesystem');
const {
    handleListFolders,
    handleCreateFolder,
    handleCreateFile,
    handleDeleteItem
} = require('./routes');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    try {
        if (req.method === 'GET') {
            if (parsedUrl.pathname === '/') {
                const content = await fs.readFile(path.join(__dirname, '../../public/boot.html'), 'utf8');
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(content);
            } else if (parsedUrl.pathname === '/list-folders') {
                await handleListFolders(req, res, parsedUrl.query.dir);
            } else if (parsedUrl.pathname.startsWith('/src/ui/')) { // Configuração para servir arquivos da pasta src/ui/
                const filePath = path.join(__dirname, '../..', parsedUrl.pathname);
                try {
                    const content = await fs.readFile(filePath);
                    let contentType = 'text/plain';
                    if (parsedUrl.pathname.endsWith('.css')) {
                        contentType = 'text/css';
                    } else if (parsedUrl.pathname.endsWith('.js')) {
                        contentType = 'application/javascript';
                    }
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(content);
                } catch (err) {
                    res.writeHead(404);
                    res.end('File not found');
                }
            } else if (parsedUrl.pathname.startsWith('/views/')) { 
                const filePath = path.join(__dirname, '../../src/ui', parsedUrl.pathname);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const contentType = parsedUrl.pathname.endsWith('.html') ? 'text/html' : 'text/plain';
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(content);
                } catch (err) {
                    res.writeHead(404);
                    res.end('File not found in views');
                }
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    if (parsedUrl.pathname === '/create-folder') {
                        await handleCreateFolder(req, res, data);
                    } else if (parsedUrl.pathname === '/create-file') {
                        await handleCreateFile(req, res, data);
                    } else if (parsedUrl.pathname === '/delete-item') {
                        await handleDeleteItem(req, res, data);
                    } else {
                        res.writeHead(404);
                        res.end('Not found');
                    }
                } catch (error) {
                    console.error('Error processing request:', error);
                    res.writeHead(400);
                    res.end('Bad Request');
                }
            });
        } else {
            res.writeHead(405);
            res.end('Method not allowed');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

function startServer(port = 5000) {
    server.listen(port, async () => {
        await initializeHomeDirectory();
        console.log(`Server running on port ${port}`);
    });
}

module.exports = { startServer };
