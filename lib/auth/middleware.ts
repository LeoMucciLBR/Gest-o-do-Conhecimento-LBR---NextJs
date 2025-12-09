import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/services/sessionManager'
import { cookies } from 'next/headers'

export async function requireAuth(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('sid')?.value

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Autenticação necessária' },
      { status: 401 }
    )
  }

  const session = await validateSession(sessionToken)

  if (!session) {
    return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? undefined,
      photoUrl: session.user.picture_url ?? undefined,
      role: session.user.role || 'user',
    },
  }
}
