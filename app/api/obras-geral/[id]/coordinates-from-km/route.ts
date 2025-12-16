import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const km = searchParams.get('km')

    if (!km) {
      return NextResponse.json({ error: 'KM parameter is required' }, { status: 400 })
    }

    const kmValue = parseFloat(km)
    if (isNaN(kmValue)) {
      return NextResponse.json({ error: 'Invalid KM value' }, { status: 400 })
    }

    // Get obra with its geometry
    // Get obra with its geometry using raw query since Prisma doesn't support PostGIS geometry directly
    const obras: any[] = await prisma.$queryRaw`
      SELECT id, km_inicio, km_fim, ST_AsGeoJSON(geometria) as geometria
      FROM obras
      WHERE id = ${parseInt(id)}
    `
    const obra = obras[0]

    if (!obra) {
      return NextResponse.json({ error: 'Obra not found' }, { status: 404 })
    }

    // Validate KM is within range
    const kmInicio = Number(obra.km_inicio)
    const kmFim = Number(obra.km_fim)
    
    if (kmValue < kmInicio || kmValue > kmFim) {
      return NextResponse.json({ 
        error: `KM must be between ${kmInicio} and ${kmFim}` 
      }, { status: 400 })
    }

    // Simple approach: Use the obra's own geometry
    // Calculate the fraction along the line for this KM
    const fraction = (kmValue - kmInicio) / (kmFim - kmInicio)

    // Use PostGIS to get the point at this fraction along the geometry
    const query = `
      SELECT 
        ST_AsGeoJSON(
          ST_LineInterpolatePoint(
            ST_GeomFromGeoJSON($1),
            $2
          )
        ) as point
    `

    const result: any[] = await prisma.$queryRawUnsafe(
      query,
      JSON.stringify(obra.geometria),
      fraction
    )

    if (result && result.length > 0 && result[0].point) {
      const point = JSON.parse(result[0].point)
      if (point.coordinates) {
        return NextResponse.json({
          latitude: point.coordinates[1],
          longitude: point.coordinates[0],
          km: kmValue
        })
      }
    }

    return NextResponse.json({ error: 'Could not calculate coordinates for this KM' }, { status: 404 })

  } catch (error: any) {
    console.error('Error calculating coordinates from KM:', error)
    return NextResponse.json(
      { error: error.message || 'Error calculating coordinates' },
      { status: 500 }
    )
  }
}
