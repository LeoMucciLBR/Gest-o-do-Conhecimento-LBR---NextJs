/**
 * Hooks React Query para Contratos
 * 
 * Estes hooks encapsulam a lógica de fetch, cache e mutations
 * para operações com contratos.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateContractInput, ListContractsQueryInput } from '@/lib/validators'

// ============================================
// Types
// ============================================

interface Contract {
  id: string
  name: string
  sector?: string | null
  object?: string | null
  status: string
  created_at: string
  organization?: { id: string; name: string } | null
  creator?: { id: string; name: string; email: string } | null
  image_url?: string | null
  lamina_url?: string | null
}

interface ContractsListResponse {
  total: number
  page: number
  pageSize: number
  items: Contract[]
}

interface ContractDetails extends Contract {
  participants?: any[]
  obras?: any[]
  documents?: any[]
}

// ============================================
// Query Keys (para invalidação consistente)
// ============================================

type ListFilters = Partial<ListContractsQueryInput>

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: ListFilters) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
}

// ============================================
// Fetch Functions
// ============================================

async function fetchContracts(params: ListFilters): Promise<ContractsListResponse> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.status) searchParams.set('status', params.status)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))

  const response = await fetch(`/api/contracts?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Erro ao carregar contratos')
  }
  return response.json()
}

async function fetchContractById(id: string): Promise<ContractDetails> {
  const response = await fetch(`/api/contracts/${id}`)
  if (!response.ok) {
    throw new Error('Erro ao carregar contrato')
  }
  return response.json()
}

async function createContract(data: CreateContractInput): Promise<Contract> {
  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao criar contrato')
  }
  return response.json()
}

async function updateContract(id: string, data: Partial<CreateContractInput>): Promise<Contract> {
  const response = await fetch(`/api/contracts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao atualizar contrato')
  }
  return response.json()
}

async function deleteContract(id: string): Promise<void> {
  const response = await fetch(`/api/contracts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao deletar contrato')
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook para listar contratos com cache
 */
export function useContracts(params: ListFilters = {}) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => fetchContracts(params),
    placeholderData: (previousData) => previousData, // Mantém dados anteriores enquanto carrega
  })
}

/**
 * Hook para buscar um contrato específico
 */
export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: contractKeys.detail(id!),
    queryFn: () => fetchContractById(id!),
    enabled: !!id, // Só executa se tiver ID
  })
}

/**
 * Hook para criar contrato
 */
export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      // Invalida todas as listas de contratos para refazer fetch
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })
}

/**
 * Hook para atualizar contrato
 */
export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContractInput> }) =>
      updateContract(id, data),
    onSuccess: (_, { id }) => {
      // Invalida o contrato específico e as listas
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })
}

/**
 * Hook para deletar contrato
 */
export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })
}

/**
 * Hook para prefetch de contrato (útil para hover)
 */
export function usePrefetchContract() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: contractKeys.detail(id),
      queryFn: () => fetchContractById(id),
      staleTime: 60 * 1000, // 1 minuto
    })
  }
}
