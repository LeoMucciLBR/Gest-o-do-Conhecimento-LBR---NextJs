'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Clock, RefreshCw, CheckCircle, XCircle, Filter } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LoginAttempt {
  id: string
  email: string
  ip_address: string
  success: boolean
  country: string | null
  city: string | null
  attempted_at: string
  error_reason: string | null
}

export default function LoginAttemptsTab() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
  const hasFetched = useRef(false)

  const fetchAttempts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<LoginAttempt[]>('/admin/security/login-attempts')
      setAttempts(data)
    } catch (error) {
      console.error('Failed to fetch login attempts', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchAttempts()
    }
  }, [])

  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'success') return attempt.success
    if (filter === 'failed') return !attempt.success
    return true
  })

  const successCount = attempts.filter(a => a.success).length
  const failedCount = attempts.filter(a => !a.success).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Tentativas de Login
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
              {attempts.length}
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Histórico das últimas tentativas de login (90 dias)
          </p>
        </div>

        <button
          onClick={fetchAttempts}
          disabled={loading}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'all'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{attempts.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
        </button>

        <button
          onClick={() => setFilter('success')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sucessos</p>
        </button>

        <button
          onClick={() => setFilter('failed')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filter === 'failed'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Falhas</p>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma tentativa encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAttempts.slice(0, 50).map((attempt, index) => (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                attempt.success
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {attempt.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {attempt.email}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    <span className="font-mono">{attempt.ip_address}</span>
                    {attempt.city && attempt.country && (
                      <>
                        <span>•</span>
                        <span>{attempt.city}, {attempt.country}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(attempt.attempted_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  {!attempt.success && attempt.error_reason && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {attempt.error_reason}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredAttempts.length > 50 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Mostrando 50 de {filteredAttempts.length} tentativas
        </p>
      )}
    </div>
  )
}
