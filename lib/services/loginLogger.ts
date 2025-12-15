import { prisma } from '@/lib/prisma'

// Obter localização aproximada do IP (cidade/estado)
export async function getLocationFromIP(ip: string): Promise<string | null> {
  try {
    // Usando API gratuita ipapi.co (até 1000 requests/dia)
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.city && data.region) {
      return `${data.city}, ${data.region}` // Ex: "São Paulo, SP"
    }
    
    return data.city || data.region || null
  } catch (error) {
    console.error('Error fetching IP location:', error)
    return null
  }
}

export interface LogLoginParams {
  userId?: string
  email?: string
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'FORCED_LOGOUT'
  success: boolean
  failReason?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Registrar log de acesso
export async function logLogin(params: LogLoginParams) {
  try {
    const location = params.ipAddress
      ? await getLocationFromIP(params.ipAddress)
      : null

    await prisma.login_audit.create({
      data: {
        user_id: params.userId || null,
        email_input: params.email || null,
        provider: 'email', // Using email/password auth
        success: params.success,
        reason: params.failReason || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        location: location,
        session_id: params.sessionId || null,
        action_type: params.action,
      },
    })
  } catch (error) {
    console.error('Error logging login:', error)
  }
}

// Buscar logs com filtros
export interface GetLogsFilter {
  userId?: string
  action?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export async function getLogs(filter: GetLogsFilter = {}) {
  const {
    userId,
    action,
    success,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter

  const where: any = {}

  if (userId) where.user_id = userId
  if (action) where.action_type = action
  if (success !== undefined) where.success = success
  if (startDate || endDate) {
    where.created_at = {}
    if (startDate) where.created_at.gte = startDate
    if (endDate) where.created_at.lte = endDate
  }

  const [logs, total] = await Promise.all([
    prisma.login_audit.findMany({
      where,
      include: {
        users: {
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
      take: limit,
      skip: offset,
    }),
    prisma.login_audit.count({ where }),
  ])

  return { logs, total }
}

// Obter estatísticas de login
export async function getLoginStats(userId?: string) {
  const where = userId ? { user_id: userId } : {}

  const [totalLogins, successLogins, failedLogins, uniqueIPs] =
    await Promise.all([
      prisma.login_audit.count({ where }),
      prisma.login_audit.count({
        where: { ...where, success: true },
      }),
      prisma.login_audit.count({
        where: { ...where, success: false },
      }),
      prisma.login_audit.groupBy({
        by: ['ip_address'],
        where,
        _count: true,
      }),
    ])

  return {
    totalLogins,
    successLogins,
    failedLogins,
    uniqueIPs: uniqueIPs.length,
    successRate:
      totalLogins > 0
        ? ((successLogins / totalLogins) * 100).toFixed(2)
        : '0',
  }
}
