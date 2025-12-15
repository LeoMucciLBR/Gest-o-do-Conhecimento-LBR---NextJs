'use client'

import dynamic from 'next/dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  MapPin,
  ArrowLeft,
  Users,
  UserCheck,
  Edit,
  Building2,
  Briefcase,
  Target,
  Info,
  ExternalLink,
  Download,
  Share2,
  Ruler,
  Box,
  Code,
  User,
  AlertCircle,
  LayoutDashboard,
  DollarSign,
  Calendar,
  ArrowRight,
  List,
  Plus,
  Clock,
  Image,
  X,
  Maximize2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api/api'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import ObraMapViewer, { type ObraWithGeometry, type NonConformityMarker } from './components/ObraMapViewer'
import LocationMapViewer from './components/LocationMapViewer'
import ObraAnnotationSidebar from './components/ObraAnnotationSidebar'
import MeasurementExplorer from './measurements/components/MeasurementExplorer'
import ProductExplorer from './products/components/ProductExplorer'
import SoftwareExplorer from './software/components/SoftwareExplorer'
import FichaModal from '@/components/modals/FichaModal'
import EditorsManager from './components/EditorsManager'
import AuditLogViewer from './components/AuditLogViewer'
import LessonsSection from './components/LessonsSection'

// Dynamic import to avoid SSR issues with react-pdf
const PDFViewerModal = dynamic(() => import('@/components/ui/PDFViewerModal'), { ssr: false })

type Contract = {
  id: string
  name: string
  sector: string | null
  object: string | null
  scope: string | null
  status: 'Ativo' | 'Inativo' | 'Pendente'
  location: string | null
  lamina_url: string | null
  image_url: string | null
  valor: string | null
  data_inicio: string | null
  data_fim: string | null
  characteristics: string | null
  created_by?: string | null
  client_office_location?: string | null
  lbr_office_location?: string | null
}

type Organization = {
  id: string
  name: string
}

type Person = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  office: string | null
}

type Participant = {
  role: string
  custom_role?: string | null
  person: Person
}

type ContractDetails = {
  contract: Contract
  organization: Organization | null
  participants: Participant[]
  obras?: any[]
  companyParticipations?: Array<{
    id: string
    company_name: string
    participation_percentage: number
  }>
}

function prettyRole(role: string, customRole?: string | null): string {
  // If there's a custom role, use it (this is for client contacts with free-text roles)
  if (customRole) {
    return customRole
  }
  
  const normalized = role.trim().toUpperCase().replace(/\s+/g, '_')
  switch (normalized) {
    case 'GESTOR_AREA':
      return 'Gestor da Área'
    case 'GERENTE_ENGENHARIA':
      return 'Gerente de Engenharia'
    case 'COORDENADORA':
      return 'Coordenadora'
    case 'ENGENHEIRO_RESPONSAVEL':
      return 'Engenheiro Responsável'
    case 'OUTRO':
      return customRole || 'Outro'
    default:
      return role || 'Função'
  }
}

interface ContractDetailsClientProps {
  contractId: string
}

export default function ContractDetailsClient({ contractId }: ContractDetailsClientProps) {
  const router = useRouter()
  const [data, setData] = useState<ContractDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedObra, setSelectedObra] = useState<ObraWithGeometry | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [nonConformities, setNonConformities] = useState<NonConformityMarker[]>([])
  const [selectedNonConformityId, setSelectedNonConformityId] = useState<string | null>(null)
  const [fichaModalOpen, setFichaModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedPersonType, setSelectedPersonType] = useState<'INTERNA' | 'CLIENTE'>('INTERNA')
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [hoveredObraId, setHoveredObraId] = useState<number | null>(null)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [mapModalType, setMapModalType] = useState<'CLIENTE' | 'LBR' | 'OBRA' | 'OBRA_LOCATION' | null>(null)
  const [mapModalAddress, setMapModalAddress] = useState<string | null>(null)
  const [canManageEditors, setCanManageEditors] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editorsModalOpen, setEditorsModalOpen] = useState(false)
  const [auditLogOpen, setAuditLogOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  const handleNonConformityClick = (nc: NonConformityMarker) => {
    console.log('Parent received NC click:', nc)
    
    // Find which obra this non-conformity belongs to based on its KM
    const obraForNc = data?.obras?.find(obra => {
      const km = nc.km
      return km >= obra.km_inicio && km <= obra.km_fim
    })
    
    if (obraForNc) {
      setSelectedObra(obraForNc)
    }
    
    setSelectedNonConformityId(nc.id)
    setIsSidebarOpen(true)
  }

  const handleObraClick = (obra: ObraWithGeometry, coords?: { lat: number; lng: number }) => {
    setSelectedObra(obra)
    setClickCoords(coords || null)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedObra(null)
    setClickCoords(null)
    setSelectedNonConformityId(null)
  }

  const handlePersonClick = (person: Person, type: 'INTERNA' | 'CLIENTE') => {
    setSelectedPerson(person)
    setSelectedPersonType(type)
    setFichaModalOpen(true)
  }

  const handleFichaModalClose = () => {
    setFichaModalOpen(false)
    setSelectedPerson(null)
  }

  useEffect(() => {
    let cancelled = false

    async function loadContract() {
      try {
        setLoading(true)
        setError(null)
        const result = await apiFetch<ContractDetails>(`/contracts/${contractId}`)
        if (!cancelled) setData(result)

        // Get current user and check permissions
        try {
          const session: any = await apiFetch('/auth/session')
          if (!cancelled && session?.user) {
            setCurrentUserId(session.user.id)
            
            // Check if user is creator or admin
            const isCreator = result.contract.created_by === session.user.id
            const isAdmin = session.user.role === 'ADMIN'
            
            // Check if user is an editor
            const editorsData = await apiFetch<any>(`/contracts/${contractId}/editors`)
            const isEditor = editorsData.editors?.some((e: any) => e.user.id === session.user.id) || false
            
            // User can manage editors if they are the creator or an admin
            const canManage = isCreator || isAdmin
            
            // User can edit if they are creator, editor, or admin
            const canEditContract = isCreator || isEditor || isAdmin
            
            console.log('🔐 Permission Check:', {
              sessionUserId: session.user.id,
              contractCreatedBy: result.contract.created_by,
              isCreator,
              isEditor,
              isAdmin,
              canManage,
              canEdit: canEditContract
            })
            
            setCanManageEditors(canManage)
            setCanEdit(canEditContract)
          } else {
            console.warn('⚠️ No session found')
          }
        } catch (e) {
          console.error('❌ Error checking permissions:', e)
        }

        // Fetch non-conformities
        try {
          const ncResult = await apiFetch<any[]>(`/contracts/${contractId}/non-conformities`)
          if (!cancelled && ncResult) {
            // Map to marker format if needed, or ensure API returns compatible format
            // API returns: { id, km, description, severity, latitude, longitude, ... }
            // Marker expects: { id, lat, lng, severity, description, km }
            const markers: NonConformityMarker[] = ncResult.map(nc => ({
              id: nc.id,
              lat: Number(nc.latitude),
              lng: Number(nc.longitude),
              severity: nc.severity,
              description: nc.description,
              km: Number(nc.km)
            })).filter(m => !isNaN(m.lat) && !isNaN(m.lng))
            
            setNonConformities(markers)
          }
        } catch (e) {
          console.error('Error fetching non-conformities:', e)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Falha ao carregar detalhes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadContract()
    return () => {
      cancelled = true
    }
  }, [contractId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-lbr-primary mb-4" />
          <p className="text-slate-700 dark:text-gray-300 text-lg font-semibold">Carregando contrato...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl border-2 border-red-200 dark:border-red-800">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Erro ao Carregar</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-slate-700 dark:text-gray-300 text-lg">Contrato não encontrado.</p>
        </div>
      </div>
    )
  }

  const { contract, organization, participants } = data

  // Clientes são todos EXCETO os cargos específicos da equipe interna
  // NOTE: OUTRO é incluído em clientes porque custom client roles são mapeados para OUTRO
  const clienteParticipants = participants.filter((p) =>
    !['COORDENADORA', 'ENGENHEIRO_RESPONSAVEL', 'GERENTE_PROJETO', 'ANALISTA'].includes(p.role.toUpperCase())
  )

  // Equipe são apenas os cargos específicos internos
  const equipeParticipants = participants.filter((p) =>
    ['COORDENADORA', 'ENGENHEIRO_RESPONSAVEL', 'GERENTE_PROJETO', 'ANALISTA'].includes(p.role.toUpperCase())
  )

  const sections = [

    { id: 'lamina', label: 'LÂMINA', icon: <FileText className="w-6 h-6" />, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'localizacao', label: 'LOCALIZAÇÃO', icon: <MapPin className="w-6 h-6" />, gradient: 'from-amber-500 to-orange-500' },
    { id: 'medicoes', label: 'MEDIÇÕES', icon: <Ruler className="w-6 h-6" />, gradient: 'from-violet-500 to-purple-500' },
    { id: 'produtos', label: 'PRODUTOS', icon: <Box className="w-6 h-6" />, gradient: 'from-pink-500 to-rose-500' },
    { id: 'software', label: 'SOFTWARE', icon: <Code className="w-6 h-6" />, gradient: 'from-indigo-500 to-blue-500' },
    { id: 'cliente', label: 'INFORMAÇÕES CLIENTE', icon: <User className="w-6 h-6" />, gradient: 'from-secondary to-pink-500' },
    { id: 'equipe', label: 'INFORMAÇÕES EQUIPE', icon: <Users className="w-6 h-6" />, gradient: 'from-green-500 to-emerald-500' },
    { id: 'dificuldades', label: 'DIFICULDADES E APRENDIZADOS', icon: <AlertCircle className="w-6 h-6" />, gradient: 'from-red-500 to-orange-600' },
  ]

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/20 relative overflow-hidden z-10">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='black' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative">
        {/* Header */}


        <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-7xl">
          {/* Title Section */}
          {/* Title Section */}
          <div className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-top duration-700">
            {/* Title Row with Absolute Buttons */}
            <div className="relative flex items-center justify-center min-h-[60px] mb-4">
              {/* Back Button - Absolute Left */}
              <div className="absolute left-0 z-20">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="group hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-gray-800 text-[#2f4982] dark:text-blue-400 shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:w-32 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#2f4982]/50"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-6 h-6 flex-shrink-0" />
                  <span className="ml-0 text-sm font-semibold opacity-0 max-w-0 transition-all duration-300 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 whitespace-nowrap">
                    Voltar
                  </span>
                </button>
              </div>

              {/* Title - Centered */}
              <div className="inline-block px-4 max-w-[60%] sm:max-w-[70%] text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2f4982] dark:text-[#ffffff] mb-3 animate-in zoom-in duration-500 break-words leading-tight">
                  {contract.name || '(Sem título)'}
                </h1>
                <div className="h-1 bg-gradient-to-r from-lbr-primary via-secondary to-accent rounded-full animate-in slide-in-from-left duration-700 mx-auto w-full" />
              </div>

              {/* Buttons - Absolute Right */}
              <div className="absolute right-0 z-20 flex items-center gap-2">
                {canManageEditors && (
                  <button
                    type="button"
                    onClick={() => setEditorsModalOpen(true)}
                    className="group hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-green-600 text-white shadow-lg border border-transparent overflow-hidden transition-all duration-300 hover:w-44 hover:bg-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-600/50"
                    aria-label="Gerenciar Editores"
                  >
                    <Users className="w-6 h-6 flex-shrink-0" />
                    <span className="ml-0 text-sm font-semibold opacity-0 max-w-0 transition-all duration-300 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 whitespace-nowrap">
                      Editores
                    </span>
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => router.push(`/engenharia/cadastrocontratos/${contractId}`)}
                    className="group hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-[#2f4982] text-white shadow-lg border border-transparent overflow-hidden transition-all duration-300 hover:w-32 hover:bg-[#263d69] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#2f4982]/50"
                    aria-label="Editar"
                  >
                    <Edit className="w-6 h-6 flex-shrink-0" />
                    <span className="ml-0 text-sm font-semibold opacity-0 max-w-0 transition-all duration-300 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 whitespace-nowrap">
                      Editar
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAuditLogOpen(true)}
                  className="group hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-purple-600 text-white shadow-lg border border-transparent overflow-hidden transition-all duration-300 hover:w-40 hover:bg-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                  aria-label="Histórico"
                >
                  <Clock className="w-6 h-6 flex-shrink-0" />
                  <span className="ml-0 text-sm font-semibold opacity-0 max-w-0 transition-all duration-300 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2 whitespace-nowrap">
                    Histórico
                  </span>
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm text-slate-700 dark:text-gray-300 font-medium">Status:</span>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                  contract.status === 'Ativo'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : contract.status === 'Pendente'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                } animate-pulse`}
              >
                {contract.status}
              </span>
            </div>
          </div>

          {/* Setor & Contratante (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
            {/* Setor */}
            <div className="group bg-gradient-to-br from-[#2f4982] to-blue-700 p-[2px] rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-left duration-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982] to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none z-0" />
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-full flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-[#2f4982] to-blue-700 rounded-xl shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 dark:text-gray-300 mb-1">Setor</h3>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">{contract.sector || '-'}</p>
                </div>
              </div>
            </div>

            {/* Contratante */}
            <div className="group bg-gradient-to-br from-[#2f4982] to-blue-700 p-[2px] rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-right duration-700 delay-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982] to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none z-0" />
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-full flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-[#2f4982] to-blue-700 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 dark:text-gray-300 mb-1">Contratante</h3>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                    {organization?.name || '(Sem contratante)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Escopo & Objeto */}
          {(contract.scope || contract.object) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
              {contract.object && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-white/20 dark:border-gray-700/20 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-left duration-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-[#2f4982] dark:text-blue-400" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Objeto</h3>
                  </div>
                  <p className="text-slate-800 dark:text-gray-200 leading-relaxed font-medium">{contract.object}</p>
                </div>
              )}

              {contract.scope && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-right duration-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-6 h-6 text-[#2f4982] dark:text-purple-400" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Escopo</h3>
                  </div>
                  <div 
                    className="text-slate-800 dark:text-gray-200 leading-relaxed font-medium prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: contract.scope || '' }}
                  />
                </div>
              )}
            </div>
          )}
          {/* Visão Geral (Valor, Prazos, Características) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            {/* Valor do Contrato */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-24 h-24 text-green-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Valor do Contrato</h4>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {contract.valor || 'Não informado'}
              </p>
            </div>

            {/* Período */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-24 h-24 text-blue-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">Período de Vigência</h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Início</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {contract.data_inicio ? new Date(contract.data_inicio).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Término</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {contract.data_fim ? new Date(contract.data_fim).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-purple-500" />
                Características e Observações
              </h4>
              <div 
                className="prose dark:prose-invert max-w-none text-slate-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: contract.characteristics || 'Nenhuma característica informada.' }}
              />
            </div>

            {/* Empresas e Participações - SEMPRE VISÍVEL */}
            <div className="md:col-span-2 bg-gradient-to-br from-[#2f4982]/5 via-blue-50/50 to-transparent dark:from-[#2f4982]/10 dark:via-blue-900/10 dark:to-transparent rounded-2xl p-6 border-2 border-[#2f4982]/20 dark:border-[#2f4982]/30 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <h4 className="text-xl font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#2f4982] to-blue-600 rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  Empresas e Participações
                </h4>

                {data.companyParticipations && data.companyParticipations.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        // Find the leader (empresa with highest percentage)
                        const maxPercentage = Math.max(...data.companyParticipations.map(c => Number(c.participation_percentage)))
                        
                        // Sort companies by percentage descending (highest first)
                        const sortedCompanies = [...data.companyParticipations].sort(
                          (a, b) => Number(b.participation_percentage) - Number(a.participation_percentage)
                        )
                        
                        return sortedCompanies.map((company, index) => {
                          const percentage = Number(company.participation_percentage)
                          const isLeader = percentage === maxPercentage
                          
                          return (
                            <div 
                              key={company.id}
                              className={`${
                                isLeader 
                                  ? 'bg-white dark:bg-gray-800 border-2 border-amber-400 dark:border-amber-500' 
                                  : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-[#2f4982]/50 dark:hover:border-[#2f4982]/50'
                              } rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden`}
                              style={{
                                animationDelay: `${index * 100}ms`
                              }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                    {company.company_name}
                                  </h5>
                                  {isLeader && (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-1 inline-block">
                                      Líder
                                    </span>
                                  )}
                                </div>
                                <span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#2f4982] to-blue-600 text-white text-xs font-bold rounded-full shadow-sm flex-shrink-0">
                                  {percentage.toFixed(2)}%
                                </span>
                              </div>

                              {/* Progress Bar - Always Blue */}
                              <div className="relative w-full h-3 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2f4982] via-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                  style={{ 
                                    width: `${percentage}%`,
                                    animation: 'slideIn 1s ease-out'
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="inline-block p-4 bg-slate-100 dark:bg-gray-700/50 rounded-full mb-4">
                      <Building2 className="w-12 h-12 text-slate-400 dark:text-gray-500" />
                    </div>
                    <p className="text-slate-600 dark:text-gray-400 font-medium text-lg">
                      Nenhuma empresa informada
                    </p>
                    <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">
                      Não há empresas participantes cadastradas neste contrato
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-gradient-to-r from-lbr-primary to-secondary rounded-full animate-pulse" />
              <span className="text-lg sm:text-3xl">Informações Detalhadas</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    // Special handling for LÂMINA - open modal directly
                    if (section.id === 'lamina') {
                      if (contract.lamina_url) {
                        setPdfModalOpen(true)
                      } else {
                        setSelectedSection(selectedSection === section.id ? null : section.id)
                      }
                    } else {
                      setSelectedSection(selectedSection === section.id ? null : section.id)
                    }
                  }}
                  className={`group relative overflow-hidden rounded-2xl p-4 sm:p-6 transition-all duration-500 transform hover:scale-105 border border-slate-100 dark:border-gray-700 ${
                    selectedSection === section.id
                      ? 'bg-gradient-to-br from-[#2f4982] to-blue-700 text-white shadow-2xl scale-105 ring-4 ring-blue-700/30'
                      : 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl'
                  } animate-in fade-in slide-in-from-bottom duration-700`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Hover Overlay (User's request) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982] to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                  {/* Bottom Border Highlight (Sliding Animation) */}
                  {selectedSection !== section.id && (
                    <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${section.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 text-center">
                    <div className={`p-3 sm:p-4 rounded-2xl shadow-lg transition-all duration-500 bg-gradient-to-br ${section.gradient} text-white group-hover:scale-110`}>
                      {section.icon}
                    </div>
                    <span className={`font-bold text-xs sm:text-sm uppercase tracking-wider ${
                      selectedSection === section.id ? 'text-white' : 'text-slate-700 dark:text-gray-300'
                    }`}>
                      {section.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Content */}
          {selectedSection && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-5 sm:p-8 md:p-10 border border-white/20 dark:border-gray-700/20 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 flex items-center gap-3">
                {sections.find((s) => s.id === selectedSection)?.icon}
                {sections.find((s) => s.id === selectedSection)?.label}
              </h3>




              {selectedSection === 'lamina' && (
                <div className="space-y-6">
                  {/* Este conteúdo só aparece se não tem lâmina (fallback) */}
                  {!contract.lamina_url && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-gray-600" />
                      <p className="text-slate-500 dark:text-gray-400 font-medium">Nenhuma lâmina disponível para este contrato.</p>
                      <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">Adicione uma lâmina editando o contrato.</p>
                    </div>
                  )}

                  {/* Downloads Section - sempre mostra se tiver algum arquivo */}
                  {(contract.lamina_url || contract.image_url) && (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-950/20 rounded-2xl p-6 border border-slate-200 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        Arquivos para Download
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contract.lamina_url && (
                          <button
                            type="button"
                            onClick={() => setPdfModalOpen(true)}
                            className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left"
                          >
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">Lâmina do Contrato</p>
                              <p className="text-sm text-slate-500 dark:text-gray-400">PDF • Clique para visualizar</p>
                            </div>
                            <Maximize2 className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-all" />
                          </button>
                        )}
                        {contract.image_url && (
                          <a
                            href={contract.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all"
                          >
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                              <Image className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">Imagem do Contrato</p>
                              <p className="text-sm text-slate-500 dark:text-gray-400">Imagem • Abrir em nova aba</p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedSection === 'cliente' && (
                <div className="grid gap-6">
                  {clienteParticipants.length > 0 ? (
                    clienteParticipants.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => handlePersonClick(p.person, 'CLIENTE')}
                        className="group p-6 rounded-2xl border-2 border-slate-200 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary transition-all duration-300 hover:shadow-xl hover:scale-102 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-950/10 cursor-pointer"
                      >
                        <p className="text-xs font-bold text-secondary dark:text-secondary-light mb-2 uppercase tracking-wider">
                          {prettyRole(p.role, p.custom_role)}
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">{p.person.full_name}</p>
                        <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-gray-300 font-medium">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📧</span> {p.person.email || '-'}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📱</span> {p.person.phone || '-'}
                          </span>
                          {p.person.office && (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">🏢</span> {p.person.office}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 dark:text-gray-300 text-center py-8 font-medium">Nenhum contato do cliente cadastrado.</p>
                  )}
                </div>
              )}

              {selectedSection === 'equipe' && (
                <div className="grid gap-6">
                  {equipeParticipants.length > 0 ? (
                    equipeParticipants.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => handlePersonClick(p.person, 'INTERNA')}
                        className="group p-6 rounded-2xl border-2 border-slate-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:scale-102 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/10 cursor-pointer"
                      >
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">
                          {prettyRole(p.role, p.custom_role)}
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">{p.person.full_name}</p>
                        <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-gray-300 font-medium">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📧</span> {p.person.email || '-'}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📱</span> {p.person.phone || '-'}
                          </span>
                          {p.person.office && (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">🏢</span> {p.person.office}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 dark:text-gray-300 text-center py-8 font-medium">Nenhum membro de equipe cadastrado.</p>
                  )}
                </div>
              )}

              {selectedSection === 'dificuldades' && (
                <LessonsSection contractId={contractId} />
              )}

              {selectedSection === 'localizacao' && (
                <div className="space-y-6">
                  {/* Location Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Card 1: Escritório Cliente */}
                    <div 
                      onClick={() => {
                        const address = contract.client_office_location || 'Endereço não informado';
                        if (address && address !== 'Endereço não informado') {
                           setMapModalType('CLIENTE');
                           setMapModalAddress(address);
                           setMapModalOpen(true);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Building2 className="w-16 h-16 text-blue-500" />
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                        <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Escritório Cliente</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-white line-clamp-3">
                        {contract.client_office_location || 'Endereço não informado'}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Ver no mapa</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Card 2: Escritório LBR */}
                    <div 
                      onClick={() => {
                         const address = contract.lbr_office_location || 'Endereço não informado';
                         if (address && address !== 'Endereço não informado') {
                           setMapModalType('LBR');
                           setMapModalAddress(address);
                           setMapModalOpen(true);
                         }
                      }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Briefcase className="w-16 h-16 text-purple-500" />
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                        <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Escritório LBR</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-white line-clamp-3">
                         {contract.lbr_office_location || 'Endereço não informado'}
                      </p>
                       <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Ver no mapa</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                  </div>

                   {/* Conditional Visualization: Highway Segments or Project Location */}
                   {contract.sector === 'Rodovias' ? (
                     // Show highway segments visualization for Rodovias sector
                     data.obras && data.obras.length > 0 && (
                       <div className="space-y-6">
                         <div>
                           <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                             🗺️ Visualização dos Trechos
                           </h4>
                           <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                             Clique em um trecho no mapa para ver detalhes e adicionar anotações
                           </p>
                           <ObraMapViewer
                             obras={data.obras}
                             onObraClick={handleObraClick}
                             selectedObraId={selectedObra?.id || null}
                             hoveredObraId={hoveredObraId}
                             nonConformities={nonConformities}
                             onNonConformityClick={handleNonConformityClick}
                           />
                         </div>

                         <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-gray-700">
                           <table className="w-full text-left border-collapse">
                             <thead className="bg-slate-50 dark:bg-gray-900/50">
                               <tr>
                                 <th className="py-4 px-6 font-bold text-slate-700 dark:text-gray-300">UF</th>
                                 <th className="py-4 px-6 font-bold text-slate-700 dark:text-gray-300">Rodovia</th>
                                 <th className="py-4 px-6 font-bold text-slate-700 dark:text-gray-300">Km Início</th>
                                 <th className="py-4 px-6 font-bold text-slate-700 dark:text-gray-300">Km Fim</th>
                                 <th className="py-4 px-6 font-bold text-slate-700 dark:text-gray-300">Extensão</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                               {data.obras.map((obra: any) => (
                                 <tr 
                                   key={obra.id} 
                                   className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                                   onClick={() => handleObraClick(obra)}
                                   onMouseEnter={() => setHoveredObraId(obra.id)}
                                   onMouseLeave={() => setHoveredObraId(null)}
                                 >
                                   <td className="py-4 px-6 text-slate-800 dark:text-gray-200">{obra.uf || '-'}</td>
                                   <td className="py-4 px-6 text-slate-800 dark:text-gray-200">{obra.nome || '-'}</td>
                                   <td className="py-4 px-6 text-slate-800 dark:text-gray-200">{obra.km_inicio}</td>
                                   <td className="py-4 px-6 text-slate-800 dark:text-gray-200">{obra.km_fim}</td>
                                   <td className="py-4 px-6 text-green-600 dark:text-green-400 font-bold">
                                     {(obra.km_fim - obra.km_inicio).toFixed(2)} km
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       </div>
                     )
                   ) : (
                     // Show project location map for non-Rodovias sectors
                     contract.location && (
                       <div className="mt-8 space-y-4">
                         <div>
                           <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                             🗺️ Visualização da Localização
                           </h4>
                           <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                             Mapa com a localização do projeto
                           </p>
                           <div className="rounded-2xl border-2 border-slate-200 dark:border-gray-700 overflow-hidden shadow-lg h-[500px]">
                             <LocationMapViewer 
                               address={contract.location}
                               className="h-full w-full"
                             />
                           </div>
                         </div>
                       </div>
                     )
                   )}
                </div>
              )}



              {selectedSection === 'medicoes' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <MeasurementExplorer
                    contractId={contractId}
                    contractName={contract.name}
                  />
                </div>
              )}

              {selectedSection === 'produtos' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <ProductExplorer
                    contractId={contractId}
                    contractName={contract.name}
                  />
                </div>
              )}

              {selectedSection === 'software' && (
                 <div className="animate-in fade-in slide-in-from-right duration-500">
                  <SoftwareExplorer contractId={contractId} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Annotation Sidebar */}
      <ObraAnnotationSidebar
        obra={selectedObra}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        clickCoords={clickCoords}
        selectedNonConformityId={selectedNonConformityId}
        onBack={() => setSelectedNonConformityId(null)}
      />

      {/* Ficha Modal */}
      <FichaModal
        isOpen={fichaModalOpen}
        onClose={handleFichaModalClose}
        onSuccess={() => {}}
        mode="view"
        initialData={selectedPerson ? {
          id: selectedPerson.id,
          nome: selectedPerson.full_name,
          email: selectedPerson.email || '',
          celular: selectedPerson.phone || '',
          cargo_cliente: selectedPerson.office || '',
          tipo: selectedPersonType,
          foto_perfil_url: '',
          // Add other default fields that might be needed
          cpf: '',
          rg: '',
          data_nascimento: '',
          nacionalidade: '',
          estado_civil: '',
          genero: '',
          telefone: '',
          endereco: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          profissao: '',
          registro_profissional: '',
          especialidades: '',
          resumo_profissional: '',
          idiomas: '',
          observacoes: '',
          experiencias: [],
          formacoes: [],
          certificados: [],
        } : undefined}
        defaultTipo={selectedPersonType}
      />

      {/* Mobile Action FAB - Only show if user can edit or manage editors */}
      {(canEdit || canManageEditors) && (
        <div className="fixed bottom-6 left-6 z-50 sm:hidden flex flex-col-reverse items-start gap-4">
          {/* Main Button */}
          <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ${
              isFabOpen ? 'bg-red-500 rotate-45' : 'bg-[#2f4982]'
            }`}
          >
            <Plus className="w-8 h-8" />
          </button>

          {/* Menu Items */}
          <AnimatePresence>
            {isFabOpen && (
              <>
                {canEdit && (
                  <motion.button
                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.8 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => {
                      router.push(`/engenharia/cadastrocontratos/${contractId}`)
                      setIsFabOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <Edit className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-gray-200">Editar</span>
                  </motion.button>
                )}

                {canManageEditors && (
                  <motion.button
                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.8 }}
                    transition={{ delay: canEdit ? 0.1 : 0.05 }}
                    onClick={() => {
                      setEditorsModalOpen(true)
                      setIsFabOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-gray-200">Editores</span>
                  </motion.button>
                )}

                <motion.button
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ delay: canManageEditors && canEdit ? 0.15 : canEdit || canManageEditors ? 0.1 : 0.05 }}
                  onClick={() => {
                    setAuditLogOpen(true)
                    setIsFabOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700"
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-gray-200">Histórico</span>
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
      {/* Generic Map Modal */}
      <AnimatePresence>
        {mapModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setMapModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#2f4982]" />
                  {mapModalType === 'OBRA' 
                    ? 'Mapa dos Trechos' 
                    : mapModalType === 'CLIENTE' 
                      ? 'Escritório do Cliente' 
                      : mapModalType === 'LBR'
                        ? 'Escritório LBR'
                        : 'Localização da Obra/Projeto'
                  }
                </h3>
                <button 
                  onClick={() => setMapModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 w-full h-full relative bg-gray-50 dark:bg-gray-800/50">
                 {mapModalType === 'OBRA' ? (
                   <div className="absolute inset-0">
                     <ObraMapViewer 
                        obras={data?.obras || []}
                        nonConformities={[]}
                        height="100%"
                        className="h-full w-full"
                     />
                   </div>
                 ) : (
                    <LocationMapViewer 
                      address={mapModalAddress}
                      className="h-full w-full"
                    />
                 )}
              </div>
              
              {mapModalType !== 'OBRA' && (
                 <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-slate-600 dark:text-gray-300 font-medium text-lg">
                      📍 {mapModalAddress}
                    </p>
                 </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editors Manager Modal */}
      <EditorsManager 
        contractId={contractId} 
        isOpen={editorsModalOpen} 
        onClose={() => setEditorsModalOpen(false)} 
      />

      {/* Audit Log Viewer */}
      <AuditLogViewer 
        contractId={contractId}
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />

      {/* Custom PDF Viewer Modal */}
      {contract.lamina_url && (
        <PDFViewerModal
          url={contract.lamina_url}
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          title="Lâmina do Contrato"
        />
      )}
    </>
  )
}
