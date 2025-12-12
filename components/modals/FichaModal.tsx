'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import FichaFormModal from '@/app/cadastros/fichas/components/FichaFormModal'

interface FichaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
  mode: 'create' | 'edit' | 'view'
  initialData?: any
  defaultTipo?: 'INTERNA' | 'CLIENTE'
  defaultCargo?: 'GESTOR_AREA' | 'GERENTE_ENGENHARIA'
}

export default function FichaModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode, 
  initialData, 
  defaultTipo, 
  defaultCargo 
}: FichaModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleSave = async (formData: any) => {
    try {
      const url = mode === 'edit' && initialData?.id ? `/api/fichas/${initialData.id}` : '/api/fichas'
      const method = mode === 'edit' && initialData?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Apply default cargo for cliente if provided
          cargo_cliente: formData.cargo_cliente || defaultCargo || ''
        })
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
      throw error // Re-throw to keep modal open
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <AnimatePresence>
      <FichaFormModal
        mode={mode === 'view' ? 'edit' : mode}
        initialData={initialData}
        defaultTipo={defaultTipo}
        onSave={handleSave}
        onClose={onClose}
      />
    </AnimatePresence>,
    document.body
  )
}
