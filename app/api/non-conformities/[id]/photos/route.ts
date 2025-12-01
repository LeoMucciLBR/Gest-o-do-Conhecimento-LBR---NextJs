import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST /api/non-conformities/[id]/photos
export async function POST(
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

    // Verify non-conformity exists
    const nc = await prisma.obra_non_conformities.findUnique({
      where: { id: nonConformityId },
    })

    if (!nc) {
      return NextResponse.json({ error: 'Non-conformity not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = formData.get('caption') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const storageUrl = `data:${file.type};base64,${base64}`

    const photo = await prisma.non_conformity_photos.create({
      data: {
        non_conformity_id: nonConformityId,
        user_id: session.users.id,
        filename: file.name,
        content_type: file.type,
        storage_url: storageUrl,
        caption: caption || null,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error.message || 'Error uploading photo' },
      { status: 500 }
    )
  }
}
