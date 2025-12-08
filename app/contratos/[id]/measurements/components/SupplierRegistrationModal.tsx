'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (supplierName: string) => void
}

export default function SupplierRegistrationModal({ isOpen, onClose, onSuccess }: SupplierRegistrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: ''
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        cnpj: ''
      })
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'cnpj') {
       // Simple mask
       let v = value.replace(/\D/g, '')
       if (v.length > 14) v = v.slice(0, 14)
       // Apply mask 00.000.000/0000-00
       if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
       else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4")
       else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3")
       else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, "$1.$2")
       setFormData(prev => ({ ...prev, [name]: v }))
    } else if (name === 'phone') {
       // Simple phone mask
       let v = value.replace(/\D/g, '')
       if (v.length > 11) v = v.slice(0, 11)
       if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
       else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
       else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2")
       setFormData(prev => ({ ...prev, [name]: v }))
    } else {
       setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateCNPJ = (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '')
    if (clean.length !== 14) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCNPJ(formData.cnpj)) {
      toast.error('CNPJ inválido (deve ter 14 dígitos)')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cnpj: formData.cnpj
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar fornecedor')
      }

      toast.success('Fornecedor cadastrado com sucesso!')
      onSuccess(formData.name)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Novo Fornecedor
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Fornecedor (Nome da Pasta)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
