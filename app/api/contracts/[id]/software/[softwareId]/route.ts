import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/contracts/[id]/software/[softwareId] - Get software details
export async function GET(
  request: Request,
  { params }: { params: { softwareId: string } }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { softwareId } = await params
    const software = await prisma.contract_softwares.findUnique({
      where: {
        id: softwareId,
      },
      include: {
        provider: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true,
          },
        },
        comments: {
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
        },
      },
    })

    if (!software) {
      return NextResponse.json({ error: 'Software não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ software })
  } catch (error: any) {
    console.error('Error fetching software:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/contracts/[id]/software/[softwareId] - Update software
export async function PUT(
  request: Request,
  { params }: { params: { softwareId: string } }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { softwareId } = await params
    const body = await request.json()
    const { name, description, main_features, provider_id, link } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const software = await prisma.contract_softwares.update({
      where: { id: softwareId },
      data: {
        name,
        description: description || null,
        main_features: main_features || null,
        provider_id: provider_id || null,
        link: link || null,
      },
      include: {
        provider: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ software })
  } catch (error: any) {
    console.error('Error updating software:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/contracts/[id]/software/[softwareId] - Delete software
export async function DELETE(
  request: Request,
  { params }: { params: { softwareId: string } }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { softwareId } = await params
    await prisma.contract_softwares.delete({
      where: { id: softwareId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting software:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
