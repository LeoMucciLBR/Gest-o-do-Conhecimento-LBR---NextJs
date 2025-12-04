import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

// DELETE /api/non-conformities/photos/[id]
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
    const photoId = id
    if (!photoId) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Check if exists
    const photo = await prisma.non_conformity_photos.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from DB
    await prisma.non_conformity_photos.delete({
      where: { id: photoId },
    })

    // TODO: Delete from storage (if implemented)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting photo' },
      { status: 500 }
    )
  }
}
