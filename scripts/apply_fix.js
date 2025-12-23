const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env since 'dotenv' might not be installed
const envPath = path.join(__dirname, '..', '.env');
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envPath)) {
    console.log('📄 Lendo arquivo .env...');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const trimmed = line.trim();
        // Simple parser for DATABASE_URL specifically
        if (trimmed.startsWith('DATABASE_URL=')) {
            let val = trimmed.substring('DATABASE_URL='.length);
            // Remove wrapping quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            connectionString = val;
            break;
        }
    }
}

if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não encontrada. Verifique se o arquivo .env existe e contém a chave DATABASE_URL.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    console.log('🔌 Conectando ao banco de dados...');
    console.log(`   URL: ${connectionString.replace(/:[^:]+@/, ':****@')}`); // Mask password

    try {
        await client.connect();
        console.log('✅ Conectado!');

        const sqlPath = path.join(__dirname, 'fix_people_schema.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Arquivo SQL não encontrado: ${sqlPath}`);
        }
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔄 Executando script de correção...');
        console.log('----------------------------------------');
        console.log(sql);
        console.log('----------------------------------------');

        await client.query(sql);

        console.log('✅ Correção aplicada com sucesso!');
        console.log('🚀 Reinicie o servidor se necessário e tente novamente.');

    } catch (err) {
        console.error('❌ Erro ao executar migração:', err);
    } finally {
        await client.end();
    }
}

runMigration();
