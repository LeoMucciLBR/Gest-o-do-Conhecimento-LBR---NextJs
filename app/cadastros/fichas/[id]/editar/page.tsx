'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import FichaForm from '../../components/FichaForm'

export default function EditarFichaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [ficha, setFicha] = useState<any>(null)

  useEffect(() => {
    fetchFicha()
  }, [id])

  const fetchFicha = async () => {
    try {
      const res = await fetch(`/api/fichas/${id}`)
      if (!res.ok) throw new Error('Ficha not found')
      const data = await res.json()
      setFicha(data)
    } catch (error) {
      console.error('Error fetching ficha:', error)
      alert('Erro ao carregar ficha')
      router.push('/cadastros')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    try {
      const res = await fetch(`/api/fichas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao atualizar ficha')
      }

      alert('Ficha atualizada com sucesso!')
      // Redirect back to cadastros with the correct tab
      const tab = formData.tipo === 'CLIENTE' ? 'clientes' : 'equipe'
      router.push(`/cadastros?tab=${tab}`)
    } catch (error: any) {
      console.error('Error updating ficha:', error)
      alert(error.message || 'Erro ao atualizar ficha')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Carregando ficha...</p>
        </div>
      </div>
    )
  }

  if (!ficha) return null

  return <FichaForm onSave={handleSave} mode="edit" initialData={ficha} />
}
