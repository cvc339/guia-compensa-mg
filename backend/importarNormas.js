const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

// --- Configurações ---
const dbPath = path.resolve(__dirname, 'database.sqlite');
const csvPath = path.resolve(__dirname, 'normas_para_importar.csv');

// --- Conexão com o Banco de Dados ---
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('Erro ao conectar ao banco de dados:', err.message);
    console.log('Conectado ao banco de dados com sucesso.');
});

console.log(`Iniciando a leitura do arquivo: ${csvPath}`);
const normasParaInserir = [];

// =================================================================================
// AQUI ESTÁ A CORREÇÃO FINAL: Forçamos a leitura do arquivo como UTF-8
// =================================================================================
fs.createReadStream(csvPath, { encoding: 'utf-8' }) 
    .pipe(csv({ separator: ';', headers: ['nome', 'link', 'preambulo'] }))
    .on('data', (row) => {
        const norma = {
            nome: row.nome || '',
            link: row.link || '',
            preambulo: row.preambulo || ''
        };
        if (norma.nome) normasParaInserir.push(norma);
    })
    .on('end', () => {
        console.log(`Leitura do arquivo CSV concluída. ${normasParaInserir.length} normas encontradas.`);

        if (normasParaInserir.length === 0) {
            console.log('Nenhuma norma para importar. Encerrando.');
            db.close();
            return;
        }

        const query = 'INSERT INTO normas (nome, link, preambulo) VALUES (?, ?, ?)';
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            normasParaInserir.forEach(norma => {
                db.run(query, [norma.nome, norma.link, norma.preambulo], function(err) {
                    if (err) return console.error('Erro ao inserir a norma:', norma.nome, err.message);
                    console.log(`Norma inserida: ${norma.nome}`);
                });
            });
            db.run('COMMIT;', (err) => {
                if (err) return console.error('Erro ao finalizar a transação:', err.message);
                console.log('\n--- IMPORTAÇÃO CONCLUÍDA COM SUCESSO! ---');
                db.close();
            });
        });
    });