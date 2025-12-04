import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // TODO: Adicionar verificação de permissão de admin
    
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    const where = userId 
      ? { user_id: userId, is_active: true }
      : { is_active: true }

    const sessions = await prisma.sessions.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true,
          }
        }
      },
      orderBy: { last_activity: 'desc' },
    })

    // Formatar resposta
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userId: session.user_id,
      user: session.users, // Correção: o campo é 'users' (plural) no Prisma
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      location: session.location,
      lastActivity: session.last_activity,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      isCurrent: false, // TODO: Comparar com token atual se necessário
    }))

    return NextResponse.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sessões' },
      { status: 500 }
    )
  }
}
