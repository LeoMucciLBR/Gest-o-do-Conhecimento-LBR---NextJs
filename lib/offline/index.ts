/**
 * Offline Module - Barrel Export
 */

// Database
export { db, clearAllData, getPendingOperationsCount, getLastSyncDate } from './db'

// Types
export type * from './types'

// Sync Queue
export { 
  queueOperation, 
  getPendingOperations, 
  getQueueStats,
  cleanupCompletedOperations 
} from './syncQueue'

// Contract Repository
export {
  getAllContracts,
  getContractById,
  searchContracts,
  saveContractsFromServer,
  createContractOffline,
  updateContractOffline,
  deleteContractOffline,
  hasUnsyncedContracts,
} from './contractRepository'

// Sync Manager
export {
  initConnectionListeners,
  getOfflineState,
  subscribeToState,
  syncAll,
  registerBackgroundSync,
} from './syncManager'
