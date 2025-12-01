import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'

// GET /api/fichas - List all fichas with filters
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (profissao) {
      where.profissao = { contains: profissao, mode: 'insensitive' }
    }

    // Get fichas
    const [fichas, total] = await Promise.all([
      // @ts-ignore - Prisma types not fully regenerated
      prisma.fichas.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          celular: true,
          profissao: true,
          foto_perfil_url: true,
          tipo: true,
          cargo_cliente: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.fichas.count({ where })
    ])

    return NextResponse.json({
      fichas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching fichas:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching fichas' },
      { status: 500 }
    )
  }
}

// POST /api/fichas - Create new ficha
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      tipo,
      cargo_cliente,
      nome,
      email,
      telefone,
      celular,
      cpf,
      rg,
      data_nascimento,
      nacionalidade,
      estado_civil,
      genero,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      profissao,
      especialidades,
      registro_profissional,
      resumo_profissional,
      idiomas,
      formacoes,
      experiencias,
      certificados,
      foto_perfil_url,
      observacoes
    } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Create ficha
    // @ts-ignore - Prisma types not yet regenerated with new fields
    const ficha = await prisma.fichas.create({
      data: {
        id: crypto.randomUUID(),
        tipo: tipo || 'INTERNA',
        cargo_cliente: cargo_cliente || null,
        nome,
        email,
        telefone,
        celular,
        cpf,
        rg,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
        nacionalidade,
        estado_civil,
        genero,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        profissao,
        especialidades,
        registro_profissional,
        resumo_profissional,
        idiomas,
        formacoes: formacoes || [],
        experiencias: experiencias || [],
        certificados: certificados || [],
        foto_perfil_url,
        observacoes
      }
    })

    return NextResponse.json(ficha, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ficha:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating ficha' },
      { status: 500 }
    )
  }
}
