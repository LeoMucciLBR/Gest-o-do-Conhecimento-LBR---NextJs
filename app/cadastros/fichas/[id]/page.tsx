'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Calendar,
  Award,
  User,
  Building2,
  FileText,
  GraduationCap,
  Languages,
  Edit,
  Loader2,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target
} from 'lucide-react'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { apiFetch } from '@/lib/api/api'
import Link from 'next/link'

interface Ficha {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  celular: string | null
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  nacionalidade: string | null
  estado_civil: string | null
  genero: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  profissao: string | null
  especialidades: string | null
  registro_profissional: string | null
  resumo_profissional: string | null
  idiomas: string | null
  formacoes: any[]
  experiencias: any[]
  certificados: any[]
  foto_perfil_url: string | null
  observacoes: string | null
  tipo: string
  created_at: string
}

interface Contract {
  id: string
  name: string
  object: string
  status: string
  organization?: { name: string } | null
  role?: string
}

export default function PerfilMembroPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [fichaId, setFichaId] = useState<string>('')

  useEffect(() => {
    async function loadParams() {
      const { id } = await params
      setFichaId(id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!fichaId) return
    
    async function loadData() {
      try {
        setLoading(true)
        const fichaData = await apiFetch<Ficha>(`/fichas/${fichaId}`)
        setFicha(fichaData)
        
        // Buscar contratos que essa pessoa participa
        if (fichaData.nome) {
          try {
            const contractsData = await apiFetch<{ contracts: Contract[] }>(`/equipe/${fichaId}/contracts`)
            setContracts(contractsData.contracts || [])
          } catch {
            // Silently fail if endpoint doesn't exist
          }
        }
      } catch (error) {
        console.error('Erro ao carregar ficha:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [fichaId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#2f4982] to-blue-600 animate-pulse mx-auto mb-6" />
            <Loader2 className="w-8 h-8 text-white animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-3" />
          </div>
          <p className="text-slate-600 dark:text-gray-400 font-medium">Carregando perfil...</p>
        </motion.div>
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-gray-300 mb-2">Perfil não encontrado</h2>
          <p className="text-slate-500 mb-8">O membro solicitado não existe ou foi removido.</p>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    )
  }

  const endereco = [ficha.endereco, ficha.numero, ficha.bairro, ficha.cidade, ficha.estado]
    .filter(Boolean)
    .join(', ')

  const activeContracts = contracts.filter(c => c.status === 'Ativo')
  const inactiveContracts = contracts.filter(c => c.status !== 'Ativo')

  return (
    <div className="relative min-h-screen pb-12">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com botão voltar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-[#2f4982] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Voltar para Equipe</span>
          </button>
        </motion.div>

        {/* Card principal do perfil */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
        >
          {/* Banner superior com padrão */}
          <div className="h-40 sm:h-48 bg-gradient-to-br from-[#2f4982] via-blue-600 to-indigo-700 relative overflow-hidden">
            {/* Padrão decorativo */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />
            </div>
            
            {/* Botão editar */}
            <Link
              href={`/cadastros/fichas/${ficha.id}/editar`}
              className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all border border-white/20"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Editar Perfil</span>
            </Link>
          </div>

          {/* Foto e info principal */}
          <div className="relative px-6 sm:px-10 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-20 sm:-mt-16">
              {/* Avatar */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                {ficha.foto_perfil_url ? (
                  <img
                    src={ficha.foto_perfil_url}
                    alt={ficha.nome}
                    className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-2xl"
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-[#2f4982] via-blue-600 to-indigo-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-2xl">
                    <span className="text-6xl font-bold text-white">
                      {ficha.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {/* Badge de status */}
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold rounded-full shadow-lg">
                  {activeContracts.length} projeto{activeContracts.length !== 1 ? 's' : ''}
                </div>
              </motion.div>

              {/* Nome e info básica */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 text-center sm:text-left pt-4 sm:pt-0 sm:pb-4"
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {ficha.nome}
                </h1>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <span className="text-lg text-[#2f4982] dark:text-blue-400 font-semibold">
                    {ficha.profissao || 'Profissional'}
                  </span>
                  {ficha.especialidades && (
                    <>
                      <span className="hidden sm:inline text-slate-300 dark:text-gray-600">•</span>
                      <span className="text-slate-500 dark:text-gray-400">
                        {ficha.especialidades}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeContracts.length}</p>
            <p className="text-sm text-slate-500 dark:text-gray-400">Projetos Ativos</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{contracts.length}</p>
            <p className="text-sm text-slate-500 dark:text-gray-400">Total Contratos</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{ficha.formacoes?.length || 0}</p>
            <p className="text-sm text-slate-500 dark:text-gray-400">Formações</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{ficha.certificados?.length || 0}</p>
            <p className="text-sm text-slate-500 dark:text-gray-400">Certificados</p>
          </div>
        </motion.div>

        {/* Contratos Ativos */}
        {activeContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              Contratos em Andamento
            </h2>
            <div className="grid gap-4">
              {activeContracts.map((contract, i) => (
                <Link
                  key={`${contract.id}-${i}`}
                  href={`/contratos/${contract.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-gradient-to-r hover:from-[#2f4982]/10 hover:to-blue-600/10 border border-transparent hover:border-[#2f4982]/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2f4982] to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#2f4982] transition-colors">
                      {contract.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                      {contract.organization?.name || contract.object}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-[#2f4982] transition-colors">
                    <span className="text-sm font-medium hidden sm:inline">Ver contrato</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grid de informações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Phone className="w-5 h-5 text-[#2f4982]" />
              </div>
              Informações de Contato
            </h2>
            <div className="space-y-4">
              {ficha.email && (
                <a href={`mailto:${ficha.email}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-[#2f4982]/10 transition-colors">
                    <Mail className="w-5 h-5 text-slate-500 group-hover:text-[#2f4982] transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Email</p>
                    <p className="text-slate-700 dark:text-gray-300 group-hover:text-[#2f4982] transition-colors">{ficha.email}</p>
                  </div>
                </a>
              )}
              {ficha.celular && (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Celular</p>
                    <p className="text-slate-700 dark:text-gray-300">{ficha.celular}</p>
                  </div>
                </div>
              )}
              {endereco && (
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Endereço</p>
                    <p className="text-slate-700 dark:text-gray-300">{endereco}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Dados Profissionais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              Dados Profissionais
            </h2>
            <div className="space-y-4">
              {ficha.registro_profissional && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-gray-700/50">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Registro Profissional</p>
                    <p className="text-slate-700 dark:text-gray-300 font-medium">{ficha.registro_profissional}</p>
                  </div>
                </div>
              )}
              {ficha.idiomas && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-gray-700/50">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-600 flex items-center justify-center">
                    <Languages className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Idiomas</p>
                    <p className="text-slate-700 dark:text-gray-300">{ficha.idiomas}</p>
                  </div>
                </div>
              )}
              {!ficha.registro_profissional && !ficha.idiomas && (
                <p className="text-slate-400 text-center py-4">Nenhuma informação cadastrada</p>
              )}
            </div>
          </motion.div>

          {/* Resumo Profissional */}
          {ficha.resumo_profissional && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                Resumo Profissional
              </h2>
              <p className="text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {ficha.resumo_profissional}
              </p>
            </motion.div>
          )}

          {/* Formações */}
          {ficha.formacoes && ficha.formacoes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                </div>
                Formação Acadêmica
              </h2>
              <div className="space-y-4">
                {ficha.formacoes.map((f: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-[#2f4982]">
                    <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-[#2f4982] -translate-x-[7px]" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">{f.curso || f.titulo}</h3>
                    <p className="text-sm text-[#2f4982]">{f.instituicao}</p>
                    {f.ano && <p className="text-xs text-slate-500 mt-1">{f.ano}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certificados */}
          {ficha.certificados && ficha.certificados.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                  <Award className="w-5 h-5 text-rose-600" />
                </div>
                Certificações
              </h2>
              <div className="grid gap-3">
                {ficha.certificados.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-transparent dark:from-rose-900/20 rounded-xl">
                    <Award className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-gray-300">{c.nome || c.titulo}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Observações */}
        {ficha.observacoes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800"
          >
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Observações
            </h2>
            <p className="text-amber-800 dark:text-amber-300 whitespace-pre-wrap">
              {ficha.observacoes}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
