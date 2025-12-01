import { prisma } from '@/lib/prisma'

export async function auditLogin(params: {
  userId?: string
  emailInput?: string
  success: boolean
  reason?: string
  ip?: string
  userAgent?: string
  provider: string
}) {
  await prisma.login_audit.create({
    data: {
      user_id: params.userId ?? null,
      email_input: params.emailInput ?? null,
      success: params.success,
      reason: params.reason ?? null,
      ip_address: params.ip ?? null,
      user_agent: params.userAgent ?? null,
      provider: params.provider,
    },
  })
}
