/**
 * Sync Queue - Fila de Sincronização
 * 
 * Gerencia operações pendentes para sincronização
 * quando a conexão for restabelecida
 */

import { db } from './db'
import type { SyncOperation, OperationType } from './types'

// ============================================
// Adicionar operação à fila
// ============================================

/**
 * Adiciona uma operação à fila de sincronização
 */
export async function queueOperation(
  type: OperationType,
  entityType: 'contract' | 'obra' | 'participant',
  entityId: string,
  payload: Record<string, unknown>
): Promise<string> {
  const operation: SyncOperation = {
    id: `${entityType}_${entityId}_${Date.now()}`,
    type,
    entityType,
    entityId,
    payload,
    createdAt: new Date(),
    attempts: 0,
    status: 'pending',
  }
  
  await db.syncQueue.add(operation)
  return operation.id
}

// ============================================
// Processar fila
// ============================================

/**
 * Obtém operações pendentes para processar
 */
export async function getPendingOperations(): Promise<SyncOperation[]> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('createdAt')
}

/**
 * Marca operação como em processamento
 */
export async function markAsProcessing(operationId: string): Promise<void> {
  const op = await db.syncQueue.get(operationId)
  await db.syncQueue.update(operationId, {
    status: 'processing',
    attempts: (op?.attempts ?? 0) + 1,
  })
}

/**
 * Marca operação como concluída
 */
export async function markAsCompleted(operationId: string): Promise<void> {
  await db.syncQueue.delete(operationId)
}

/**
 * Marca operação como falha
 */
export async function markAsFailed(
  operationId: string, 
  error: string
): Promise<void> {
  const operation = await db.syncQueue.get(operationId)
  if (!operation) return
  
  // Após 3 tentativas, marca como permanentemente falho
  if (operation.attempts >= 3) {
    await db.syncQueue.update(operationId, {
      status: 'failed',
      lastError: error,
    })
  } else {
    // Volta para pendente para retry
    await db.syncQueue.update(operationId, {
      status: 'pending',
      lastError: error,
    })
  }
}

// ============================================
// Limpeza
// ============================================

/**
 * Remove operações concluídas com mais de 24h
 */
export async function cleanupCompletedOperations(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const oldOperations = await db.syncQueue
    .where('status')
    .equals('completed')
    .filter(op => op.createdAt < oneDayAgo)
    .toArray()
  
  const ids = oldOperations.map(op => op.id)
  await db.syncQueue.bulkDelete(ids)
  
  return ids.length
}

/**
 * Remove operações falhas de uma entidade específica
 * (útil quando o usuário resolve manualmente)
 */
export async function clearFailedOperations(entityId: string): Promise<void> {
  const failed = await db.syncQueue
    .where('entityId')
    .equals(entityId)
    .filter(op => op.status === 'failed')
    .toArray()
  
  await db.syncQueue.bulkDelete(failed.map(op => op.id))
}

// ============================================
// Estatísticas
// ============================================

/**
 * Obtém contagem de operações por status
 */
export async function getQueueStats(): Promise<Record<string, number>> {
  const all = await db.syncQueue.toArray()
  
  return all.reduce((acc, op) => {
    acc[op.status] = (acc[op.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
