import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { unblockIp } from '@/lib/security/ipBlocker'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const blockId = params.id

    // Buscar IP antes de deletar
    const blockedEntry = await prisma.blocked_ips.findUnique({
      where: { id: blockId },
    })

    if (!blockedEntry) {
      return NextResponse.json({ error: 'Blocked IP not found' }, { status: 404 })
    }

    // Desbloquear
    await unblockIp(blockedEntry.ip_address)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error unblocking IP:', error)
    return NextResponse.json(
      { error: error.message || 'Error unblocking IP' },
      { status: 500 }
    )
  }
}
