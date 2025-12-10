'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Shield, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiFetch } from '@/lib/api/api'

interface AuditLog {
  id: string
  type: 'login' | 'contract'
  action: string
  action_type?: string  // For login logs: LOGIN, LOGOUT, PASSWORD_CHANGE
  created_at: string
  user: {
    name: string | null
    email: string
    picture_url: string | null
  } | null
  ip_address: string | null
  location: string | null
  success?: boolean
  contract?: {
    name: string
  }
  changes?: any
}

export default function AllLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'login' | 'contract'>('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Fetch both login and contract logs
      const [loginData, contractData] = await Promise.all([
        apiFetch<{ logs: any[] }>('/admin/audit/login?limit=25'),
        apiFetch<{ logs: any[] }>('/admin/audit/contracts?limit=25'),
      ])

      // Combine and sort by date
      const combinedLogs = [
        ...loginData.logs.map(log => ({ ...log, type: 'login' as const })),
        ...contractData.logs.map(log => ({ ...log, type: 'contract' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setLogs(combinedLogs)
    } catch (error) {
      console.error('Error fetching all logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter)

  const getLogIcon = (log: AuditLog) => {
    if (log.type === 'login') return <Shield className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const getLogColor = (log: AuditLog) => {
    if (log.type === 'login') {
      return log.success 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    }
    
    if (log.action?.includes('CREATED') || log.action?.includes('ADDED')) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    }
    if (log.action?.includes('UPDATED') || log.action?.includes('MOVED')) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    }
    if (log.action?.includes('DELETED') || log.action?.includes('REMOVED')) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
  }

  const getLogLabel = (log: AuditLog) => {
    if (log.type === 'login') {
      if (log.action_type === 'LOGIN') return log.success ? 'Login bem-sucedido' : 'Falha no login'
      if (log.action_type === 'LOGOUT') return 'Logout'
      if (log.action_type === 'PASSWORD_CHANGE') return 'Senha alterada'
      return log.action
    }
    return log.action?.replace(/_/g, ' ') || 'Ação desconhecida'
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Todos os Logs do Sistema
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredLogs.length} registros encontrados
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="login">Login/Auth</option>
            <option value="contract">Contratos</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredLogs.map((log, index) => (
              <motion.div
                key={`${log.type}-${log.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getLogColor(log)}`}>
                    {getLogIcon(log)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {log.user?.picture_url ? (
                            <img
                              src={log.user.picture_url}
                              alt={log.user.name || 'User'}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                            </div>
                          )}
                          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {log.user?.name || 'Sistema'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {log.type === 'login' ? 'Auth' : 'Contrato'}
                          </span>
                        </div>
                        
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                          {getLogLabel(log)}
                          {log.contract && (
                            <span className="text-gray-600 dark:text-gray-400 ml-1">
                              · {log.contract.name}
                            </span>
                          )}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}</span>
                          {log.ip_address && (
                            <>
                              <span>·</span>
                              <span>{log.ip_address}</span>
                            </>
                          )}
                          {log.location && (
                            <>
                              <span>·</span>
                              <span>{log.location}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(log.created_at), 'HH:mm')}
                      </time>
                    </div>

                    {/* Expandable details */}
                    {log.changes && (
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {expandedId === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Ver detalhes
                      </button>
                    )}

                    {expandedId === log.id && log.changes && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto"
                      >
                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </motion.div>
                    )}
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
