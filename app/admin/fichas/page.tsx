'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Download,
  Plus,
  ArrowLeft,
  Filter,
  UserCircle2,
} from 'lucide-react'
import AnimatedBackground from '@/components/ui/AnimatedBackground'

interface Ficha {
  id: string
  nome: string
  email: string | null
  profissao: string | null
  telefone: string | null
  celular: string | null
  foto_perfil_url: string | null
  created_at: string
  updated_at: string
}

interface FichasResponse {
  fichas: Ficha[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function VisualizacaoFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [searchNome, setSearchNome] = useState('')
  const [searchCargo, setSearchCargo] = useState('')
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchFichas()
  }, [searchNome, searchCargo, pagination.page])

  const fetchFichas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '50'
      })
      
      if (searchNome) params.append('search', searchNome)
      if (searchCargo) params.append('profissao', searchCargo)

      const res = await fetch(`/api/fichas?${params}`)
      if (!res.ok) throw new Error('Failed to fetch fichas')
      
      const data: FichasResponse = await res.json()
      setFichas(data.fichas)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching fichas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique professions for filter
  const profissoes = Array.from(new Set(fichas.map((f) => f.profissao).filter(Boolean))).sort()

  const handleDeletar = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar a ficha de ${nome}?`)) return

    try {
      const res = await fetch(`/api/fichas/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete ficha')

      await fetchFichas()
    } catch (error) {
      console.error('Error deleting ficha:', error)
      alert('Erro ao deletar ficha')
    }
  }

  const handleDownloadPDF = (ficha: Ficha) => {
    // TODO: Implement PDF generation
    console.log('Download PDF:', ficha.id)
    alert(`Download da ficha de ${ficha.nome} em desenvolvimento!`)
  }

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-slate-50/50 via-white/30 to-slate-100/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50 backdrop-blur-sm">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fichas Cadastradas</h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Visualize e gerencie todas as fichas pessoais</p>
            </div>
          </div>
          <Link
            href="/admin/fichas/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Nova Ficha
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchNome}
                onChange={(e) => {
                  setSearchNome(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-all font-medium flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Filtrar por Cargo
                  </label>
                  <select
                    value={searchCargo}
                    onChange={(e) => {
                      setSearchCargo(e.target.value)
                      setPagination(prev => ({ ...prev, page: 1 }))
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    <option value="">Todos os cargos</option>
                    {profissoes.map((prof) => (
                      <option key={prof} value={prof || ''}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchNome('')
                      setSearchCargo('')
                      setShowFilters(false)
                      setPagination(prev => ({ ...prev, page: 1 }))
                    }}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-all font-medium"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Mostrando <span className="font-semibold">{fichas.length}</span> de{' '}
              <span className="font-semibold">{pagination.total}</span> fichas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('grid')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewType === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-600'
                }`}
              >
                Grade
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewType === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-600'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-gray-400">Carregando fichas...</p>
          </div>
        ) : fichas.length > 0 ? (
          <>
            {/* GRID VIEW */}
            {viewType === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fichas.map((ficha) => (
                  <div
                    key={ficha.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-gray-600 transition-all group"
                  >
                    {/* Card Header */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-700"></div>

                    {/* Card Body */}
                    <div className="px-6 pb-6">
                      {/* Avatar */}
                      <div className="flex justify-center -mt-12 mb-4">
                        {ficha.foto_perfil_url ? (
                          <img
                            src={ficha.foto_perfil_url}
                            alt={ficha.nome}
                            className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white dark:border-gray-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {ficha.nome.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
                        {ficha.nome}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium text-center mb-4">
                        {ficha.profissao || 'Sem profissão cadastrada'}
                      </p>

                      {/* Details */}
                      <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-gray-400">
                        {ficha.email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span className="truncate">{ficha.email}</span>
                          </div>
                        )}
                        {(ficha.telefone || ficha.celular) && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Telefone:</span>
                            <span>{ficha.celular || ficha.telefone}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-gray-500">
                          Atualizado em {new Date(ficha.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/fichas/${ficha.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Visualizar
                        </Link>
                        <Link
                          href={`/admin/fichas/${ficha.id}/editar`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-all font-medium text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeletar(ficha.id, ficha.nome)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TABLE VIEW */}
            {viewType === 'table' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                {/* Table content - similar to grid but in table format */}
                <div className="divide-y divide-slate-200 dark:divide-gray-700">
                  {fichas.map((ficha) => (
                    <div
                      key={ficha.id}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {ficha.foto_perfil_url ? (
                            <img
                              src={ficha.foto_perfil_url}
                              alt={ficha.nome}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                              {ficha.nome.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{ficha.nome}</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{ficha.profissao || 'Sem profissão'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/fichas/${ficha.id}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/admin/fichas/${ficha.id}/editar`}
                            className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition-all"
                          >
                            <Edit2 className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDeletar(ficha.id, ficha.nome)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(ficha)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-slate-600 dark:text-gray-400">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-700 mb-4">
              <UserCircle2 className="w-8 h-8 text-slate-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma ficha encontrada</h3>
            <p className="text-slate-600 dark:text-gray-400 mb-6">Tente ajustar seus filtros ou crie uma nova ficha</p>
            <Link
              href="/admin/fichas/novo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Criar Nova Ficha
            </Link>
          </div>
        )}
      </main>
    </div>
    </>
  )
}
