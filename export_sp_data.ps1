# ================================================
# Script PowerShell para migrar apenas dados de SP
# ================================================

Write-Host "🚀 Iniciando migração de dados de SP para Neon..." -ForegroundColor Green

# 1. Exportar todas as tabelas EXCETO rodovias e segmento_rodovia
Write-Host "`n📦 Exportando tabelas de aplicação (contratos, usuários, etc.)..." -ForegroundColor Yellow
pg_dump -U app_user -d lbr_app --data-only --inserts `
  --exclude-table=rodovias `
  --exclude-table=segmento_rodovia `
  -f backup_app_data.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tabelas de aplicação exportadas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao exportar tabelas de aplicação" -ForegroundColor Red
    exit 1
}

# 2. Exportar apenas rodovias de SP
Write-Host "`n📍 Exportando rodovias de SP..." -ForegroundColor Yellow
$sqlRodovias = @"
\o backup_rodovias_sp.sql
COPY (SELECT * FROM rodovias WHERE uf = 'SP') TO STDOUT;
\o
"@
$sqlRodovias | psql -U app_user -d lbr_app

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rodovias de SP exportadas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao exportar rodovias" -ForegroundColor Red
}

# 3. Exportar segmentos de rodovias de SP
Write-Host "`n🛣️ Exportando segmentos de rodovias de SP..." -ForegroundColor Yellow
$sqlSegmentos = @"
\o backup_segmentos_sp.sql
COPY (
  SELECT s.* 
  FROM segmento_rodovia s
  WHERE EXISTS (
    SELECT 1 FROM rodovias r 
    WHERE r.codigo = s.rodovia_codigo AND r.uf = 'SP'
  )
) TO STDOUT;
\o
"@
$sqlSegmentos | psql -U app_user -d lbr_app

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Segmentos de SP exportados!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao exportar segmentos" -ForegroundColor Red
}

# 4. Mostrar tamanhos dos arquivos
Write-Host "`n📊 Tamanhos dos arquivos gerados:" -ForegroundColor Cyan
Get-ChildItem backup_*.sql | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length/1MB, 2)}}

Write-Host "`n✅ Exportação concluída! Agora você pode importar para o Neon." -ForegroundColor Green
Write-Host "   Execute: psql `"sua_connection_string_neon`" -f backup_app_data.sql" -ForegroundColor White
