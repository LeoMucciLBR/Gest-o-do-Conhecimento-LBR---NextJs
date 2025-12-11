'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, RefreshCw, User, Mail, AlertCircle, Unlock } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BlockedUser {
  id: string
  user_id: string
  email: string
  reason: string
  blocked_at: string
  blocked_by_user?: {
    name: string
    email: string
  }
  user?: {
    name: string
  }
}

export default function BlockedUsersTab() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockinId, setUnblockingId] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchBlockedUsers = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<BlockedUser[]>('/admin/security/blocked-users')
      setBlockedUsers(data)
    } catch (error) {
      console.error('Failed to fetch blocked users', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchBlockedUsers()
    }
  }, [])

  const handleUnblock = async (email: string, blockId: string) => {
    if (!confirm('Tem certeza que deseja desbloquear este usuário?')) return

    setUnblockingId(blockId)
    try {
      await apiFetch(`/admin/security/blocked-users/${blockId}`, {
        method: 'DELETE',
      })
      
      setBlockedUsers(prev => prev.filter(u => u.id !== blockId))
    } catch (error) {
      alert('Erro ao desbloquear usuário')
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Usuários Bloqueados
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold">
              {blockedUsers.length}
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Usuários que foram bloqueados manualmente ou automaticamente após múltiplas tentativas
          </p>
        </div>

        <button
          onClick={fetchBlockedUsers}
          disabled={loading}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Ban className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum usuário bloqueado</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {blockedUsers.map((blocked, index) => (
              <motion.div
                key={blocked.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all relative group"
              >
                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <User className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {blocked.user?.name || 'Usuário'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span className="font-mono">{blocked.email}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            Motivo: <span className="font-normal">{blocked.reason}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Bloqueado {formatDistanceToNow(new Date(blocked.blocked_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {blocked.blocked_by_user && (
                          <span>
                            por <strong>{blocked.blocked_by_user.name}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUnblock(blocked.email, blocked.id)}
                    disabled={unblockinId === blocked.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                  >
                    {unblockinId === blocked.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Desbloqueando...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        Desbloquear
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
