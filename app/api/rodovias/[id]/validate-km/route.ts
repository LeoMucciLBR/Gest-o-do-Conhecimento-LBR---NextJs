import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// POST /api/rodovias/[id]/validate-km - Validate if a KM range is valid for a highway
export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { km_inicio, km_fim } = await request.json()

    if (km_inicio === undefined || km_fim === undefined) {
      return NextResponse.json(
        { error: 'km_inicio e km_fim são obrigatórios' },
        { status: 400 }
      )
    }

    const kmInicio = parseFloat(km_inicio)
    const kmFim = parseFloat(km_fim)

    if (isNaN(kmInicio) || isNaN(kmFim)) {
      return NextResponse.json(
        { error: 'km_inicio e km_fim devem ser números válidos' },
        { status: 400 }
      )
    }

    if (kmInicio > kmFim) {
      return NextResponse.json(
        { error: 'km_inicio deve ser menor ou igual a km_fim' },
        { status: 400 }
      )
    }

    // Get highway info
    const rodovia = await prisma.rodovias.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nome: true,
        codigo: true,
        uf: true,
      }
    })

    if (!rodovia) {
      return NextResponse.json(
        { error: 'Rodovia não encontrada' },
        { status: 404 }
      )
    }

    // Get all segments for this highway
    const segmentos = await prisma.segmento_rodovia.findMany({
      where: {
        rodovia_codigo: rodovia.codigo,
      },
      select: {
        km_inicial: true,
        km_final: true,
      },
      orderBy: {
        km_inicial: 'asc'
      }
    })

    // If no segments, check against the main rodovia km range
    if (segmentos.length === 0) {
      const rodoviaWithKm = await prisma.rodovias.findUnique({
        where: { id: Number(id) },
        select: {
          km_inicial: true,
          km_final: true,
        }
      })

      const rodoviaKmInicio = rodoviaWithKm?.km_inicial ? parseFloat(rodoviaWithKm.km_inicial.toString()) : null
      const rodoviaKmFim = rodoviaWithKm?.km_final ? parseFloat(rodoviaWithKm.km_final.toString()) : null

      if (rodoviaKmInicio !== null && rodoviaKmFim !== null) {
        const isValid = kmInicio >= rodoviaKmInicio && kmFim <= rodoviaKmFim
        return NextResponse.json({
          valid: isValid,
          message: isValid 
            ? 'Intervalo de KM válido' 
            : `KM fora do intervalo válido. Intervalo disponível: KM ${rodoviaKmInicio.toFixed(1)} - ${rodoviaKmFim.toFixed(1)}`,
          rodovia: {
            nome: rodovia.nome,
            codigo: rodovia.codigo,
            uf: rodovia.uf,
          },
          km_range: {
            min: rodoviaKmInicio,
            max: rodoviaKmFim,
          }
        })
      }

      // No KM data available
      return NextResponse.json({
        valid: true, // Allow if no data to validate against
        message: 'Nenhum dado de KM disponível para validação',
        warning: true,
      })
    }

    // Check if the entire range [km_inicio, km_fim] is covered by segments
    // We need to verify that every point in the range is within at least one segment
    
    let currentKm = kmInicio
    let isCovered = false
    const gaps: Array<{start: number, end: number}> = []

    for (const segmento of segmentos) {
      if (!segmento.km_inicial || !segmento.km_final) continue
      
      const segInicio = parseFloat(segmento.km_inicial.toString())
      const segFim = parseFloat(segmento.km_final.toString())

      // If current position is before this segment, we have a gap
      if (currentKm < segInicio) {
        // Check if the entire requested range ends before this segment starts
        if (kmFim < segInicio) {
          // The entire range is in a gap before this segment
          gaps.push({ start: currentKm, end: kmFim })
          break
        } else {
          // Part of the range is in a gap
          gaps.push({ start: currentKm, end: segInicio })
          currentKm = segInicio
        }
      }

      // If current position is within this segment
      if (currentKm >= segInicio && currentKm <= segFim) {
        // Move current position to the end of this segment or kmFim, whichever is smaller
        currentKm = Math.min(segFim, kmFim)
        
        // If we've covered the entire requested range
        if (currentKm >= kmFim) {
          isCovered = true
          break
        }
      }
    }

    // After checking all segments, if we haven't covered the entire range
    if (!isCovered && currentKm < kmFim) {
      gaps.push({ start: currentKm, end: kmFim })
    }

    const isValid = gaps.length === 0 && (isCovered || currentKm >= kmFim)

    // Format segments for response
    const availableSegments = segmentos
      .filter(s => s.km_inicial && s.km_final)
      .map(s => ({
        km_inicial: parseFloat(s.km_inicial!.toString()),
        km_final: parseFloat(s.km_final!.toString()),
    }))

    return NextResponse.json({
      valid: isValid,
      message: isValid 
        ? 'Intervalo de KM válido' 
        : `O intervalo KM ${kmInicio.toFixed(1)} - ${kmFim.toFixed(1)} contém trechos não cadastrados`,
      rodovia: {
        nome: rodovia.nome,
        codigo: rodovia.codigo,
        uf: rodovia.uf,
      },
      gaps: gaps.length > 0 ? gaps.map(g => ({
        start: g.start.toFixed(1),
        end: g.end.toFixed(1),
        message: `KM ${g.start.toFixed(1)} a ${g.end.toFixed(1)} não existe nesta rodovia`
      })) : undefined,
      available_segments: availableSegments,
    })

  } catch (error) {
    console.error('Validate KM error:', error)
    return NextResponse.json(
      { error: 'Erro ao validar KM' },
      { status: 500 }
    )
  }
}
