/**
 * IndexedDB Database - Dexie.js
 * 
 * Banco de dados local para suporte offline
 */

import Dexie, { type EntityTable } from 'dexie'
import type { 
  OfflineContract, 
  OfflineObra, 
  OfflineParticipant,
  SyncOperation,
  SyncMetadata
} from './types'

// ============================================
// Schema do Banco de Dados
// ============================================

class OfflineDatabase extends Dexie {
  // Tabelas tipadas
  contracts!: EntityTable<OfflineContract, 'id'>
  obras!: EntityTable<OfflineObra, 'id'>
  participants!: EntityTable<OfflineParticipant, 'id'>
  syncQueue!: EntityTable<SyncOperation, 'id'>
  syncMetadata!: EntityTable<SyncMetadata, 'id'>

  constructor() {
    super('LBR_OfflineDB')
    
    // Versão 1 do schema
    this.version(1).stores({
      // Contratos - indexados por status, sync e datas
      contracts: 'id, status, _syncStatus, _localUpdatedAt, created_at, organization_id',
      
      // Obras - indexadas por contrato
      obras: 'id, contract_id, tipoRodovia, _syncStatus',
      
      // Participantes - indexados por contrato
      participants: 'id, contract_id, role, _syncStatus',
      
      // Fila de sincronização - ordenada por criação
      syncQueue: 'id, entityType, entityId, status, createdAt',
      
      // Metadata de sync - por tipo de entidade
      syncMetadata: 'id, entityType, lastSyncAt',
    })
  }
}

// Singleton da instância do banco
export const db = new OfflineDatabase()

// ============================================
// Helpers para operações comuns
// ============================================

/**
 * Limpa todo o banco de dados local
 */
export async function clearAllData(): Promise<void> {
  await db.contracts.clear()
  await db.obras.clear()
  await db.participants.clear()
  await db.syncQueue.clear()
  await db.syncMetadata.clear()
}

/**
 * Obtém contagem de operações pendentes de sync
 */
export async function getPendingOperationsCount(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}

/**
 * Obtém última data de sincronização
 */
export async function getLastSyncDate(entityType: string): Promise<Date | null> {
  const meta = await db.syncMetadata.get(entityType)
  return meta?.lastSyncAt ?? null
}

/**
 * Atualiza metadata de sincronização
 */
export async function updateSyncMetadata(
  entityType: string, 
  lastSyncAt: Date
): Promise<void> {
  await db.syncMetadata.put({
    id: entityType,
    entityType,
    lastSyncAt,
    lastFullSyncAt: lastSyncAt,
  })
}

// ============================================
// Export default
// ============================================

export default db
