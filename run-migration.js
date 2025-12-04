/**
 * Script para executar a migração do banco de dados
 * Este script adiciona o valor COVER_IMAGE ao enum document_kind
 * 
 * Como executar:
 * 
 * Opção 1 - Via linha de comando PostgreSQL:
 * psql -U seu_usuario -d nome_do_banco -c "ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';"
 * 
 * Opção 2 - Via interface gráfica (pgAdmin, DBeaver, etc):
 * Abra o SQL editor e execute:
 * ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';
 * 
 * Opção 3 - Via Node.js (se as opções acima não funcionarem):
 * 1. Instale pg: npm install pg
 * 2. Edite este arquivo e adicione suas credenciais do banco
 * 3. Execute: node run-migration.js
 */

// Descomente e configure as linhas abaixo se quiser usar a Opção 3
/*
const { Client } = require('pg')

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'seu_banco',
  user: 'seu_usuario',
  password: 'sua_senha'
})

async function runMigration() {
  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados')
    
    console.log('🔄 Executando migração...')
    await client.query(`ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';`)
    
    console.log('✅ Migração concluída com sucesso!')
    console.log('🔄 Agora reinicie o servidor: npm run dev')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

runMigration()
*/

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         MIGRAÇÃO DO BANCO DE DADOS - COVER_IMAGE              ║
╚════════════════════════════════════════════════════════════════╝

⚠️  IMPORTANTE: Você precisa executar esta migração SQL!

📋 SQL a ser executado:
───────────────────────────────────────────────────────────────
ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';
───────────────────────────────────────────────────────────────

💡 Como executar:

1️⃣  Via psql (linha de comando):
   psql -U seu_usuario -d nome_do_banco -c "ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';"

2️⃣  Via pgAdmin ou DBeaver:
   - Abra o SQL Editor
   - Cole e execute o SQL acima

3️⃣  Via código Node.js:
   - Descomente o código neste arquivo
   - Configure suas credenciais do banco
   - Execute: node run-migration.js

📝 Após executar a migração:
   - Reinicie o servidor: npm run dev
   - Teste a criação de contratos

`)
