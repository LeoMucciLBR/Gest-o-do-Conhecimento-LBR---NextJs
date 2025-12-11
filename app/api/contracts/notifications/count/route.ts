import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

/**
 * GET /api/contracts/notifications/count
 * Retorna contagem de notificações não lidas do usuário atual
 */
export async function GET(request: NextRequest) {
  // Autenticação obrigatória
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const userId = authResult.user.id

    // Contar notificações não lidas
    const unreadCount = await prisma.contract_notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contagem de notificações' },
      { status: 500 }
    )
  }
}
