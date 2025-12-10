'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import ContractCard, { UiContract } from '@/components/ui/ContractCard'
import AddContractCard from '@/components/ui/AddContractCard'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { apiFetch } from '@/lib/api/api'

/** Modelo vindo da API */
type ApiContract = {
  id: string
  name?: string | null
  object?: string | null
  status: 'Ativo' | 'Inativo' | 'Pendente'
  created_at?: string
  image_url?: string | null
  lamina_url?: string | null
  organization?: { id: string; name: string | null } | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
}

function mapToUi(api: ApiContract): UiContract {
  return {
    id: api.id,
    name: api.name ?? '',
    organization: api.organization ? {
      id: api.organization.id,
      name: api.organization.name ?? ''
    } : null,
    status: api.status,
    data_inicio: null,
    data_fim: null,
    valor: null,
    image_url: api.image_url ?? api.lamina_url ?? null,
    object: api.object ?? '',
    creator: api.creator || null,
  }
}

export default function Contratos() {
  const router = useRouter()

  const [items, setItems] = useState<UiContract[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [err, setErr] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()

  useEffect(() => {
    let cancel = false

    async function run() {
      try {
        setLoading(true)
        setErr(null)

        const params = new URLSearchParams()
        if (searchTerm.trim()) params.set('q', searchTerm.trim())
        params.set('pageSize', '500')
        params.set('status', 'Ativo')

        const url = `/contracts?${params.toString()}`
        const data: any = await apiFetch(url)

        // Normaliza para array
        const list: unknown = Array.isArray(data) ? data : data?.items

        if (!Array.isArray(list)) {
          console.error('Payload inesperado de /contracts:', data)
          throw new Error(
            'Formato inesperado da API: esperado array ou { items: [] }.'
          )
        }

        const mapped = (list as ApiContract[])
          .map(mapToUi)
          .filter((c) => c.status === 'Ativo')
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!cancel) setItems(mapped)
      } catch (e: any) {
        if (!cancel) setErr(e?.message || 'Falha ao carregar contratos')
      } finally {
        if (!cancel) setLoading(false)
      }
    }

    run()
    return () => {
      cancel = true
    }
  }, [searchTerm])

  // Get current user from session
  useEffect(() => {
    async function getUser() {
      try {
        const session: any = await apiFetch('/auth/session')
        if (session?.user?.id) {
          setCurrentUserId(session.user.id)
        }
      } catch (e) {
        console.error('Failed to get session:', e)
      }
    }
    getUser()
  }, [])

  const filteredContracts = items

  const cardsToRender = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredContracts.map((c, idx) => (
        <div 
          key={c.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
        >
          <ContractCard contract={c} currentUserId={currentUserId} />
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
          <ContractCard contract={c} currentUserId={currentUserId} />
        </div>
      )),
    ]
  }, [filteredContracts, searchTerm, router, currentUserId])

  return (
    <div className="relative text-center duration-300 ease-in-out min-h-screen">
      <AnimatedBackground />

      {/* Header decorativo */}
      <div className="relative mb-8 pt-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#2f4982] via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 animate-in fade-in slide-in-from-top-4 duration-700">
          Contratos
        </h1>

      </div>

      {/* Barra de busca com estilo melhorado */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10 animate-in fade-in slide-in-from-top-8 duration-700" style={{ animationDelay: '200ms' }}>
        <div className="relative group">
          {/* Efeito glow */}
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#2f4982] dark:text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">Carregando contratos...</p>
          </div>
        )}

        {err && !loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Erro ao carregar
            </h2>
            <p className="text-red-600 dark:text-red-400 max-w-md text-center">
              {err}
            </p>
          </div>
        )}

        {!loading && !err && (
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
                  Tente ajustar os critérios ou limpe o campo para ver todos.
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
      </div>
    </div>
  )
}
