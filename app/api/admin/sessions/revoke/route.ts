import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/services/sessionManager'
import { auditLogin } from '@/lib/auth/audit'

export async function POST(request: NextRequest) {
  try {
    // TODO: Adicionar verificação de permissão de admin

    const body = await request.json()
    const { sessionId, userId, reason } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    await revokeSession(sessionId)

    // Logar a ação de logout forçado
    if (userId) {
      await auditLogin({
        userId,
        success: true,
        reason: reason || 'Admin revoked session (FORCED_LOGOUT)',
        ip: request.headers.get('x-forwarded-for') || (request as any).ip || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        provider: 'local'
      })
    }

    return NextResponse.json({ message: 'Sessão revogada com sucesso' })
  } catch (error) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: 'Erro ao revogar sessão' },
      { status: 500 }
    )
  }
}
