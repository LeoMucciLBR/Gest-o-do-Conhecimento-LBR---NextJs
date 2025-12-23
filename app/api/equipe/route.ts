import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

// GET /api/equipe - Lista membros da equipe com estatísticas de contratos
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const profissao = searchParams.get('profissao') || ''

    // Build where clause - only INTERNA (team members)
    const where: any = {
      tipo: 'INTERNA'
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { profissao: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (profissao) {
      where.profissao = { contains: profissao, mode: 'insensitive' }
    }

    // Get team members (fichas do tipo INTERNA)
    const membros = await prisma.fichas.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        celular: true,
        profissao: true,
        especialidades: true,
        foto_perfil_url: true,
        area: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { nome: 'asc' }
    })

    // Get unique professions for filter
    const profissoes = await prisma.fichas.findMany({
      where: { tipo: 'INTERNA', profissao: { not: null } },
      select: { profissao: true },
      distinct: ['profissao']
    })

    // Get contract participation count for each member
    // We need to match by name since fichas.id != people.id in contract_participants
    const contractCounts = await prisma.$queryRaw<{ nome: string; count: bigint }[]>`
      SELECT f.nome, COUNT(DISTINCT cp.contract_id) as count
      FROM fichas f
      LEFT JOIN people p ON LOWER(p.full_name) = LOWER(f.nome)
      LEFT JOIN contract_participants cp ON cp.person_id = p.id
      LEFT JOIN contracts c ON c.id = cp.contract_id AND c.status = 'Ativo'
      WHERE f.tipo = 'INTERNA'
      GROUP BY f.nome
    `

    const countMap = new Map(contractCounts.map(c => [c.nome.toLowerCase(), Number(c.count)]))

    // Enhance members with contract count
    const membrosWithStats = membros.map(m => ({
      ...m,
      contractsCount: countMap.get(m.nome?.toLowerCase() || '') || 0
    }))

    // Calculate statistics
    const stats = {
      total: membros.length,
      byProfissao: profissoes.reduce((acc, p) => {
        if (p.profissao) {
          acc[p.profissao] = (acc[p.profissao] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      withActiveContracts: membrosWithStats.filter(m => m.contractsCount > 0).length
    }

    return NextResponse.json({
      membros: membrosWithStats,
      profissoes: profissoes.map(p => p.profissao).filter(Boolean),
      stats
    })
  } catch (error: any) {
    console.error('Error fetching equipe:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching equipe' },
      { status: 500 }
    )
  }
}
