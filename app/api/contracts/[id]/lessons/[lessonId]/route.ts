'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// PUT /api/contracts/[id]/lessons/[lessonId] - Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id, lessonId } = await params
    const body = await request.json()

    const { type, title, description } = body

    if (type && !['DIFICULDADE', 'APRENDIZADO'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use DIFICULDADE ou APRENDIZADO' },
        { status: 400 }
      )
    }

    if (title !== undefined && !title?.trim()) {
      return NextResponse.json(
        { error: 'Título não pode estar vazio' },
        { status: 400 }
      )
    }

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE contract_lessons 
      SET 
        type = COALESCE($1, type),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        updated_at = NOW()
      WHERE id = $4::uuid AND contract_id = $5::uuid
      RETURNING id, type, title, description, created_at, updated_at
    `, type || null, title?.trim() || null, description?.trim(), lessonId, id)

    if (!result.length) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lesson: result[0] })
  } catch (error: any) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar registro' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[id]/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id, lessonId } = await params

    const result = await prisma.$queryRawUnsafe<any[]>(`
      DELETE FROM contract_lessons 
      WHERE id = $1::uuid AND contract_id = $2::uuid
      RETURNING id
    `, lessonId, id)

    if (!result.length) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir registro' },
      { status: 500 }
    )
  }
}
