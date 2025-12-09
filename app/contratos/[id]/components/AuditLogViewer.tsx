'use client'

import { useState, useEffect } from 'react'
import { X, Filter, Clock, User, FileText, Folder, Users, Code, MapPin, Image, AlertTriangle, MessageSquare, Download, Trash2, Edit, Plus, Move, ChevronDown, ChevronUp } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  contract_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  changes: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user: {
    id: string
    name: string | null
    email: string
    picture_url: string | null
  } | null
}

interface AuditLogViewerProps {
  contractId: string
  isOpen: boolean
  onClose: () => void
}

export default function AuditLogViewer({ contractId, isOpen, onClose }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen, filter, userFilter])

  async function loadLogs() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter) params.set('action', filter)
      if (userFilter) params.set('user', userFilter)
      
      const res = await fetch(`/api/contracts/${contractId}/audit?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar logs')
      
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  function getActionIcon(action: string) {
    // Contrato
    if (action.includes('CONTRACT')) return <FileText className="w-5 h-5" />
    // Participantes
    if (action.includes('PARTICIPANT')) return <Users className="w-5 h-5" />
    // Editores
    if (action.includes('EDITOR')) return <Edit className="w-5 h-5" />
    // Documentos
    if (action.includes('DOCUMENT')) return <FileText className="w-5 h-5" />
    // Arquivos
    if (action.includes('FILE_UPLOADED')) return <Plus className="w-5 h-5" />
    if (action.includes('FILE_MOVED')) return <Move className="w-5 h-5" />
    if (action.includes('FILE_DELETED')) return <Trash2 className="w-5 h-5" />
    // Pastas
    if (action.includes('FOLDER')) return <Folder className="w-5 h-5" />
    // Software
    if (action.includes('SOFTWARE')) return <Code className="w-5 h-5" />
    // Obras
    if (action.includes('OBRA')) return <MapPin className="w-5 h-5" />
    
    return <Clock className="w-5 h-5" />
  }

  function getActionColor(action: string) {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('UPLOADED')) {
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    }
    if (action.includes('UPDATED') || action.includes('MOVED') || action.includes('RENAMED')) {
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
    }
    if (action.includes('DELETED') || action.includes('REMOVED')) {
      return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    }
    return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
  }

  function getActionLabel(action: string) {
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
      'MEASUREMENT_FOLDER_CREATED': 'Pasta de medição criada',
      'MEASUREMENT_FOLDER_DELETED': 'Pasta de medição deletada',
      'PRODUCT_FILE_UPLOADED': 'Arquivo de produto enviado',
      'PRODUCT_FILE_DELETED': 'Arquivo de produto deletado',
      'PRODUCT_FOLDER_CREATED': 'Pasta de produto criada',
      'SOFTWARE_ADDED': 'Software adicionado',
      'SOFTWARE_UPDATED': 'Software atualizado',
      'SOFTWARE_DELETED': 'Software excluído',
      'OBRA_CREATED': 'Obra criada'
    }
    return labels[action] || action.replace(/_/g, ' ')
  }

  function renderChanges(changes: any) {
    if (!changes) return null

    // Se tem before/after, mostrar comparação visual
    if (changes.before && changes.after) {
      const keys = new Set([...Object.keys(changes.before), ...Object.keys(changes.after)])
      const changedKeys = Array.from(keys).filter(
        key => JSON.stringify(changes.before[key]) !== JSON.stringify(changes.after[key])
      )

      return (
        <div className="space-y-2">
          {changedKeys.map(key => (
            <div key={key} className="border-l-2 border-blue-500 pl-2 sm:pl-3">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {key}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 border border-red-200 dark:border-red-800">
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium mb-1">Antes:</p>
                  <p className="text-[10px] sm:text-xs text-gray-800 dark:text-gray-200 break-all">
                    {String(changes.before[key] ?? '-')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
                  <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mb-1">Depois:</p>
                  <p className="text-[10px] sm:text-xs text-gray-800 dark:text-gray-200 break-all">
                    {String(changes.after[key] ?? '-')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Se é só informação (filename, folder, etc), mostrar como lista
    if (typeof changes === 'object' && !Array.isArray(changes)) {
      return (
        <div className="space-y-1">
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-[10px] sm:text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{key}:</span>
              <span className="text-gray-600 dark:text-gray-400 break-all">{String(value)}</span>
            </div>
          ))}
        </div>
      )
    }

    // Fallback para JSON
    return (
      <pre className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto break-all">
        {JSON.stringify(changes, null, 2)}
      </pre>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Histórico de Ações</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Registro completo de atividades</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Carregando histórico...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Nenhuma ação registrada</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className="relative pl-10 sm:pl-12 pb-6 sm:pb-8 last:pb-0"
                >
                  {/* Timeline line */}
                  {index < logs.length - 1 && (
                    <div className="absolute left-2 sm:left-3 top-7 sm:top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Timeline dot */}
                  <div className={`absolute left-2 sm:left-3 -translate-x-1/2 top-1 p-1.5 sm:p-2 rounded-full ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                          {log.user?.picture_url ? (
                            <img
                              src={log.user.picture_url}
                              alt={log.user.name || 'Usuario'}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          )}
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                            {log.user?.name || 'Sistema'}
                          </span>
                          <span className="text-gray-400 hidden sm:inline">·</span>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                          {getActionLabel(log.action)}
                        </p>

                        {log.changes && (
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {expandedLog === log.id ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                            Ver detalhes
                          </button>
                        )}

                        {expandedLog === log.id && log.changes && (
                          <div className="mt-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                            {renderChanges(log.changes)}
                            {log.ip_address && (
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-300 dark:border-gray-700">
                                📍 IP: {log.ip_address}
                              </p>
                            )}
                          </div>
                        )}
                       </div>

                      <time className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap self-start sm:self-auto">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
