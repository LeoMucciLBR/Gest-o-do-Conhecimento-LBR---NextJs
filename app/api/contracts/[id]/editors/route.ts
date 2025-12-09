import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { canManageEditors, getContractEditors } from '@/lib/auth/contractAuth'
import { logEditorAdded, logEditorRemoved } from '@/lib/services/auditLogger'

// GET /api/contracts/[id]/editors - List contract editors
export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    // Check if contract exists
    const contract = await prisma.contracts.findUnique({ where: { id } })
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Get list of editors
    const editors = await getContractEditors(id)

    // Also include the contract creator
    const creator = contract.created_by
      ? await prisma.users.findUnique({
          where: { id: contract.created_by },
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true,
          }
        })
      : null

    return NextResponse.json({
      creator,
      editors,
      total: editors.length
    })
  } catch (error: any) {
    console.error('Get editors error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar editores' },
      { status: 500 }
    )
  }
}

// POST /api/contracts/[id]/editors - Add editor to contract
export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Check if contract exists
    const contract = await prisma.contracts.findUnique({ where: { id } })
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Check if user has permission to manage editors
    const hasPermission = await canManageEditors(
      authResult.user.id,
      authResult.user.role,
      id
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para gerenciar editores deste contrato. Apenas o criador ou administradores podem gerenciar editores.' },
        { status: 403 }
      )
    }

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check if user is already an editor
    const existingEditor = await prisma.contract_editors.findFirst({
      where: {
        contract_id: id,
        user_id: userId
      }
    })

    if (existingEditor) {
      return NextResponse.json(
        { error: 'Este usuário já é um editor deste contrato' },
        { status: 400 }
      )
    }

    // Check if user is the creator (creator doesn't need to be added as editor)
    if (contract.created_by === userId) {
      return NextResponse.json(
        { error: 'O criador do contrato já possui permissões completas' },
        { status: 400 }
      )
    }

    // Add editor
    const editor = await prisma.contract_editors.create({
      data: {
        contract_id: id,
        user_id: userId,
        added_by: authResult.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true
          }
        }
      }
    })

    // Log the addition
    await logEditorAdded(
      id,
      userId,
      authResult.user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      message: 'Editor adicionado com sucesso',
      editor
    }, { status: 201 })
  } catch (error: any) {
    console.error('Add editor error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar editor' },
      { status: 400 }
    )
  }
}

// DELETE /api/contracts/[id]/editors - Remove editor from contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório como query parameter' },
        { status: 400 }
      )
    }

    // Check if contract exists
    const contract = await prisma.contracts.findUnique({ where: { id } })
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Check if user has permission to manage editors
    const hasPermission = await canManageEditors(
      authResult.user.id,
      authResult.user.role,
      id
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para gerenciar editores deste contrato. Apenas o criador ou administradores podem gerenciar editores.' },
        { status: 403 }
      )
    }

    // Find the editor
    const editor = await prisma.contract_editors.findFirst({
      where: {
        contract_id: id,
        user_id: userId
      }
    })

    if (!editor) {
      return NextResponse.json(
        { error: 'Este usuário não é um editor deste contrato' },
        { status: 404 }
      )
    }

    // Remove editor
    await prisma.contract_editors.delete({
      where: {
        id: editor.id
      }
    })

    // Log the removal
    await logEditorRemoved(
      id,
      userId,
      authResult.user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      message: 'Editor removido com sucesso'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Remove editor error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao remover editor' },
      { status: 400 }
    )
  }
}
