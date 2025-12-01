import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session'
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
      id: session.users.id,
      email: session.users.email,
      name: session.users.name ?? undefined,
      photoUrl: session.users.picture_url ?? undefined,
    },
  }
}
