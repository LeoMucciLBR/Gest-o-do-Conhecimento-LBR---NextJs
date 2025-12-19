'use client'

/**
 * OfflineIndicator - Indicador de Status de Conexão
 * 
 * Mostra um banner quando offline e quantidade de
 * operações pendentes de sincronização
 */

import { useOfflineState } from '@/lib/offline/hooks/useOfflineContracts'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'

export function OfflineIndicator() {
  const { isOnline, pendingOperations, syncInProgress, lastSyncAt } = useOfflineState()
  
  // Só mostra se offline ou tem operações pendentes
  const shouldShow = !isOnline || pendingOperations > 0
  
  if (!shouldShow) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100]"
      >
        <div className={`
          flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium
          ${!isOnline 
            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' 
            : 'bg-gradient-to-r from-amber-500 to-amber-400 text-amber-900'
          }
        `}>
          {!isOnline ? (
            <>
              <CloudOff className="w-4 h-4" />
              <span>Você está offline</span>
              {pendingOperations > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {pendingOperations} alteração{pendingOperations > 1 ? 'ões' : ''} pendente{pendingOperations > 1 ? 's' : ''}
                </span>
              )}
            </>
          ) : syncInProgress ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : pendingOperations > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>
                {pendingOperations} alteração{pendingOperations > 1 ? 'ões' : ''} aguardando sincronização
              </span>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// SyncStatus - Status detalhado de sincronização
// ============================================

interface SyncStatusProps {
  compact?: boolean
}

export function SyncStatus({ compact = false }: SyncStatusProps) {
  const { isOnline, pendingOperations, syncInProgress, lastSyncAt } = useOfflineState()
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {!isOnline ? (
          <div className="flex items-center gap-1.5 text-red-500">
            <CloudOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        ) : syncInProgress ? (
          <div className="flex items-center gap-1.5 text-blue-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Sincronizando</span>
          </div>
        ) : pendingOperations > 0 ? (
          <div className="flex items-center gap-1.5 text-amber-500">
            <AlertTriangle className="w-4 h-4" />
            <span>{pendingOperations} pendente{pendingOperations > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-green-500">
            <Check className="w-4 h-4" />
            <span>Sincronizado</span>
          </div>
        )}
      </div>
    )
  }
  
  // Versão completa
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca'
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`
    return date.toLocaleDateString('pt-BR')
  }
  
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status de Sincronização
        </span>
        {!isOnline ? (
          <span className="flex items-center gap-1.5 text-sm text-red-500">
            <CloudOff className="w-4 h-4" />
            Offline
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Online
          </span>
        )}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Última sincronização:</span>
          <span>{formatLastSync(lastSyncAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Alterações pendentes:</span>
          <span className={pendingOperations > 0 ? 'text-amber-500 font-medium' : ''}>
            {pendingOperations}
          </span>
        </div>
      </div>
      
      {syncInProgress && (
        <div className="flex items-center gap-2 text-sm text-blue-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Sincronizando...
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator
