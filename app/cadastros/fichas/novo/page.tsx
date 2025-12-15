'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FichaForm from '../components/FichaForm'

function NovaFichaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipoParam = searchParams.get('tipo') as 'INTERNA' | 'CLIENTE' | null

  const handleSave = async (formData: any) => {
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao criar ficha')
      }

      alert('Ficha criada com sucesso!')
      // Redirect back to cadastros with the correct tab
      const tab = formData.tipo === 'CLIENTE' ? 'clientes' : 'equipe'
      router.push(`/cadastros?tab=${tab}`)
    } catch (error: any) {
      console.error('Error creating ficha:', error)
      alert(error.message || 'Erro ao criar ficha')
    }
  }

  return <FichaForm onSave={handleSave} mode="create" defaultTipo={tipoParam || undefined} />
}

export default function NovaFichaPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8 text-center">Carregando...</div>}>
      <NovaFichaContent />
    </Suspense>
  )
}
