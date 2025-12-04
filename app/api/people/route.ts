import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const searchParams = request.nextUrl.searchParams
  const searchTerm = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const tipo = searchParams.get('tipo') || ''

  // Allow empty search only when tipo filter is present (to fetch all internal/external people)
  if (!searchTerm.trim() && !tipo) {
    return NextResponse.json({ people: [] })
  }

  try {
    // Fetch from people table only if no role/tipo filter
    let peopleList: any[] = []
    if (!role && !tipo) {
      peopleList = await prisma.people.findMany({
        where: {
          OR: [
            { full_name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          office: true,
        },
        take: 20,
      })
    }

    // Build where clause for fichas
    const fichasWhere: any = {}
    
    // Only add search filter if searchTerm is not empty
    if (searchTerm.trim()) {
      fichasWhere.OR = [
        { nome: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }

    // Add role filter if specified
    if (role) {
      fichasWhere.cargo_cliente = role
    }

    // Add tipo filter if specified
    if (tipo) {
      // @ts-ignore
      fichasWhere.tipo = tipo
    }

    // Fetch from fichas table
    // @ts-ignore
    const fichasList = await prisma.fichas.findMany({
      where: fichasWhere,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        celular: true,
        profissao: true,
        // @ts-ignore
        tipo: true,
        // @ts-ignore
        cargo_cliente: true,
      },
      take: 20,
    })

    // Combine and normalize results
    const combined = [
      ...peopleList.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        office: p.office,
        source: 'people',
      })),
      ...fichasList.map((f: any) => ({
        id: f.id,
        full_name: f.nome,
        nome: f.nome,
        email: f.email,
        phone: f.celular || f.telefone,
        celular: f.celular,
        telefone: f.telefone,
        profissao: f.profissao,
        source: 'fichas',
      })),
    ]

    return NextResponse.json({ people: combined })
  } catch (error: any) {
    console.error('Error fetching people:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
