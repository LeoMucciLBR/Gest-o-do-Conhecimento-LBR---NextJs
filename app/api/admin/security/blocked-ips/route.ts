import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'
import { getBlockedIps, blockIp, unblockIp } from '@/lib/security/ipBlocker'

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

    const blockedIps = await getBlockedIps()

    return NextResponse.json(blockedIps)
  } catch (error: any) {
    console.error('Error fetching blocked IPs:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching blocked IPs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { ip_address, reason } = body

    if (!ip_address) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 })
    }

    await blockIp(ip_address, reason || 'Blocked by admin', session.user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error blocking IP:', error)
    return NextResponse.json(
      { error: error.message || 'Error blocking IP' },
      { status: 500 }
    )
  }
}
