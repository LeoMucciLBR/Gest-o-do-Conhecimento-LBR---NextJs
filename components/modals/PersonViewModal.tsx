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
          if (data.fichas?.length > 0) {
            let match = data.fichas.find((f: any) => 
              f.nome?.toLowerCase().trim() === person.full_name?.toLowerCase().trim()
            )
            if (!match) match = data.fichas[0]
            if (match) setFichaData(match)
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

  if (!mounted || !isOpen) return null

  const displayRole = customRole || role || 'Participante'
  const isEquipe = type === 'INTERNA'

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }

  // Cliente - Modal simples
  const ClienteModal = () => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
              {getInitials(person.full_name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{person.full_name}</h2>
              <p className="text-white/80 text-sm">{displayRole}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {person.email && (
          <a href={`mailto:${person.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Mail className="w-5 h-5 text-purple-500" />
            <span className="text-gray-900 dark:text-white text-sm">{person.email}</span>
          </a>
        )}
        {person.phone && (
          <a href={`tel:${person.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Phone className="w-5 h-5 text-green-500" />
            <span className="text-gray-900 dark:text-white text-sm">{person.phone}</span>
          </a>
        )}
        {person.office && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <Building className="w-5 h-5 text-blue-500" />
            <span className="text-gray-900 dark:text-white text-sm">{person.office}</span>
          </div>
        )}
        {!person.email && !person.phone && !person.office && (
          <p className="text-center text-gray-500 py-4">Sem informações de contato</p>
        )}
      </div>

      <div className="px-5 pb-5">
        <button onClick={onClose} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg">
          Fechar
        </button>
      </div>
    </motion.div>
  )

  // Equipe - Modal estilo CV
  const CVModal = () => {
    const ficha = fichaData
    const endereco = ficha ? [ficha.cidade, ficha.estado].filter(Boolean).join(' - ') : ''

    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#2f4982] animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Header do CV */}
            <div className="bg-[#2f4982] text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Foto */}
                <div className="flex-shrink-0">
                  {ficha?.foto_perfil_url ? (
                    <img 
                      src={ficha.foto_perfil_url} 
                      alt={person.full_name} 
                      className="w-28 h-28 rounded-lg object-cover border-4 border-white/20"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-lg bg-white/20 flex items-center justify-center text-4xl font-bold">
                      {getInitials(person.full_name)}
                    </div>
                  )}
                </div>

                {/* Info principal */}
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">{person.full_name}</h1>
                  <p className="text-xl text-white/90 mb-3">{ficha?.profissao || displayRole}</p>
                  
                  {/* Contatos inline */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80">
                    {(person.email || ficha?.email) && (
                      <a href={`mailto:${person.email || ficha?.email}`} className="flex items-center gap-1.5 hover:text-white">
                        <Mail className="w-4 h-4" />
                        {person.email || ficha?.email}
                      </a>
                    )}
                    {(person.phone || ficha?.celular) && (
                      <a href={`tel:${person.phone || ficha?.celular}`} className="flex items-center gap-1.5 hover:text-white">
                        <Phone className="w-4 h-4" />
                        {person.phone || ficha?.celular}
                      </a>
                    )}
                    {endereco && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {endereco}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Corpo do CV */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Registro Profissional */}
              {ficha?.registro_profissional && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  {ficha.registro_profissional}
                </div>
              )}

              {/* Resumo */}
              {ficha?.resumo_profissional && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <User className="w-5 h-5 text-[#2f4982]" />
                    Perfil Profissional
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {ficha.resumo_profissional}
                  </p>
                </section>
              )}

              {/* Duas colunas: Especialidades + Idiomas */}
              {(ficha?.especialidades || ficha?.idiomas) && (
                <div className="grid sm:grid-cols-2 gap-6">
                  {ficha?.especialidades && (
                    <section>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <Briefcase className="w-5 h-5 text-[#2f4982]" />
                        Especialidades
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300">{ficha.especialidades}</p>
                    </section>
                  )}
                  {ficha?.idiomas && (
                    <section>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <Languages className="w-5 h-5 text-[#2f4982]" />
                        Idiomas
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300">{ficha.idiomas}</p>
                    </section>
                  )}
                </div>
              )}

              {/* Experiência */}
              {ficha?.experiencias?.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <Briefcase className="w-5 h-5 text-[#2f4982]" />
                    Experiência Profissional
                  </h2>
                  <div className="space-y-4">
                    {ficha.experiencias.map((exp: any, i: number) => (
                      <div key={i} className="relative pl-5 border-l-2 border-[#2f4982]">
                        <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-[#2f4982] -translate-x-[5px]" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{exp.cargo}</h3>
                        <p className="text-[#2f4982] dark:text-blue-400 font-medium">{exp.empresa}</p>
                        {(exp.dataInicio || exp.dataFim) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {exp.dataInicio} {exp.dataFim && `- ${exp.dataFim}`}
                          </p>
                        )}
                        {exp.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{exp.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Formação */}
              {ficha?.formacoes?.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <GraduationCap className="w-5 h-5 text-[#2f4982]" />
                    Formação Acadêmica
                  </h2>
                  <div className="space-y-3">
                    {ficha.formacoes.map((form: any, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{form.curso}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{form.instituicao}</p>
                          {form.nivel && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                              {form.nivel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certificados */}
              {ficha?.certificados?.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <Award className="w-5 h-5 text-[#2f4982]" />
                    Certificações
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {ficha.certificados.map((cert: any, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg text-sm font-medium">
                        🏆 {cert.nome}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Dados Pessoais */}
              {(ficha?.cpf || ficha?.rg || ficha?.data_nascimento) && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <FileText className="w-5 h-5 text-[#2f4982]" />
                    Dados Pessoais
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {ficha?.cpf && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">CPF</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ficha.cpf}</p>
                      </div>
                    )}
                    {ficha?.rg && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">RG</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ficha.rg}</p>
                      </div>
                    )}
                    {ficha?.data_nascimento && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Nascimento</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(ficha.data_nascimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Se não tiver ficha */}
              {!ficha && (
                <div className="text-center py-10 text-gray-500">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Ficha não encontrada</p>
                  <p className="text-sm">Complete a ficha desta pessoa para visualizar o currículo completo</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 bg-[#2f4982] hover:bg-[#243a68] text-white font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          {isEquipe ? <CVModal /> : <ClienteModal />}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
