import { prisma } from '@/lib/prisma'

/**
 * Verifica se o usuário é o criador do contrato
 */
export async function isContractCreator(
  userId: string,
  contractId: string
): Promise<boolean> {
  const contract = await prisma.contracts.findUnique({
    where: { id: contractId },
    select: { created_by: true }
  })

  return contract?.created_by === userId
}

/**
 * Verifica se o usuário é um editor autorizado do contrato
 */
export async function isContractEditor(
  userId: string,
  contractId: string
): Promise<boolean> {
  const editor = await prisma.contract_editors.findFirst({
    where: {
      contract_id: contractId,
      user_id: userId
    }
  })

  return !!editor
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(userRole: string): boolean {
  return userRole === 'ADMIN' || userRole === 'admin'
}

/**
 * Verifica se o usuário pode editar o contrato
 * Pode editar: criador, editor autorizado ou admin
 */
export async function canEditContract(
  userId: string,
  userRole: string,
  contractId: string
): Promise<boolean> {
  // Admin pode editar qualquer contrato
  if (isAdmin(userRole)) {
    return true
  }

  // Verifica se é o criador
  const isCreator = await isContractCreator(userId, contractId)
  if (isCreator) {
    return true
  }

  // Verifica se é um editor autorizado
  const isEditor = await isContractEditor(userId, contractId)
  return isEditor
}

/**
 * Verifica se o usuário pode deletar o contrato
 * Pode deletar: apenas criador ou admin
 */
export async function canDeleteContract(
  userId: string,
  userRole: string,
  contractId: string
): Promise<boolean> {
  // Admin pode deletar qualquer contrato
  if (isAdmin(userRole)) {
    return true
  }

  // Apenas o criador pode deletar
  return await isContractCreator(userId, contractId)
}

/**
 * Verifica se o usuário pode gerenciar editores do contrato
 * Pode gerenciar: apenas criador ou admin
 */
export async function canManageEditors(
  userId: string,
  userRole: string,
  contractId: string
): Promise<boolean> {
  // Admin pode gerenciar editores de qualquer contrato
  if (isAdmin(userRole)) {
    return true
  }

  // Apenas o criador pode gerenciar editores
  return await isContractCreator(userId, contractId)
}

/**
 * Obtém informações do criador do contrato
 */
export async function getContractCreator(contractId: string) {
  const contract = await prisma.contracts.findUnique({
    where: { id: contractId },
    select: {
      created_by: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  return contract?.creator || null
}

/**
 * Obtém lista de editores do contrato
 */
export async function getContractEditors(contractId: string) {
  const editors = await prisma.contract_editors.findMany({
    where: { contract_id: contractId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          picture_url: true
        }
      },
      added_by_user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return editors
}
