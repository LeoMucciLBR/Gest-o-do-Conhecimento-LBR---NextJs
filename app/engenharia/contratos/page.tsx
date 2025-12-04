'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
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
}

function mapToUi(api: ApiContract): UiContract {
  return {
    id: api.id,
    nome: api.name ?? '',
    objeto: api.object ?? '',
    nomeContrato: api.organization?.name ?? '',
    status: api.status,
    imagemUrl: api.image_url ?? api.lamina_url ?? null,
  }
}

export default function Contratos() {
  const router = useRouter()

  const [items, setItems] = useState<UiContract[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [err, setErr] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
          .sort((a, b) => a.nome.localeCompare(b.nome))

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

  const filteredContracts = items

  const cardsToRender = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredContracts.map((c) => (
        <ContractCard key={c.id} contract={c} />
      ))
    }
    return [
      <AddContractCard
        key="add"
        onClick={() => router.push('/engenharia/cadastrocontratos')}
      />,
      ...filteredContracts.map((c) => <ContractCard key={c.id} contract={c} />),
    ]
  }, [filteredContracts, searchTerm, router])

  return (
    <div className="relative text-center duration-300 ease-in-out">
      <AnimatedBackground />
      <h1 className="text-6xl font-bold mb-6 text-lbr-primary dark:text-blue-400">
        Contratos
      </h1>

      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border-2 border-transparent hover:border-lbr-primary dark:hover:border-blue-400 focus-within:border-lbr-primary dark:focus-within:border-blue-400 transition-colors shadow-sm">
          <Search size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, objeto ou contratante..."
            className="flex-1 ml-3 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {loading && (
          <div className="py-16 text-gray-600 dark:text-gray-400">
            Carregando contratos…
          </div>
        )}
        {err && !loading && (
          <div className="py-16 text-red-600 dark:text-red-400">Erro: {err}</div>
        )}

        {!loading && !err && (
          <>
            {filteredContracts.length > 0 || !searchTerm.trim() ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-300">
                {cardsToRender}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Nenhum contrato encontrado
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Tente ajustar seus critérios de busca ou limpe o campo para
                  ver todos.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
