'use client'

/**
 * OfflineProvider - Inicializa suporte offline
 * 
 * Deve envolver a aplicação para:
 * - Inicializar listeners de conexão
 * - Registrar Background Sync
 * - Tentar sync automático
 */

import { useEffect } from 'react'
import { initConnectionListeners, registerBackgroundSync, syncAll } from '@/lib/offline'
import { OfflineIndicator } from './OfflineIndicator'

interface OfflineProviderProps {
  children: React.ReactNode
  showIndicator?: boolean
}

export function OfflineProvider({ 
  children, 
  showIndicator = true 
}: OfflineProviderProps) {
  
  useEffect(() => {
    // Inicializa listeners de online/offline
    initConnectionListeners()
    
    // Registra Background Sync
    registerBackgroundSync()
    
    // Tenta sincronizar ao carregar se online
    if (navigator.onLine) {
      syncAll()
    }
  }, [])
  
  return (
    <>
      {showIndicator && <OfflineIndicator />}
      {children}
    </>
  )
}

export default OfflineProvider
