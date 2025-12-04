'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import FichaForm from '@/app/admin/fichas/components/FichaForm'

interface FichaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
  mode: 'create' | 'edit' | 'view'
  initialData?: any
  defaultTipo?: 'INTERNA' | 'CLIENTE' // Pre-set tipo for modal context
  defaultCargo?: 'GESTOR_AREA' | 'GERENTE_ENGENHARIA' // Pre-set cargo_cliente for CLIENTE tipo
}

export default function FichaModal({ isOpen, onClose, onSuccess, mode, initialData, defaultTipo, defaultCargo }: FichaModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

 useEffect(() => {
    setMounted(true)
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  if (!mounted || (!isOpen && !isVisible)) return null

  const handleSave = async (formData: any) => {
    if (mode === 'view') return // Should not happen as save button is hidden

    try {
      const url = mode === 'edit' && initialData?.id ? `/api/fichas/${initialData.id}` : '/api/fichas'
      const method = mode === 'edit' && initialData?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar ficha')
      }

      const data = await res.json()
      onSuccess(data)
      onClose()
    } catch (error: any) {
      console.error('Error saving ficha:', error)
      alert(error.message || 'Erro ao salvar ficha')
    }
  }

  // Check if it's a Cliente ficha in view mode
  const isClienteView = mode === 'view' && initialData?.tipo === 'CLIENTE'
  const modalSize = isClienteView ? 'max-w-lg' : 'max-w-7xl'
  const modalHeight = isClienteView ? 'h-auto' : 'max-h-[85vh]'

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative w-full ${modalSize} ${modalHeight} bg-transparent rounded-2xl flex flex-col transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'} overflow-hidden`}>
        {/* Close button - Always show, positioned absolutely */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-50 p-2 bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors shadow-lg border-2 border-slate-200 dark:border-gray-600"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-gray-400" />
        </button>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <FichaForm onSave={handleSave} mode={mode} initialData={initialData} isModal={true} defaultTipo={defaultTipo} defaultCargo={defaultCargo} />
        </div>
      </div>
    </div>,
    document.body
  )
}
