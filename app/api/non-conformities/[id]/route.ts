import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

// DELETE /api/non-conformities/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const session = await validateSession(sessionToken)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const nonConformityId = id
    if (!nonConformityId) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Check if exists
    const nc = await prisma.obra_non_conformities.findUnique({
      where: { id: nonConformityId },
    })

    if (!nc) {
      return NextResponse.json({ error: 'Non-conformity not found' }, { status: 404 })
    }

    // Delete
    await prisma.obra_non_conformities.delete({
      where: { id: nonConformityId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting non-conformity:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting non-conformity' },
      { status: 500 }
    )
  }
}
