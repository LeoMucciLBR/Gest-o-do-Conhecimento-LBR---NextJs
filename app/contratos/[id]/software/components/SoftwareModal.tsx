'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Link as LinkIcon, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Software {
  id: string
  name: string
  description?: string | null
  main_features?: string | null
  link?: string | null
  provider_id?: string | null
  provider?: {
    id: string
    name: string
  } | null
  creator: {
    id: string
    name: string
    email: string
  }
}

interface Provider {
  id: string
  name: string
}

interface SoftwareModalProps {
  contractId: string
  software: Software | null // null = create mode
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onOpenProviderModal: () => void
}

export default function SoftwareModal({
  contractId,
  software: initialSoftware,
  isOpen,
  onClose,
  onSuccess,
  onOpenProviderModal,
}: SoftwareModalProps) {
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    main_features: '',
    provider_id: '',
    link: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (initialSoftware) {
        setFormData({
          name: initialSoftware.name || '',
          description: initialSoftware.description || '',
          main_features: initialSoftware.main_features || '',
          provider_id: initialSoftware.provider_id || '',
          link: initialSoftware.link || '',
        })
      } else {
        setFormData({
          name: '',
          description: '',
          main_features: '',
          provider_id: '',
          link: '',
        })
      }
      loadProviders()
    }
  }, [isOpen, initialSoftware])

  async function loadProviders() {
    try {
      const res = await fetch('/api/software/providers')
      if (!res.ok) throw new Error('Erro ao carregar fornecedores')
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)
      const method = initialSoftware ? 'PUT' : 'POST'
      const url = initialSoftware
        ? `/api/contracts/${contractId}/software/${initialSoftware.id}`
        : `/api/contracts/${contractId}/software`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Erro ao salvar software')
      toast.success(initialSoftware ? 'Software atualizado!' : 'Software cadastrado!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {initialSoftware ? 'Editar Software' : 'Novo Software'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {initialSoftware ? 'Atualize as informações do software' : 'Preencha os dados para cadastrar um novo software'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Software <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Microsoft Office, AutoCad..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fornecedor
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="provider_id"
                        value={formData.provider_id}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                      >
                        <option value="">Selecione um fornecedor...</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenProviderModal}
                      className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      + Novo
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link de Acesso
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Breve descrição do software..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Principais Funcionalidades
                  </label>
                  <textarea
                    name="main_features"
                    value={formData.main_features}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Liste as principais funcionalidades..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {initialSoftware ? 'Salvar Alterações' : 'Cadastrar Software'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
