import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/services/sessionManager'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const result = await validateSession(sessionToken)

    if (!result) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const { user } = result

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        photoUrl: user.picture_url ?? undefined,
      },
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
