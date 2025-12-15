import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { logPessoaAddToEmpresa, logPessoaRemoveFromEmpresa } from '@/lib/services/auditLogger'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/empresas/[id]/pessoas - List all people from an empresa
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params

    // Check if empresa exists
    const empresa = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nome, tipo FROM empresas WHERE id = $1::uuid
    `, id)

    if (empresa.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Get all people from this empresa
    const pessoas = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, full_name, email, phone, office, role, created_at
      FROM people
      WHERE empresa_id = $1::uuid
      ORDER BY full_name ASC
    `, id)

    return NextResponse.json({ 
      empresa: empresa[0],
      pessoas 
    })
  } catch (error) {
    console.error('Error fetching pessoas:', error)
    return NextResponse.json({ error: 'Erro ao buscar pessoas' }, { status: 500 })
  }
}

// POST /api/empresas/[id]/pessoas - Add a new person to an empresa
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { full_name, email, phone, role } = body

    // Validation
    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Check if empresa exists
    const empresa = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nome FROM empresas WHERE id = $1::uuid
    `, id)

    if (empresa.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Create person
    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO people (empresa_id, full_name, email, phone, role)
      VALUES ($1::uuid, $2, $3, $4, $5)
      RETURNING id, full_name, email, phone, role, created_at
    `, id, full_name.trim(), email?.trim() || null, phone?.trim() || null, role?.trim() || null)

    const newPessoa = result[0]

    // Log the action
    await logPessoaAddToEmpresa(
      newPessoa.id,
      id,
      session.user.id,
      { pessoaNome: newPessoa.full_name, empresaNome: empresa[0].nome },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({ pessoa: newPessoa }, { status: 201 })
  } catch (error) {
    console.error('Error creating pessoa:', error)
    return NextResponse.json({ error: 'Erro ao criar pessoa' }, { status: 500 })
  }
}

// DELETE method to remove a person from empresa
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const pessoaId = searchParams.get('pessoaId')

    if (!pessoaId) {
      return NextResponse.json({ error: 'ID da pessoa é obrigatório' }, { status: 400 })
    }

    // Get pessoa and empresa info for logging
    const pessoa = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p.id, p.full_name, e.nome as empresa_nome
      FROM people p
      JOIN empresas e ON e.id = p.empresa_id
      WHERE p.id = $1::uuid AND p.empresa_id = $2::uuid
    `, pessoaId, id)

    // Remove pessoa from empresa (set empresa_id to null instead of deleting)
    await prisma.$queryRawUnsafe(`
      UPDATE people SET empresa_id = NULL WHERE id = $1::uuid AND empresa_id = $2::uuid
    `, pessoaId, id)

    // Log the action
    if (pessoa.length > 0) {
      await logPessoaRemoveFromEmpresa(
        pessoaId,
        id,
        session.user.id,
        { pessoaNome: pessoa[0].full_name, empresaNome: pessoa[0].empresa_nome },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing pessoa:', error)
    return NextResponse.json({ error: 'Erro ao remover pessoa' }, { status: 500 })
  }
}

