import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'

// GET /api/obras/[id]/km-location?lat=...&lng=...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const session = await validateSession(sessionToken)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const obraId = parseInt(id)
    if (isNaN(obraId)) {
      return NextResponse.json({ error: 'Invalid obra ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // 1. Fetch Obra details
    const obra = await prisma.obras.findUnique({
      where: { id: obraId },
      include: { rodovia: true }
    })

    if (!obra || !obra.rodovia) {
      return NextResponse.json({ error: 'Obra or Rodovia not found' }, { status: 404 })
    }

    // 2. Determine Rodovia Name (same logic as in contracts API)
    let rodovia_nome = obra.rodovia.nome
    if (rodovia_nome && (rodovia_nome.startsWith('BR-') || !isNaN(Number(rodovia_nome)))) {
      const num = rodovia_nome.replace('BR-', '')
      if (!isNaN(Number(num))) {
        rodovia_nome = num.padStart(3, '0')
      }
    }

    // 3. Calculate Geometry and Locate Point
    // We use the same CTE to build the geometry, then use ST_LineLocatePoint
    const query = `
      WITH params AS (
        SELECT
          $1::text      AS p_uf,
          $2::text      AS p_rodovia,
          $3::numeric   AS p_km_ini,
          $4::numeric   AS p_km_fim,
          $5::numeric   AS p_lat,
          $6::numeric   AS p_lng
      ),
      segmentos AS (
        SELECT 
          s.geom, 
          s.km_inicial, 
          s.km_final, 
          ABS(s.km_final - s.km_inicial) as total_km
        FROM segmento_rodovia s
        JOIN rodovias r ON r.codigo = s.rodovia_codigo
        WHERE r.uf = (SELECT p_uf FROM params)
          AND r.nome = (SELECT p_rodovia FROM params)
          AND (
            (s.km_inicial <= (SELECT p_km_fim FROM params) AND s.km_final >= (SELECT p_km_ini FROM params))
            OR
            (s.km_inicial >= (SELECT p_km_ini FROM params) AND s.km_final <= (SELECT p_km_fim FROM params))
          )
      ),
      recortes AS (
        SELECT
          GREATEST(LEAST(km_inicial, km_final), (SELECT p_km_ini FROM params)) as km_rec_ini,
          LEAST(GREATEST(km_inicial, km_final), (SELECT p_km_fim FROM params)) as km_rec_fim,
          ST_LineSubstring(
            ST_LineMerge(geom), 
            (GREATEST(LEAST(km_inicial, km_final), (SELECT p_km_ini FROM params)) - km_inicial) / NULLIF(total_km,0)::float,
            (LEAST(GREATEST(km_inicial, km_final), (SELECT p_km_fim FROM params)) - km_inicial) / NULLIF(total_km,0)::float
          ) AS geom_recortado
        FROM segmentos
        WHERE total_km > 0
      ),
      unido AS (
        SELECT ST_LineMerge(ST_Collect(geom_recortado)) AS geom_unido
        FROM recortes
      )
      SELECT 
        ST_LineLocatePoint(
          geom_unido, 
          ST_SetSRID(ST_MakePoint((SELECT p_lng FROM params), (SELECT p_lat FROM params)), 4326)
        ) as fraction,
        ST_AsGeoJSON(
          ST_LineInterpolatePoint(
            geom_unido,
            ST_LineLocatePoint(
              geom_unido, 
              ST_SetSRID(ST_MakePoint((SELECT p_lng FROM params), (SELECT p_lat FROM params)), 4326)
            )
          )
        ) as snapped_point
      FROM unido;
    `

    const result: any[] = await prisma.$queryRawUnsafe(
      query,
      obra.rodovia.uf,
      rodovia_nome,
      Number(obra.km_inicio),
      Number(obra.km_fim),
      lat,
      lng
    )

    if (result && result.length > 0 && result[0].fraction !== null) {
      const fraction = result[0].fraction
      const km_inicio = Number(obra.km_inicio)
      const km_fim = Number(obra.km_fim)
      
      // Calculate KM based on fraction
      // Note: This assumes the geometry direction matches the KM direction (increasing)
      // If the geometry is reversed, this might be inverted. 
      // Usually road geometries are digitized in the direction of increasing KM, but not always.
      // For now, we assume standard direction.
      const km = km_inicio + fraction * (km_fim - km_inicio)

      let snappedCoords = { lat, lng } // Default to original if snapping fails
      
      if (result[0].snapped_point) {
        const point = JSON.parse(result[0].snapped_point)
        if (point.coordinates) {
          snappedCoords = {
            lng: point.coordinates[0],
            lat: point.coordinates[1]
          }
        }
      }

      return NextResponse.json({ 
        km,
        latitude: snappedCoords.lat,
        longitude: snappedCoords.lng
      })
    }

    return NextResponse.json({ error: 'Could not calculate location' }, { status: 404 })

  } catch (error: any) {
    console.error('Error calculating KM:', error)
    return NextResponse.json(
      { error: error.message || 'Error calculating KM' },
      { status: 500 }
    )
  }
}
