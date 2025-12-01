'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Search, 
  Filter, 
  MapPin, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Log {
  id: number
  username: string | null
  email: string | null
  action: string
  success: boolean
  fail_reason: string | null
  ip_address: string | null
  location: string | null
  created_at: string
  users?: {
    name: string | null
    picture_url: string | null
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterEmail, setFilterEmail] = useState('')
  const [filterSuccess, setFilterSuccess] = useState<string>('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      
      if (filterEmail) params.append('email', filterEmail)
      if (filterSuccess !== 'all') params.append('success', filterSuccess)

      const data = await apiFetch<any>(`/admin/logs?${params.toString()}`)
      setLogs(data.logs)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch logs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs()
    }, 500) // Debounce search
    return () => clearTimeout(timeout)
  }, [page, filterEmail, filterSuccess])

  const getActionColor = (action: string | null) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'LOGIN_FAIL': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      case 'LOGOUT': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      case 'FORCED_LOGOUT': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
      case 'PASSWORD_CHANGE': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Logs de Auditoria
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Histórico de acessos e atividades de segurança
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          
          <select
            value={filterSuccess}
            onChange={(e) => setFilterSuccess(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="true">Sucesso</option>
            <option value="false">Falha</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Usuário</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Ação</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Localização / IP</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.users?.picture_url ? (
                          <img src={log.users.picture_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">
                            {(log.users?.name || log.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.users?.name || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {log.email || log.username || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {(log.action || 'UNKNOWN').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {log.success ? 'Sucesso' : 'Falha'}
                        </span>
                      </div>
                      {!log.success && log.fail_reason && (
                        <p className="text-xs text-red-500 mt-1">{log.fail_reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {log.location && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {log.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Globe className="w-3.5 h-3.5" />
                          {log.ip_address || 'IP Oculto'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
