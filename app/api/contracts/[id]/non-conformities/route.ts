import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'

// GET /api/contracts/[id]/non-conformities
export async function GET(
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
    const contractId = id

    const nonConformities = await prisma.obra_non_conformities.findMany({
      where: {
        obra: {
          contract_id: contractId
        }
      },
      include: {
        obra: {
          select: {
            id: true,
            nome: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        photos: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(nonConformities)
  } catch (error: any) {
    console.error('Error fetching contract non-conformities:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching non-conformities' },
      { status: 500 }
    )
  }
}
