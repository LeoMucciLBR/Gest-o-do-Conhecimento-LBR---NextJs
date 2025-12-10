'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, XCircle, User, MapPin, Globe, RefreshCw, Monitor, Smartphone, Laptop } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiFetch } from '@/lib/api/api'

interface LoginLog {
  id: string
  user_id: string | null
  email_input: string | null
  provider: string
  success: boolean
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  location: string | null
  action_type: string | null
  created_at: string
  user: {
    name: string | null
    email: string
    picture_url: string | null
  } | null
}

export default function LoginLogsTab() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = filter === 'all' ? '' : `?success=${filter === 'success'}`
      const data = await apiFetch<{ logs: LoginLog[] }>(`/admin/audit/login${params}`)
      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching login logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="w-4 h-4" />
    if (userAgent.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />
    return <Laptop className="w-4 h-4" />
  }

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length,
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Logs de Autenticação
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Histórico de logins, logouts e alterações de senha
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setFilter('all')}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setFilter('success')}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
              filter === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border-green-500'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}
          >
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.success}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sucesso</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setFilter('failed')}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
              filter === 'failed'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}
          >
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Falhas</p>
          </motion.button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum log de autenticação encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-lg p-4 border-l-4 ${
                  log.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    log.success
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                  }`}>
                    {log.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.user?.picture_url ? (
                          <img
                            src={log.user.picture_url}
                            alt={log.user.name || 'User'}
                            className="w-7 h-7 rounded-full"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {log.user?.name || log.email_input || 'Usuário desconhecido'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {log.action_type || 'LOGIN'} via {log.provider}
                          </p>
                        </div>
                      </div>

                      <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                      </time>
                    </div>

                    {!log.success && log.reason && (
                      <p className="text-sm text-red-700 dark:text-red-400 mb-2 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        ⚠️ {log.reason}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                      {log.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{log.location}</span>
                        </div>
                      )}
                      {log.user_agent && (
                        <div className="flex items-center gap-1">
                          {getDeviceIcon(log.user_agent)}
                          <span className="max-w-[200px] truncate">{log.user_agent}</span>
                        </div>
                      )}
                      <span className="text-gray-400">
                        · {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
