'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  X,
  Check,
  Loader2,
  Truck,
  Monitor,
  Eye,
  Mail,
  Phone
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api/api'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { toast } from 'sonner'
import FichaFormModal from './fichas/components/FichaFormModal'
import FichaViewModal from './fichas/components/FichaViewModal'

type TabType = 'empresas' | 'clientes' | 'equipe' | 'fornecedores'

type Empresa = {
  id: string
  nome: string
  cnpj: string | null
  tipo: 'CONTRATANTE' | 'SOCIO'
  ativo: boolean
}

type Ficha = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  celular: string | null
  profissao: string | null
  cargo_cliente: string | null
  tipo: string
  foto_perfil_url: string | null
}

type Supplier = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  cnpj?: string | null
  website?: string | null
  tipo: 'SOFTWARE' | 'MEDICAO'
}

function CadastrosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'empresas'
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [loading, setLoading] = useState(false)
  
  // Empresas state
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [searchTermEmpresa, setSearchTermEmpresa] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'CONTRATANTE' | 'SOCIO' | ''>('')
  
  // Fichas state (Clientes & Equipe)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [searchTermFicha, setSearchTermFicha] = useState('')
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTermSupplier, setSearchTermSupplier] = useState('')
  const [supplierTipoFilter, setSupplierTipoFilter] = useState<'SOFTWARE' | 'MEDICAO' | ''>('')
  
  // Empresa Modal states
  const [empresaModalOpen, setEmpresaModalOpen] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [empresaFormData, setEmpresaFormData] = useState({ nome: '', cnpj: '', tipo: 'CONTRATANTE' as 'CONTRATANTE' | 'SOCIO' })
  
  // Ficha Modal states
  const [fichaModalOpen, setFichaModalOpen] = useState(false)
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null)
  const [fichaInitialData, setFichaInitialData] = useState<any>(null)
  const [fichaViewMode, setFichaViewMode] = useState(false)
  
  // Ficha View Modal state
  const [fichaViewModalOpen, setFichaViewModalOpen] = useState(false)
  const [viewingFichaData, setViewingFichaData] = useState<any>(null)
  
  const [saving, setSaving] = useState(false)

  // Load empresas
  const loadEmpresas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tipoFilter) params.append('tipo', tipoFilter)
      if (searchTermEmpresa) params.append('search', searchTermEmpresa)
      
      const result = await apiFetch<{ empresas: Empresa[] }>(`/empresas?${params.toString()}`)
      setEmpresas(result.empresas || [])
    } catch (error) {
      console.error('Error loading empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  // Load fichas (Clientes ou Equipe)
  const loadFichas = async (tipoFicha: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTermFicha) params.append('search', searchTermFicha)
      
      const result = await apiFetch<{ fichas: Ficha[] }>(`/fichas?${params.toString()}`)
      const filtered = (result.fichas || []).filter(f => {
        if (tipoFicha === 'CLIENTE') return f.tipo === 'CLIENTE'
        if (tipoFicha === 'INTERNA') return f.tipo === 'INTERNA'
        return false
      })
      setFichas(filtered)
    } catch (error) {
      console.error('Error loading fichas:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Load suppliers (combines software_providers and measurement suppliers)
  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const [softwareRes, measurementRes] = await Promise.all([
        apiFetch<{ providers: any[] }>('/software/providers'),
        apiFetch<{ suppliers: any[] }>('/admin/suppliers').catch(() => ({ suppliers: [] }))
      ])

      const softwareSuppliers = (softwareRes.providers || []).map(p => ({
        ...p,
        tipo: 'SOFTWARE' as const
      }))

      const measurementSuppliers = (measurementRes.suppliers || []).map(s => ({
        ...s,
        tipo: 'MEDICAO' as const
      }))

      let allSuppliers = [...softwareSuppliers, ...measurementSuppliers]

      // Apply filters
      if (supplierTipoFilter) {
        allSuppliers = allSuppliers.filter(s => s.tipo === supplierTipoFilter)
      }
      if (searchTermSupplier) {
        const search = searchTermSupplier.toLowerCase()
        allSuppliers = allSuppliers.filter(s => 
          s.name.toLowerCase().includes(search) || 
          s.cnpj?.includes(search)
        )
      }

      setSuppliers(allSuppliers)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'empresas') {
      loadEmpresas()
    } else if (activeTab === 'clientes') {
      loadFichas('CLIENTE')
    } else if (activeTab === 'equipe') {
      loadFichas('INTERNA')
    } else if (activeTab === 'fornecedores') {
      loadSuppliers()
    }
  }, [activeTab, tipoFilter, supplierTipoFilter])

  // Update tab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType
    if (tabFromUrl && ['empresas', 'clientes', 'equipe', 'fornecedores'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Debounced search for empresas
  useEffect(() => {
    if (activeTab === 'empresas') {
      const timer = setTimeout(() => loadEmpresas(), 300)
      return () => clearTimeout(timer)
    }
  }, [searchTermEmpresa])

  // Debounced search for fichas
  useEffect(() => {
    if (activeTab === 'clientes' || activeTab === 'equipe') {
      const timer = setTimeout(() => {
        loadFichas(activeTab === 'clientes' ? 'CLIENTE' : 'INTERNA')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTermFicha])

  // Debounced search for suppliers
  useEffect(() => {
    if (activeTab === 'fornecedores') {
      const timer = setTimeout(() => loadSuppliers(), 300)
      return () => clearTimeout(timer)
    }
  }, [searchTermSupplier])

  // === EMPRESA HANDLERS ===
  const handleOpenEmpresaModal = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa)
      setEmpresaFormData({ nome: empresa.nome, cnpj: empresa.cnpj || '', tipo: empresa.tipo })
    } else {
      setEditingEmpresa(null)
      setEmpresaFormData({ nome: '', cnpj: '', tipo: 'CONTRATANTE' })
    }
    setEmpresaModalOpen(true)
  }

  const handleCloseEmpresaModal = () => {
    setEmpresaModalOpen(false)
    setEditingEmpresa(null)
    setEmpresaFormData({ nome: '', cnpj: '', tipo: 'CONTRATANTE' })
  }

  const handleSaveEmpresa = async () => {
    if (!empresaFormData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      if (editingEmpresa) {
        await apiFetch(`/empresas/${editingEmpresa.id}`, {
          method: 'PUT',
          body: JSON.stringify(empresaFormData)
        })
        toast.success('Empresa atualizada!')
      } else {
        await apiFetch('/empresas', {
          method: 'POST',
          body: JSON.stringify(empresaFormData)
        })
        toast.success('Empresa criada!')
      }
      handleCloseEmpresaModal()
      loadEmpresas()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmpresa = async (empresa: Empresa) => {
    if (!confirm(`Deseja desativar a empresa "${empresa.nome}"?`)) return
    
    try {
      await apiFetch(`/empresas/${empresa.id}`, { method: 'DELETE' })
      toast.success('Empresa desativada!')
      loadEmpresas()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao desativar empresa')
    }
  }

  // === FICHA HANDLERS (open modal) ===
  const handleNewFicha = () => {
    setEditingFicha(null)
    setFichaInitialData(null)
    setFichaViewMode(false)
    setFichaModalOpen(true)
  }

  const handleViewFicha = async (ficha: Ficha) => {
    try {
      const res = await fetch(`/api/fichas/${ficha.id}`)
      if (!res.ok) throw new Error('Ficha not found')
      const fullData = await res.json()
      setViewingFichaData(fullData)
      setFichaViewModalOpen(true)
    } catch (error) {
      console.error('Error loading ficha:', error)
      toast.error('Erro ao carregar ficha')
    }
  }

  const handleViewToEdit = () => {
    setFichaViewModalOpen(false)
    if (viewingFichaData) {
      setEditingFicha(viewingFichaData)
      setFichaInitialData(viewingFichaData)
      setFichaViewMode(false)
      setFichaModalOpen(true)
    }
  }

  const handleEditFicha = async (ficha: Ficha) => {
    // Load full ficha data for editing
    try {
      const res = await fetch(`/api/fichas/${ficha.id}`)
      if (!res.ok) throw new Error('Ficha not found')
      const fullData = await res.json()
      setEditingFicha(ficha)
      setFichaInitialData(fullData)
      setFichaViewMode(false)
      setFichaModalOpen(true)
    } catch (error) {
      console.error('Error loading ficha:', error)
      toast.error('Erro ao carregar ficha')
    }
  }

  const handleSaveFicha = async (formData: any) => {
    try {
      if (editingFicha) {
        await apiFetch(`/fichas/${editingFicha.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
        toast.success('Ficha atualizada!')
      } else {
        await apiFetch('/fichas', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
        toast.success('Ficha criada!')
      }
      setFichaModalOpen(false)
      setEditingFicha(null)
      setFichaInitialData(null)
      loadFichas(formData.tipo)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar ficha')
      throw error // Re-throw to keep modal open on error
    }
  }

  const handleCloseFichaModal = () => {
    setFichaModalOpen(false)
    setEditingFicha(null)
    setFichaInitialData(null)
    setFichaViewMode(false)
  }

  const handleDeleteFicha = async (ficha: Ficha) => {
    if (!confirm(`Deseja excluir "${ficha.nome}"?`)) return
    
    try {
      await apiFetch(`/fichas/${ficha.id}`, { method: 'DELETE' })
      toast.success('Ficha excluída!')
      loadFichas(ficha.tipo)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir ficha')
    }
  }

  const tabs = [
    { id: 'empresas' as TabType, label: 'Empresas', icon: Building2, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'clientes' as TabType, label: 'Clientes', icon: Users, gradient: 'from-green-500 to-emerald-600' },
    { id: 'equipe' as TabType, label: 'Equipe', icon: UserCheck, gradient: 'from-green-500 to-emerald-600' },
    { id: 'fornecedores' as TabType, label: 'Fornecedores', icon: Truck, gradient: 'from-orange-500 to-amber-600' },
  ]

  // Render Fichas Table (shared between Clientes and Equipe)
  const renderFichasTable = (tipo: 'CLIENTE' | 'INTERNA') => {
    const isCliente = tipo === 'CLIENTE'
    const IconComponent = isCliente ? Users : UserCheck
    const label = isCliente ? 'cliente' : 'membro da equipe'

    return (
      <>
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTermFicha}
              onChange={(e) => setSearchTermFicha(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => handleNewFicha()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            {isCliente ? 'Novo Cliente' : 'Novo Membro'}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2f4982]" />
          </div>
        ) : fichas.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
            <p className="text-slate-600 dark:text-gray-400 text-lg">Nenhum {label} encontrado</p>
            <button
              onClick={() => handleNewFicha()}
              className="mt-4 text-green-600 font-semibold hover:underline"
            >
              Cadastrar primeiro {label}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">
                    {isCliente ? 'Cargo' : 'Profissão'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {fichas.map((ficha) => (
                  <tr 
                    key={ficha.id} 
                    onClick={() => handleViewFicha(ficha)}
                    className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 text-slate-900 dark:text-white font-medium">
                      <div className="flex items-center gap-3">
                        {ficha.foto_perfil_url ? (
                          <img src={ficha.foto_perfil_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                        {ficha.nome}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-gray-400">
                      {ficha.email || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-gray-400">
                      {ficha.celular || ficha.telefone || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-gray-400">
                      {isCliente ? ficha.cargo_cliente || '-' : ficha.profissao || '-'}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditFicha(ficha)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFicha(ficha)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )
  }

  // Render Suppliers Table
  const renderSuppliersTable = () => (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTermSupplier}
            onChange={(e) => setSearchTermSupplier(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
          />
        </div>

        <select
          value={supplierTipoFilter}
          onChange={(e) => setSupplierTipoFilter(e.target.value as any)}
          className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982]"
        >
          <option value="">Todos os tipos</option>
          <option value="SOFTWARE">Software</option>
          <option value="MEDICAO">Medição</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2f4982]" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg mb-4">Nenhum fornecedor encontrado</p>
          <div className="max-w-md mx-auto p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>ℹ️ Nota:</strong> Fornecedores são cadastrados através das seções de <strong>Software</strong> e <strong>Medição</strong> nos contratos.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">CNPJ</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-4 text-slate-900 dark:text-white font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${supplier.tipo === 'SOFTWARE' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'} flex items-center justify-center`}>
                        {supplier.tipo === 'SOFTWARE' ? (
                          <Monitor className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Truck className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      {supplier.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-gray-400">
                    {supplier.cnpj || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      supplier.tipo === 'SOFTWARE'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {supplier.tipo === 'SOFTWARE' ? 'Software' : 'Medição'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-gray-400">
                    {supplier.email || supplier.phone || supplier.website || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20 relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/portal')}
                className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6 text-[#2f4982]" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[#2f4982] dark:text-white">Cadastros</h1>
                <p className="text-slate-600 dark:text-gray-400">Gerencie empresas, clientes e equipe</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchTermFicha('')
                  router.push(`/cadastros?tab=${tab.id}`, { scroll: false })
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            {activeTab === 'empresas' && (
              <>
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTermEmpresa}
                      onChange={(e) => setSearchTermEmpresa(e.target.value)}
                      placeholder="Buscar por nome ou CNPJ..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent"
                    />
                  </div>

                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value as any)}
                    className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982]"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="CONTRATANTE">Contratantes</option>
                    <option value="SOCIO">Sócios/Participantes</option>
                  </select>

                  <button
                    onClick={() => handleOpenEmpresaModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nova Empresa
                  </button>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2f4982]" />
                  </div>
                ) : empresas.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
                    <p className="text-slate-600 dark:text-gray-400 text-lg">Nenhuma empresa encontrada</p>
                    <button onClick={() => handleOpenEmpresaModal()} className="mt-4 text-[#2f4982] font-semibold hover:underline">
                      Cadastrar primeira empresa
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">CNPJ</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-gray-300">Tipo</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-gray-300">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {empresas.map((empresa) => (
                          <tr key={empresa.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-4 text-slate-900 dark:text-white font-medium">{empresa.nome}</td>
                            <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{empresa.cnpj || '-'}</td>
                            <td className="px-4 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                empresa.tipo === 'CONTRATANTE'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}>
                                {empresa.tipo === 'CONTRATANTE' ? 'Contratante' : 'Sócio'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleOpenEmpresaModal(empresa)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors" title="Editar">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteEmpresa(empresa)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors" title="Desativar">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'clientes' && renderFichasTable('CLIENTE')}
            {activeTab === 'equipe' && renderFichasTable('INTERNA')}
            {activeTab === 'fornecedores' && renderSuppliersTable()}
          </div>
        </div>

        {/* Empresa Modal */}
        <AnimatePresence>
          {empresaModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseEmpresaModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
                  </h2>
                  <button onClick={handleCloseEmpresaModal} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Nome *</label>
                    <input
                      type="text"
                      value={empresaFormData.nome}
                      onChange={(e) => setEmpresaFormData({ ...empresaFormData, nome: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982]"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">CNPJ</label>
                    <input
                      type="text"
                      value={empresaFormData.cnpj}
                      onChange={(e) => setEmpresaFormData({ ...empresaFormData, cnpj: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982]"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Tipo *</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        empresaFormData.tipo === 'CONTRATANTE' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-600 hover:border-blue-300'
                      }`}>
                        <input type="radio" name="tipo" checked={empresaFormData.tipo === 'CONTRATANTE'} onChange={() => setEmpresaFormData({ ...empresaFormData, tipo: 'CONTRATANTE' })} className="sr-only" />
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Contratante</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        empresaFormData.tipo === 'SOCIO' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-gray-600 hover:border-purple-300'
                      }`}>
                        <input type="radio" name="tipo" checked={empresaFormData.tipo === 'SOCIO'} onChange={() => setEmpresaFormData({ ...empresaFormData, tipo: 'SOCIO' })} className="sr-only" />
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Sócio</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleCloseEmpresaModal} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-gray-600">
                    Cancelar
                  </button>
                  <button onClick={handleSaveEmpresa} disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" />Salvar</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ficha Modal */}
        <AnimatePresence>
          {fichaModalOpen && (
            <FichaFormModal
              mode={fichaViewMode ? 'view' : (editingFicha ? 'edit' : 'create')}
              initialData={fichaInitialData}
              defaultTipo={activeTab === 'clientes' ? 'CLIENTE' : 'INTERNA'}
              onSave={handleSaveFicha}
              onClose={handleCloseFichaModal}
              onEdit={() => setFichaViewMode(false)}
            />
          )}
        </AnimatePresence>

        {/* Ficha View Modal */}
        <AnimatePresence>
          {fichaViewModalOpen && viewingFichaData && (
            <FichaViewModal
              data={viewingFichaData}
              onClose={() => {
                setFichaViewModalOpen(false)
                setViewingFichaData(null)
              }}
              onEdit={handleViewToEdit}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default function CadastrosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-gray-700" />
          <p className="text-slate-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    }>
      <CadastrosContent />
    </Suspense>
  )
}
