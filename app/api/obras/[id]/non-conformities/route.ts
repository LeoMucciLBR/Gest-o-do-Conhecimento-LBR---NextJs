import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'

// GET /api/obras/[id]/non-conformities
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
    if (isNaN(obraId)) return NextResponse.json({ error: 'Invalid obra ID' }, { status: 400 })

    const nonConformities = await prisma.obra_non_conformities.findMany({
      where: { obra_id: obraId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(nonConformities)
  } catch (error: any) {
    console.error('Error fetching non-conformities:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching non-conformities' },
      { status: 500 }
    )
  }
}

// POST /api/obras/[id]/non-conformities
export async function POST(
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

    const body = await request.json()
    const { km, description, severity, status, latitude: providedLat, longitude: providedLng } = body

    if (km === undefined || !description) {
      return NextResponse.json(
        { error: 'Missing required fields (km, description)' },
        { status: 400 }
      )
    }

    // Start with provided coordinates (from km-location API on frontend)
    let latitude = providedLat || null
    let longitude = providedLng || null

    try {
      // Get obra to calculate coordinates from KM
      const obra = await prisma.obras.findUnique({
        where: { id: obraId },
        include: { rodovia: true }
      })

      if (obra && obra.rodovia) {
        // Format rodovia name (same logic as km-location)
        let rodovia_nome = obra.rodovia.nome
        if (rodovia_nome && (rodovia_nome.startsWith('BR-') || !isNaN(Number(rodovia_nome)))) {
          const num = rodovia_nome.replace('BR-', '')
          if (!isNaN(Number(num))) {
            rodovia_nome = num.padStart(3, '0')
          }
        }

        // Calculate coordinates from KM using simple linear interpolation
        const kmInicio = Number(obra.km_inicio)
        const kmFim = Number(obra.km_fim)
        const fraction = (km - kmInicio) / (kmFim - kmInicio)

        // Use same query structure as km-location to get coordinates
        const query = `
          WITH params AS (
            SELECT
              $1::text      AS p_uf,
              $2::text      AS p_rodovia,
              $3::numeric   AS p_km_ini,
              $4::numeric   AS p_km_fim,
              $5::numeric   AS p_fraction
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
            ST_AsGeoJSON(
              ST_LineInterpolatePoint(geom_unido, (SELECT p_fraction FROM params))
            ) as point
          FROM unido;
        `

        const result: any[] = await prisma.$queryRawUnsafe(
          query,
          obra.rodovia.uf,
          rodovia_nome,
          kmInicio,
          kmFim,
          fraction
        )

        if (result && result.length > 0 && result[0].point) {
          const point = JSON.parse(result[0].point)
          if (point.coordinates) {
            latitude = point.coordinates[1]
            longitude = point.coordinates[0]
          }
        }
      }
    } catch (coordError) {
      // Log error but don't fail the entire request
      console.warn('Could not calculate coordinates from KM:', coordError)
    }

    const nonConformity = await prisma.obra_non_conformities.create({
      data: {
        obra_id: obraId,
        user_id: session.users.id,
        km,
        description,
        severity: severity || 'BAIXA',
        status: status || 'ABERTA',
        latitude,
        longitude,
      },
    })

    return NextResponse.json(nonConformity, { status: 201 })
  } catch (error: any) {
    console.error('Error creating non-conformity:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating non-conformity' },
      { status: 500 }
    )
  }
}
