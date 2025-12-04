'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, ArrowLeft, ArrowRight, Check, Trash2, FileText, MapPin, User, Users, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api/api'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import type { LocationValue } from '@/components/ui/LocationField'
import GeralSection from './components/GeralSection'
import ClienteSection from './components/ClienteSection'
import EquipeSection, { type TeamMember } from './components/EquipeSection'
import LocalizacaoSection from './components/LocalizacaoSection'
import ObrasSection, { type ObraRow, type RodoviaOption, type ObraTipo } from './components/ObrasSection'
import { emptyLocation } from './lib/validation'

type TabType = 'geral' | 'localizacao' | 'cliente' | 'equipe' | 'obras'

interface FormData {
  nomeContrato: string
  contratante: string
  setor: string
  objetoContrato: string
  escopoContrato: string
  caracteristicas: string
  dataInicio: string
  dataFim: string
  valorContrato: string
  lamina: File | null
  imagemContrato: File | null
  localizacao: LocationValue
  localizacaoEscritorioCliente: LocationValue
  localizacaoEscritorioLbr: LocationValue
  gestorArea: string
  emailGestor: string
  telefoneGestor: string
  gerenteEngenharia: string
  emailGerente: string
  telefoneGerente: string
  teamMembers: TeamMember[]
}

function normalizarRodoviasEstaduais(data: RodoviaOption[], uf: string): RodoviaOption[] {
  const map = new Map<string, RodoviaOption>()
  for (const row of data) {
    // row.codigo já vem como "SP-008" do banco, use direto
    const key = `${row.codigo}-${uf}`
    if (!map.has(key)) {
      map.set(key, {
        id: row.id,
        codigo: row.codigo,
        nome: row.nome || row.codigo,  // Usa o nome do banco (já formatado)
        uf,
        km_inicial: row.km_inicial,
        km_final: row.km_final,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

function buildParticipants(form: FormData) {
  const escritorioCliente = form.localizacaoEscritorioCliente?.texto?.trim() || null
  const escritorioLbr = form.localizacaoEscritorioLbr?.texto?.trim() || null

  const arr = [
    // Client participants
    form.gestorArea?.trim() && {
      role: 'GESTOR_AREA',
      person: {
        full_name: form.gestorArea.trim(),
        email: form.emailGestor || null,
        phone: form.telefoneGestor || null,
        office: escritorioCliente,
      },
    },
    form.gerenteEngenharia?.trim() && {
      role: 'GERENTE_ENGENHARIA',
      person: {
        full_name: form.gerenteEngenharia.trim(),
        email: form.emailGerente || null,
        phone: form.telefoneGerente || null,
        office: escritorioCliente,
      },
    },
    // Team members (dynamic)
    ...form.teamMembers.map(member => ({
      role: member.role,
      person: {
        full_name: member.name,
        email: member.email || null,
        phone: member.phone || null,
        office: escritorioLbr,
      },
    })),
  ].filter(Boolean)

  return arr
}

export default function CadastroContrato() {
  const router = useRouter()
  const params = useParams()
  const contractId = params?.id as string | undefined
  const isEdit = useMemo(() => Boolean(contractId), [contractId])

  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    nomeContrato: '',
    contratante: '',
    setor: '',
    objetoContrato: '',
    escopoContrato: '',
    caracteristicas: '',
    dataInicio: '',
    dataFim: '',
    valorContrato: '',
    lamina: null,
    imagemContrato: null,
    localizacao: emptyLocation,
    localizacaoEscritorioCliente: emptyLocation,
    localizacaoEscritorioLbr: emptyLocation,
    gestorArea: '',
    emailGestor: '',
    telefoneGestor: '',
    gerenteEngenharia: '',
    emailGerente: '',
    telefoneGerente: '',
    teamMembers: [],
  })

  const [hasMultipleWorks, setHasMultipleWorks] = useState<'nao' | 'sim'>('nao')
  const [obras, setObras] = useState<ObraRow[]>([
    { tipo: 'ESTADUAL', uf: '', rodoviaId: '', brCodigo: '', kmInicio: '', kmFim: '' },
  ])
  const [rodoviasPorUf, setRodoviasPorUf] = useState<Record<string, RodoviaOption[]>>({})
  const [brsPorUf, setBrsPorUf] = useState<Record<string, string[]>>({})
  
  // State for existing images/files stored in database
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingLaminaFilename, setExistingLaminaFilename] = useState<string | null>(null)
  
  // Flags to track if existing files were explicitly removed
  const [existingImageRemoved, setExistingImageRemoved] = useState(false)
  const [existingLaminaRemoved, setExistingLaminaRemoved] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, lamina: file }))
    if (file) toast.success('Arquivo anexado com sucesso!')
  }

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, lamina: null }))
    if (existingLaminaFilename) {
      setExistingLaminaRemoved(true)
    }
    toast.info('Arquivo removido')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, imagemContrato: file }))
    if (file) toast.success('Imagem anexada com sucesso!')
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imagemContrato: null }))
    if (existingImageUrl) {
      setExistingImageRemoved(true)
    }
    toast.info('Imagem removida')
  }

  async function loadRodoviasEstaduais(uf: string) {
    if (!uf || rodoviasPorUf[uf]) return
    try {
      const raw = (await apiFetch(`/rodovias?uf=${uf}&tipo=ESTADUAL`)) as RodoviaOption[]
      const data = normalizarRodoviasEstaduais(raw, uf)
      setRodoviasPorUf((prev) => ({ ...prev, [uf]: data }))
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível carregar as rodovias deste estado.')
    }
  }

  async function loadBrsFederais(uf: string) {
    if (!uf || brsPorUf[uf]) return
    try {
      const iso = new Date().toISOString()
      const url = `https://servicos.dnit.gov.br/sgplan/apigeo/snv/listarbrporuf?data=${encodeURIComponent(iso)}&uf=${uf}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('Falha ao buscar BRs deste estado.')
      const json: { uf: string; lista_br: string } = await resp.json()
      const lista = json.lista_br?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
      setBrsPorUf((prev) => ({ ...prev, [uf]: lista }))
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível carregar as BRs deste estado.')
    }
  }

  // Load existing contract data for editing
  useEffect(() => {
    if (!isEdit || !contractId) return
    let cancelled = false

    async function loadExistingContract() {
      try {
        setLoadingExisting(true)
        const data: any = await apiFetch(`/contracts/${contractId}`)
        
        if (cancelled) return

        const contract = data.contract || {}
        const organization = data.organization || {}
        const participants = data.participants || []

        const getPerson = (role: string) => {
          const participant = participants.find((p: any) => 
            (p.role || '').toUpperCase() === role.toUpperCase()
          )
          return participant?.person || null
        }

        const gestor = getPerson('GESTOR_AREA')
        const gerente = getPerson('GERENTE_ENGENHARIA')
        const coord = getPerson('COORDENADORA')
        const eng = getPerson('ENGENHEIRO_RESPONSAVEL')

        setFormData({
          nomeContrato: contract.name || '',
          contratante: organization.name || '',
          setor: contract.sector || '',
          objetoContrato: contract.object || '',
          escopoContrato: contract.scope || '',
          caracteristicas: contract.caracteristicas || '',
          dataInicio: contract.data_inicio || '',
          dataFim: contract.data_fim || '',
          valorContrato: contract.valor || '',
          lamina: null,
          imagemContrato: null,
          localizacao: { texto: contract.location || '', lat: null, lng: null, placeId: null },
          localizacaoEscritorioCliente: { 
            texto: gestor?.office || '', 
            lat: null, 
            lng: null, 
            placeId: null 
          },
          localizacaoEscritorioLbr: { 
            texto: coord?.office || eng?.office || '', 
            lat: null, 
            lng: null, 
            placeId: null 
          },
          gestorArea: gestor?.full_name || '',
          emailGestor: gestor?.email || '',
          telefoneGestor: gestor?.phone || '',
          gerenteEngenharia: gerente?.full_name || '',
          emailGerente: gerente?.email || '',
          telefoneGerente: gerente?.phone || '',
          teamMembers: participants
            .filter((p: any) => {
              const role = (p.role || '').toUpperCase()
              return !['GESTOR_AREA', 'GERENTE_ENGENHARIA'].includes(role)
            })
            .map((p: any, index: number) => ({
              id: `loaded-${index}`,
              personId: p.person_id || '',
              name: p.person?.full_name || '',
              role: p.role || 'OUTRO',
              email: p.person?.email || '',
              phone: p.person?.phone || ''
            })),
        })

        // Load existing documents (cover image and lamina)
        const documents = data.documents || []
        const coverImageDoc = documents.find((d: any) => d.kind === 'COVER_IMAGE')
        const laminaDoc = documents.find((d: any) => d.kind === 'LAMINA')
        
        if (coverImageDoc?.storage_url) {
          setExistingImageUrl(coverImageDoc.storage_url)
        }
        
        if (laminaDoc?.filename) {
          setExistingLaminaFilename(laminaDoc.filename)
        }

        const obrasApi = data.obras || []
        if (obrasApi.length > 0) {
          const mappedObras: ObraRow[] = obrasApi.map((o: any) => ({
            tipo: (o.tipo_rodovia || 'ESTADUAL').toUpperCase() as ObraTipo,
            uf: o.uf || '',
            rodoviaId: o.rodovia_id || '',
            brCodigo: o.br_codigo || '',
            kmInicio: String(o.km_inicio || ''),
            kmFim: String(o.km_fim || ''),
          }))

          setObras(mappedObras)
          setHasMultipleWorks(mappedObras.length > 1 ? 'sim' : 'nao')

          for (const obra of mappedObras) {
            if (obra.uf) {
              if (obra.tipo === 'ESTADUAL') {
                await loadRodoviasEstaduais(obra.uf)
              } else {
                await loadBrsFederais(obra.uf)
              }
            }
          }
        }
      } catch (err: any) {
        toast.error(err?.message || 'Falha ao carregar contrato para edição.')
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    }

    loadExistingContract()

    return () => {
      cancelled = true
    }
  }, [isEdit, contractId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomeContrato.trim()) {
      toast.error('Informe o Nome do Contrato.')
      setActiveTab('geral')
      return
    }
    if (!formData.contratante.trim()) {
      toast.error('Informe o Contratante/Empresa.')
      setActiveTab('geral')
      return
    }
    if (!formData.objetoContrato.trim() || !formData.escopoContrato.trim()) {
      toast.error('Objeto e Escopo são obrigatórios.')
      setActiveTab('geral')
      return
    }

    const normalizarKm = (valor: string) => Number(valor.replace(',', '.').trim())

    try {
      setSubmitting(true)

      const obrasPayload = obras
        .filter((o) => {
          if (!o.uf || !o.kmInicio.trim() || !o.kmFim.trim()) return false
          if (o.tipo === 'ESTADUAL') return Boolean(o.rodoviaId)
          return Boolean(o.brCodigo)
        })
        .map((o) => ({
          tipoRodovia: o.tipo,
          uf: o.uf,
          rodoviaId: o.tipo === 'ESTADUAL' ? Number(o.rodoviaId) : null,
          brCodigo: o.tipo === 'FEDERAL' ? o.brCodigo : null,
          kmInicio: normalizarKm(o.kmInicio),
          kmFim: normalizarKm(o.kmFim),
        }))

      const participants = buildParticipants(formData)

      const laminaFile = formData.lamina
        ? {
            filename: formData.lamina.name,
            contentType: formData.lamina.type || undefined,
            data: await fileToBase64(formData.lamina),
          }
        : null

      const coverImageFile = formData.imagemContrato
        ? {
            filename: formData.imagemContrato.name,
            contentType: formData.imagemContrato.type || undefined,
            data: await fileToBase64(formData.imagemContrato),
          }
        : null

      const payload = {
        name: formData.nomeContrato,
        sector: formData.setor || null,
        object: formData.objetoContrato,
        scope: formData.escopoContrato,
        caracteristicas: formData.caracteristicas || null,
        dataInicio: formData.dataInicio || null,
        dataFim: formData.dataFim || null,
        valor: formData.valorContrato || null,
        status: 'Ativo',
        location: formData.localizacao?.texto || null,
        organization: { name: formData.contratante },
        participants,
        obras: obrasPayload,
        laminaFile: laminaFile || undefined,
        coverImageFile: coverImageFile || undefined,
        removeLamina: existingLaminaRemoved,
        removeCoverImage: existingImageRemoved,
      }

      const endpoint = isEdit && contractId ? `/contracts/${contractId}` : '/contracts'
      const method = isEdit ? 'PUT' : 'POST'

      const resp: any = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      toast.success(isEdit ? 'Contrato atualizado com sucesso!' : 'Contrato salvo com sucesso!')
      const newId = isEdit && contractId ? contractId : resp?.id
      router.push(newId ? `/contratos/${newId}` : '/engenharia/contratos')
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar o contrato.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'geral' as TabType, label: 'Geral', icon: FileText },
    { id: 'localizacao' as TabType, label: 'Localização', icon: MapPin },
    { id: 'cliente' as TabType, label: 'Cliente', icon: User },
    { id: 'equipe' as TabType, label: 'Equipe', icon: Users },
    { id: 'obras' as TabType, label: 'Obras', icon: Layers },
  ]

  if (loadingExisting) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-600 dark:text-gray-400">
        Carregando dados do contrato...
      </div>
    )
  }

  return (
    <>
      <AnimatedBackground />
      <main className="relative container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-block px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-lbr-primary via-secondary to-accent dark:from-lbr-primary dark:via-secondary-dark dark:to-accent-dark bg-clip-text text mb-3 animate-in zoom-in duration-500 break-words">
              {isEdit ? '✏️ Editar Contrato' : '✨ Novo Contrato'}
            </h1>
            <div className="h-1 bg-gradient-to-r from-lbr-primary via-secondary to-accent rounded-full animate-in slide-in-from-left duration-700" />
          </div>
          <p className="text-slate-600 dark:text-gray-200 mt-4 text-sm sm:text-base md:text-lg animate-in fade-in duration-700 delay-200 font-medium px-2">
            Preencha os dados com atenção para criar um registro completo
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top duration-700 delay-100">
          <div className="max-w-3xl mx-auto relative px-2">
            {/* Connecting Lines Container - Positioned between the centers of the first and last circles */}
            <div className="hidden sm:block absolute top-5 left-5 right-5 h-1 -translate-y-1/2 z-0">
              {/* Gray Background Line */}
              <div className="absolute inset-0 bg-slate-200 dark:bg-gray-700 rounded-full" />
              
              {/* Green Progress Line */}
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ 
                  width: `${(tabs.findIndex(t => t.id === activeTab) / (tabs.length - 1)) * 100}%` 
                }} 
              />
            </div>

            <div className="flex items-center justify-between relative z-20 gap-2">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id
                const isCompleted = tabs.findIndex((t) => t.id === activeTab) > index
                
                return (
                  <div key={tab.id} className="flex flex-col items-center gap-1 sm:gap-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold transition-all duration-500 border-2 sm:border-4 relative z-20 ${
                        isActive
                          ? 'bg-gray-900 bg-opacity-100 text-white shadow-lg scale-110 border-white dark:border-gray-700'
                          : isCompleted
                          ? 'bg-green-500 bg-opacity-100 text-white shadow-md border-white dark:border-gray-950'
                          : 'bg-slate-50 dark:bg-gray-950 bg-opacity-100 text-slate-500 dark:text-gray-400 border-white dark:border-gray-950'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-xs sm:text-base">{index + 1}</span>}
                    </div>
                    <span 
                      className={`text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                        isActive 
                          ? 'text-lbr-primary dark:text-white scale-110' 
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-slate-500 dark:text-gray-500'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs - Modernized & Centered */}
        <div className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-top duration-700 delay-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:justify-center gap-3 sm:gap-4 px-2 sm:px-4">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-500 overflow-hidden ${
                    isActive
                      ? 'text-white shadow-2xl shadow-blue-900/40 scale-105 ring-2 ring-[#2f4982]/50'
                      : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-slate-700 dark:text-gray-200 hover:shadow-xl hover:scale-105 border-2 border-slate-200 dark:border-gray-700 hover:border-lbr-primary/50 dark:hover:border-blue-500/50'
                  }`}
                  style={isActive ? { background: '#2f4982', animationDelay: `${index * 50}ms` } : { animationDelay: `${index * 50}ms` }}
                >
                  {/* Shimmer effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ${isActive ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'}`} />
                  
                  {/* Glow effect for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl" style={{ background: '#2f4982' }} />
                  )}
                  
                  <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                      isActive 
                        ? 'animate-pulse' 
                        : 'group-hover:scale-110 group-hover:rotate-6'
                    }`} />
                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                  </span>

                  {/* Active indicator - animated bar */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-1 bg-white rounded-full">
                      <div className="absolute inset-0 bg-white rounded-full animate-pulse" />
                      <div className="absolute inset-0 bg-white/50 rounded-full blur-sm animate-pulse" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 md:p-12 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="min-h-[600px]">
              {activeTab === 'geral' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <GeralSection
                    formData={formData}
                    onChange={handleInputChange}
                    onFileChange={handleFileChange}
                    onImageChange={handleImageChange}
                    onRemoveFile={handleRemoveFile}
                    onRemoveImage={handleRemoveImage}
                    existingImageUrl={!existingImageRemoved ? existingImageUrl : null}
                    existingLaminaFilename={!existingLaminaRemoved ? existingLaminaFilename : null}
                  />
                </div>
              )}

              {activeTab === 'localizacao' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <LocalizacaoSection
                    formData={formData}
                    onLocalizacaoChange={(value) => setFormData((prev) => ({ ...prev, localizacao: value }))}
                    onLocalizacaoClienteChange={(value) => setFormData((prev) => ({ ...prev, localizacaoEscritorioCliente: value }))}
                    onLocalizacaoLbrChange={(value) => setFormData((prev) => ({ ...prev, localizacaoEscritorioLbr: value }))}
                  />
                </div>
              )}

              {activeTab === 'cliente' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <ClienteSection
                    formData={formData}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {activeTab === 'equipe' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <EquipeSection
                    formData={formData}
                    onTeamChange={(team) => setFormData((prev) => ({ ...prev, teamMembers: team }))}
                  />
                </div>
              )}

              {activeTab === 'obras' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <ObrasSection
                    obras={obras}
                    rodoviasPorUf={rodoviasPorUf}
                    brsPorUf={brsPorUf}
                    hasMultipleWorks={hasMultipleWorks}
                    onHasMultipleWorksChange={setHasMultipleWorks}
                    onAddObra={() => setObras((prev) => [...prev, { tipo: 'ESTADUAL', uf: '', rodoviaId: '', brCodigo: '', kmInicio: '', kmFim: '' }])}
                    onRemoveObra={(index) => setObras((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))}
                    onUpdateObraField={(index, field, value) => setObras((prev) => prev.map((obra, i) => i === index ? { ...obra, [field]: value } : obra))}
                    onChangeTipo={async (index, tipo) => {
                      const ufAtual = obras[index]?.uf ?? ''
                      setObras((prev) => prev.map((obra, i) => i === index ? { ...obra, tipo, rodoviaId: '', brCodigo: '' } : obra))
                      if (ufAtual) {
                        if (tipo === 'ESTADUAL') await loadRodoviasEstaduais(ufAtual)
                        else await loadBrsFederais(ufAtual)
                      }
                    }}
                    onChangeUf={async (index, uf) => {
                      const tipoAtual = obras[index]?.tipo ?? 'ESTADUAL'
                      setObras((prev) => prev.map((obra, i) => i === index ? { ...obra, uf, rodoviaId: '', brCodigo: '' } : obra))
                      if (uf) {
                        if (tipoAtual === 'ESTADUAL') await loadRodoviasEstaduais(uf)
                        else await loadBrsFederais(uf)
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons - Modernized & Centered */}
            <div className="flex justify-center items-center gap-3 sm:gap-4 px-2 pt-6 sm:pt-8 border-t border-slate-200 dark:border-gray-700 flex-wrap">
              {/* Previous Button */}
              {activeTab !== 'geral' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex((t) => t.id === activeTab)
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id)
                  }}
                  className="group px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-lbr-primary dark:hover:border-blue-500 hover:shadow-lg hover:-translate-x-1 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Anterior</span>
                </button>
              )}
              
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => router.push('/engenharia/contratos')}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:shadow-lg"
              >
                Cancelar
              </button>

              {/* Delete Button - Only in Edit Mode */}
              {isEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) return
                    
                    try {
                      setSubmitting(true)
                      await apiFetch(`/contracts/${contractId}`, { method: 'DELETE' })
                      toast.success('Contrato excluído com sucesso!')
                      router.push('/engenharia/contratos')
                    } catch (err: any) {
                      toast.error(err?.message || 'Erro ao excluir contrato')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  disabled={submitting}
                  className="group px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Excluir</span>
                </button>
              )}

              {/* Next/Save Button */}
              {activeTab !== 'obras' ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex((t) => t.id === activeTab)
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id)
                  }}
                  className="group px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-lbr-primary to-secondary text-white hover:from-lbr-primary-hover hover:to-secondary-dark shadow-lg hover:shadow-xl hover:shadow-secondary/50 hover:translate-x-1 flex items-center gap-2"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative px-7 sm:px-10 py-3 sm:py-4 rounded-xl font-bold transition-all duration-500 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-2xl hover:shadow-green-500/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden flex items-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <span className="relative flex items-center gap-3">
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Salvar Contrato</span>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
