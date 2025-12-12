'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAuthorized } from '@/lib/auth/session'

// GET /api/empresas - List all empresas with optional type filter
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'CONTRATANTE' | 'SOCIO' | null (all)
    const ativo = searchParams.get('ativo') !== 'false' // default true
    const search = searchParams.get('search') || ''

    // Build WHERE clause
    let whereClause = 'WHERE ativo = $1'
    const params: any[] = [ativo]
    let paramIndex = 2

    if (tipo && (tipo === 'CONTRATANTE' || tipo === 'SOCIO')) {
      whereClause += ` AND tipo = $${paramIndex}::tipo_empresa`
      params.push(tipo)
      paramIndex++
    }

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramIndex} OR cnpj ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    const empresas = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nome, cnpj, tipo, ativo, created_at, updated_at
      FROM empresas
      ${whereClause}
      ORDER BY nome ASC
    `, ...params)

    return NextResponse.json({ empresas })
  } catch (error) {
    console.error('Error fetching empresas:', error)
    return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 })
  }
}

// POST /api/empresas - Create new empresa
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only ADMIN or GESTOR can create
    const authorized = await isAuthorized(['ADMIN', 'GESTOR'])
    if (!authorized) {
      return NextResponse.json({ error: 'Sem permissão para criar empresas' }, { status: 403 })
    }

    const body = await request.json()
    const { nome, cnpj, tipo } = body

    // Validation
    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!tipo || !['CONTRATANTE', 'SOCIO'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser CONTRATANTE ou SOCIO' }, { status: 400 })
    }

    // Check for duplicate CNPJ if provided
    if (cnpj && cnpj.trim()) {
      const existing = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM empresas WHERE cnpj = $1
      `, cnpj.trim())

      if (existing.length > 0) {
        return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 400 })
      }
    }

    // Create empresa
    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO empresas (nome, cnpj, tipo)
      VALUES ($1, $2, $3::tipo_empresa)
      RETURNING id, nome, cnpj, tipo, ativo, created_at, updated_at
    `, nome.trim(), cnpj?.trim() || null, tipo)

    return NextResponse.json({ empresa: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating empresa:', error)
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}
