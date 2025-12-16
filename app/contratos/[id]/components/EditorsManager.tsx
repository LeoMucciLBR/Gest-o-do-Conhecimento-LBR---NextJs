'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Shield, UserCircle2, X, Search, Check, Users2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCustomAlert } from '@/components/ui/CustomAlert'

type Editor = {
  id: string
  user: {
    id: string
    name: string
    email: string
    picture_url?: string | null
  }
  added_at: string
  added_by?: string
}

type Creator = {
  id: string
  name: string
  email: string
  picture_url?: string | null
}

type User = {
  id: string
  name: string
  email: string
  picture_url?: string | null
}

interface EditorsManagerProps {
  contractId: string
  isOpen: boolean
  onClose: () => void
}

export default function EditorsManager({ contractId, isOpen, onClose }: EditorsManagerProps) {
  const { showConfirm } = useCustomAlert()
  const [editors, setEditors] = useState<Editor[]>([])
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadEditors()
    }
  }, [contractId, isOpen])

  const loadEditors = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<{
        creator: Creator | null
        editors: Editor[]
        total: number
      }>(`/contracts/${contractId}/editors`)
      
      setCreator(data.creator)
      setEditors(data.editors)
    } catch (error: any) {
      console.error('Erro ao carregar editores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const users = await apiFetch<User[]>('/users')
      setAvailableUsers(users)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
    loadAvailableUsers()
  }

  const handleAddEditor = async (userId: string) => {
    try {
      setAdding(true)
      await apiFetch(`/contracts/${contractId}/editors`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
      
      await loadEditors()
      setIsAddModalOpen(false)
      setSearchTerm('')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar editor')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveEditor = async (userId: string, userName: string) => {
    const confirmed = await showConfirm({
      title: 'Remover Editor',
      message: `Tem certeza que deseja remover "${userName}" dos editores?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      isDangerous: true
    })
    if (!confirmed) return

    try {
      setRemoving(userId)
      await apiFetch(`/contracts/${contractId}/editors?userId=${userId}`, {
        method: 'DELETE'
      })
      
      await loadEditors()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover editor')
    } finally {
      setRemoving(null)
    }
  }

  const filteredUsers = availableUsers.filter(user => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = user.name.toLowerCase().includes(search) || 
                         user.email.toLowerCase().includes(search)
    
    // Exclude creator and existing editors
    const isCreator = creator?.id === user.id
    const isEditor = editors.some(e => e.user.id === user.id)
    
    return matchesSearch && !isCreator && !isEditor
  })

  return (
    <>
      {/* Main Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-[#2f4982] to-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                      <Users2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Gerenciar Editores
                      </h2>
                      <p className="text-sm text-blue-100">
                        {editors.length} {editors.length === 1 ? 'editor' : 'editores'} além do criador
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-slate-200 dark:bg-gray-700 h-12 w-12"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Creator */}
                    {creator && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                          {creator.picture_url ? (
                            <img
                              src={creator.picture_url}
                              alt={creator.name}
                              className="w-14 h-14 rounded-full border-3 border-green-500 shadow-lg"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                              {creator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-lg text-slate-900 dark:text-white">{creator.name}</p>
                              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                                <Shield className="w-3.5 h-3.5" />
                                Criador
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-gray-400">{creator.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Editor Button */}
                    <button
                      onClick={handleOpenAddModal}
                      className="w-full mb-4 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Adicionar Novo Editor</span>
                    </button>

                    {/* Editors List */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Editores ({editors.length})
                      </h3>
                      
                      {editors.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 dark:text-gray-400">
                          <UserCircle2 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">Nenhum editor adicionado ainda</p>
                          <p className="text-sm mt-1">Clique no botão acima para adicionar editores</p>
                        </div>
                      ) : (
                        editors.map((editor) => (
                          <div
                            key={editor.id}
                            className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl border-2 border-slate-200 dark:border-gray-600 flex items-center gap-4 group hover:bg-slate-100 dark:hover:bg-gray-700 hover:border-[#2f4982] dark:hover:border-blue-500 transition-all duration-300"
                          >
                            {editor.user.picture_url ? (
                              <img
                                src={editor.user.picture_url}
                                alt={editor.user.name}
                                className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-gray-600"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#2f4982] text-white flex items-center justify-center font-bold text-lg">
                                {editor.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">{editor.user.name}</p>
                              <p className="text-sm text-slate-600 dark:text-gray-400">{editor.user.email}</p>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveEditor(editor.user.id, editor.user.name)}
                              disabled={removing === editor.user.id}
                              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
                              title="Remover editor"
                            >
                              {removing === editor.user.id ? (
                                <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                              ) : (
                                <UserMinus className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Editor Sub-Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-[#2f4982]" />
                  Selecionar Usuário
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#2f4982] focus:ring-2 focus:ring-[#2f4982]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 dark:text-gray-400">
                      <UserCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAddEditor(user.id)}
                        disabled={adding}
                        className="w-full p-4 bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl border border-slate-200 dark:border-gray-600 flex items-center gap-3 transition-all duration-300 disabled:opacity-50 hover:border-[#2f4982]"
                      >
                        {user.picture_url ? (
                          <img
                            src={user.picture_url}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#2f4982] text-white flex items-center justify-center font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{user.email}</p>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

