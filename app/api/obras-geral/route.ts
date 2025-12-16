import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Complex PostGIS query to get segment geometry based on KM range
// This is the same query used in the contract details API
const SEGMENT_QUERY = `
  WITH params AS (
    SELECT
      $1::text      AS p_uf,
      $2::text      AS p_rodovia,
      $3::numeric   AS p_km_ini,
      $4::numeric   AS p_km_fim
  ),
  segmentos AS (
    SELECT
      s.id,
      s.geom,
      s.km_inicial,
      s.km_final,
      (s.km_final - s.km_inicial) AS total_km,
      GREATEST(p.p_km_ini, s.km_inicial) AS km_rec_ini,
      LEAST(p.p_km_fim, s.km_final)      AS km_rec_fim,
      r.nome AS rodovia,
      r.uf
    FROM segmento_rodovia s
    JOIN rodovias r ON r.codigo = s.rodovia_codigo
    CROSS JOIN params p
    WHERE r.uf   = p.p_uf
      AND (r.nome = p.p_rodovia OR r.codigo = p.p_rodovia OR r.nome LIKE p.p_rodovia || '/%')
      AND s.km_final   >= p.p_km_ini
      AND s.km_inicial <= p.p_km_fim
  ),
  recortes AS (
    SELECT
      ST_LineSubstring(
        ST_LineMerge(geom::geography::geometry),
        (km_rec_ini - km_inicial) / NULLIF(total_km,0)::float,
        (km_rec_fim - km_inicial) / NULLIF(total_km,0)::float
      ) AS geom_recortado
    FROM segmentos
    WHERE total_km > 0 AND km_rec_fim > km_rec_ini
  ),
  unido AS (
    SELECT
      CASE 
        WHEN ST_SRID(ST_Union(geom_recortado)) = 4326 
        THEN ST_Union(geom_recortado)
        ELSE ST_Transform(ST_Union(geom_recortado), 4326)
      END AS geom_unido
    FROM recortes
  )
  SELECT ST_AsGeoJSON(geom_unido) AS geojson FROM unido;
`

export async function GET() {
  try {
    // Buscar todas as obras que têm contract_id (ligadas a contratos)
    const obrasRaw = await prisma.obras.findMany({
      where: {
        contract_id: { not: null }
      },
      select: {
        id: true,
        nome: true,
        km_inicio: true,
        km_fim: true,
        uf: true,
        rodovia_id: true,
        contract_id: true,
        contract: {
          select: {
            name: true,
            object: true
          }
        }
      }
    })

    if (obrasRaw.length === 0) {
      return NextResponse.json([])
    }

    // Buscar rodovias com geometria via raw SQL (PostGIS)
    const rodoviasIds = [...new Set(obrasRaw.map(o => o.rodovia_id).filter(Boolean))]
    
    let rodovias: any[] = []
    if (rodoviasIds.length > 0) {
      rodovias = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, uf, nome, codigo, ST_AsGeoJSON(geometria) as geometria FROM rodovias WHERE id = ANY($1::int[])`,
        rodoviasIds
      )
    }

    const rodoviasMap = new Map(rodovias.map(r => [r.id, r]))

    // Processar cada obra e calcular geometria usando PostGIS
    const obrasWithGeometry = await Promise.all(obrasRaw.map(async (obra) => {
      const rodovia = obra.rodovia_id ? rodoviasMap.get(obra.rodovia_id) : null
      
      let geometria = null
      
      if (rodovia && obra.km_inicio !== null && obra.km_fim !== null) {
        // Try to get the precise segment geometry using PostGIS
        try {
          const result = await prisma.$queryRawUnsafe<any[]>(
            SEGMENT_QUERY,
            rodovia.uf,
            rodovia.codigo || rodovia.nome,
            Number(obra.km_inicio),
            Number(obra.km_fim)
          )
          
          if (result && result.length > 0 && result[0].geojson) {
            geometria = JSON.parse(result[0].geojson)
          }
        } catch (err) {
          console.error(`Error calculating segment for obra ${obra.id}:`, err)
        }
        
        // Fallback: use full rodovia geometry if segment query fails
        if (!geometria && rodovia.geometria) {
          try {
            geometria = JSON.parse(rodovia.geometria)
          } catch (e) {
            console.error('Error parsing fallback geometry:', e)
          }
        }
      }
      
      return {
        id: obra.id,
        nome: obra.nome || rodovia?.nome || `Obra ${obra.id}`,
        km_inicio: Number(obra.km_inicio) || 0,
        km_fim: Number(obra.km_fim) || 0,
        uf: obra.uf || rodovia?.uf || '',
        geometria,
        contract_id: obra.contract_id,
        contract_name: obra.contract?.name,
        type: 'obra'
      }
    }))
    
    const obrasFiltered = obrasWithGeometry.filter(obra => obra.geometria !== null)

    console.log(`[obras-geral] Returning ${obrasFiltered.length} obras with geometry (out of ${obrasRaw.length} total)`)

    return NextResponse.json(obrasFiltered)
  } catch (error) {
    console.error('Error fetching all obras:', error)
    return NextResponse.json(
      { error: 'Failed to fetch obras', details: String(error) },
      { status: 500 }
    )
  }
}
