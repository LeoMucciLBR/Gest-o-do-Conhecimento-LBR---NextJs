'use client'

import { useState, useEffect } from 'react'
import { Code, Edit, Loader2, Plus, ExternalLink, MessageSquare, User, Calendar, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SoftwareModal from '@/app/contratos/[id]/software/components/SoftwareModal'
import ProviderModal from '@/app/contratos/[id]/software/components/ProviderModal'
import { useCustomAlert } from '@/components/ui/CustomAlert'

interface Software {
  id: string
  name: string
  description?: string
  main_features?: string
  link?: string | null
  provider_id?: string | null
  provider?: {
    id: string
    name: string
  } | null
  creator: {
    id: string
    name: string
    email: string
  }
  _count: {
    comments: number
  }
  created_at: string
}

interface SoftwareExplorerProps {
  contractId: string
}

export default function SoftwareExplorer({ contractId }: SoftwareExplorerProps) {
  const { showConfirm } = useCustomAlert()
  const [software, setSoftware] = useState<Software | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSoftwareModal, setShowSoftwareModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)

  useEffect(() => {
    loadSoftware()
  }, [contractId])

  async function loadSoftware() {
    try {
      setLoading(true)
      const res = await fetch(`/api/contracts/${contractId}/software`)
      if (!res.ok) throw new Error('Erro ao carregar software')
      const data = await res.json()
      // Pega apenas o primeiro software (só deve ter 1)
      setSoftware(data.softwares?.[0] || null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar software')
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setShowSoftwareModal(true)
  }

  function handleEdit() {
    setShowSoftwareModal(true)
  }

  async function handleDelete() {
    if (!software) return
    
    const confirmed = await showConfirm({
      title: 'Excluir Software',
      message: `Tem certeza que deseja excluir "${software.name}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      isDangerous: true
    })
    if (!confirmed) return
    
    try {
      const res = await fetch(`/api/contracts/${contractId}/software/${software.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erro ao excluir software')
      toast.success('Software excluído com sucesso!')
      setSoftware(null)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  function handleSoftwareSuccess() {
    setShowSoftwareModal(false)
    loadSoftware()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6">
      <AnimatePresence mode="wait">
        {!software ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-xl p-8 sm:p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
            
             <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg mb-6 sm:mb-8 rotate-3"
            >
              <Code className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </motion.div>

            <h3 className="relative z-10 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Nenhum software vinculado
            </h3>
            <p className="relative z-10 text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-8 sm:mb-10 text-base sm:text-lg">
              Centralize o gerenciamento técnico do contrato vinculando o software utilizado. Facilite o acesso e a colaboração da equipe.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="relative z-10 group inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
              Cadastrar Software
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* Main Info Card */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
                
                {/* Header */}
                <div className="relative p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                        <Code className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-all sm:break-normal">
                          {software.name}
                        </h2>
                        {software.provider && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {software.provider.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-auto">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleEdit}
                        className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         onClick={handleDelete}
                         className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                         title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative p-6 sm:p-8 space-y-6 sm:space-y-8">
                  {software.description && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        Descrição
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg break-words">
                        {software.description}
                      </p>
                    </div>
                  )}

                  {software.main_features && (
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                        Principais Funcionalidades
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                        {software.main_features}
                      </p>
                    </div>
                  )}

                  {software.link && (
                    <motion.a
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      href={software.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col sm:flex-row items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all gap-4 sm:gap-0"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-blue-100 text-sm font-medium mb-0.5">Acessar Software</p>
                          <p className="text-white font-bold tracking-tight truncate max-w-[200px] sm:max-w-md">{software.link}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </motion.a>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 gap-4 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium text-gray-900 dark:text-white">{software.creator.name || software.creator.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4" />
                       <time>{new Date(software.created_at).toLocaleDateString()}</time>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="xl:col-span-1">
              <SoftwareComments contractId={contractId} softwareId={software.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showSoftwareModal && (
        <SoftwareModal
          contractId={contractId}
          software={software}
          isOpen={showSoftwareModal}
          onClose={() => setShowSoftwareModal(false)}
          onSuccess={handleSoftwareSuccess}
          onOpenProviderModal={() => setShowProviderModal(true)}
        />
      )}

      {showProviderModal && (
        <ProviderModal
          isOpen={showProviderModal}
          onClose={() => setShowProviderModal(false)}
          onSuccess={() => setShowProviderModal(false)}
        />
      )}
    </div>
  )
}

function SoftwareComments({ contractId, softwareId }: { contractId: string; softwareId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [softwareId])

  async function loadComments() {
    try {
      setLoading(true)
      const res = await fetch(`/api/contracts/${contractId}/software/${softwareId}/comments`)
      if (!res.ok) throw new Error('Erro ao carregar comentários')
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/contracts/${contractId}/software/${softwareId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      })

      if (!res.ok) throw new Error('Erro ao adicionar comentário')
      const data = await res.json()
      setComments([data.comment, ...comments])
      setNewComment('')
      toast.success('Comentário adicionado!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-[600px] xl:h-auto xl:sticky xl:top-6 flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Comentários
          <span className="ml-auto text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
            {comments.length}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 px-4">
             <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageSquare className="w-8 h-8 text-gray-400" />
             </div>
            <p className="text-gray-500 font-medium">Nenhum comentário ainda</p>
            <p className="text-xs text-gray-400 mt-1">Inicie a conversa sobre este software</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={comment.id}
                className="group flex gap-3"
              >
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {comment.user.name?.[0] || comment.user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center justify-between gap-2 mb-1">
                       <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {comment.user.name || comment.user.email}
                       </span>
                       <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </span>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {comment.comment}
                     </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddComment()
              }
            }}
            placeholder="Escreva um comentário..."
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-950 border-2 border-transparent focus:border-blue-500/50 rounded-xl resize-none shadow-sm text-sm focus:ring-0 transition-all placeholder:text-gray-400"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || submitting}
            className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Pressione Enter para enviar
        </p>
      </div>
    </div>
  )
}
