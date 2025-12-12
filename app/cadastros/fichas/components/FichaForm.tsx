'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  User,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  Loader2,
  CheckCircle
} from 'lucide-react'
import FichaProfileView from './FichaProfileView'
import { motion, AnimatePresence } from 'framer-motion'

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

type TabType = 'pessoal' | 'contato' | 'profissional' | 'experiencia' | 'formacao' | 'certificados'

interface FichaFormProps {
  onSave: (data: any) => Promise<void>
  mode: 'create' | 'edit' | 'view'
  initialData?: any
  isModal?: boolean
  defaultTipo?: 'INTERNA' | 'CLIENTE'
  defaultCargo?: 'GESTOR_AREA' | 'GERENTE_ENGENHARIA'
}

// Primary blue color
const PRIMARY_BLUE = '#2f4982'

// Clean Input Field Component
const InputField = ({ label, name, type = 'text', placeholder, value, onChange, disabled, required, className, maxLength }: any) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f4982]/50 focus:border-[#2f4982] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
)

// Clean Select Field Component
const SelectField = ({ label, name, value, onChange, disabled, options, className, required }: any) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2f4982]/50 focus:border-[#2f4982] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
)

// Clean TextArea Field Component
const TextAreaField = ({ label, name, placeholder, value, onChange, disabled, rows = 3 }: any) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f4982]/50 focus:border-[#2f4982] transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
)

export default function FichaForm({ onSave, mode, initialData, isModal = false, defaultTipo, defaultCargo }: FichaFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('pessoal')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.foto_perfil_url || null
  )

  const readOnly = mode === 'view'

  const [formData, setFormData] = useState({
    tipo: defaultTipo || initialData?.tipo || 'INTERNA',
    cargo_cliente: defaultCargo || initialData?.cargo_cliente || '',
    nome: initialData?.nome || '',
    cpf: initialData?.cpf || '',
    rg: initialData?.rg || '',
    data_nascimento: initialData?.data_nascimento || '',
    nacionalidade: initialData?.nacionalidade || '',
    estado_civil: initialData?.estado_civil || '',
    genero: initialData?.genero || '',
    email: initialData?.email || '',
    telefone: initialData?.telefone || '',
    celular: initialData?.celular || '',
    endereco: initialData?.endereco || '',
    numero: initialData?.numero || '',
    complemento: initialData?.complemento || '',
    bairro: initialData?.bairro || '',
    cidade: initialData?.cidade || '',
    estado: initialData?.estado || '',
    cep: initialData?.cep || '',
    profissao: initialData?.profissao || '',
    registro_profissional: initialData?.registro_profissional || '',
    especialidades: initialData?.especialidades || '',
    resumo_profissional: initialData?.resumo_profissional || '',
    idiomas: initialData?.idiomas || '',
    observacoes: initialData?.observacoes || '',
    foto_perfil_url: initialData?.foto_perfil_url || '',
    experiencias: initialData?.experiencias || [],
    formacoes: initialData?.formacoes || [],
    certificados: initialData?.certificados || [],
  })

  const [novaExperiencia, setNovaExperiencia] = useState<Experiencia>({
    id: '', empresa: '', cargo: '', dataInicio: '', dataFim: '', descricao: '',
  })

  const [novaFormacao, setNovaFormacao] = useState<Formacao>({
    id: '', instituicao: '', curso: '', nivel: '', dataFormacao: '', descricao: '',
  })

  const [novoCertificado, setNovoCertificado] = useState<Certificado>({
    id: '', nome: '', instituicao: '', dataObtencao: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (readOnly) return
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload/ficha-photo', {
        method: 'POST',
        body: formDataUpload
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await res.json()
      setFormData((prev) => ({ ...prev, foto_perfil_url: data.url }))
      setPhotoPreview(data.url)
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      alert(error.message || 'Erro ao fazer upload da foto')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAddExperiencia = () => {
    if (readOnly || !novaExperiencia.empresa || !novaExperiencia.cargo) return
    setFormData((prev) => ({
      ...prev,
      experiencias: [...prev.experiencias, { ...novaExperiencia, id: Date.now().toString() }],
    }))
    setNovaExperiencia({ id: '', empresa: '', cargo: '', dataInicio: '', dataFim: '', descricao: '' })
  }

  const handleRemoveExperiencia = (id: string) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      experiencias: prev.experiencias.filter((e: Experiencia) => e.id !== id),
    }))
  }

  const handleAddFormacao = () => {
    if (readOnly || !novaFormacao.instituicao || !novaFormacao.curso) return
    setFormData((prev) => ({
      ...prev,
      formacoes: [...prev.formacoes, { ...novaFormacao, id: Date.now().toString() }],
    }))
    setNovaFormacao({ id: '', instituicao: '', curso: '', nivel: '', dataFormacao: '', descricao: '' })
  }

  const handleRemoveFormacao = (id: string) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      formacoes: prev.formacoes.filter((f: Formacao) => f.id !== id),
    }))
  }

  const handleAddCertificado = () => {
    if (readOnly || !novoCertificado.nome || !novoCertificado.instituicao) return
    setFormData((prev) => ({
      ...prev,
      certificados: [...prev.certificados, { ...novoCertificado, id: Date.now().toString() }],
    }))
    setNovoCertificado({ id: '', nome: '', instituicao: '', dataObtencao: '' })
  }

  const handleRemoveCertificado = (id: string) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      certificados: prev.certificados.filter((c: Certificado) => c.id !== id),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (readOnly) return
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    const tab = formData.tipo === 'CLIENTE' ? 'clientes' : 'equipe'
    router.push(`/cadastros?tab=${tab}`)
  }

  const tabs: { id: TabType; label: string; icon: any }[] = useMemo(() => [
    { id: 'pessoal', label: 'Pessoal', icon: User },
    { id: 'contato', label: 'Contato', icon: Phone },
    ...(formData.tipo !== 'CLIENTE' ? [
      { id: 'profissional', label: 'Profissional', icon: Briefcase },
      { id: 'experiencia', label: 'Experiência', icon: Calendar },
      { id: 'formacao', label: 'Formação', icon: GraduationCap },
      { id: 'certificados', label: 'Certificados', icon: Award },
    ] : [])
  ] as any, [formData.tipo])

  if (mode === 'view' && initialData) {
    return <FichaProfileView data={initialData} />
  }

  return (
    <div className={`min-h-screen ${isModal ? 'min-h-0 bg-transparent' : 'bg-slate-50 dark:bg-gray-900'}`}>
      {/* Clean Header */}
      {!isModal && (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#2f4982] dark:text-white">
                    {mode === 'create' ? 'Nova Ficha' : 'Editar Ficha'}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-gray-400 hidden sm:block">
                    {formData.tipo === 'CLIENTE' ? 'Ficha de Cliente' : 'Ficha Interna LBR'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#2f4982]/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-5xl mx-auto ${isModal ? 'p-0' : 'px-4 sm:px-6 py-6 sm:py-8'}`}>
        <form onSubmit={handleSubmit}>
          
          {/* Tipo de Ficha Selector */}
          {!defaultTipo && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700 mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-4">
                Tipo de Ficha
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'INTERNA', label: 'Interna LBR' },
                  { value: 'CLIENTE', label: 'Cliente' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.tipo === option.value
                        ? 'border-[#2f4982] bg-[#2f4982]/5 dark:bg-[#2f4982]/20'
                        : 'border-slate-200 dark:border-gray-600 hover:border-[#2f4982]/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.tipo === option.value ? 'border-[#2f4982] bg-[#2f4982]' : 'border-slate-300 dark:border-gray-500'
                    }`}>
                      {formData.tipo === option.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <input
                      type="radio"
                      name="tipo"
                      value={option.value}
                      checked={formData.tipo === option.value}
                      onChange={handleInputChange}
                      className="hidden"
                      disabled={readOnly}
                    />
                    <span className={`font-medium ${formData.tipo === option.value ? 'text-[#2f4982] dark:text-white' : 'text-slate-600 dark:text-gray-400'}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clean Tabs */}
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-gray-700 text-[#2f4982] dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* PESSOAL TAB */}
                {activeTab === 'pessoal' && (
                  <div className="space-y-6">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-gray-700">
                      <div className="relative group">
                        <div className={`w-28 h-28 rounded-full overflow-hidden border-4 transition-all ${
                          photoPreview 
                            ? 'border-[#2f4982]/20' 
                            : 'border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700'
                        }`}>
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-gray-500">
                              <User className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        
                        {!readOnly && (
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full">
                            <div className="text-center">
                              <Upload className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs">Alterar</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                          </label>
                        )}
                        
                        {uploadingPhoto && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-full">
                            <Loader2 className="w-6 h-6 text-[#2f4982] animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">Foto de Perfil</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={handleInputChange} disabled={readOnly} required className="md:col-span-2" placeholder="Digite o nome completo" />
                      
                      {formData.tipo === 'CLIENTE' && (
                        <SelectField 
                          label="Cargo do Cliente" 
                          name="cargo_cliente" 
                          value={formData.cargo_cliente} 
                          onChange={handleInputChange} 
                          disabled={readOnly}
                          required
                          options={[
                            { value: '', label: 'Selecione o cargo' },
                            { value: 'GESTOR_AREA', label: 'Gestor da Área' },
                            { value: 'GERENTE_ENGENHARIA', label: 'Gerente de Engenharia' }
                          ]} 
                          className="md:col-span-2"
                        />
                      )}

                      {formData.tipo !== 'CLIENTE' && (
                        <>
                          <InputField label="CPF" name="cpf" value={formData.cpf} onChange={handleInputChange} disabled={readOnly} placeholder="000.000.000-00" />
                          <InputField label="RG" name="rg" value={formData.rg} onChange={handleInputChange} disabled={readOnly} placeholder="00.000.000-0" />
                          <InputField label="Data de Nascimento" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleInputChange} disabled={readOnly} />
                          <InputField label="Nacionalidade" name="nacionalidade" value={formData.nacionalidade} onChange={handleInputChange} disabled={readOnly} placeholder="Brasileira" />
                          <SelectField 
                            label="Estado Civil" 
                            name="estado_civil" 
                            value={formData.estado_civil} 
                            onChange={handleInputChange} 
                            disabled={readOnly} 
                            options={[
                              { value: '', label: 'Selecione' },
                              { value: 'solteiro', label: 'Solteiro(a)' },
                              { value: 'casado', label: 'Casado(a)' },
                              { value: 'divorciado', label: 'Divorciado(a)' },
                              { value: 'viuvo', label: 'Viúvo(a)' }
                            ]} 
                          />
                          <SelectField 
                            label="Gênero" 
                            name="genero" 
                            value={formData.genero} 
                            onChange={handleInputChange} 
                            disabled={readOnly} 
                            options={[
                              { value: '', label: 'Selecione' },
                              { value: 'masculino', label: 'Masculino' },
                              { value: 'feminino', label: 'Feminino' },
                              { value: 'outro', label: 'Outro' }
                            ]} 
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTATO TAB */}
                {activeTab === 'contato' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={readOnly} placeholder="exemplo@email.com" />
                      <InputField label="Celular" name="celular" type="tel" value={formData.celular} onChange={handleInputChange} disabled={readOnly} placeholder="(00) 00000-0000" />
                      <InputField label="Telefone Fixo" name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} disabled={readOnly} placeholder="(00) 0000-0000" />
                    </div>

                    {formData.tipo !== 'CLIENTE' && (
                      <div className="pt-6 border-t border-slate-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-5 uppercase tracking-wide">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                          <InputField label="CEP" name="cep" value={formData.cep} onChange={handleInputChange} disabled={readOnly} placeholder="00000-000" />
                          <InputField label="Endereço" name="endereco" value={formData.endereco} onChange={handleInputChange} disabled={readOnly} className="md:col-span-3" placeholder="Rua, Avenida, etc" />
                          <InputField label="Número" name="numero" value={formData.numero} onChange={handleInputChange} disabled={readOnly} placeholder="123" />
                          <InputField label="Complemento" name="complemento" value={formData.complemento} onChange={handleInputChange} disabled={readOnly} placeholder="Apto 101" className="md:col-span-2" />
                          <InputField label="Bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} disabled={readOnly} placeholder="Centro" />
                          <InputField label="Cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} disabled={readOnly} className="md:col-span-3" placeholder="São Paulo" />
                          <InputField label="Estado" name="estado" value={formData.estado} onChange={handleInputChange} disabled={readOnly} placeholder="SP" maxLength={2} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PROFISSIONAL TAB */}
                {activeTab === 'profissional' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Profissão" name="profissao" value={formData.profissao} onChange={handleInputChange} disabled={readOnly} placeholder="Ex: Engenheiro Civil" />
                      <InputField label="Registro Profissional" name="registro_profissional" value={formData.registro_profissional} onChange={handleInputChange} disabled={readOnly} placeholder="Ex: CREA 123456" />
                    </div>
                    <TextAreaField label="Resumo Profissional" name="resumo_profissional" value={formData.resumo_profissional} onChange={handleInputChange} disabled={readOnly} placeholder="Descreva suas principais qualificações..." rows={4} />
                    <TextAreaField label="Especialidades" name="especialidades" value={formData.especialidades} onChange={handleInputChange} disabled={readOnly} placeholder="Java, React, Gestão de Projetos..." />
                    <TextAreaField label="Idiomas" name="idiomas" value={formData.idiomas} onChange={handleInputChange} disabled={readOnly} placeholder="Inglês Fluente, Espanhol Básico..." />
                  </div>
                )}

                {/* EXPERIÊNCIA TAB */}
                {activeTab === 'experiencia' && (
                  <div className="space-y-6">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-5 border border-slate-200 dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#2f4982]" />
                          Adicionar Experiência
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InputField label="Empresa" value={novaExperiencia.empresa} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, empresa: e.target.value })} placeholder="Nome da empresa" />
                          <InputField label="Cargo" value={novaExperiencia.cargo} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, cargo: e.target.value })} placeholder="Seu cargo" />
                          <InputField label="Início" type="date" value={novaExperiencia.dataInicio} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, dataInicio: e.target.value })} />
                          <InputField label="Fim" type="date" value={novaExperiencia.dataFim} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, dataFim: e.target.value })} />
                          <div className="md:col-span-2">
                            <TextAreaField label="Descrição" value={novaExperiencia.descricao} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, descricao: e.target.value })} placeholder="Descreva suas atividades..." />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddExperiencia}
                          className="w-full py-2.5 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </div>
                    )}

                    {formData.experiencias.length > 0 && (
                      <div className="space-y-3">
                        {formData.experiencias.map((exp: Experiencia) => (
                          <div key={exp.id} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">{exp.cargo}</h4>
                              <p className="text-sm text-slate-600 dark:text-gray-400">{exp.empresa}</p>
                              {(exp.dataInicio || exp.dataFim) && (
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                                  {exp.dataInicio} - {exp.dataFim || 'Atual'}
                                </p>
                              )}
                            </div>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExperiencia(exp.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.experiencias.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-gray-500">
                        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma experiência cadastrada</p>
                      </div>
                    )}
                  </div>
                )}

                {/* FORMAÇÃO TAB */}
                {activeTab === 'formacao' && (
                  <div className="space-y-6">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-5 border border-slate-200 dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#2f4982]" />
                          Adicionar Formação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InputField label="Instituição" value={novaFormacao.instituicao} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, instituicao: e.target.value })} placeholder="Nome da instituição" />
                          <InputField label="Curso" value={novaFormacao.curso} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, curso: e.target.value })} placeholder="Nome do curso" />
                          <SelectField
                            label="Nível"
                            value={novaFormacao.nivel}
                            onChange={(e: any) => setNovaFormacao({ ...novaFormacao, nivel: e.target.value })}
                            options={[
                              { value: '', label: 'Selecione' },
                              { value: 'tecnico', label: 'Técnico' },
                              { value: 'graduacao', label: 'Graduação' },
                              { value: 'pos', label: 'Pós-Graduação' },
                              { value: 'mestrado', label: 'Mestrado' },
                              { value: 'doutorado', label: 'Doutorado' }
                            ]}
                          />
                          <InputField label="Data de Conclusão" type="date" value={novaFormacao.dataFormacao} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, dataFormacao: e.target.value })} />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddFormacao}
                          className="w-full py-2.5 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </div>
                    )}

                    {formData.formacoes.length > 0 && (
                      <div className="space-y-3">
                        {formData.formacoes.map((form: Formacao) => (
                          <div key={form.id} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">{form.curso}</h4>
                              <p className="text-sm text-slate-600 dark:text-gray-400">{form.instituicao}</p>
                              {form.nivel && <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[#2f4982]/10 text-[#2f4982] dark:bg-[#2f4982]/30 dark:text-blue-300 rounded">{form.nivel}</span>}
                            </div>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFormacao(form.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.formacoes.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-gray-500">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma formação cadastrada</p>
                      </div>
                    )}
                  </div>
                )}

                {/* CERTIFICADOS TAB */}
                {activeTab === 'certificados' && (
                  <div className="space-y-6">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-5 border border-slate-200 dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#2f4982]" />
                          Adicionar Certificado
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InputField label="Nome do Certificado" value={novoCertificado.nome} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, nome: e.target.value })} placeholder="Nome do certificado" />
                          <InputField label="Instituição" value={novoCertificado.instituicao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, instituicao: e.target.value })} placeholder="Instituição emissora" />
                          <InputField label="Data de Obtenção" type="date" value={novoCertificado.dataObtencao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, dataObtencao: e.target.value })} />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCertificado}
                          className="w-full py-2.5 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </div>
                    )}

                    {formData.certificados.length > 0 && (
                      <div className="space-y-3">
                        {formData.certificados.map((cert: Certificado) => (
                          <div key={cert.id} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600">
                            <div className="p-2 bg-[#2f4982]/10 dark:bg-[#2f4982]/30 rounded-lg">
                              <Award className="w-5 h-5 text-[#2f4982] dark:text-blue-300" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">{cert.nome}</h4>
                              <p className="text-sm text-slate-600 dark:text-gray-400">{cert.instituicao}</p>
                              {cert.dataObtencao && (
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{cert.dataObtencao}</p>
                              )}
                            </div>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCertificado(cert.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.certificados.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-gray-500">
                        <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum certificado cadastrado</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Save Button */}
          {!isModal && (
            <div className="mt-6 sm:hidden">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-semibold transition-all disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Ficha
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
