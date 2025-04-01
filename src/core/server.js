const express = require('express');
const path = require('path');

const app = express();

// Serve arquivos estáticos
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.static(path.join(__dirname, '../ui')));

// Rota principal para boot.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/boot.html'));
});

// Inicia o servidor
function startServer(PORT = 5000) {
    app.listen(PORT, () => {
        console.log(`Sistema operacional rodando em http://localhost:${PORT}`);
    });
}

module.exports = { startServer };
