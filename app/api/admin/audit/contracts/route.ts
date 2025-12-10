import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin permission check
    
    const searchParams = request.nextUrl.searchParams
    const contractId = searchParams.get('contractId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (contractId) where.contract_id = contractId
    if (userId) where.user_id = userId
    if (action) where.action = action
    if (entityType) where.entity_type = entityType

    // Fetch total count
    const total = await prisma.contract_audit_log.count({ where })

    // Fetch logs with user and contract information
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
        },
        contract: {
          select: {
            id: true,
            name: true,
            sector: true
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
    console.error('Error fetching contract audit logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract audit logs' },
      { status: 500 }
    )
  }
}
