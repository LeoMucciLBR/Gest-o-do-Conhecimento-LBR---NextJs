import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { prisma } from '@/lib/prisma'

// GET /api/contracts/[id]/audit - Fetch audit logs for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: contractId } = await params

    // Verify contract exists
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // Filter by action type
    const userId = searchParams.get('user') // Filter by user
    const entityType = searchParams.get('entity') // Filter by entity type
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      contract_id: contractId
    }
    
    if (action) where.action = action
    if (userId) where.user_id = userId
    if (entityType) where.entity_type = entityType

    // Fetch total count
    const total = await prisma.contract_audit_log.count({ where })

    // Fetch logs with user information
    const logs = await prisma.contract_audit_log.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Convert BigInt to string for JSON serialization
    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString()
    }))

    return NextResponse.json({ 
      logs: serializedLogs, 
      total,
      hasMore: offset + logs.length < total
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
