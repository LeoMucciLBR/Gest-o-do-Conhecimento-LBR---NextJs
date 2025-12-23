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

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#2f4982] animate-spin" />
            <p className="mt-3 text-gray-500">Carregando currículo...</p>
          </div>
        ) : !ficha ? (
          <div className="flex flex-col items-center justify-center py-20">
            <User className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Ficha não encontrada</h3>
            <p className="text-sm text-gray-500 mt-1">Esta pessoa ainda não possui uma ficha cadastrada</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-[#2f4982] hover:bg-[#263d69] text-white text-sm font-medium rounded-xl"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Header do CV */}
            <div className="bg-gradient-to-r from-[#2f4982] to-blue-600 p-6 text-white">
              <div className="flex items-start gap-5">
                {/* Foto */}
                {ficha.foto_perfil_url ? (
                  <img
                    src={ficha.foto_perfil_url}
                    alt={ficha.nome}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {getInitials(ficha.nome || person.full_name)}
                  </div>
                )}

                {/* Info principal */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{ficha.nome || person.full_name}</h1>
                  <p className="text-lg text-white/90 mt-1">{ficha.profissao || displayRole}</p>
                  
                  {/* Registro profissional */}
                  {ficha.registro_profissional && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 rounded-lg text-sm">
                      <FileText className="w-4 h-4" />
                      {ficha.registro_profissional}
                    </div>
                  )}

                  {/* Contatos */}
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/80">
                    {(ficha.email || person.email) && (
                      <a href={`mailto:${ficha.email || person.email}`} className="flex items-center gap-1.5 hover:text-white">
                        <Mail className="w-4 h-4" />
                        {ficha.email || person.email}
                      </a>
                    )}
                    {(ficha.celular || ficha.telefone || person.phone) && (
                      <a href={`tel:${ficha.celular || ficha.telefone || person.phone}`} className="flex items-center gap-1.5 hover:text-white">
                        <Phone className="w-4 h-4" />
                        {ficha.celular || ficha.telefone || person.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Corpo do CV - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* DADOS PESSOAIS */}
              {(ficha.cpf || ficha.rg || ficha.data_nascimento || ficha.nacionalidade || ficha.estado_civil || ficha.genero) && (
                <CVSection icon={<User />} title="Dados Pessoais">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ficha.cpf && <DataField label="CPF" value={ficha.cpf} />}
                    {ficha.rg && <DataField label="RG" value={ficha.rg} />}
                    {ficha.data_nascimento && <DataField label="Nascimento" value={formatDate(ficha.data_nascimento)} />}
                    {ficha.nacionalidade && <DataField label="Nacionalidade" value={ficha.nacionalidade} />}
                    {ficha.estado_civil && <DataField label="Estado Civil" value={ficha.estado_civil} />}
                    {ficha.genero && <DataField label="Gênero" value={ficha.genero} />}
                  </div>
                </CVSection>
              )}

              {/* ENDEREÇO */}
              {enderecoCompleto && (
                <CVSection icon={<Home />} title="Endereço">
                  <p className="text-gray-700 dark:text-gray-300">{enderecoCompleto}</p>
                </CVSection>
              )}

              {/* RESUMO PROFISSIONAL */}
              {ficha.resumo_profissional && (
                <CVSection icon={<BookOpen />} title="Resumo Profissional">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{ficha.resumo_profissional}</p>
                </CVSection>
              )}

              {/* ESPECIALIDADES */}
              {ficha.especialidades && (
                <CVSection icon={<Star />} title="Especialidades">
                  <div className="flex flex-wrap gap-2">
                    {ficha.especialidades.split(',').map((spec: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-[#2f4982]/10 text-[#2f4982] dark:text-blue-400 rounded-lg text-sm font-medium">
                        {spec.trim()}
                      </span>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* IDIOMAS */}
              {ficha.idiomas && (
                <CVSection icon={<Languages />} title="Idiomas">
                  <div className="flex flex-wrap gap-2">
                    {ficha.idiomas.split(',').map((lang: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                        {lang.trim()}
                      </span>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* EXPERIÊNCIA PROFISSIONAL */}
              {ficha.experiencias?.length > 0 && (
                <CVSection icon={<Briefcase />} title="Experiência Profissional">
                  <div className="space-y-4">
                    {ficha.experiencias.map((exp: any, i: number) => (
                      <div key={i} className="relative pl-5 border-l-2 border-[#2f4982]">
                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#2f4982] -translate-x-[7px]" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">{exp.cargo}</h4>
                        <p className="text-[#2f4982] dark:text-blue-400 font-medium">{exp.empresa}</p>
                        {(exp.dataInicio || exp.dataFim) && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {exp.dataInicio || ''} {exp.dataFim && `→ ${exp.dataFim}`} {exp.atual && '(Atual)'}
                          </p>
                        )}
                        {exp.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{exp.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* FORMAÇÃO ACADÊMICA */}
              {ficha.formacoes?.length > 0 && (
                <CVSection icon={<GraduationCap />} title="Formação Acadêmica">
                  <div className="space-y-4">
                    {ficha.formacoes.map((form: any, i: number) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{form.curso}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{form.instituicao}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.nivel && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                              {form.nivel}
                            </span>
                          )}
                          {form.dataFormacao && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {form.dataFormacao}
                            </span>
                          )}
                        </div>
                        {form.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{form.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* CERTIFICADOS */}
              {ficha.certificados?.length > 0 && (
                <CVSection icon={<Award />} title="Certificações">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {ficha.certificados.map((cert: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="p-2 bg-[#2f4982]/10 rounded-lg">
                          <Award className="w-5 h-5 text-[#2f4982]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{cert.nome}</p>
                          {cert.instituicao && (
                            <p className="text-xs text-gray-500 truncate">{cert.instituicao}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* OBSERVAÇÕES */}
              {ficha.observacoes && (
                <CVSection icon={<FileText />} title="Observações">
                  <p className="text-gray-700 dark:text-gray-300">{ficha.observacoes}</p>
                </CVSection>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2f4982] hover:bg-[#263d69] text-white font-medium rounded-xl transition-colors"
              >
                Fechar
              </button>
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
