'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, User, ChevronDown, ChevronUp, RefreshCw, Filter } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiFetch } from '@/lib/api/api'

interface ContractLog {
  id: string
  contract_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  changes: any
  ip_address: string | null
  created_at: string
  user: {
    name: string | null
    email: string
    picture_url: string | null
  } | null
  contract: {
    id: string
    name: string
    sector: string | null
  } | null
}

interface Contract {
  id: string
  name: string
}

export default function ContractLogsTab() {
  const [logs, setLogs] = useState<ContractLog[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchContracts = async () => {
    try {
      const data = await apiFetch<{ items: Contract[] }>('/contracts')
      setContracts(data.items || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = selectedContract === 'all' ? '' : `?contractId=${selectedContract}`
      const data = await apiFetch<{ logs: ContractLog[] }>(`/admin/audit/contracts${params}`)
      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching contract logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [selectedContract])

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('UPLOADED')) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    }
    if (action.includes('UPDATED') || action.includes('MOVED') || action.includes('RENAMED')) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    }
    if (action.includes('DELETED') || action.includes('REMOVED')) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CONTRACT_CREATED': 'Contrato criado',
      'CONTRACT_UPDATED': 'Contrato atualizado',
      'CONTRACT_STATUS_CHANGED': 'Status alterado',
      'CONTRACT_DELETED': 'Contrato excluído',
      'PARTICIPANT_ADDED': 'Participante adicionado',
      'PARTICIPANT_REMOVED': 'Participante removido',
      'EDITOR_ADDED': 'Editor adicionado',
      'EDITOR_REMOVED': 'Editor removido',
      'DOCUMENT_UPLOADED': 'Documento enviado',
      'DOCUMENT_DELETED': 'Documento excluído',
      'MEASUREMENT_FILE_UPLOADED': 'Arquivo de medição enviado',
      'MEASUREMENT_FILE_MOVED': 'Arquivo movido',
      'MEASUREMENT_FILE_DELETED': 'Arquivo deletado',
      'MEASUREMENT_FOLDER_CREATED': 'Pasta criada',
      'MEASUREMENT_FOLDER_DELETED': 'Pasta deletada',
      'SOFTWARE_ADDED': 'Software adicionado',
      'SOFTWARE_UPDATED': 'Software atualizado',
      'SOFTWARE_DELETED': 'Software excluído',
      'OBRA_CREATED': 'Obra criada'
    }
    return labels[action] || action.replace(/_/g, ' ')
  }

  const renderChanges = (changes: any) => {
    if (!changes) return null

    if (changes.before && changes.after) {
      const keys = new Set([...Object.keys(changes.before), ...Object.keys(changes.after)])
      const changedKeys = Array.from(keys).filter(
        key => JSON.stringify(changes.before[key]) !== JSON.stringify(changes.after[key])
      )

      return (
        <div className="space-y-2">
          {changedKeys.map(key => (
            <div key={key} className="border-l-2 border-blue-500 pl-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{key}:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Antes:</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200 break-all">
                    {String(changes.before[key] ?? '-')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Depois:</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200 break-all">
                    {String(changes.after[key] ?? '-')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (typeof changes === 'object' && !Array.isArray(changes)) {
      return (
        <div className="space-y-1">
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{key}:</span>
              <span className="text-gray-600 dark:text-gray-400 break-all">{String(value)}</span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto break-all">
        {JSON.stringify(changes, null, 2)}
      </pre>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Logs de Contratos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {logs.length} registros encontrados
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Contract Filter */}
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="flex-1 sm:flex-none sm:min-w-[200px] px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os contratos</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum log de contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getActionColor(log.action)}`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
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
                        </div>

                        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                          {getActionLabel(log.action)}
                        </p>

                        {log.contract && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📄 {log.contract.name}
                            {log.contract.sector && <span className="text-gray-400 ml-1">· {log.contract.sector}</span>}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}</span>
                          {log.ip_address && (
                            <>
                              <span>·</span>
                              <span>{log.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM HH:mm')}
                      </time>
                    </div>

                    {/* Expandable details */}
                    {log.changes && (
                      <>
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {expandedId === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Ver alterações
                        </button>

                        {expandedId === log.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                          >
                            {renderChanges(log.changes)}
                          </motion.div>
                        )}
                      </>
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
