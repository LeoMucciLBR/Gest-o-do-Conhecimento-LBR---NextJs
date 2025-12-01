'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit2,
  Download,
} from 'lucide-react'
import FichaProfileView from '../components/FichaProfileView'

interface Experiencia {
  id: string
  empresa: string
  cargo: string
  dataInicio: string
  dataFim: string
  descricao: string
}

interface Formacao {
  id: string
  instituicao: string
  curso: string
  nivel: string
  dataFormacao: string
  descricao: string
}

interface Certificado {
  id: string
  nome: string
  instituicao: string
  dataObtencao: string
}

interface Ficha {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  celular: string | null
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  nacionalidade: string | null
  estado_civil: string | null
  genero: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  profissao: string | null
  especialidades: string | null
  registro_profissional: string | null
  resumo_profissional: string | null
  idiomas: string | null
  formacoes: Formacao[]
  experiencias: Experiencia[]
  certificados: Certificado[]
  foto_perfil_url: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export default function VisualizarFichaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [ficha, setFicha] = useState<Ficha | null>(null)

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
      router.push('/admin/fichas')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/fichas"
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ficha Pessoal</h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{ficha.nome}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert('Download PDF em desenvolvimento')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-all font-medium"
            >
              <Download className="w-5 h-5" />
              PDF
            </button>
            <Link
              href={`/admin/fichas/${id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <Edit2 className="w-5 h-5" />
              Editar
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-0">
        <FichaProfileView data={ficha} />
      </div>
    </div>
  )
}
