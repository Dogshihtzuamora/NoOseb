const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Rota para listar arquivos e diretórios (File Explorer)
router.get('/fileExplorer', (req, res) => {
    const directoryPath = 'C:\\'; // Definir a raiz
    fs.readdir(directoryPath, (err, files) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ files });
    });
});

// Criar pasta ou arquivo
router.post('/fileExplorer/create', (req, res) => {
    const { name, type } = req.body;
    const fullPath = path.join('C:\\', name);

    if (type === 'folder') {
        fs.mkdir(fullPath, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Pasta criada com sucesso' });
        });
    } else if (type === 'file') {
        fs.writeFile(fullPath, '', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Arquivo criado com sucesso' });
        });
    }
});

// Abrir um aplicativo
router.get('/openApp/:app', (req, res) => {
    const appName = req.params.app;
    res.json({ message: `Abrindo ${appName}` });
});

module.exports = router;
