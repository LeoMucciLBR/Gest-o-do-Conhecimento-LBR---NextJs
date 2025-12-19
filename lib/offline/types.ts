/**
 * Tipos para Suporte Offline
 * 
 * Estruturas de dados para IndexedDB e sincronização
 */

// ============================================
// Status de Sincronização
// ============================================

export type SyncStatus = 'synced' | 'pending' | 'failed' | 'conflict'
export type OperationType = 'create' | 'update' | 'delete'

// ============================================
// Interface base para entidades offline
// ============================================

export interface OfflineEntity {
  id: string
  _syncStatus: SyncStatus
  _syncedAt: Date | null
  _localUpdatedAt: Date
  _serverUpdatedAt: Date | null
  _version: number
}

// ============================================
// Contrato Offline
// ============================================

export interface OfflineContract extends OfflineEntity {
  name: string
  sector?: string | null
  object?: string | null
  scope?: string | null
  status: string
  location?: string | null
  dataInicio?: string | null
  dataFim?: string | null
  valor?: string | null
  image_url?: string | null
  lamina_url?: string | null
  created_at: string
  updated_at: string
  
  // Relacionamentos (IDs)
  organization_id?: string | null
  creator_id?: string | null
  
  // Dados desnormalizados para acesso offline
  organizationName?: string | null
  creatorName?: string | null
}

// ============================================
// Obra Offline
// ============================================

export interface OfflineObra extends OfflineEntity {
  contract_id: string
  tipoRodovia: 'FEDERAL' | 'ESTADUAL' | 'PONTO_FIXO'
  uf?: string | null
  rodoviaId?: number | null
  brCodigo?: string | null
  kmInicio: number
  kmFim: number
  nome?: string | null
  lat?: number | null
  lng?: number | null
}

// ============================================
// Participante Offline
// ============================================

export interface OfflineParticipant extends OfflineEntity {
  contract_id: string
  role: string
  person_id?: string | null
  personName?: string | null
  personEmail?: string | null
}

// ============================================
// Operação de Sincronização (Queue)
// ============================================

export interface SyncOperation {
  id: string
  type: OperationType
  entityType: 'contract' | 'obra' | 'participant'
  entityId: string
  payload: Record<string, unknown>
  createdAt: Date
  attempts: number
  lastError?: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// ============================================
// Metadata de Sincronização
// ============================================

export interface SyncMetadata {
  id: string
  entityType: string
  lastSyncAt: Date | null
  lastFullSyncAt: Date | null
}

// ============================================
// Resultado de Sincronização
// ============================================

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  conflicts: number
  errors: string[]
}

// ============================================
// Estado Offline
// ============================================

export interface OfflineState {
  isOnline: boolean
  pendingOperations: number
  lastSyncAt: Date | null
  syncInProgress: boolean
}
