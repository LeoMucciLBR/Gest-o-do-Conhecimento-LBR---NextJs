'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, RefreshCw, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useCustomAlert } from '@/components/ui/CustomAlert'

interface BlockedIP {
  id: string
  ip_address: string
  reason: string | null
  blocked_at: string
  blocked_by_user?: {
    name: string
    email: string
  }
}

export default function BlockedIPsTab() {
  const { showConfirm } = useCustomAlert()
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newIP, setNewIP] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchBlockedIPs = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<BlockedIP[]>('/admin/security/blocked-ips')
      setBlockedIPs(data)
    } catch (error) {
      console.error('Failed to fetch blocked IPs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchBlockedIPs()
    }
  }, [])

  const handleAdd = async () => {
    if (!newIP.trim()) {
      toast.error('Informe o endereço IP')
      return
    }

    setAdding(true)
    try {
      await apiFetch('/admin/security/blocked-ips', {
        method: 'POST',
        body: JSON.stringify({
          ip_address: newIP.trim(),
          reason: newReason.trim() || 'Bloqueado manualmente pelo administrador',
        }),
      })

      setShowAddModal(false)
      setNewIP('')
      setNewReason('')
      await fetchBlockedIPs()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao bloquear IP')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string, ip: string) => {
    const confirmed = await showConfirm({
      title: 'Desbloquear IP',
      message: `Desbloquear IP ${ip}?`,
      confirmText: 'Desbloquear',
      cancelText: 'Cancelar'
    })
    if (!confirmed) return

    setRemovingId(id)
    try {
      await apiFetch(`/admin/security/blocked-ips/${id}`, {
        method: 'DELETE',
      })
      
      setBlockedIPs(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      toast.error('Erro ao desbloquear IP')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            IPs Bloqueados
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
              {blockedIPs.length}
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Endereços IP bloqueados permanentemente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBlockedIPs}
            disabled={loading}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Bloquear IP</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : blockedIPs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum IP bloqueado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {blockedIPs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                    {item.ip_address}
                  </p>
                  {item.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(item.blocked_at), { addSuffix: true, locale: ptBR })}
                    {item.blocked_by_user && ` • por ${item.blocked_by_user.name}`}
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(item.id, item.ip_address)}
                  disabled={removingId === item.id}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removingId === item.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Bloquear Endereço IP
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endereço IP
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Motivo do bloqueio..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {adding ? 'Bloqueando...' : 'Bloquear'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
