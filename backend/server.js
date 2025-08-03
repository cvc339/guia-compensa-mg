const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// --- Conexão com o Banco de Dados ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error("ERRO GRAVE: Não foi possível conectar ao database.sqlite.", err.message);
    console.log('Conectado ao banco de dados database.sqlite com sucesso.');
});

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// ==================================================================
// === AQUI ESTÁ A CORREÇÃO =========================================
// ==================================================================
// Middleware para forçar o cabeçalho UTF-8 em todas as rotas da API.
// Isso garante que o navegador interprete os caracteres especiais (ç, ã, º) corretamente.
app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});
// ==================================================================
// === FIM DA CORREÇÃO ==============================================
// ==================================================================


// ===============================================
// === ROTAS PÚBLICAS (para o index.html) ========
// ===============================================

// Rota de normas com funcionalidade de busca (ex: /api/v2/normas?q=decreto)
app.get('/api/v2/normas', (req, res) => {
    const searchTerm = req.query.q; 
    let sql = "SELECT * FROM normas";
    const params = [];

    if (searchTerm) {
        const lowerSearchTerm = `%${searchTerm.toLowerCase()}%`;
        sql += " WHERE LOWER(nome) LIKE ? OR LOWER(link) LIKE ? OR LOWER(preambulo) LIKE ?";
        params.push(lowerSearchTerm, lowerSearchTerm, lowerSearchTerm);
    }

    sql += " ORDER BY nome";

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({ data: rows });
    });
});

app.get('/api/v2/tipos', (req, res) => db.all("SELECT * FROM tipos_compensacao", [], (err, rows) => err ? res.status(400).json({ "error": err.message }) : res.json({ data: rows })));
app.get('/api/v2/modalidades', (req, res) => db.all("SELECT * FROM modalidades", [], (err, rows) => err ? res.status(400).json({ "error": err.message }) : res.json({ data: rows })));

// ===============================================
// === ROTAS DA ÁREA ADMINISTRATIVA (CRUD) ======
// ===============================================

// --- NORMAS ---
app.post('/api/v2/normas', (req, res) => { // CREATE
    const { nome, link, preambulo } = req.body;
    db.run('INSERT INTO normas (nome, link, preambulo) VALUES (?, ?, ?)', [nome, link, preambulo], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});
app.put('/api/v2/normas/:id', (req, res) => { // UPDATE
    const { nome, link, preambulo } = req.body;
    db.run('UPDATE normas SET nome = ?, link = ?, preambulo = ? WHERE id = ?', [nome, link, preambulo, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(200).json({ message: 'Norma atualizada com sucesso' });
    });
});
app.delete('/api/v2/normas/:id', (req, res) => { // DELETE
    db.run('DELETE FROM normas WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Norma não encontrada." });
        res.status(200).json({ message: 'Norma deletada com sucesso' });
    });
});

// --- TIPOS ---
app.post('/api/v2/tipos', (req, res) => { // CREATE
    const { nome, norma_ids } = req.body;
    db.run('INSERT INTO tipos_compensacao (nome, norma_ids) VALUES (?, ?)', [nome, norma_ids], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});
app.put('/api/v2/tipos/:id', (req, res) => { // UPDATE
    const { nome, norma_ids } = req.body;
    db.run('UPDATE tipos_compensacao SET nome = ?, norma_ids = ? WHERE id = ?', [nome, norma_ids, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(200).json({ message: 'Tipo atualizado com sucesso' });
    });
});
app.delete('/api/v2/tipos/:id', (req, res) => { // DELETE
    db.run('DELETE FROM tipos_compensacao WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Tipo não encontrado." });
        res.status(200).json({ message: 'Tipo deletado com sucesso' });
    });
});

// --- MODALIDADES ---
app.post('/api/v2/modalidades', (req, res) => { // CREATE
    const sql = `INSERT INTO modalidades (tipo_id, nome, proporcao, forma, especificidades, vantagens, desvantagens, observacao, documentos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const p = req.body;
    db.run(sql, [p.tipo_id, p.nome, p.proporcao, p.forma, p.especificidades, p.vantagens, p.desvantagens, p.observacao, p.documentos], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});
app.put('/api/v2/modalidades/:id', (req, res) => { // UPDATE
    const sql = `UPDATE modalidades SET tipo_id = ?, nome = ?, proporcao = ?, forma = ?, especificidades = ?, vantagens = ?, desvantagens = ?, observacao = ?, documentos = ? WHERE id = ?`;
    const p = req.body;
    db.run(sql, [p.tipo_id, p.nome, p.proporcao, p.forma, p.especificidades, p.vantagens, p.desvantagens, p.observacao, p.documentos, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(200).json({ message: 'Modalidade atualizada com sucesso' });
    });
});
app.delete('/api/v2/modalidades/:id', (req, res) => { // DELETE
    db.run('DELETE FROM modalidades WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Modalidade não encontrada." });
        res.status(200).json({ message: 'Modalidade deletada com sucesso' });
    });
});

// --- Servindo os arquivos estáticos do Frontend ---
const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Servindo arquivos do frontend da pasta: ${frontendPath}`);
});