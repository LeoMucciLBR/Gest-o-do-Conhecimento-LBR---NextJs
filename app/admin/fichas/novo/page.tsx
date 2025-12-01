'use client'

import { useRouter } from 'next/navigation'
import FichaForm from '../components/FichaForm'

export default function NovaFichaPage() {
  const router = useRouter()

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
      router.push('/admin/fichas')
    } catch (error: any) {
      console.error('Error creating ficha:', error)
      alert(error.message || 'Erro ao criar ficha')
    }
  }

  return <FichaForm onSave={handleSave} mode="create" />
}
