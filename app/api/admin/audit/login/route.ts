import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin permission check
    
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const success = searchParams.get('success')
    const actionType = searchParams.get('actionType') // LOGIN, LOGOUT, PASSWORD_CHANGE
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (userId) where.user_id = userId
    if (success !== null && success !== undefined) {
      where.success = success === 'true'
    }
    if (actionType) where.action_type = actionType

    // Fetch total count
    const total = await prisma.login_audit.count({ where })

    // Fetch logs with user information
    const logs = await prisma.login_audit.findMany({
      where,
      include: {
        users: {
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
      id: log.id.toString(),
      user: log.users
    }))

    return NextResponse.json({ 
      logs: serializedLogs, 
      total,
      hasMore: offset + logs.length < total
    })
  } catch (error: any) {
    console.error('Error fetching login audit logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch login audit logs' },
      { status: 500 }
    )
  }
}
