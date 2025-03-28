const fs = require('fs').promises;
const path = require('path');
const { HOME_DIR, DOCUMENTS_DIR, getFolderStructure } = require('./filesystem');

async function handleListFolders(req, res, dir) {
    try {
        const targetDir = dir ? path.join(HOME_DIR, dir) : HOME_DIR;
        const structure = await getFolderStructure(targetDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(structure));
    } catch (error) {
        console.error('Error listing folders:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao listar diretórios' }));
    }
}

async function handleCreateFolder(req, res, body) {
    try {
        const { parentPath, folderName } = body;
        if (!folderName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Nome da pasta é obrigatório' }));
        }

        const folderPath = path.join(HOME_DIR, parentPath, folderName);
        await fs.mkdir(folderPath, { recursive: true });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Pasta criada com sucesso' }));
    } catch (error) {
        console.error('Error creating folder:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao criar pasta' }));
    }
}

async function handleCreateFile(req, res, body) {
    try {
        const { parentPath, fileName } = body;
        if (!fileName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Nome do arquivo é obrigatório' }));
        }

        const filePath = path.join(HOME_DIR, parentPath, fileName);
        await fs.writeFile(filePath, '', 'utf8');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Arquivo criado com sucesso' }));
    } catch (error) {
        console.error('Error creating file:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao criar arquivo' }));
    }
}

async function handleDeleteItem(req, res, body) {
    try {
        const { path: itemPath } = body;
        if (!itemPath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Caminho do item é obrigatório' }));
        }

        const fullPath = path.join(HOME_DIR, itemPath);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
            await fs.rmdir(fullPath, { recursive: true });
        } else {
            await fs.unlink(fullPath);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item excluído com sucesso' }));
    } catch (error) {
        console.error('Error deleting item:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao excluir item' }));
    }
}

module.exports = {
    handleListFolders,
    handleCreateFolder,
    handleCreateFile,
    handleDeleteItem
};