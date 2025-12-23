'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import ContractCard, { UiContract } from '@/components/ui/ContractCard'
import AddContractCard from '@/components/ui/AddContractCard'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { apiFetch } from '@/lib/api/api'
import { useOfflineContracts, useOfflineState } from '@/lib/offline/hooks/useOfflineContracts'

/** Modelo vindo da API ou Cache */
type ApiContract = {
  id: string
  name?: string | null
  object?: string | null
  status: 'Ativo' | 'Inativo' | 'Pendente' | string
  created_at?: string
  image_url?: string | null
  lamina_url?: string | null
  organization?: { id: string; name: string | null } | null
  organizationName?: string | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
  creatorName?: string | null
}

function mapToUi(api: ApiContract): UiContract {
  return {
    id: api.id,
    name: api.name ?? '',
    organization: api.organization ? {
      id: api.organization.id,
      name: api.organization.name ?? ''
    } : api.organizationName ? {
      id: '',
      name: api.organizationName
    } : null,
    status: api.status as 'Ativo' | 'Inativo' | 'Pendente',
    data_inicio: null,
    data_fim: null,
    valor: null,
    image_url: api.image_url ?? api.lamina_url ?? null,
    object: api.object ?? '',
    creator: api.creator || (api.creatorName ? { id: '', name: api.creatorName, email: '' } : null),
  }
}

export default function Contratos() {
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [contractsWithNotifications, setContractsWithNotifications] = useState<Set<string>>(new Set())
  const [navigatingId, setNavigatingId] = useState<string | null>(null)
  
  // ============================================
  // HOOKS OFFLINE - Usa cache IndexedDB primeiro
  // ============================================
  const { 
    contracts: offlineContracts, 
    isLoading: offlineLoading, 
    isSyncing,
    error: offlineError,
    refetch 
  } = useOfflineContracts({ 
    status: 'Ativo',
    search: searchTerm.trim() || undefined
  })
  
  // isHydrated evita hydration mismatch - só mostra banner offline após hydration
  const { isOnline, pendingOperations, isHydrated } = useOfflineState()
  
  // Mapeia contratos para UI
  const items = useMemo(() => {
    if (!offlineContracts?.length) return []
    return offlineContracts
      .map(c => mapToUi(c as unknown as ApiContract))
      .filter(c => c.status === 'Ativo')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [offlineContracts])
  
  // Get current user from session (com fallback localStorage)
  useEffect(() => {
    // Primeiro tenta do localStorage
    const savedUserId = localStorage.getItem('currentUserId')
    if (savedUserId) setCurrentUserId(savedUserId)
    
    // Se online, atualiza do servidor
    if (isHydrated && isOnline) {
      apiFetch('/auth/session')
        .then((session: any) => {
          if (session?.user?.id) {
            setCurrentUserId(session.user.id)
            localStorage.setItem('currentUserId', session.user.id)
          }
        })
        .catch(() => {
          // Ignora erros - usa dado do localStorage
        })
    }
  }, [isHydrated, isOnline])

  // Buscar notificações (só quando online e hidratado)
  useEffect(() => {
    if (!isHydrated || !isOnline) return
    
    apiFetch('/contracts/notifications')
      .then((data: any) => {
        const ids = new Set<string>(data.items?.map((n: any) => n.contractId) || [])
        setContractsWithNotifications(ids)
      })
      .catch(() => {
        // Ignora erros - notificações são opcionais
      })
  }, [isHydrated, isOnline])

  // Marca notificação como lida ao clicar no card
  const handleCardClick = useCallback(async (contractId: string) => {
    // Mostrar loading imediato
    setNavigatingId(contractId)
    
    if (isOnline) {
      apiFetch(`/contracts/${contractId}/mark-read`, { method: 'POST' })
        .then(() => {
          setContractsWithNotifications(prev => {
            const newSet = new Set(prev)
            newSet.delete(contractId)
            return newSet
          })
        })
        .catch(() => {})
    }
    
    router.push(`/contratos/${contractId}`)
  }, [isOnline, router])

  const filteredContracts = items

  const cardsToRender = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredContracts.map((c, idx) => (
        <div 
          key={c.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
        >
          <ContractCard 
            contract={c} 
            currentUserId={currentUserId}
            hasNotification={contractsWithNotifications.has(c.id)}
            onCardClick={handleCardClick}
          />
        </div>
      ))
    }
    return [
      <div 
        key="add"
        className="animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}
      >
        <AddContractCard onClick={() => router.push('/engenharia/cadastrocontratos')} />
      </div>,
      ...filteredContracts.map((c, idx) => (
        <div 
          key={c.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${(idx + 1) * 50}ms`, animationFillMode: 'backwards' }}
        >
          <ContractCard 
            contract={c} 
            currentUserId={currentUserId}
            hasNotification={contractsWithNotifications.has(c.id)}
            onCardClick={handleCardClick}
          />
        </div>
      )),
    ]
  }, [filteredContracts, searchTerm, router, currentUserId, contractsWithNotifications, handleCardClick])

  // Só mostra banner offline após hydration para evitar hydration mismatch
  const showOfflineBanner = isHydrated && !isOnline
  const showSyncingBanner = isHydrated && isSyncing && isOnline

  return (
    <div className="relative text-center duration-300 ease-in-out min-h-screen">
      <AnimatedBackground />

      {/* Loading Overlay - aparece imediatamente ao clicar em um contrato */}
      {navigatingId && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-16 h-16 text-[#2f4982] animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#2f4982] dark:text-blue-400">Abrindo contrato...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
          </div>
        </div>
      )}
      {showOfflineBanner && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>Você está offline - Mostrando dados em cache</span>
          {pendingOperations > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs ml-2">
              {pendingOperations} pendente{pendingOperations > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Indicador de Sincronização */}
      {showSyncingBanner && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Sincronizando...</span>
        </div>
      )}

      {/* Header decorativo */}
      <div className="relative mb-8 pt-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#2f4982] via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 animate-in fade-in slide-in-from-top-4 duration-700">
          Contratos
        </h1>
      </div>

      {/* Barra de busca */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10 animate-in fade-in slide-in-from-top-8 duration-700" style={{ animationDelay: '200ms' }}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2f4982] to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
          
          <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2f4982] dark:hover:border-blue-500 focus-within:border-[#2f4982] dark:focus-within:border-blue-500 transition-all shadow-lg hover:shadow-xl">
            <Search size={22} className="text-gray-400 dark:text-gray-500 flex-shrink-0 group-focus-within:text-[#2f4982] dark:group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, objeto ou contratante..."
              className="flex-1 ml-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Limpar busca"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Área de conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {offlineLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#2f4982] dark:text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">Carregando contratos...</p>
          </div>
        )}

        {offlineError && !offlineLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-6xl mb-4">{isOnline ? '⚠️' : '📴'}</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {isOnline ? 'Erro ao carregar' : 'Sem dados em cache'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md text-center mb-4">
              {isOnline 
                ? 'Ocorreu um erro ao carregar os contratos.' 
                : 'Conecte-se à internet para carregar os contratos pela primeira vez.'}
            </p>
            {isOnline && (
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            )}
          </div>
        )}

        {!offlineLoading && !offlineError && (
          <>
            {filteredContracts.length > 0 || !searchTerm.trim() ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-14 pt-12">
                {cardsToRender}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative text-7xl">🔍</div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                  Nenhum contrato encontrado
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-sm sm:text-base">
                  Não encontramos contratos que correspondam à sua busca.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Limpar Busca
                </button>
              </div>
            )}
          </>
        )}

        {/* Info sobre dados em cache quando offline */}
        {showOfflineBanner && items.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Mostrando {items.length} contrato{items.length > 1 ? 's' : ''} do cache local</p>
          </div>
        )}
      </div>
    </div>
  )
}
