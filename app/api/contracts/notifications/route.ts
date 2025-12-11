import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

/**
 * GET /api/contracts/notifications
 * Retorna lista de notificações não lidas do usuário atual
 */
export async function GET(request: NextRequest) {
  // Autenticação obrigatória
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const userId = authResult.user.id
    const { searchParams } = new URL(request.url)
    const includeRead = searchParams.get('includeRead') === 'true'

    // Buscar notificações
    const notifications = await prisma.contract_notifications.findMany({
      where: {
        user_id: userId,
        ...(includeRead ? {} : { is_read: false }),
      },
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50, // Limitar para evitar sobrecarga
    })

    const items = notifications.map((n) => ({
      id: n.id,
      contractId: n.contract_id,
      contractName: n.contract.name,
      contractStatus: n.contract.status,
      notificationType: n.type,
      isRead: n.is_read,
      createdAt: n.created_at.toISOString(),
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}
