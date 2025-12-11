import { prisma } from '@/lib/prisma'

/**
 * IP Blocker - Gerencia bloqueio de IPs
 */

/**
 * Verifica se IP está na blacklist
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const blocked = await prisma.blocked_ips.findFirst({
    where: {
      ip_address: ipAddress,
      is_active: true,
      OR: [
        { expires_at: null }, // Permanente
        { expires_at: { gt: new Date() } }, // Não expirado
      ],
    },
  })

  return !!blocked
}

/**
 * Verifica se IP está na whitelist global
 */
export async function isIpWhitelisted(ipAddress: string): Promise<boolean> {
  const whitelisted = await prisma.whitelisted_ips.findFirst({
    where: {
      ip_address: ipAddress,
      is_active: true,
    },
  })

  return !!whitelisted
}

/**
 * Adiciona IP à blacklist
 */
export async function blockIp(
  ipAddress: string,
  reason: string,
  adminId: string,
  expiresAt?: Date
) {
  const existing = await prisma.blocked_ips.findFirst({
    where: { ip_address: ipAddress },
  })

  if (existing) {
    // Atualizar bloqueio existente
    return await prisma.blocked_ips.update({
      where: { id: existing.id },
      data: {
        reason,
        blocked_by: adminId,
        blocked_at: new Date(),
        expires_at: expiresAt || null,
        is_active: true,
      },
    })
  }

  // Criar novo bloqueio
  return await prisma.blocked_ips.create({
    data: {
      ip_address: ipAddress,
      reason,
      blocked_by: adminId,
      expires_at: expiresAt || null,
      is_active: true,
    },
  })
}

/**
 * Remove IP da blacklist
 */
export async function unblockIp(ipAddress: string) {
  await prisma.blocked_ips.updateMany({
    where: { ip_address: ipAddress },
    data: { is_active: false },
  })
}

/**
 * Adiciona IP à whitelist global
 */
export async function whitelistIp(
  ipAddress: string,
  description: string,
  adminId: string
) {
  const existing = await prisma.whitelisted_ips.findFirst({
    where: { ip_address: ipAddress },
  })

  if (existing) {
    return await prisma.whitelisted_ips.update({
      where: { id: existing.id },
      data: {
        description,
        added_by: adminId,
        is_active: true,
      },
    })
  }

  return await prisma.whitelisted_ips.create({
    data: {
      ip_address: ipAddress,
      description,
      added_by: adminId,
      is_active: true,
    },
  })
}

/**
 * Remove IP da whitelist
 */
export async function removeFromWhitelist(ipAddress: string) {
  await prisma.whitelisted_ips.updateMany({
    where: { ip_address: ipAddress },
    data: { is_active: false },
  })
}

/**
 * Lista IPs bloqueados
 */
export async function getBlockedIps() {
  return await prisma.blocked_ips.findMany({
    where: { is_active: true },
    include: {
      blocked_by_user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { blocked_at: 'desc' },
  })
}

/**
 * Lista IPs na whitelist
 */
export async function getWhitelistedIps() {
  return await prisma.whitelisted_ips.findMany({
    where: { is_active: true },
    include: {
      added_by_user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { added_at: 'desc' },
  })
}
