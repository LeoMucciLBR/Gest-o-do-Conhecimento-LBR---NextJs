import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        picture_url: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}
