import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { getBlockedUsers, unblockUser } from '@/lib/security/emailBlocker'

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

    const blockedUsers = await getBlockedUsers()

    return NextResponse.json(blockedUsers)
  } catch (error: any) {
    console.error('Error fetching blocked users:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching blocked users' },
      { status: 500 }
    )
  }
}
