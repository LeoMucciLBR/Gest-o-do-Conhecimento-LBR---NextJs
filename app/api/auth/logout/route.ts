import { NextRequest, NextResponse } from 'next/server'
import { validateSession, revokeSession } from '@/lib/services/sessionManager'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (sessionToken) {
      // Primeiro validamos para obter o ID da sessão
      const session = await validateSession(sessionToken)
      if (session) {
        await revokeSession(session.sessionId)
      }
    }

    cookieStore.delete('sid')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
