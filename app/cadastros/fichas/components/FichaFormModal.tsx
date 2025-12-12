'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
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
  Upload,
  Mail,
  MapPin,
  Edit
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  initialData?: any
  defaultTipo?: 'INTERNA' | 'CLIENTE'
  onEdit?: () => void
}

// Elegant Input Component with floating label effect
const FloatingInput = ({ label, name, type = 'text', placeholder, value, onChange, disabled, required, className }: any) => (
  <div className={`relative ${className}`}>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder=" "
      required={required}
      className="peer w-full px-4 pt-5 pb-2 rounded-2xl border border-white/20 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#2f4982]/40 focus:border-[#2f4982] transition-all duration-300 disabled:opacity-50"
    />
    <label className="absolute left-4 top-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#2f4982]">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  </div>
)

// Elegant Select Component
const FloatingSelect = ({ label, name, value, onChange, disabled, options, className, required }: any) => (
  <div className={`relative ${className}`}>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className="peer w-full px-4 pt-5 pb-2 rounded-2xl border border-white/20 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2f4982]/40 focus:border-[#2f4982] transition-all duration-300 disabled:opacity-50 appearance-none cursor-pointer"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <label className="absolute left-4 top-1.5 text-xs font-medium text-slate-500 dark:text-gray-400">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

// Elegant TextArea Component
const FloatingTextArea = ({ label, name, value, onChange, disabled, rows = 3 }: any) => (
  <div className="relative">
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder=" "
      rows={rows}
      className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-white/20 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#2f4982]/40 focus:border-[#2f4982] transition-all duration-300 resize-none disabled:opacity-50"
    />
    <label className="absolute left-4 top-2 text-xs font-medium text-slate-500 dark:text-gray-400">
      {label}
    </label>
  </div>
)

export default function FichaFormModal({ onSave, onClose, mode, initialData, defaultTipo, onEdit }: FichaFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pessoal')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.foto_perfil_url || null)

  const [formData, setFormData] = useState({
    tipo: defaultTipo || initialData?.tipo || 'INTERNA',
    cargo_cliente: initialData?.cargo_cliente || '',
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

  const isCliente = formData.tipo === 'CLIENTE'
  const isViewMode = mode === 'view'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      
      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload/ficha-photo', { method: 'POST', body: formDataUpload })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      setFormData((prev) => ({ ...prev, foto_perfil_url: data.url }))
      setPhotoPreview(data.url)
      toast.success('Foto carregada com sucesso!')
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      toast.error(error.message || 'Erro ao fazer upload da foto')
      setPhotoPreview(null) // Reset preview on error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAddExperiencia = () => {
    if (!novaExperiencia.empresa || !novaExperiencia.cargo) return
    setFormData((prev) => ({
      ...prev,
      experiencias: [...prev.experiencias, { ...novaExperiencia, id: Date.now().toString() }],
    }))
    setNovaExperiencia({ id: '', empresa: '', cargo: '', dataInicio: '', dataFim: '', descricao: '' })
  }

  const handleRemoveExperiencia = (id: string) => {
    setFormData((prev) => ({ ...prev, experiencias: prev.experiencias.filter((e: Experiencia) => e.id !== id) }))
  }

  const handleAddFormacao = () => {
    if (!novaFormacao.instituicao || !novaFormacao.curso) return
    setFormData((prev) => ({
      ...prev,
      formacoes: [...prev.formacoes, { ...novaFormacao, id: Date.now().toString() }],
    }))
    setNovaFormacao({ id: '', instituicao: '', curso: '', nivel: '', dataFormacao: '', descricao: '' })
  }

  const handleRemoveFormacao = (id: string) => {
    setFormData((prev) => ({ ...prev, formacoes: prev.formacoes.filter((f: Formacao) => f.id !== id) }))
  }

  const handleAddCertificado = () => {
    if (!novoCertificado.nome || !novoCertificado.instituicao) return
    setFormData((prev) => ({
      ...prev,
      certificados: [...prev.certificados, { ...novoCertificado, id: Date.now().toString() }],
    }))
    setNovoCertificado({ id: '', nome: '', instituicao: '', dataObtencao: '' })
  }

  const handleRemoveCertificado = (id: string) => {
    setFormData((prev) => ({ ...prev, certificados: prev.certificados.filter((c: Certificado) => c.id !== id) }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  const tabs = useMemo(() => {
    if (isCliente) {
      return [{ id: 'pessoal', label: 'Dados Gerais', icon: User }]
    }
    return [
      { id: 'pessoal', label: 'Pessoal', icon: User },
      { id: 'contato', label: 'Contato', icon: Phone },
      { id: 'profissional', label: 'Profissional', icon: Briefcase },
      { id: 'experiencia', label: 'Experiência', icon: Calendar },
      { id: 'formacao', label: 'Formação', icon: GraduationCap },
      { id: 'certificados', label: 'Certificados', icon: Award },
    ]
  }, [isCliente]) as { id: TabType; label: string; icon: any }[]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-blue-50/90 to-slate-50/95 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 shadow-2xl shadow-[#2f4982]/20 border border-white/50 dark:border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden">
          {/* Subtle animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2f4982] via-[#3d5a9e] to-[#2f4982] opacity-95" />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === 'create' ? 'Nova Ficha' : 'Editar Ficha'}
                </h2>
                <p className="text-sm text-white/70">
                  {isCliente ? 'Ficha de Cliente' : 'Ficha Interna LBR'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs - Elegant centered design with animation */}
        {tabs.length > 1 && (
          <div className="px-6 pt-4">
            <div className="flex justify-center">
              <div className="inline-flex gap-1 p-1.5 bg-slate-100/90 dark:bg-gray-800/90 rounded-2xl backdrop-blur-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <motion.button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {/* Animated background pill */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-[#2f4982] rounded-xl shadow-lg"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* PESSOAL TAB */}
              {activeTab === 'pessoal' && (
                <div className="space-y-6">
                  {/* Photo + Basic Info */}
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                            photoPreview 
                              ? 'border-[#2f4982]/30' 
                              : 'border-dashed border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-800'
                          }`}
                        >
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-gray-500">
                              <User className="w-10 h-10" />
                            </div>
                          )}
                        </motion.div>
                        
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-2xl">
                          <Upload className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                        
                        {uploadingPhoto && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-2xl">
                            <Loader2 className="w-6 h-6 text-[#2f4982] animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name + Type */}
                    <div className="flex-1 space-y-4 w-full">
                      <FloatingInput 
                        label="Nome Completo" 
                        name="nome" 
                        value={formData.nome} 
                        onChange={handleInputChange} 
                        required 
                      />
                      
                      {isCliente && (
                        <FloatingInput 
                          label="Cargo do Cliente" 
                          name="cargo_cliente" 
                          value={formData.cargo_cliente} 
                          onChange={handleInputChange}
                        />
                      )}
                    </div>
                  </div>

                  {/* Contact Info for Clients (all in one tab) */}
                  {isCliente && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Mail className="w-4 h-4 text-[#2f4982]" />
                        Contato
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        <FloatingInput label="Celular" name="celular" value={formData.celular} onChange={handleInputChange} />
                        <FloatingInput label="Telefone" name="telefone" value={formData.telefone} onChange={handleInputChange} />
                      </div>
                    </div>
                  )}

                  {/* Personal Info - Only for Internal */}
                  {!isCliente && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-4 h-4 text-[#2f4982]" />
                        Dados Pessoais
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FloatingInput label="CPF" name="cpf" value={formData.cpf} onChange={handleInputChange} />
                        <FloatingInput label="RG" name="rg" value={formData.rg} onChange={handleInputChange} />
                        <FloatingInput label="Data de Nascimento" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleInputChange} />
                        <FloatingInput label="Nacionalidade" name="nacionalidade" value={formData.nacionalidade} onChange={handleInputChange} />
                        <FloatingSelect 
                          label="Estado Civil" 
                          name="estado_civil" 
                          value={formData.estado_civil} 
                          onChange={handleInputChange}
                          options={[
                            { value: '', label: 'Selecione' },
                            { value: 'solteiro', label: 'Solteiro(a)' },
                            { value: 'casado', label: 'Casado(a)' },
                            { value: 'divorciado', label: 'Divorciado(a)' },
                            { value: 'viuvo', label: 'Viúvo(a)' }
                          ]} 
                        />
                        <FloatingSelect 
                          label="Gênero" 
                          name="genero" 
                          value={formData.genero} 
                          onChange={handleInputChange}
                          options={[
                            { value: '', label: 'Selecione' },
                            { value: 'masculino', label: 'Masculino' },
                            { value: 'feminino', label: 'Feminino' },
                            { value: 'outro', label: 'Outro' }
                          ]} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTATO TAB - Only for Internal */}
              {activeTab === 'contato' && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-[#2f4982]" />
                      Informações de Contato
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                      <FloatingInput label="Celular" name="celular" value={formData.celular} onChange={handleInputChange} />
                      <FloatingInput label="Telefone" name="telefone" value={formData.telefone} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-[#2f4982]" />
                      Endereço
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <FloatingInput label="CEP" name="cep" value={formData.cep} onChange={handleInputChange} />
                      <FloatingInput label="Endereço" name="endereco" value={formData.endereco} onChange={handleInputChange} className="col-span-2 sm:col-span-3" />
                      <FloatingInput label="Número" name="numero" value={formData.numero} onChange={handleInputChange} />
                      <FloatingInput label="Complemento" name="complemento" value={formData.complemento} onChange={handleInputChange} className="sm:col-span-2" />
                      <FloatingInput label="Bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} />
                      <FloatingInput label="Cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} className="sm:col-span-2" />
                      <FloatingInput label="Estado" name="estado" value={formData.estado} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              )}

              {/* PROFISSIONAL TAB */}
              {activeTab === 'profissional' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingInput label="Profissão" name="profissao" value={formData.profissao} onChange={handleInputChange} />
                    <FloatingInput label="Registro Profissional" name="registro_profissional" value={formData.registro_profissional} onChange={handleInputChange} />
                  </div>
                  <FloatingTextArea label="Resumo Profissional" name="resumo_profissional" value={formData.resumo_profissional} onChange={handleInputChange} rows={4} />
                  <FloatingTextArea label="Especialidades" name="especialidades" value={formData.especialidades} onChange={handleInputChange} />
                  <FloatingTextArea label="Idiomas" name="idiomas" value={formData.idiomas} onChange={handleInputChange} />
                </div>
              )}

              {/* EXPERIÊNCIA TAB */}
              {activeTab === 'experiencia' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#2f4982]" />
                      Adicionar Experiência
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FloatingInput label="Empresa" value={novaExperiencia.empresa} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, empresa: e.target.value })} />
                      <FloatingInput label="Cargo" value={novaExperiencia.cargo} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, cargo: e.target.value })} />
                      <FloatingInput label="Início" type="date" value={novaExperiencia.dataInicio} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, dataInicio: e.target.value })} />
                      <FloatingInput label="Fim" type="date" value={novaExperiencia.dataFim} onChange={(e: any) => setNovaExperiencia({ ...novaExperiencia, dataFim: e.target.value })} />
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleAddExperiencia}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </motion.button>
                  </div>

                  {formData.experiencias.length > 0 ? (
                    <div className="space-y-3">
                      {formData.experiencias.map((exp: Experiencia) => (
                        <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-700/40"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{exp.cargo}</h4>
                            <p className="text-sm text-slate-600 dark:text-gray-400">{exp.empresa}</p>
                          </div>
                          <button onClick={() => handleRemoveExperiencia(exp.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma experiência cadastrada</p>
                    </div>
                  )}
                </div>
              )}

              {/* FORMAÇÃO TAB */}
              {activeTab === 'formacao' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#2f4982]" />
                      Adicionar Formação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FloatingInput label="Instituição" value={novaFormacao.instituicao} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, instituicao: e.target.value })} />
                      <FloatingInput label="Curso" value={novaFormacao.curso} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, curso: e.target.value })} />
                      <FloatingSelect
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
                      <FloatingInput label="Data de Conclusão" type="date" value={novaFormacao.dataFormacao} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, dataFormacao: e.target.value })} />
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleAddFormacao}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </motion.button>
                  </div>

                  {formData.formacoes.length > 0 ? (
                    <div className="space-y-3">
                      {formData.formacoes.map((form: Formacao) => (
                        <motion.div
                          key={form.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-700/40"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{form.curso}</h4>
                            <p className="text-sm text-slate-600 dark:text-gray-400">{form.instituicao}</p>
                          </div>
                          <button onClick={() => handleRemoveFormacao(form.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma formação cadastrada</p>
                    </div>
                  )}
                </div>
              )}

              {/* CERTIFICADOS TAB */}
              {activeTab === 'certificados' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#2f4982]" />
                      Adicionar Certificado
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FloatingInput label="Nome do Certificado" value={novoCertificado.nome} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, nome: e.target.value })} />
                      <FloatingInput label="Instituição" value={novoCertificado.instituicao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, instituicao: e.target.value })} />
                      <FloatingInput label="Data de Obtenção" type="date" value={novoCertificado.dataObtencao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, dataObtencao: e.target.value })} />
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleAddCertificado}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-[#2f4982] hover:bg-[#243a68] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </motion.button>
                  </div>

                  {formData.certificados.length > 0 ? (
                    <div className="space-y-3">
                      {formData.certificados.map((cert: Certificado) => (
                        <motion.div
                          key={cert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-700/40"
                        >
                          <div className="p-2 bg-[#2f4982]/10 rounded-lg">
                            <Award className="w-5 h-5 text-[#2f4982]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{cert.nome}</h4>
                            <p className="text-sm text-slate-600 dark:text-gray-400">{cert.instituicao}</p>
                          </div>
                          <button onClick={() => handleRemoveCertificado(cert.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum certificado cadastrado</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer with actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-700/50 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex justify-end gap-3">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={isViewMode 
              ? "px-6 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 font-medium hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              : "px-6 py-2.5 rounded-xl border border-red-300 dark:border-red-500/50 text-red-500 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            }
          >
            {isViewMode ? 'Fechar' : 'Cancelar'}
          </motion.button>
          {isViewMode ? (
            <motion.button
              type="button"
              onClick={onEdit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl bg-[#2f4982] hover:bg-[#243a68] text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-[#2f4982]/20"
            >
              <Edit className="w-4 h-4" />
              Editar
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl bg-[#2f4982] hover:bg-[#243a68] text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2f4982]/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
