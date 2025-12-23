import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

// GET /api/equipe/[id]/contracts - Lista contratos que o membro participa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Buscar a ficha para pegar o nome
    const ficha = await prisma.fichas.findUnique({
      where: { id },
      select: { nome: true }
    })

    if (!ficha) {
      return NextResponse.json({ contracts: [] })
    }

    // Buscar pessoas com nome similar
    const people = await prisma.people.findMany({
      where: {
        full_name: {
          contains: ficha.nome || '',
          mode: 'insensitive'
        }
      },
      select: { id: true }
    })

    if (people.length === 0) {
      return NextResponse.json({ contracts: [] })
    }

    const personIds = people.map(p => p.id)

    // Buscar participações em contratos
    const participations = await prisma.contract_participants.findMany({
      where: {
        person_id: { in: personIds }
      },
      select: {
        role: true,
        custom_role: true,
        contract: {
          select: {
            id: true,
            name: true,
            object: true,
            status: true,
            organization: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Formatar resposta
    const contracts = participations.map(p => ({
      id: p.contract.id,
      name: p.contract.name,
      object: p.contract.object,
      status: p.contract.status,
      organization: p.contract.organization,
      role: p.custom_role || p.role
    }))

    // Ordenar: ativos primeiro
    contracts.sort((a, b) => {
      if (a.status === 'Ativo' && b.status !== 'Ativo') return -1
      if (a.status !== 'Ativo' && b.status === 'Ativo') return 1
      return 0
    })

    return NextResponse.json({ contracts })
  } catch (error: any) {
    console.error('Error fetching member contracts:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching contracts' },
      { status: 500 }
    )
  }
}
