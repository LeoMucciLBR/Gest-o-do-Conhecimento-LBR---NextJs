import { prisma } from '@/lib/prisma'

/**
 * Rate Limiter para tentativas de login
 * - 3 tentativas = cooldown de 15 minutos
 * - 5 tentativas = bloqueio automático do usuário
 */

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutos em ms
const MAX_ATTEMPTS = 3
const BLOCK_AFTER_ATTEMPTS = 5

export interface RateLimitResult {
  allowed: boolean
  attemptsLeft: number
  cooldownUntil?: Date
  permanentlyBlocked?: boolean
}

/**
 * Verifica se email/IP pode tentar login
 */
export async function checkLoginAttempts(
  email: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW)

  // Buscar tentativas recentes
  const recentAttempts = await prisma.login_attempts.findMany({
    where: {
      email: email.toLowerCase(),
      attempted_at: { gte: windowStart },
      success: false,
    },
    orderBy: { attempted_at: 'desc' },
  })

  const failedAttempts = recentAttempts.length

  // Verificar se usuário foi bloqueado permanentemente (5+ tentativas)
  if (failedAttempts >= BLOCK_AFTER_ATTEMPTS) {
    // Verificar se já existe bloqueio ativo
    const existingBlock = await prisma.blocked_users.findFirst({
      where: {
        email: email.toLowerCase(),
        is_active: true,
      },
    })

    if (!existingBlock) {
      // Criar bloqueio automático
      await prisma.blocked_users.create({
        data: {
          user_id: (await prisma.users.findUnique({ where: { email: email.toLowerCase() } }))?.id || '',
          email: email.toLowerCase(),
          reason: `Bloqueio automático após ${BLOCK_AFTER_ATTEMPTS} tentativas de login falhas`,
          is_active: true,
        },
      })
    }

    return {
      allowed: false,
      attemptsLeft: 0,
      permanentlyBlocked: true,
    }
  }

  // Rate limit normal (3 tentativas)
  if (failedAttempts >= MAX_ATTEMPTS) {
    const lastAttempt = recentAttempts[0]?.attempted_at
    const cooldownUntil = lastAttempt
      ? new Date(lastAttempt.getTime() + RATE_LIMIT_WINDOW)
      : new Date(now.getTime() + RATE_LIMIT_WINDOW)

    return {
      allowed: false,
      attemptsLeft: 0,
      cooldownUntil,
    }
  }

  return {
    allowed: true,
    attemptsLeft: MAX_ATTEMPTS - failedAttempts,
  }
}

/**
 * Registra tentativa de login
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean,
  options?: {
    country?: string
    city?: string
    userAgent?: string
    errorReason?: string
  }
) {
  await prisma.login_attempts.create({
    data: {
      email: email.toLowerCase(),
      ip_address: ipAddress,
      success,
      country: options?.country,
      city: options?.city,
      user_agent: options?.userAgent,
      error_reason: options?.errorReason,
      attempted_at: new Date(),
    },
  })

  // Se login bem-sucedido, limpar tentativas falhas anteriores
  if (success) {
    await clearFailedAttempts(email)
  }
}

/**
 * Limpa tentativas falhas após login bem-sucedido
 */
export async function clearFailedAttempts(email: string) {
  await prisma.login_attempts.deleteMany({
    where: {
      email: email.toLowerCase(),
      success: false,
    },
  })
}

/**
 * Limpa tentativas antigas (>90 dias)
 * Executar via cron job diariamente
 */
export async function cleanupOldAttempts() {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const result = await prisma.login_attempts.deleteMany({
    where: {
      attempted_at: { lt: ninetyDaysAgo },
    },
  })

  console.log(`Cleaned up ${result.count} old login attempts`)
  return result.count
}
