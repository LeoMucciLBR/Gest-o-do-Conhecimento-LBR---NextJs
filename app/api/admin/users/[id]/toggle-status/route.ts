import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { requireAdmin } from '@/lib/auth/admin'

// PATCH /api/admin/users/[id]/toggle-status - Toggle user active status
export async function PATCH(
  request: NextRequest,
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

    // Require admin role
    try {
      requireAdmin(session)
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current status
    const user = await prisma.users.findUnique({
      where: { id },
      select: { is_active: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle status
    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        is_active: !user.is_active
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return NextResponse.json(
      { error: error.message || 'Error toggling user status' },
      { status: 500 }
    )
  }
}
