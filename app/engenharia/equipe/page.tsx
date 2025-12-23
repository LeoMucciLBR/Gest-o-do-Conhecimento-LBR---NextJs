'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Briefcase, 
  Mail, 
  Phone,
  Filter,
  UserCircle,
  TrendingUp,
  Building2,
  ChevronRight,
  Loader2,
  Star,
  Award
} from 'lucide-react'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { apiFetch } from '@/lib/api/api'
import Link from 'next/link'

interface TeamMember {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  celular: string | null
  profissao: string | null
  especialidades: string | null
  foto_perfil_url: string | null
  area: string | null
  contractsCount: number
  created_at: string
}

interface Stats {
  total: number
  byProfissao: Record<string, number>
  withActiveContracts: number
}

export default function EquipePage() {
  const [membros, setMembros] = useState<TeamMember[]>([])
  const [profissoes, setProfissoes] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProfissao, setFilterProfissao] = useState('')

  useEffect(() => {
    async function loadEquipe() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (filterProfissao) params.set('profissao', filterProfissao)
        
        const data = await apiFetch<{
          membros: TeamMember[]
          profissoes: string[]
          stats: Stats
        }>(`/equipe?${params.toString()}`)
        
        setMembros(data.membros)
        setProfissoes(data.profissoes)
        setStats(data.stats)
      } catch (error) {
        console.error('Erro ao carregar equipe:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const debounce = setTimeout(loadEquipe, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, filterProfissao])

  // Filtrar membros localmente também (para resposta instantânea)
  const filteredMembros = useMemo(() => {
    return membros.filter(m => {
      const matchSearch = !searchTerm || 
        m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.profissao?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchProfissao = !filterProfissao || m.profissao === filterProfissao
      return matchSearch && matchProfissao
    })
  }, [membros, searchTerm, filterProfissao])

  const getActivityColor = () => {
    return 'from-[#2f4982] to-blue-600'
  }

  const getActivityLabel = (count: number) => {
    if (count >= 5) return 'Alta demanda'
    if (count >= 3) return 'Ativo'
    if (count >= 1) return 'Moderado'
    return 'Disponível'
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      {/* Header com gradiente */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Título animado */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#2f4982] to-blue-600 shadow-lg shadow-blue-500/25">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2f4982] via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Equipe LBR
                </h1>
                <p className="text-slate-600 dark:text-gray-400 text-lg mt-1">
                  Conheça os profissionais que fazem a diferença
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {/* Total de membros */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#2f4982] to-blue-600 shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Total de Membros</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.total || 0}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2f4982] to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>

            {/* Com contratos ativos */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Em Projetos Ativos</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.withActiveContracts || 0}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>

            {/* Especialidades */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Especialidades</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{profissoes.length}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou profissão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#2f4982] focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
            </div>

            {/* Filtro por profissão */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterProfissao}
                onChange={(e) => setFilterProfissao(e.target.value)}
                className="pl-12 pr-10 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2f4982] focus:border-transparent transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">Todas as profissões</option>
                {profissoes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#2f4982] animate-spin" />
              <span className="ml-4 text-lg text-slate-600 dark:text-gray-400">Carregando equipe...</span>
            </div>
          )}

          {/* Grid de Cards */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12"
            >
              <AnimatePresence mode="popLayout">
                {filteredMembros.map((membro, index) => (
                  <motion.div
                    key={membro.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                      {/* Barra superior colorida */}
                      <div className={`h-2 bg-gradient-to-r ${getActivityColor()}`} />
                      
                      {/* Conteúdo do card */}
                      <div className="p-6">
                        {/* Avatar e nome */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative">
                            {membro.foto_perfil_url ? (
                              <img
                                src={membro.foto_perfil_url}
                                alt={membro.nome}
                                className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-[#2f4982]/30 transition-all"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2f4982] to-blue-600 flex items-center justify-center ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-[#2f4982]/30 transition-all">
                                <span className="text-2xl font-bold text-white">
                                  {membro.nome?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            {membro.contractsCount >= 3 && (
                              <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#2f4982] transition-colors leading-tight">
                              {membro.nome}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                              {membro.profissao || 'Profissão não informada'}
                            </p>
                          </div>
                        </div>

                        {/* Info de contato */}
                        <div className="space-y-2 mb-4">
                          {membro.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{membro.email}</span>
                            </div>
                          )}
                          {(membro.telefone || membro.celular) && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span>{membro.celular || membro.telefone}</span>
                            </div>
                          )}
                        </div>

                        {/* Badge de contratos */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-gray-300">
                              {membro.contractsCount} contrato{membro.contractsCount !== 1 ? 's' : ''} ativo{membro.contractsCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getActivityColor()} text-white`}>
                            {getActivityLabel(membro.contractsCount)}
                          </span>
                        </div>
                      </div>

                      {/* Hover overlay para ver mais */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2f4982]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 pointer-events-none">
                        <Link 
                          href={`/cadastros/fichas/${membro.id}`}
                          className="px-4 py-2 bg-white rounded-lg text-[#2f4982] font-semibold text-sm flex items-center gap-2 shadow-lg hover:bg-gray-50 transition-colors pointer-events-auto"
                        >
                          Ver perfil completo
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {filteredMembros.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-300 mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-slate-500 dark:text-gray-400">
                    {searchTerm || filterProfissao 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Adicione membros à equipe para visualizá-los aqui'}
                  </p>
                  <Link
                    href="/cadastros?tab=equipe"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Users className="w-5 h-5" />
                    Gerenciar Equipe
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Botão flutuante para adicionar */}
          <Link
            href="/cadastros?tab=equipe"
            className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-full shadow-2xl hover:shadow-[#2f4982]/40 hover:-translate-y-1 transition-all duration-300 z-50 group"
          >
            <Building2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
