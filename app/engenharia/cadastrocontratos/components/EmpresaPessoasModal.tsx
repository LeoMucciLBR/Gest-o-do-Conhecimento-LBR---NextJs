'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Loader2, 
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Search
} from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { toast } from 'sonner'
import { useCustomAlert } from '@/components/ui/CustomAlert'

interface Pessoa {
  id: string
  full_name: string
  email?: string
  phone?: string
  office?: string
  role?: string
  created_at?: string
}

interface Empresa {
  id: string
  nome: string
  tipo: string
}

interface FichaInterna {
  id: string
  nome: string
  email?: string
  celular?: string
  telefone?: string
  profissao?: string
  foto_perfil_url?: string
}

interface EmpresaPessoasModalProps {
  isOpen: boolean
  onClose: () => void
  empresaNome: string
  empresaId?: string
  isLBR?: boolean
}

export default function EmpresaPessoasModal({
  isOpen,
  onClose,
  empresaNome,
  empresaId,
  isLBR = false
}: EmpresaPessoasModalProps) {
  // Calculate isLBR directly from empresaNome to ensure it works correctly
  const effectiveIsLBR = empresaNome.toUpperCase().includes('LBR')
  
  const { showConfirm } = useCustomAlert()
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [empresaInfo, setEmpresaInfo] = useState<Empresa | null>(null)

  // LBR internal people states
  const [fichasInternas, setFichasInternas] = useState<FichaInterna[]>([])
  const [loadingFichas, setLoadingFichas] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFicha, setSelectedFicha] = useState<FichaInterna | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    office: '',
    role: ''
  })

  // Load pessoas when modal opens
  useEffect(() => {
    if (isOpen && empresaId) {
      loadPessoas()
    } else if (isOpen && !empresaId) {
      // No empresaId - show empty state
      setLoading(false)
      setPessoas([])
    }
    
    // Reset showAddForm when modal opens/closes
    if (!isOpen) {
      setShowAddForm(false)
      setSearchTerm('')
    }
  }, [isOpen, empresaId])

  // Load internal people (fichas) when LBR and modal opens
  useEffect(() => {
    if (isOpen && effectiveIsLBR && showAddForm) {
      loadFichasInternas()
    }
  }, [isOpen, effectiveIsLBR, showAddForm, searchTerm])

  const loadFichasInternas = async () => {
    try {
      setLoadingFichas(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      const data = await apiFetch<{ fichas: FichaInterna[] }>(`/fichas?${params.toString()}`)
      // Filter only INTERNA type and exclude already added people
      const existingNames = pessoas.map(p => p.full_name.toLowerCase())
      const filtered = (data.fichas || [])
        .filter(f => (f as any).tipo === 'INTERNA')
        .filter(f => !existingNames.includes(f.nome.toLowerCase()))
      setFichasInternas(filtered)
    } catch (error) {
      console.error('Error loading fichas internas:', error)
    } finally {
      setLoadingFichas(false)
    }
  }

  const loadPessoas = async () => {
    if (!empresaId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const data = await apiFetch<{ empresa: Empresa; pessoas: Pessoa[] }>(`/empresas/${empresaId}/pessoas`)
      setEmpresaInfo(data.empresa)
      setPessoas(data.pessoas || [])
    } catch (error) {
      console.error('Error loading pessoas:', error)
      toast.error('Erro ao carregar pessoas')
    } finally {
      setLoading(false)
    }
  }

  // Add internal person from ficha
  const handleAddFromFicha = async (ficha: FichaInterna) => {
    if (!empresaId) {
      toast.error('Empresa não encontrada')
      return
    }

    try {
      setSubmitting(true)
      const pessoaData = {
        full_name: ficha.nome,
        email: ficha.email || '',
        phone: ficha.celular || ficha.telefone || '',
        office: '',
        role: ficha.profissao || ''
      }
      
      const data = await apiFetch<{ pessoa: Pessoa }>(`/empresas/${empresaId}/pessoas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pessoaData)
      })

      setPessoas([...pessoas, data.pessoa])
      setShowAddForm(false)
      setSearchTerm('')
      setSelectedFicha(null)
      toast.success('Pessoa adicionada com sucesso!')
    } catch (error) {
      console.error('Error adding pessoa from ficha:', error)
      toast.error('Erro ao adicionar pessoa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPessoa = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSubmitting(true)
      const data = await apiFetch<{ pessoa: Pessoa }>(`/empresas/${empresaId}/pessoas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      setPessoas([...pessoas, data.pessoa])
      setFormData({ full_name: '', email: '', phone: '', office: '', role: '' })
      setShowAddForm(false)
      toast.success('Pessoa adicionada com sucesso!')
    } catch (error) {
      console.error('Error adding pessoa:', error)
      toast.error('Erro ao adicionar pessoa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemovePessoa = async (pessoaId: string, pessoaNome: string) => {
    const confirmed = await showConfirm({
      title: 'Remover Pessoa',
      message: `Deseja remover "${pessoaNome}" da empresa?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      isDangerous: true
    })
    if (!confirmed) return

    try {
      await apiFetch(`/empresas/${empresaId}/pessoas?pessoaId=${pessoaId}`, {
        method: 'DELETE'
      })
      setPessoas(pessoas.filter(p => p.id !== pessoaId))
      toast.success('Pessoa removida')
    } catch (error) {
      console.error('Error removing pessoa:', error)
      toast.error('Erro ao remover pessoa')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2f4982] to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{empresaNome}</h2>
                  <p className="text-blue-100 text-sm">Pessoas da empresa</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#2f4982]" />
              </div>
            ) : (
              <>
                {/* Add Person Button */}
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full mb-6 p-4 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl hover:border-[#2f4982] hover:bg-slate-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:text-[#2f4982]"
                  >
                    {effectiveIsLBR ? (
                      <>
                        <Search className="w-5 h-5" />
                        <span className="font-semibold">Buscar Pessoa da Equipe LBR</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="font-semibold">Adicionar Pessoa</span>
                      </>
                    )}
                  </button>
                )}

                {/* Add Person Form - LBR mode: search internal people */}
                <AnimatePresence>
                  {showAddForm && effectiveIsLBR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl border-2 border-[#2f4982]/20"
                    >
                      <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-[#2f4982]" />
                        Buscar Pessoa LBR
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                        Busque e selecione um membro da equipe LBR para adicionar.
                      </p>
                      
                      {/* Search Input */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                          placeholder="Buscar por nome..."
                        />
                      </div>

                      {/* Internal People List */}
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {loadingFichas ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-[#2f4982]" />
                          </div>
                        ) : fichasInternas.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {searchTerm 
                                ? 'Nenhuma pessoa encontrada' 
                                : 'Digite para buscar membros da equipe'
                              }
                            </p>
                          </div>
                        ) : (
                          fichasInternas.map((ficha) => (
                            <button
                              key={ficha.id}
                              onClick={() => handleAddFromFicha(ficha)}
                              disabled={submitting}
                              className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-gray-600 hover:border-[#2f4982] hover:shadow-md transition-all flex items-center gap-3 text-left disabled:opacity-50"
                            >
                              {ficha.foto_perfil_url ? (
                                <img 
                                  src={ficha.foto_perfil_url} 
                                  alt="" 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {ficha.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {ficha.nome}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                                  {ficha.profissao || ficha.email || 'Equipe LBR'}
                                </p>
                              </div>
                              <Plus className="w-5 h-5 text-[#2f4982] flex-shrink-0" />
                            </button>
                          ))
                        )}
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setShowAddForm(false)
                            setSearchTerm('')
                          }}
                          className="w-full px-4 py-2.5 bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Person Form - Normal mode: manual input */}
                <AnimatePresence>
                  {showAddForm && !effectiveIsLBR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl border-2 border-[#2f4982]/20"
                    >
                      <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#2f4982]" />
                        Nova Pessoa
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                            placeholder="Nome da pessoa"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            <Mail className="w-4 h-4 inline mr-1" /> Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" /> Telefone
                          </label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            <Briefcase className="w-4 h-4 inline mr-1" /> Cargo
                          </label>
                          <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                            placeholder="Ex: Diretor, Engenheiro"
                          />
                        </div>
                        </div>
                      
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleAddPessoa}
                          disabled={submitting}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                          {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              Adicionar
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* People List */}
                {pessoas.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#2f4982]" />
                      Pessoas ({pessoas.length})
                    </h3>
                    
                    {pessoas.map((pessoa) => (
                      <motion.div
                        key={pessoa.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {pessoa.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {pessoa.full_name}
                              </h4>
                              {pessoa.role && (
                                <p className="text-sm text-slate-500 dark:text-gray-400">{pessoa.role}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-gray-400">
                                {pessoa.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {pessoa.email}
                                  </span>
                                )}
                                {pessoa.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {pessoa.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePessoa(pessoa.id, pessoa.full_name)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover pessoa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : !showAddForm && (
                  <div className="text-center py-12 text-slate-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma pessoa cadastrada</p>
                    <p className="text-sm">Clique no botão acima para adicionar</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
