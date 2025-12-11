import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { unblockUser } from '@/lib/security/emailBlocker'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: blockId } = await params

    // Buscar email before deleting
    const blockedEntry = await prisma.blocked_users.findUnique({
      where: { id: blockId },
    })

    if (!blockedEntry) {
      return NextResponse.json({ error: 'Blocked user not found' }, { status: 404 })
    }

    // Desbloquear
    await unblockUser(blockedEntry.email)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error unblocking user:', error)
    return NextResponse.json(
      { error: error.message || 'Error unblocking user' },
      { status: 500 }
    )
  }
}
