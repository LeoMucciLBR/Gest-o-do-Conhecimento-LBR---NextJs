import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/software/providers - List all providers
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const providers = await prisma.software_providers.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ providers })
  } catch (error: any) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/software/providers - Create new provider
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { name, email, phone, website } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const provider = await prisma.software_providers.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
      },
    })

    return NextResponse.json({ provider }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
