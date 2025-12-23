'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  FileText,
  Loader2,
  Calendar,
  Building,
  Copy,
  Check,
  Home,
  Hash,
  Globe,
  Heart,
  Users,
  BookOpen,
  Star,
} from 'lucide-react'

interface PersonViewModalProps {
  isOpen: boolean
  onClose: () => void
  person: {
    id?: string
    full_name: string
    email?: string | null
    phone?: string | null
    office?: string | null
  }
  type: 'INTERNA' | 'CLIENTE'
  role?: string
  customRole?: string | null
}

export default function PersonViewModal({
  isOpen,
  onClose,
  person,
  type,
  role,
  customRole,
}: PersonViewModalProps) {
  const [mounted, setMounted] = useState(false)
  const [fichaData, setFichaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadFichaData = async () => {
      if (!isOpen || !person.full_name || type !== 'INTERNA') return

      setLoading(true)
      setFichaData(null)

      try {
        const res = await fetch(`/api/fichas?search=${encodeURIComponent(person.full_name)}`)
        if (res.ok) {
          const data = await res.json()
          console.log('Ficha data loaded:', data)
          if (data.fichas?.length > 0) {
            let match = data.fichas.find(
              (f: any) => f.nome?.toLowerCase().trim() === person.full_name?.toLowerCase().trim()
            )
            if (!match) match = data.fichas[0]
            if (match) {
              // Se encontrou um match, buscar a ficha completa pelo ID
              try {
                const fullFichaRes = await fetch(`/api/fichas/${match.id}`)
                if (fullFichaRes.ok) {
                  const fullFicha = await fullFichaRes.json()
                  console.log('Full ficha data:', fullFicha)
                  setFichaData(fullFicha)
                } else {
                  setFichaData(match)
                }
              } catch {
                setFichaData(match)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading ficha:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFichaData()
  }, [isOpen, person.full_name, type])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  const displayRole = customRole || role || 'Participante'
  const isEquipe = type === 'INTERNA'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  // Cliente - Modal limpo e profissional
  const ClienteModal = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Botão fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="pt-8 pb-6 px-6 text-center">
        {/* Avatar */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2f4982] to-blue-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-[#2f4982]/20"
        >
          {getInitials(person.full_name)}
        </motion.div>

        {/* Nome */}
        <motion.h2 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {person.full_name}
        </motion.h2>

        {/* Cargo */}
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400 text-sm font-medium rounded-full"
        >
          <Briefcase className="w-3.5 h-3.5" />
          {displayRole}
        </motion.span>
      </div>

      {/* Separador */}
      <div className="mx-6 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Informações de contato */}
      <div className="p-6 space-y-3">
        {person.email && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => copyToClipboard(person.email!, 'email')}
            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <div className="p-2 rounded-lg bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{person.email}</p>
            </div>
            {copiedField === 'email' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </motion.div>
        )}

        {person.phone && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => copyToClipboard(person.phone!, 'phone')}
            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <div className="p-2 rounded-lg bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Telefone</p>
              <p className="text-sm text-gray-900 dark:text-white">{person.phone}</p>
            </div>
            {copiedField === 'phone' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </motion.div>
        )}

        {person.office && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3 p-3 rounded-xl"
          >
            <div className="p-2 rounded-lg bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400">
              <Building className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Escritório</p>
              <p className="text-sm text-gray-900 dark:text-white">{person.office}</p>
            </div>
          </motion.div>
        )}

        {!person.email && !person.phone && !person.office && (
          <div className="text-center py-6">
            <User className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500">Sem informações de contato</p>
          </div>
        )}
      </div>
    </motion.div>
  )

  // Equipe - CURRÍCULO COMPLETO
  const CVModal = () => {
    const ficha = fichaData

    // Formatar endereço completo
    const enderecoCompleto = ficha
      ? [
          ficha.endereco,
          ficha.numero && `nº ${ficha.numero}`,
          ficha.complemento,
          ficha.bairro,
          ficha.cidade && ficha.estado ? `${ficha.cidade} - ${ficha.estado}` : ficha.cidade || ficha.estado,
          ficha.cep && `CEP: ${ficha.cep}`,
        ]
          .filter(Boolean)
          .join(', ')
      : ''

    // Verificar se tem conteúdo
    const hasContent = ficha && (
      ficha.cpf || ficha.rg || ficha.data_nascimento || enderecoCompleto ||
      ficha.resumo_profissional || ficha.especialidades || ficha.idiomas ||
      ficha.experiencias?.length > 0 || ficha.formacoes?.length > 0 ||
      ficha.certificados?.length > 0 || ficha.observacoes
    )

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#2f4982]/20" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[#2f4982] animate-spin" />
            </div>
            <p className="mt-6 text-gray-500 font-medium">Carregando currículo...</p>
          </div>
        ) : !ficha ? (
          <div className="flex flex-col items-center justify-center py-32 px-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ficha não encontrada</h3>
            <p className="text-gray-500 mt-2 text-center max-w-sm">
              Esta pessoa ainda não possui uma ficha cadastrada no sistema
            </p>
          </div>
        ) : (
          <>
            {/* Header Premium */}
            <div className="relative px-8 pt-8 pb-6">
              {/* Background decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/5 via-blue-500/5 to-purple-500/5" />
              
              <div className="relative flex items-start gap-6">
                {/* Foto com borda gradiente */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#2f4982] to-blue-500 rounded-2xl opacity-75" />
                  {ficha.foto_perfil_url ? (
                    <img
                      src={ficha.foto_perfil_url}
                      alt={ficha.nome}
                      className="relative w-28 h-28 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#2f4982] to-blue-600 flex items-center justify-center text-4xl font-bold text-white">
                      {getInitials(ficha.nome || person.full_name)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {ficha.nome || person.full_name}
                  </h1>
                  <p className="text-xl text-[#2f4982] dark:text-blue-400 font-semibold mt-1">
                    {ficha.profissao || displayRole}
                  </p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {ficha.registro_profissional && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-semibold">
                        <FileText className="w-4 h-4" />
                        {ficha.registro_profissional}
                      </span>
                    )}
                  </div>

                  {/* Contatos */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {(ficha.email || person.email) && (
                      <a 
                        href={`mailto:${ficha.email || person.email}`} 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:text-[#2f4982] hover:bg-[#2f4982]/5 transition-all shadow-sm hover:shadow-md"
                      >
                        <Mail className="w-4 h-4 text-[#2f4982]" />
                        <span className="truncate max-w-[200px]">{ficha.email || person.email}</span>
                      </a>
                    )}
                    {(ficha.celular || ficha.telefone || person.phone) && (
                      <a 
                        href={`tel:${ficha.celular || ficha.telefone || person.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:text-[#2f4982] hover:bg-[#2f4982]/5 transition-all shadow-sm hover:shadow-md"
                      >
                        <Phone className="w-4 h-4 text-[#2f4982]" />
                        {ficha.celular || ficha.telefone || person.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Corpo do CV - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {!hasContent ? (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-center">
                    Esta ficha ainda não possui informações detalhadas
                  </p>
                </div>
              ) : (
                <div className="px-8 pb-8 space-y-6">
                  {/* DADOS PESSOAIS */}
                  {(ficha.cpf || ficha.rg || ficha.data_nascimento || ficha.nacionalidade || ficha.estado_civil || ficha.genero) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-xl text-white">
                          <User className="w-5 h-5" />
                        </div>
                        Dados Pessoais
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {ficha.cpf && <DataField label="CPF" value={ficha.cpf} />}
                        {ficha.rg && <DataField label="RG" value={ficha.rg} />}
                        {ficha.data_nascimento && <DataField label="Nascimento" value={formatDate(ficha.data_nascimento)} />}
                        {ficha.nacionalidade && <DataField label="Nacionalidade" value={ficha.nacionalidade} />}
                        {ficha.estado_civil && <DataField label="Estado Civil" value={ficha.estado_civil} />}
                        {ficha.genero && <DataField label="Gênero" value={ficha.genero} />}
                      </div>
                    </div>
                  )}

                  {/* ENDEREÇO */}
                  {enderecoCompleto && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-xl text-white">
                          <Home className="w-5 h-5" />
                        </div>
                        Endereço
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{enderecoCompleto}</p>
                    </div>
                  )}

                  {/* RESUMO PROFISSIONAL */}
                  {ficha.resumo_profissional && (
                    <div className="bg-gradient-to-r from-[#2f4982]/5 to-blue-500/5 dark:from-[#2f4982]/10 dark:to-blue-500/10 rounded-2xl p-6 border-l-4 border-[#2f4982]">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-xl text-white">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        Resumo Profissional
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{ficha.resumo_profissional}</p>
                    </div>
                  )}

                  {/* GRID: ESPECIALIDADES & IDIOMAS */}
                  {(ficha.especialidades || ficha.idiomas) && (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {ficha.especialidades && (
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                          <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                            <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-xl text-white">
                              <Star className="w-5 h-5" />
                            </div>
                            Especialidades
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {ficha.especialidades.split(',').map((spec: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400 rounded-full text-sm font-medium">
                                {spec.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {ficha.idiomas && (
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                          <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                              <Languages className="w-5 h-5" />
                            </div>
                            Idiomas
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {ficha.idiomas.split(',').map((lang: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                {lang.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EXPERIÊNCIA PROFISSIONAL */}
                  {ficha.experiencias?.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-6">
                        <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-xl text-white">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        Experiência Profissional
                      </h3>
                      <div className="space-y-6">
                        {ficha.experiencias.map((exp: any, i: number) => (
                          <div key={i} className="relative pl-8">
                            {/* Linha do tempo */}
                            {i < ficha.experiencias.length - 1 && (
                              <div className="absolute left-3 top-8 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#2f4982] to-[#2f4982]/20" />
                            )}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#2f4982] flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{exp.cargo}</h4>
                              <p className="text-[#2f4982] dark:text-blue-400 font-semibold">{exp.empresa}</p>
                              {(exp.dataInicio || exp.dataFim) && (
                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
                                  <Calendar className="w-4 h-4" />
                                  {exp.dataInicio || ''} {exp.dataFim && `→ ${exp.dataFim}`} {exp.atual && '(Atual)'}
                                </p>
                              )}
                              {exp.descricao && (
                                <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{exp.descricao}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FORMAÇÃO ACADÊMICA */}
                  {ficha.formacoes?.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        Formação Acadêmica
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {ficha.formacoes.map((form: any, i: number) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">{form.curso}</h4>
                            <p className="text-gray-600 dark:text-gray-400">{form.instituicao}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {form.nivel && (
                                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">
                                  {form.nivel}
                                </span>
                              )}
                              {form.dataFormacao && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                                  <Calendar className="w-3 h-3" />
                                  {form.dataFormacao}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CERTIFICADOS */}
                  {ficha.certificados?.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
                          <Award className="w-5 h-5" />
                        </div>
                        Certificações
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {ficha.certificados.map((cert: any, i: number) => (
                          <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl">
                            <Award className="w-4 h-4" />
                            <span className="font-medium">{cert.nome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OBSERVAÇÕES */}
                  {ficha.observacoes && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        Observações
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{ficha.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    )
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          {isEquipe ? <CVModal /> : <ClienteModal />}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Componente de Seção do CV
function CVSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-[#2f4982]">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

// Componente de Campo de Dados
function DataField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
