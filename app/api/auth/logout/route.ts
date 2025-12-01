import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (sessionToken) {
      await revokeSession(sessionToken)
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
