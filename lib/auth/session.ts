import * as crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? '7')

export function generateSessionToken() {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(token).digest()
  return { token, tokenHash }
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest()
}

export async function createSession(
  userId: string,
  ip?: string,
  userAgent?: string
) {
  const { token, tokenHash } = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.sessions.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ip ?? null,
      user_agent: userAgent ?? null,
    },
  })

  return token
}

export async function validateSession(sessionToken: string) {
  const tokenHash = hashToken(sessionToken)

  const session = await prisma.sessions.findFirst({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: {
      users: {
        select: { id: true, email: true, name: true, role: true, picture_url: true },
      },
    },
  })

  return session
}

export async function revokeSession(sessionToken: string) {
  const tokenHash = hashToken(sessionToken)
  await prisma.sessions.deleteMany({
    where: { token_hash: tokenHash, revoked_at: null },
  })
}
