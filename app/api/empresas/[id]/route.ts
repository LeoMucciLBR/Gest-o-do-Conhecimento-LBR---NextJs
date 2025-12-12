'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAuthorized } from '@/lib/auth/session'

type Props = {
  params: Promise<{ id: string }>
}

// GET /api/empresas/[id] - Get single empresa with linked people
export async function GET(request: NextRequest, props: Props) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await props.params

    // Get empresa
    const empresaResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nome, cnpj, tipo, ativo, created_at, updated_at
      FROM empresas
      WHERE id = $1::uuid
    `, id)

    if (empresaResult.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const empresa = empresaResult[0]

    // Get people linked to this empresa
    const pessoas = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        p.id,
        p.full_name,
        p.email,
        p.phone
      FROM people p
      WHERE p.empresa_id = $1::uuid
      ORDER BY p.full_name
    `, id)

    // Get contracts where people from this empresa are participants
    const pessoasComContratos = await prisma.$queryRawUnsafe<any[]>(`
      SELECT DISTINCT
        p.id as pessoa_id,
        p.full_name,
        p.email,
        c.id as contrato_id,
        c.name as contrato_nome
      FROM people p
      INNER JOIN contract_participants cp ON cp.person_id = p.id
      INNER JOIN contracts c ON c.id = cp.contract_id
      WHERE p.empresa_id = $1::uuid
      ORDER BY p.full_name, c.name
    `, id)

    return NextResponse.json({ 
      empresa, 
      pessoas,
      pessoasComContratos 
    })
  } catch (error) {
    console.error('Error fetching empresa:', error)
    return NextResponse.json({ error: 'Erro ao buscar empresa' }, { status: 500 })
  }
}

// PUT /api/empresas/[id] - Update empresa
export async function PUT(request: NextRequest, props: Props) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const authorized = await isAuthorized(['ADMIN', 'GESTOR'])
    if (!authorized) {
      return NextResponse.json({ error: 'Sem permissão para editar empresas' }, { status: 403 })
    }

    const { id } = await props.params
    const body = await request.json()
    const { nome, cnpj, tipo, ativo } = body

    // Validation
    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!tipo || !['CONTRATANTE', 'SOCIO'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser CONTRATANTE ou SOCIO' }, { status: 400 })
    }

    // Check for duplicate CNPJ if provided (excluding current)
    if (cnpj && cnpj.trim()) {
      const existing = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM empresas WHERE cnpj = $1 AND id != $2::uuid
      `, cnpj.trim(), id)

      if (existing.length > 0) {
        return NextResponse.json({ error: 'CNPJ já cadastrado em outra empresa' }, { status: 400 })
      }
    }

    // Update empresa
    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE empresas
      SET nome = $1, cnpj = $2, tipo = $3::tipo_empresa, ativo = $4, updated_at = NOW()
      WHERE id = $5::uuid
      RETURNING id, nome, cnpj, tipo, ativo, created_at, updated_at
    `, nome.trim(), cnpj?.trim() || null, tipo, ativo !== false, id)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ empresa: result[0] })
  } catch (error) {
    console.error('Error updating empresa:', error)
    return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 })
  }
}

// DELETE /api/empresas/[id] - Soft delete (deactivate) empresa
export async function DELETE(request: NextRequest, props: Props) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const authorized = await isAuthorized(['ADMIN'])
    if (!authorized) {
      return NextResponse.json({ error: 'Apenas administradores podem desativar empresas' }, { status: 403 })
    }

    const { id } = await props.params

    // Soft delete (set ativo = false)
    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE empresas
      SET ativo = false, updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING id, nome
    `, id)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Empresa desativada com sucesso', empresa: result[0] })
  } catch (error) {
    console.error('Error deleting empresa:', error)
    return NextResponse.json({ error: 'Erro ao desativar empresa' }, { status: 500 })
  }
}
