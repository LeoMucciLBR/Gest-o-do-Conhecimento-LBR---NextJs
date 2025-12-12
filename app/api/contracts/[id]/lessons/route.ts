'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/contracts/[id]/lessons - List all lessons for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    const lessons = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        l.id,
        l.type,
        l.title,
        l.description,
        l.created_at,
        l.updated_at,
        l.created_by,
        u.name as creator_name
      FROM contract_lessons l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.contract_id = $1::uuid
      ORDER BY l.created_at DESC
    `, id)

    return NextResponse.json({ lessons })
  } catch (error: any) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar registros' },
      { status: 500 }
    )
  }
}

// POST /api/contracts/[id]/lessons - Create new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params
    const body = await request.json()

    const { type, title, description } = body

    if (!type || !['DIFICULDADE', 'APRENDIZADO'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use DIFICULDADE ou APRENDIZADO' },
        { status: 400 }
      )
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO contract_lessons (contract_id, type, title, description, created_by)
      VALUES ($1::uuid, $2, $3, $4, $5::uuid)
      RETURNING id, type, title, description, created_at, updated_at
    `, id, type, title.trim(), description?.trim() || null, authResult.user.id)

    return NextResponse.json({ lesson: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar registro' },
      { status: 500 }
    )
  }
}
