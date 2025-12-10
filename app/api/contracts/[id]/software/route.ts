import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/contracts/[id]/software - List software for contract
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const softwares = await prisma.contract_softwares.findMany({
      where: {
        contract_id: id,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json({ softwares })
  } catch (error: any) {
    console.error('Error fetching softwares:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/contracts/[id]/software - Create new software
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, main_features, provider_id, link } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const software = await prisma.contract_softwares.create({
      data: {
        contract_id: id,
        name,
        description: description || null,
        main_features: main_features || null,
        provider_id: provider_id || null,
        link: link || null,
        created_by: authResult.user.id,
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

    return NextResponse.json({ software }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating software:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
