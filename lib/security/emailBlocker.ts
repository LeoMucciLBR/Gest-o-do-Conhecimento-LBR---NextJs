import { prisma } from '@/lib/prisma'

/**
 * Email/User Blocker - Gerencia bloqueio de usuários
 */

/**
 * Verifica se usuário está bloqueado
 */
export async function isUserBlocked(email: string): Promise<boolean> {
  const blocked = await prisma.blocked_users.findFirst({
    where: {
      email: email.toLowerCase(),
      is_active: true,
    },
  })

  return !!blocked
}

/**
 * Bloqueia usuário permanentemente
 */
export async function blockUser(
  email: string,
  reason: string,
  adminId?: string
) {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  const existing = await prisma.blocked_users.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  })

  if (existing) {
    // Reativar bloqueio
    return await prisma.blocked_users.update({
      where: { id: existing.id },
      data: {
        reason,
        blocked_by: adminId || null,
        blocked_at: new Date(),
        is_active: true,
      },
    })
  }

  // Criar novo bloqueio
  return await prisma.blocked_users.create({
    data: {
      user_id: user.id,
      email: email.toLowerCase(),
      reason,
      blocked_by: adminId || null,
      is_active: true,
    },
  })
}

/**
 * Desbloqueia usuário
 */
export async function unblockUser(email: string) {
  await prisma.blocked_users.updateMany({
    where: {
      email: email.toLowerCase(),
    },
    data: {
      is_active: false,
    },
  })
}

/**
 * Lista usuários bloqueados
 */
export async function getBlockedUsers() {
  return await prisma.blocked_users.findMany({
    where: { is_active: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      blocked_by_user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { blocked_at: 'desc' },
  })
}

/**
 * Busca informações de bloqueio de um usuário
 */
export async function getUserBlockInfo(email: string) {
  return await prisma.blocked_users.findFirst({
    where: {
      email: email.toLowerCase(),
      is_active: true,
    },
    include: {
      blocked_by_user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })
}
