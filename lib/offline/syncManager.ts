/**
 * Sync Manager - Gerenciador de Sincronização
 * 
 * Orquestra a sincronização entre IndexedDB e servidor
 * com estratégia Last-Write-Wins
 */

import { db, getPendingOperationsCount } from './db'
import { 
  getPendingOperations, 
  markAsProcessing, 
  markAsCompleted, 
  markAsFailed 
} from './syncQueue'
import { markContractAsSynced } from './contractRepository'
import type { SyncOperation, SyncResult, OfflineState } from './types'

// ============================================
// Estado de Conexão
// ============================================

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
let syncInProgress = false
let listeners: Set<(state: OfflineState) => void> = new Set()

/**
 * Inicializa listeners de conexão
 */
export function initConnectionListeners(): void {
  if (typeof window === 'undefined') return
  
  window.addEventListener('online', () => {
    isOnline = true
    notifyListeners()
    // Auto-sync quando voltar online
    syncAll()
  })
  
  window.addEventListener('offline', () => {
    isOnline = false
    notifyListeners()
  })
}

/**
 * Obtém estado atual
 */
export async function getOfflineState(): Promise<OfflineState> {
  const pendingOperations = await getPendingOperationsCount()
  const meta = await db.syncMetadata.get('contracts')
  
  return {
    isOnline,
    pendingOperations,
    lastSyncAt: meta?.lastSyncAt ?? null,
    syncInProgress,
  }
}

/**
 * Registra listener para mudanças de estado
 */
export function subscribeToState(
  listener: (state: OfflineState) => void
): () => void {
  listeners.add(listener)
  
  // Notifica imediatamente com estado atual
  getOfflineState().then(listener)
  
  // Retorna função de unsubscribe
  return () => listeners.delete(listener)
}

async function notifyListeners(): Promise<void> {
  const state = await getOfflineState()
  listeners.forEach(listener => listener(state))
}

// ============================================
// Sincronização
// ============================================

/**
 * Sincroniza todas as operações pendentes
 */
export async function syncAll(): Promise<SyncResult> {
  if (!isOnline || syncInProgress) {
    return { success: false, synced: 0, failed: 0, conflicts: 0, errors: ['Sync não disponível'] }
  }
  
  syncInProgress = true
  notifyListeners()
  
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  }
  
  try {
    const operations = await getPendingOperations()
    
    for (const operation of operations) {
      try {
        await markAsProcessing(operation.id)
        await processOperation(operation)
        await markAsCompleted(operation.id)
        result.synced++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        await markAsFailed(operation.id, errorMessage)
        result.failed++
        result.errors.push(`${operation.entityType}/${operation.entityId}: ${errorMessage}`)
      }
    }
    
    result.success = result.failed === 0
  } finally {
    syncInProgress = false
    notifyListeners()
  }
  
  return result
}

/**
 * Processa uma operação individual
 */
async function processOperation(operation: SyncOperation): Promise<void> {
  const { type, entityType, entityId, payload } = operation
  
  if (entityType === 'contract') {
    await processContractOperation(type, entityId, payload)
  }
  // TODO: Adicionar outros entity types (obra, participant)
}

/**
 * Processa operação de contrato
 */
async function processContractOperation(
  type: 'create' | 'update' | 'delete',
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  let response: Response
  
  switch (type) {
    case 'create':
      response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      break
      
    case 'update':
      // IDs temporários começam com 'temp_', não podemos fazer update
      if (entityId.startsWith('temp_')) {
        throw new Error('Contrato ainda não foi criado no servidor')
      }
      response = await fetch(`/api/contracts/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      break
      
    case 'delete':
      response = await fetch(`/api/contracts/${entityId}`, {
        method: 'DELETE',
      })
      break
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro de rede' }))
    throw new Error(error.error || `Erro HTTP ${response.status}`)
  }
  
  // Atualiza cache local com dados do servidor
  if (type === 'create' || type === 'update') {
    const serverData = await response.json()
    await markContractAsSynced(entityId, serverData.id, serverData)
  } else if (type === 'delete') {
    // Remove do cache local após deleção confirmada
    await db.contracts.delete(entityId)
  }
}

// ============================================
// Background Sync Registration
// ============================================

/**
 * Registra para Background Sync (se suportado)
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register('sync-contracts')
      return true
    } catch {
      return false
    }
  }
  return false
}

// ============================================
// Export default
// ============================================

export default {
  initConnectionListeners,
  getOfflineState,
  subscribeToState,
  syncAll,
  registerBackgroundSync,
}
