import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

/**
 * POST /api/contracts/[id]/mark-read
 * Marca todas as notificações de um contrato como lidas para o usuário atual
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Autenticação obrigatória
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: contractId } = await context.params
    const userId = authResult.user.id

    // Verificar se o contrato existe
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId },
      select: { id: true },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Marcar notificações como lidas
    const result = await prisma.contract_notifications.updateMany({
      where: {
        contract_id: contractId,
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar notificações como lidas' },
      { status: 500 }
    )
  }
}
