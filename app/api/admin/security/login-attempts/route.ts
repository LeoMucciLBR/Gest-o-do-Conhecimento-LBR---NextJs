import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      requireAdmin(session)
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Buscar últimas 100 tentativas de login
    const attempts = await prisma.login_attempts.findMany({
      orderBy: { attempted_at: 'desc' },
      take: 100,
    })

    return NextResponse.json(attempts)
  } catch (error: any) {
    console.error('Error fetching login attempts:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching login attempts' },
      { status: 500 }
    )
  }
}
