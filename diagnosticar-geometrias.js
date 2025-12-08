const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_fRLTgDJ7lub1@ep-late-cake-aeek4vzi-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function diagnosticar() {
  try {
    await client.connect();
    console.log('✓ Conectado ao Neon\n');
    
    // 1. Verificar dados nas rodovias
    console.log('=== 1. VERIFICANDO TABELA RODOVIAS ===');
    const rodovias = await client.query(`
      SELECT codigo, nome, uf, km_inicial, km_final, 
             geometria IS NOT NULL as tem_geometria
      FROM rodovias 
      WHERE uf = 'SP' 
      ORDER BY codigo 
      LIMIT 5
    `);
    console.log('Amostra de rodovias SP:');
    console.table(rodovias.rows);
    
    // 2. Verificar dados nos segmentos
    console.log('\n=== 2. VERIFICANDO TABELA SEGMENTO_RODOVIA ===');
    const segmentos = await client.query(`
      SELECT rodovia_codigo, uf, km_inicial, km_final,
             geom IS NOT NULL as tem_geometria
      FROM segmento_rodovia 
      WHERE uf = 'SP' 
      ORDER BY rodovia_codigo 
      LIMIT 5
    `);
    console.log('Amostra de segmentos SP:');
    console.table(segmentos.rows);
    
    // 3. Verificar se os códigos batem (JOIN test)
    console.log('\n=== 3. TESTANDO JOIN ENTRE TABELAS ===');
    const join_test = await client.query(`
      SELECT 
        r.codigo as rodovia_codigo_na_tabela_rodovias,
        COUNT(s.id) as quantidade_segmentos_relacionados
      FROM rodovias r
      LEFT JOIN segmento_rodovia s ON r.codigo = s.rodovia_codigo
      WHERE r.uf = 'SP'
      GROUP BY r.codigo
      ORDER BY quantidade_segmentos_relacionados DESC
      LIMIT 10
    `);
    console.log('Relação rodovias → segmentos (top 10):');
    console.table(join_test.rows);
    
    // 4. Verificar códigos únicos em segmento_rodovia
    console.log('\n=== 4. CÓDIGOS ÚNICOS EM SEGMENTO_RODOVIA (SP) ===');
    const codigos_segmentos = await client.query(`
      SELECT DISTINCT rodovia_codigo, COUNT(*) as qtd_segmentos
      FROM segmento_rodovia
      WHERE uf = 'SP'
      GROUP BY rodovia_codigo
      ORDER BY rodovia_codigo
      LIMIT 10
    `);
    console.log('Códigos usados em segmento_rodovia:');
    console.table(codigos_segmentos.rows);
    
    // 5 Verificar se há geometrias nos segmentos
    console.log('\n=== 5. VERIFICANDO GEOMETRIAS ===');
    const geom_stats = await client.query(`
      SELECT 
        COUNT(*) as total_segmentos,
        COUNT(geom) as segmentos_com_geometria,
        COUNT(*) - COUNT(geom) as segmentos_sem_geometria
      FROM segmento_rodovia
      WHERE uf = 'SP'
    `);
    console.log('Estatísticas de geometria:');
    console.table(geom_stats.rows);
    
    // 6. Teste específico de uma rodovia (exemplo: SP-330)
    console.log('\n=== 6. TESTE COM RODOVIA ESPECÍFICA ===');
    const teste_sp330 = await client.query(`
      SELECT r.codigo, r.nome, r.uf,
             COUNT(s.id) as segmentos_encontrados
      FROM rodovias r
      LEFT JOIN segmento_rodovia s ON r.codigo = s.rodovia_codigo AND s.uf = r.uf
      WHERE r.uf = 'SP' AND (r.codigo LIKE 'SP-%' OR r.codigo LIKE 'SP%')
      GROUP BY r.codigo, r.nome, r.uf
      ORDER BY r.codigo
      LIMIT 10
    `);
    console.log('Rodovias SP e seus segmentos:');
    console.table(teste_sp330.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

diagnosticar();
