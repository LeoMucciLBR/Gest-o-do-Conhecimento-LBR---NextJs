const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_fRLTgDJ7lub1@ep-late-cake-aeek4vzi-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function importar() {
  try {
    await client.connect();
    console.log('✓ Conectado ao Neon');
    
    const sql = fs.readFileSync('rodovias_sp_filtered.sql', 'utf8');
    console.log('✓ Arquivo SQL carregado');
    
    await client.query(sql);
    console.log('✓ Dados importados com sucesso!');
    
    // Verificar contagem
    const rodovias = await client.query("SELECT COUNT(*) FROM rodovias WHERE uf = 'SP'");
    const segmentos = await client.query("SELECT COUNT(*) FROM segmento_rodovia WHERE uf = 'SP'");
    
    console.log(`\n📊 Verificação:`);
    console.log(`   Rodovias SP: ${rodovias.rows[0].count}`);
    console.log(`   Segmentos SP: ${segmentos.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

importar();
