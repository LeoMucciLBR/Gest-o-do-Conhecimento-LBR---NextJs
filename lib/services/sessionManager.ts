import { PrismaClient } from '@prisma/client'
import { getLocationFromIP } from './loginLogger'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Configurações de sessão
const SESSION_MAX_AGE_DAYS = Number(process.env.SESSION_MAX_AGE_DAYS ?? '1') // Default: 1 dia (absoluto)
const SESSION_IDLE_TIMEOUT_MINUTES = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? '60') // Default: 60 minutos (inatividade)

export interface CreateSessionParams {
  userId: string
  userAgent?: string
  ipAddress?: string
}

// Criar nova sessão
export async function createSession(params: CreateSessionParams) {
  const { userId, userAgent, ipAddress } = params

  // Gerar token único
  const token = crypto.randomBytes(32).toString('base64url') // Usando base64url para URL-safe
  const tokenHash = crypto.createHash('sha256').update(token).digest()

  // Obter localização do IP
  const location = ipAddress ? await getLocationFromIP(ipAddress) : null

  // Expiração absoluta (máximo tempo que a sessão pode existir)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_MAX_AGE_DAYS)

  const session = await prisma.sessions.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
      location,
      is_active: true,
      last_activity: new Date(),
      expires_at: expiresAt,
    },
  })

  return { session, token }
}

// Validar sessão
export async function validateSession(token: string) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest()

    const session = await prisma.sessions.findFirst({
      where: { 
        token_hash: tokenHash,
        is_active: true, // Deve estar ativa
        revoked_at: null // Não revogada
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            is_active: true,
            picture_url: true,
          },
        },
      },
    })

    if (!session) return null

    const now = new Date()

    // 1. Verificar expiração absoluta
    if (session.expires_at < now) {
      await revokeSession(session.id)
      return null
    }

    // 2. Verificar inatividade (Idle Timeout)
    if (session.last_activity) {
      const lastActivity = new Date(session.last_activity)
      const diffMinutes = (now.getTime() - lastActivity.getTime()) / 1000 / 60
      
      if (diffMinutes > SESSION_IDLE_TIMEOUT_MINUTES) {
        await revokeSession(session.id)
        return null
      }
    }

    // 3. Verificar se usuário está ativo
    if (!session.users.is_active) {
      await revokeSession(session.id)
      return null
    }

    // Atualizar última atividade
    // Otimização: atualizar apenas se passou mais de 1 minuto para evitar writes excessivos
    const lastActivity = new Date(session.last_activity || 0)
    if ((now.getTime() - lastActivity.getTime()) > 60 * 1000) {
      await prisma.sessions.update({
        where: { id: session.id },
        data: { last_activity: now },
      })
    }

    return {
      sessionId: session.id,
      user: session.users,
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return null
  }
}

// Revogar sessão (logout)
export async function revokeSession(sessionId: string) {
  try {
    await prisma.sessions.update({
      where: { id: sessionId },
      data: {
        revoked_at: new Date(),
        is_active: false,
      },
    })
    return true
  } catch (error) {
    console.error('Error revoking session:', error)
    return false
  }
}

// Revogar todas as sessões de um usuário
export async function revokeAllUserSessions(userId: string, except?: string) {
  try {
    const where: any = {
      user_id: userId,
      is_active: true,
    }

    if (except) {
      where.id = { not: except }
    }

    await prisma.sessions.updateMany({
      where,
      data: {
        revoked_at: new Date(),
        is_active: false,
      },
    })
    return true
  } catch (error) {
    console.error('Error revoking user sessions:', error)
    return false
  }
}

// Obter sessões ativas de um usuário
export async function getUserActiveSessions(userId: string) {
  return await prisma.sessions.findMany({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: { gt: new Date() },
      revoked_at: null,
    },
    orderBy: {
      last_activity: 'desc',
    },
  })
}

// Obter todas as sessões ativas (para admin)
export async function getAllActiveSessions() {
  return await prisma.sessions.findMany({
    where: {
      is_active: true,
      expires_at: { gt: new Date() },
      revoked_at: null,
    },
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
      last_activity: 'desc',
    },
  })
}

// Limpar sessões expiradas (executar periodicamente)
export async function cleanExpiredSessions() {
  try {
    const now = new Date()
    const idleThreshold = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000)

    const result = await prisma.sessions.updateMany({
      where: {
        is_active: true,
        OR: [
          { expires_at: { lt: now } }, // Expiradas absolutamente
          { last_activity: { lt: idleThreshold } }, // Expiradas por inatividade
        ],
      },
      data: {
        is_active: false,
      },
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning expired sessions:', error)
    return 0
  }
}

// Forçar logout (admin)
export async function forceLogout(sessionId: string, adminUserId?: string) {
  try {
    const session = await prisma.sessions.findUnique({
      where: { id: sessionId },
      select: { user_id: true },
    })

    if (!session) return false

    // Revogar a sessão  
    await revokeSession(sessionId)

    return true
  } catch (error) {
    console.error('Error forcing logout:', error)
    return false
  }
}
