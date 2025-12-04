import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/rodovias - List highways optionally filtered by UF
export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const uf = searchParams.get('uf')
    const tipo = searchParams.get('tipo')

    const where: any = {}
    if (uf) where.uf = uf
    if (tipo) where.tipo = tipo

    const rodovias = await prisma.rodovias.findMany({
      where,
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        codigo: true,
        uf: true,
        km_inicial: true,
        km_final: true,
        tipo: true,
        created_at: true,
        updated_at: true,
      },
    })

    return NextResponse.json(rodovias)
  } catch (error) {
    console.error('List rodovias error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar rodovias' },
      { status: 500 }
    )
  }
}
