'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api/api'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import type { LocationValue } from '@/components/ui/LocationField'
import GeralSection from './components/GeralSection'
import ClienteSection from './components/ClienteSection'
import EquipeSection, { type TeamMember } from './components/EquipeSection'
import ObrasSection, { type ObraRow, type RodoviaOption, type ObraTipo } from './components/ObrasSection'
import { emptyLocation } from './lib/validation'

type TabType = 'geral' | 'cliente' | 'equipe' | 'obras'

interface FormData {
  nomeContrato: string
  contratante: string
  setor: string
  objetoContrato: string
  escopoContrato: string
  lote4: string
  lote5: string
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
    const match = row.codigo?.match(/^\d{3}/)
    const numeroRodovia = match ? match[0] : row.codigo
    const key = `${uf}-${numeroRodovia}`
    if (!map.has(key)) {
      map.set(key, {
        id: row.id,
        codigo: numeroRodovia,
        nome: `${uf} ${numeroRodovia}`,
        uf,
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
    lote4: '',
    lote5: '',
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
      const raw = (await apiFetch(`/rodovias?uf=${uf}`)) as RodoviaOption[]
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
          lote4: contract.lote4 || '',
          lote5: contract.lote5 || '',
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
        lote4: formData.lote4 || null,
        lote5: formData.lote5 || null,
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
    { id: 'geral' as TabType, label: 'Geral', icon: '📋' },
    { id: 'cliente' as TabType, label: 'Cliente', icon: '👤' },
    { id: 'equipe' as TabType, label: 'Equipe', icon: '👥' },
    { id: 'obras' as TabType, label: 'Obras', icon: '🛣️' },
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

        {/* Tabs */}
        <div className="mb-6 sm:mb-10 animate-in fade-in slide-in-from-top duration-700 delay-200">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto py-4 sm:py-8 px-2 sm:px-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-500 whitespace-nowrap overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-lbr-primary to-secondary text-white shadow-2xl shadow-lbr-primary scale-105 ring-4 ring-lbr-primary/30'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-slate-700 dark:text-gray-200 hover:shadow-lg hover:scale-102 border-2 border-slate-300 dark:border-gray-600'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-lbr-primary via-secondary to-accent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                )}
                
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="font-semibold">{tab.label}</span>
                </span>

                {activeTab === tab.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}
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
                    onLocationChange={(value) => setFormData((prev) => ({ ...prev, localizacao: value }))}
                    onFileChange={handleFileChange}
                    onImageChange={handleImageChange}
                    onRemoveFile={handleRemoveFile}
                    onRemoveImage={handleRemoveImage}
                    existingImageUrl={!existingImageRemoved ? existingImageUrl : null}
                    existingLaminaFilename={!existingLaminaRemoved ? existingLaminaFilename : null}
                  />
                </div>
              )}

              {activeTab === 'cliente' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <ClienteSection
                    formData={formData}
                    onChange={handleInputChange}
                    onLocationChange={(value) => setFormData((prev) => ({ ...prev, localizacaoEscritorioCliente: value }))}
                  />
                </div>
              )}

              {activeTab === 'equipe' && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                  <EquipeSection
                    formData={formData}
                    onTeamChange={(team) => setFormData((prev) => ({ ...prev, teamMembers: team }))}
                    onLocationChange={(value) => setFormData((prev) => ({ ...prev, localizacaoEscritorioLbr: value }))}
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

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-slate-200 dark:border-gray-700">
              <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                {activeTab !== 'geral' && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex((t) => t.id === activeTab)
                      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id)
                    }}
                    className="group px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 hover:shadow-lg hover:-translate-x-1 flex-1 sm:flex-none"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="hidden sm:inline">Anterior</span>
                    </span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => router.push('/engenharia/contratos')}
                  className="px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:shadow-lg flex-1 sm:flex-none text-sm sm:text-base"
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
                    className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-900 dark:bg-gray-800 border-none flex items-center justify-center shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 overflow-hidden hover:w-36 sm:hover:w-40 hover:rounded-full hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* SVG Icon */}
                    <svg
                      viewBox="0 0 448 512"
                      className="w-3 sm:w-4 fill-white transition-all duration-300 group-hover:w-12 sm:group-hover:w-14 group-hover:translate-y-[60%]"
                    >
                      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                    </svg>
                    
                    {/* Delete Text */}
                    <span className="absolute -top-5 text-white text-[2px] transition-all duration-300 group-hover:text-sm group-hover:opacity-100 group-hover:translate-y-[30px] opacity-0">
                      Excluir
                    </span>
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {activeTab !== 'obras' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex((t) => t.id === activeTab)
                      if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id)
                    }}
                    className="group px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-lbr-primary to-secondary text-white hover:from-lbr-primary-hover hover:to-secondary-dark shadow-lg hover:shadow-xl hover:shadow-secondary/50 hover:translate-x-1 flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      <span className="hidden sm:inline">Próximo</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-bold transition-all duration-500 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-2xl hover:shadow-green-500/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden flex-1 sm:flex-none text-sm sm:text-base"
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
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
