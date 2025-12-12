import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { removeFromWhitelist } from '@/lib/security/ipBlocker'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const whitelistId = id

    // Buscar IP antes de deletar
    const whitelistEntry = await prisma.whitelisted_ips.findUnique({
      where: { id: whitelistId },
    })

    if (!whitelistEntry) {
      return NextResponse.json({ error: 'Whitelisted IP not found' }, { status: 404 })
    }

    // Remover
    await removeFromWhitelist(whitelistEntry.ip_address)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing from whitelist:', error)
    return NextResponse.json(
      { error: error.message || 'Error removing from whitelist' },
      { status: 500 }
    )
  }
}
