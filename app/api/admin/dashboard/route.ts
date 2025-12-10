import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  // Check authentication and admin role
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  // Verify admin role
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem acessar.' },
      { status: 403 }
    )
  }

  try {
    // Calculate timestamp for 24 hours ago
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Fetch all statistics in parallel
    const [
      totalUsers,
      activeUsers,
      totalContracts,
      activeSessions,
      recentAuditLogs,
      recentLoginLogs,
      latestActivity
    ] = await Promise.all([
      // Total users
      prisma.users.count({
        where: { is_active: true }
      }),

      // Active users (users with active sessions)
      prisma.users.count({
        where: {
          sessions: {
            some: {
              expires_at: { gt: new Date() }
            }
          }
        }
      }),

      // Total contracts (not deleted)
      prisma.contracts.count({
        where: { is_deleted: false }
      }),

      // Active sessions
      prisma.sessions.count({
        where: {
          expires_at: { gt: new Date() }
        }
      }),

      // Recent audit logs (last 24h)
      prisma.contract_audit_log.count({
        where: {
          created_at: { gte: last24h }
        }
      }),

      // Recent login logs (last 24h)
      prisma.login_audit.count({
        where: {
          created_at: { gte: last24h }
        }
      }),

      // Latest activity (combined audit and login logs)
      Promise.all([
        prisma.contract_audit_log.findMany({
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                picture_url: true
              }
            },
            contract: {
              select: {
                name: true
              }
            }
          }
        }),
        prisma.login_audit.findMany({
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            users: {
              select: {
                name: true,
                email: true,
                picture_url: true
              }
            }
          }
        })
      ])
    ])

    // Combine and sort latest activity
    const [contractLogs, loginLogs] = latestActivity
    const combinedActivity = [
      ...contractLogs.map((log: any) => ({
        id: `contract-${log.id}`,
        type: 'contract' as const,
        action: log.action,
        created_at: log.created_at,
        user: log.user,
        contract: log.contract
      })),
      ...loginLogs.map((log: any) => ({
        id: `login-${log.id}`,
        type: 'login' as const,
        action: log.action_type,
        created_at: log.created_at,
        user: log.users,
        success: log.success
      }))
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers
      },
      contracts: {
        total: totalContracts
      },
      sessions: {
        active: activeSessions
      },
      activity: {
        last24h: recentAuditLogs + recentLoginLogs,
        auditLogs: recentAuditLogs,
        loginLogs: recentLoginLogs
      },
      recentActivity: combinedActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas do dashboard' },
      { status: 500 }
    )
  }
}
