/**
 * Contract Repository - Operações Offline de Contratos
 * 
 * Abstração para operações CRUD de contratos com
 * suporte a IndexedDB e sincronização
 */

import { db, updateSyncMetadata } from './db'
import { queueOperation } from './syncQueue'
import type { OfflineContract, SyncStatus } from './types'

// ============================================
// Conversão de dados
// ============================================

/**
 * Converte contrato do servidor para formato offline
 */
export function toOfflineContract(
  serverContract: Record<string, unknown>
): OfflineContract {
  return {
    id: serverContract.id as string,
    name: serverContract.name as string,
    sector: serverContract.sector as string | null,
    object: serverContract.object as string | null,
    scope: serverContract.scope as string | null,
    status: serverContract.status as string,
    location: serverContract.location as string | null,
    dataInicio: serverContract.dataInicio as string | null,
    dataFim: serverContract.dataFim as string | null,
    valor: serverContract.valor as string | null,
    image_url: serverContract.image_url as string | null,
    lamina_url: serverContract.lamina_url as string | null,
    created_at: serverContract.created_at as string,
    updated_at: serverContract.updated_at as string,
    organization_id: serverContract.organization_id as string | null,
    creator_id: serverContract.creator_id as string | null,
    organizationName: (serverContract.organization as Record<string, unknown>)?.name as string | null,
    creatorName: (serverContract.creator as Record<string, unknown>)?.name as string | null,
    
    // Metadata de sync
    _syncStatus: 'synced',
    _syncedAt: new Date(),
    _localUpdatedAt: new Date(),
    _serverUpdatedAt: new Date(serverContract.updated_at as string),
    _version: 1,
  }
}

// ============================================
// Operações de Leitura
// ============================================

/**
 * Obtém todos os contratos do cache local
 * @param statusFilter Opcional - filtrar por status específico (ex: 'Ativo')
 */
export async function getAllContracts(statusFilter?: string): Promise<OfflineContract[]> {
  const contracts = await db.contracts.orderBy('created_at').reverse().toArray()
  // Se um filtro de status foi passado, filtra os resultados
  if (statusFilter) {
    return contracts.filter(c => c.status === statusFilter)
  }
  return contracts
}

/**
 * Obtém um contrato por ID do cache local
 */
export async function getContractById(id: string): Promise<OfflineContract | undefined> {
  return db.contracts.get(id)
}

/**
 * Busca contratos por nome ou outros campos
 */
export async function searchContracts(query: string): Promise<OfflineContract[]> {
  const lowerQuery = query.toLowerCase()
  return db.contracts
    .filter(contract => {
      const nameMatch = contract.name.toLowerCase().includes(lowerQuery)
      const sectorMatch = contract.sector?.toLowerCase().includes(lowerQuery) ?? false
      const orgMatch = contract.organizationName?.toLowerCase().includes(lowerQuery) ?? false
      return nameMatch || sectorMatch || orgMatch
    })
    .toArray()
}

/**
 * Obtém contratos pendentes de sincronização
 */
export async function getPendingContracts(): Promise<OfflineContract[]> {
  return db.contracts
    .where('_syncStatus')
    .equals('pending')
    .toArray()
}

// ============================================
// Operações de Escrita
// ============================================

/**
 * Salva contratos do servidor no cache local (bulk)
 */
export async function saveContractsFromServer(
  contracts: Record<string, unknown>[]
): Promise<void> {
  const offlineContracts = contracts.map(toOfflineContract)
  await db.contracts.bulkPut(offlineContracts)
  await updateSyncMetadata('contracts', new Date())
}

/**
 * Cria um novo contrato offline
 */
export async function createContractOffline(
  contractData: Omit<OfflineContract, 'id' | '_syncStatus' | '_syncedAt' | '_localUpdatedAt' | '_serverUpdatedAt' | '_version'>
): Promise<OfflineContract> {
  const now = new Date()
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const contract: OfflineContract = {
    ...contractData,
    id: tempId,
    _syncStatus: 'pending',
    _syncedAt: null,
    _localUpdatedAt: now,
    _serverUpdatedAt: null,
    _version: 1,
  }
  
  await db.contracts.add(contract)
  
  // Adiciona à fila de sync
  await queueOperation('create', 'contract', tempId, contractData)
  
  return contract
}

/**
 * Atualiza um contrato offline
 */
export async function updateContractOffline(
  id: string,
  updates: Partial<OfflineContract>
): Promise<void> {
  const now = new Date()
  const existing = await db.contracts.get(id)
  
  await db.contracts.update(id, {
    ...updates,
    _syncStatus: 'pending' as SyncStatus,
    _localUpdatedAt: now,
    _version: (existing?._version ?? 0) + 1,
  })
  
  // Adiciona à fila de sync
  await queueOperation('update', 'contract', id, updates)
}

/**
 * Marca contrato para deleção offline
 */
export async function deleteContractOffline(id: string): Promise<void> {
  // Marcar como pendente de deleção ao invés de deletar
  // para permitir sync com servidor
  await db.contracts.update(id, {
    _syncStatus: 'pending' as SyncStatus,
    status: 'DELETED', // Marcador especial
  })
  
  await queueOperation('delete', 'contract', id, {})
}

// ============================================
// Sincronização
// ============================================

/**
 * Atualiza contrato após sync bem-sucedido
 */
export async function markContractAsSynced(
  tempId: string, 
  serverId: string,
  serverData: Record<string, unknown>
): Promise<void> {
  // Se o ID mudou (era temporário), deleta o antigo e cria com ID real
  if (tempId !== serverId) {
    const existing = await db.contracts.get(tempId)
    if (existing) {
      await db.contracts.delete(tempId)
      const offlineData = toOfflineContract(serverData)
      await db.contracts.add({
        ...existing,
        ...offlineData,
        id: serverId,
      })
    }
  } else {
    await db.contracts.update(serverId, {
      ...toOfflineContract(serverData),
    })
  }
}

/**
 * Verifica se há contratos não sincronizados
 */
export async function hasUnsyncedContracts(): Promise<boolean> {
  const count = await db.contracts
    .where('_syncStatus')
    .equals('pending')
    .count()
  return count > 0
}
