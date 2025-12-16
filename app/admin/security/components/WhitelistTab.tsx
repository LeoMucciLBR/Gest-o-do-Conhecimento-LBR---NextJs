'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RefreshCw, Plus, Trash2, X, Building2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useCustomAlert } from '@/components/ui/CustomAlert'

interface WhitelistedIP {
  id: string
  ip_address: string
  description: string
  added_at: string
  added_by_user?: {
    name: string
  }
}

export default function WhitelistTab() {
  const { showConfirm } = useCustomAlert()
  const [whitelistIPs, setWhitelistIPs] = useState<WhitelistedIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newIP, setNewIP] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchWhitelist = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<WhitelistedIP[]>('/admin/security/whitelist')
      setWhitelistIPs(data)
    } catch (error) {
      console.error('Failed to fetch whitelist', error)
    } finally {
      setLoading(false)
   }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchWhitelist()
    }
  }, [])

  const handleAdd = async () => {
    if (!newIP.trim() || !newDescription.trim()) {
      toast.error('Informe o IP e a descrição')
      return
    }

    setAdding(true)
    try {
      await apiFetch('/admin/security/whitelist', {
        method: 'POST',
        body: JSON.stringify({
          ip_address: newIP.trim(),
          description: newDescription.trim(),
        }),
      })

      setShowAddModal(false)
      setNewIP('')
      setNewDescription('')
      await fetchWhitelist()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar IP')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string, ip: string) => {
    const confirmed = await showConfirm({
      title: 'Remover da Whitelist',
      message: `Remover IP ${ip} da whitelist?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      isDangerous: true
    })
    if (!confirmed) return

    setRemovingId(id)
    try {
      await apiFetch(`/admin/security/whitelist/${id}`, {
        method: 'DELETE',
      })
      
      setWhitelistIPs(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      toast.error('Erro ao remover IP')
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
            IPs Permitidos (Whitelist)
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
              {whitelistIPs.length}
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            IPs confiáveis que ignoram todas as restrições de segurança
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWhitelist}
            disabled={loading}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar IP</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : whitelistIPs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum IP na whitelist</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Adicione IPs confiáveis (ex: escritório da empresa)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {whitelistIPs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start justify-between p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-lg border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  
                  <div>
                    <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                      {item.ip_address}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Adicionado {formatDistanceToNow(new Date(item.added_at), { addSuffix: true, locale: ptBR })}
                      {item.added_by_user && ` • por ${item.added_by_user.name}`}
                    </p>
                  </div>
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
                Adicionar IP Confiável
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
                  placeholder="192.168.1.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Escritório São Paulo"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {adding ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
