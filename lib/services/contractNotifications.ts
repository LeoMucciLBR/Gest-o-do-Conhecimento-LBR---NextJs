import { prisma } from '@/lib/prisma'

/**
 * Cria notificações para usuários quando um contrato é criado ou atualizado
 * 
 * Regras:
 * - CRIAÇÃO: Notifica TODOS os usuários exceto o criador
 * - ATUALIZAÇÃO: Notifica APENAS criador e editores do contrato (exceto quem alterou)
 */
export async function createContractNotifications(
  contractId: string,
  actorId: string, // ID de quem fez a ação
  action: 'CREATE' | 'UPDATE'
) {
  try {
    // Buscar contrato com criador e editores
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId },
      include: {
        creator: { select: { id: true } },
        editors: { select: { user_id: true } },
      },
    })

    if (!contract) {
      console.warn(`Contract ${contractId} not found for notifications`)
      return
    }

    const usersToNotify = new Set<string>()

    if (action === 'CREATE') {
      // Notificar TODOS os usuários do sistema exceto o criador
      const allUsers = await prisma.users.findMany({
        where: { is_active: true },
        select: { id: true },
      })

      allUsers.forEach((user) => {
        if (user.id !== actorId) {
          usersToNotify.add(user.id)
        }
      })
    } else if (action === 'UPDATE') {
      // Notificar APENAS criador e editores (exceto quem fez a alteração)
      
      // Adicionar criador se não for quem alterou
      if (contract.created_by && contract.created_by !== actorId) {
        usersToNotify.add(contract.created_by)
      }

      // Adicionar editores (exceto quem alterou)
      contract.editors.forEach((editor) => {
        if (editor.user_id !== actorId) {
          usersToNotify.add(editor.user_id)
        }
      })
    }

    // Criar notificações em batch
    if (usersToNotify.size > 0) {
      await prisma.contract_notifications.createMany({
        data: Array.from(usersToNotify).map((userId) => ({
          contract_id: contractId,
          user_id: userId,
          type: action === 'CREATE' ? 'CONTRACT_CREATED' : 'CONTRACT_UPDATED',
          is_read: false,
        })),
        skipDuplicates: true, // Evita erro se notificação já existir
      })

      console.log(
        `Created ${usersToNotify.size} notifications for contract ${contractId} (${action})`
      )
    }
  } catch (error) {
    console.error('Failed to create contract notifications:', error)
    // Não lança erro para não quebrar o fluxo principal
  }
}
