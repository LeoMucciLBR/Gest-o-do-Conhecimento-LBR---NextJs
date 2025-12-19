'use client'

/**
 * Hook para Contratos com Suporte Offline
 * 
 * Combina React Query com IndexedDB para:
 * - Carregar dados do cache primeiro (faster UX)
 * - Atualizar com dados do servidor quando online
 * - Permitir operações offline que sincronizam depois
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  getAllContracts, 
  getContractById, 
  saveContractsFromServer,
  createContractOffline,
  updateContractOffline,
  deleteContractOffline,
  syncAll,
  getOfflineState,
  subscribeToState,
} from '@/lib/offline'
import type { OfflineContract, OfflineState } from '@/lib/offline/types'
import { useEffect, useState } from 'react'

// ============================================
// Hook de Estado Offline
// ============================================

interface OfflineStateWithHydration extends OfflineState {
  isHydrated: boolean
}

/**
 * Hook que monitora estado de conexão e sync
 * 
 * IMPORTANTE: Usa isHydrated para evitar hydration mismatch.
 * O estado isOnline só é confiável após isHydrated=true
 */
export function useOfflineState(): OfflineStateWithHydration {
  // Inicia com valores seguros para SSR (sempre online=true para não mostrar banner)
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    pendingOperations: 0,
    lastSyncAt: null,
    syncInProgress: false,
  })
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    // Marca como hidratado após o primeiro render no cliente
    setIsHydrated(true)
    const unsubscribe = subscribeToState(setState)
    return unsubscribe
  }, [])
  
  return { ...state, isHydrated }
}

// ============================================
// Hook de Contratos Offline
// ============================================

interface UseOfflineContractsOptions {
  status?: string
  search?: string
}

/**
 * Hook para listar contratos com suporte offline
 * 
 * Estratégia:
 * 1. Retorna dados do IndexedDB imediatamente (cache-first)
 * 2. Busca do servidor em background
 * 3. Atualiza IndexedDB com dados frescos
 */
export function useOfflineContracts(options: UseOfflineContractsOptions = {}) {
  const { status, search } = options
  
  // Dados do IndexedDB (reactive)
  const localContracts = useLiveQuery(
    () => getAllContracts(),
    [],
    [] // fallback value
  )
  
  // Busca do servidor (background refresh)
  const serverQuery = useQuery({
    queryKey: ['contracts', 'offline-sync', status, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('q', search)
      params.set('pageSize', '100') // Pegar mais para cache
      
      const response = await fetch(`/api/contracts?${params.toString()}`)
      if (!response.ok) throw new Error('Erro ao carregar contratos')
      const data = await response.json()
      
      // Salva no IndexedDB
      await saveContractsFromServer(data.items || data)
      
      return data
    },
    // Não faz retry automático quando offline
    retry: (failureCount, error) => {
      if (!navigator.onLine) return false
      return failureCount < 2
    },
    // Dados ficam frescos por 1 minuto
    staleTime: 60 * 1000,
    // Não mostra loading se temos dados locais
    placeholderData: (prev) => prev,
  })
  
  // Filtra localmente se necessário
  let filteredContracts = localContracts || []
  if (status) {
    filteredContracts = filteredContracts.filter(c => c.status === status)
  }
  if (search) {
    const lowerSearch = search.toLowerCase()
    filteredContracts = filteredContracts.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) ||
      c.sector?.toLowerCase().includes(lowerSearch) ||
      c.organizationName?.toLowerCase().includes(lowerSearch)
    )
  }
  
  return {
    contracts: filteredContracts,
    isLoading: serverQuery.isLoading && !localContracts?.length,
    isSyncing: serverQuery.isFetching,
    error: serverQuery.error,
    refetch: serverQuery.refetch,
  }
}

// ============================================
// Hook de Contrato Único Offline
// ============================================

/**
 * Hook para buscar um contrato específico com suporte offline
 */
export function useOfflineContract(id: string | undefined) {
  // Dados do IndexedDB
  const localContract = useLiveQuery(
    () => id ? getContractById(id) : undefined,
    [id],
    undefined
  )
  
  // Atualização do servidor
  const serverQuery = useQuery({
    queryKey: ['contract', id, 'offline-sync'],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${id}`)
      if (!response.ok) throw new Error('Erro ao carregar contrato')
      const data = await response.json()
      
      // Atualiza cache local
      await saveContractsFromServer([data])
      
      return data
    },
    enabled: !!id,
    retry: (failureCount) => navigator.onLine && failureCount < 2,
    staleTime: 60 * 1000,
  })
  
  return {
    contract: localContract || serverQuery.data,
    isLoading: serverQuery.isLoading && !localContract,
    isSyncing: serverQuery.isFetching,
    error: serverQuery.error,
  }
}

// ============================================
// Mutations Offline
// ============================================

/**
 * Hook para criar contrato offline
 */
export function useCreateContractOffline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<OfflineContract, 'id' | '_syncStatus' | '_syncedAt' | '_localUpdatedAt' | '_serverUpdatedAt' | '_version'>) => {
      return createContractOffline(data)
    },
    onSuccess: () => {
      // Invalida queries para refletir novo contrato
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      
      // Tenta sincronizar imediatamente se online
      if (navigator.onLine) {
        syncAll()
      }
    },
  })
}

/**
 * Hook para atualizar contrato offline
 */
export function useUpdateContractOffline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OfflineContract> }) => {
      await updateContractOffline(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      
      if (navigator.onLine) {
        syncAll()
      }
    },
  })
}

/**
 * Hook para deletar contrato offline
 */
export function useDeleteContractOffline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteContractOffline(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      
      if (navigator.onLine) {
        syncAll()
      }
    },
  })
}

/**
 * Hook para forçar sincronização
 */
export function useSyncContracts() {
  return useMutation({
    mutationFn: syncAll,
  })
}
