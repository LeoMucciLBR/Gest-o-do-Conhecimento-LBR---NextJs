import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/contracts/[id]/software/[softwareId]/comments - List comments
export async function GET(
  request: NextRequest,
  { params }: { params: { softwareId: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { softwareId } = await params
    const comments = await prisma.software_comments.findMany({
      where: {
        software_id: softwareId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json({ comments })
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/contracts/[id]/software/[softwareId]/comments - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: { softwareId: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { softwareId } = await params
    const body = await request.json()
    const { comment: commentText } = body

    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ error: 'Comentário não pode estar vazio' }, { status: 400 })
    }

    const comment = await prisma.software_comments.create({
      data: {
        software_id: softwareId,
        user_id: authResult.user.id,
        comment: commentText.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true,
          },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
