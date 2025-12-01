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
  Mail,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  MapPin,
  Phone
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
  defaultTipo?: 'INTERNA' | 'CLIENTE' // Pre-set tipo and hide selector
}

// Define components outside to prevent recreation on every render
const InputField = ({ label, name, type = 'text', placeholder, value, onChange, disabled, required, className, icon }: any) => (
  <div className={className}>
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
      {icon && <span className="text-blue-500">{icon}</span>}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md focus:shadow-lg"
      />
      {/* Animated border gradient on focus */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
    </div>
  </div>
)


const SelectField = ({ label, name, value, onChange, disabled, options, className, required }: any) => (
  <div className={className}>
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed appearance-none hover:border-slate-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md focus:shadow-lg cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 dark:text-blue-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      {/* Animated border gradient on focus */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
    </div>
  </div>
)


const TextAreaField = ({ label, name, placeholder, value, onChange, disabled, rows = 3 }: any) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
      {label}
    </label>
    <div className="relative group">
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md focus:shadow-lg"
      />
     {/* Animated border gradient on focus */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
    </div>
  </div>
)

export default function FichaForm({ onSave, mode, initialData, isModal = false, defaultTipo }: FichaFormProps) {
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
    id: '',
    empresa: '',
    cargo: '',
    dataInicio: '',
    dataFim: '',
    descricao: '',
  })

  const [novaFormacao, setNovaFormacao] = useState<Formacao>({
    id: '',
    instituicao: '',
    curso: '',
    nivel: '',
    dataFormacao: '',
    descricao: '',
  })

  const [novoCertificado, setNovoCertificado] = useState<Certificado>({
    id: '',
    nome: '',
    instituicao: '',
    dataObtencao: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (readOnly) return
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/ficha-photo', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await res.json()
      
      setFormData((prev) => ({
        ...prev,
        foto_perfil_url: data.url
      }))

      setPhotoPreview(data.url)
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      alert(error.message || 'Erro ao fazer upload da foto')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    if (readOnly) return
    setPhotoPreview(null)
    setFormData((prev) => ({
      ...prev,
      foto_perfil_url: ''
    }))
  }

  const handleAddExperiencia = () => {
    if (readOnly) return
    if (novaExperiencia.empresa && novaExperiencia.cargo) {
      setFormData((prev) => ({
        ...prev,
        experiencias: [
          ...prev.experiencias,
          { ...novaExperiencia, id: Date.now().toString() },
        ],
      }))
      setNovaExperiencia({
        id: '',
        empresa: '',
        cargo: '',
        dataInicio: '',
        dataFim: '',
        descricao: '',
      })
    }
  }

  const handleRemoveExperiencia = (id: string) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      experiencias: prev.experiencias.filter((e: Experiencia) => e.id !== id),
    }))
  }

  const handleAddFormacao = () => {
    if (readOnly) return
    if (novaFormacao.instituicao && novaFormacao.curso) {
      setFormData((prev) => ({
        ...prev,
        formacoes: [
          ...prev.formacoes,
          { ...novaFormacao, id: Date.now().toString() },
        ],
      }))
      setNovaFormacao({
        id: '',
        instituicao: '',
        curso: '',
        nivel: '',
        dataFormacao: '',
        descricao: '',
      })
    }
  }

  const handleRemoveFormacao = (id: string) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      formacoes: prev.formacoes.filter((f: Formacao) => f.id !== id),
    }))
  }

  const handleAddCertificado = () => {
    if (readOnly) return
    if (novoCertificado.nome && novoCertificado.instituicao) {
      setFormData((prev) => ({
        ...prev,
        certificados: [
          ...prev.certificados,
          { ...novoCertificado, id: Date.now().toString() },
        ],
      }))
      setNovoCertificado({
        id: '',
        nome: '',
        instituicao: '',
        dataObtencao: '',
      })
    }
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
    e.stopPropagation() // Prevent event from bubbling to parent forms
    if (readOnly) return
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: TabType; label: string; icon: any }[] = useMemo(() => [
    { id: 'pessoal', label: 'Pessoal', icon: User },
    { id: 'contato', label: 'Contato', icon: Phone },
    // Only show these tabs if NOT Cliente
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
    <div className={`min-h-screen relative overflow-hidden ${isModal ? 'min-h-0 bg-transparent' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-indigo-950/20'}`}>
      {/* Animated Background Shapes - Only if not modal */}
      {!isModal && (
        <>
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: '#233a74', opacity: 0.2 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: '#233a74', opacity: 0.2 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl"
            style={{ background: '#233a74', opacity: 0.15 }}
            animate={{
              x: [-100, 100, -100],
              y: [-50, 50, -50],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      
      {/* Header - Hide if isModal */}
      {!isModal && (
        <header className="relative z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b-2 border-white/40 dark:border-gray-800/40 shadow-xl shadow-purple-500/5">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/fichas')}
                className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl transition-all text-white shadow-lg shadow-purple-500/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400">
                  {mode === 'create' ? '✨ Nova Ficha' : '🎨 Editar Ficha'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                  Preencha as informações abaixo com carinho
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white rounded-2xl font-bold transition-all shadow-2xl shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-black">Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="font-black">Salvar Ficha</span>
                </>
              )}
            </motion.button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`container mx-auto ${isModal ? 'p-0' : 'px-4 py-8'}`}>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          
          {/* Tipo de Ficha Selector - Only show if defaultTipo is not set */}
          {!defaultTipo && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 mb-8 shadow-sm">
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4">
                Tipo de Ficha
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.tipo === 'INTERNA' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-gray-600 group-hover:border-blue-400'}`}>
                    {formData.tipo === 'INTERNA' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input
                    type="radio"
                    name="tipo"
                    value="INTERNA"
                    checked={formData.tipo === 'INTERNA'}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={readOnly}
                  />
                  <span className={`font-medium transition-colors ${formData.tipo === 'INTERNA' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-gray-400'}`}>
                    Interna LBR
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.tipo === 'CLIENTE' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-gray-600 group-hover:border-blue-400'}`}>
                    {formData.tipo === 'CLIENTE' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input
                    type="radio"
                    name="tipo"
                    value="CLIENTE"
                    checked={formData.tipo === 'CLIENTE'}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={readOnly}
                  />
                  <span className={`font-medium transition-colors ${formData.tipo === 'CLIENTE' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-gray-400'}`}>
                    Cliente
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Modern Tabs with Colorful Icons */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center gap-3 p-2 bg-white/5 dark:bg-gray-800/5 backdrop-blur-md rounded-3xl border-2 border-white/20 dark:border-gray-600/20 overflow-x-auto shadow-2xl">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                // Color schemes for each tab
                const colors = {
                  pessoal: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', icon: 'text-blue-500', activeBg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                  contato: { bg: 'from-green-500 to-emerald-600', text: 'text-green-600', icon: 'text-green-500', activeBg: 'bg-gradient-to-r from-green-500 to-emerald-600' },
                  profissional: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', icon: 'text-purple-500', activeBg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                  experiencia: { bg: 'from-orange-500 to-amber-600', text: 'text-orange-600', icon: 'text-orange-500', activeBg: 'bg-gradient-to-r from-orange-500 to-amber-600' },
                  formacao: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', icon: 'text-indigo-500', activeBg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
                  certificados: { bg: 'from-pink-500 to-rose-600', text: 'text-pink-600', icon: 'text-pink-500', activeBg: 'bg-gradient-to-r from-pink-500 to-rose-600' },
                }[tab.id as string] || { bg: 'from-gray-500 to-gray-600', text: 'text-gray-600', icon: 'text-gray-500', activeBg: 'bg-gradient-to-r from-gray-500 to-gray-600' }
                
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap justify-center overflow-hidden group ${
                      isActive
                        ? `${colors.activeBg} text-white shadow-2xl shadow-${tab.id}/50 scale-105`
                        : 'bg-white/10 dark:bg-gray-700/10 text-slate-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-600/20 backdrop-blur-sm border border-white/30 dark:border-gray-600/30'
                    }`}
                  >
                    {/* Background gradient on hover (only for inactive) */}
                    {!isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    )}
                    
                    {/* Icon with animation */}
                    <motion.div
                      animate={isActive ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                      className="relative z-10"
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : colors.icon}`} />
                    </motion.div>
                    
                    <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>


          {/* Content Area with Vibrant Glassmorphism */}
          <div className="relative bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 dark:from-gray-800/90 dark:via-purple-900/30 dark:to-blue-900/30 rounded-[32px] shadow-[0_20px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.5)] border-2 border-white/80 dark:border-gray-700/50 p-6 md:p-8 backdrop-blur-xl overflow-hidden">
            {/* Decorative animated blobs */}
            <motion.div 
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
              style={{ background: '#233a74', opacity: 0.3 }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl"
              style={{ background: '#233a74', opacity: 0.25 }}
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Floating particles */}
            {!isModal && [0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-40"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 40, scale: 0.9, rotateY: 10 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, x: -40, scale: 0.9, rotateY: -10 }}
                transition={{ duration: 0.4, ease: "easeOut", type: "spring", stiffness: 100 }}
                className="relative z-10"
              >
                {/* PESSOAL TAB */}
                {activeTab === 'pessoal' && (
                  <div className="space-y-4">
                    {/* Photo Upload - Centered */}
                    <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-100 dark:border-gray-700/50">
                      <div className="relative group">
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${photoPreview ? 'border-white shadow-xl' : 'border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800'} transition-all`}>
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-gray-600">
                              <User className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        
                        {!readOnly && (
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full backdrop-blur-sm">
                            <div className="text-center">
                              <Upload className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs font-medium">Alterar</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                          </label>
                        )}
                        
                        {uploadingPhoto && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-full">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Foto de Perfil</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={handleInputChange} disabled={readOnly} required className="md:col-span-2" placeholder="Digite o nome completo" />
                      
                      {/* Show Cargo Cliente only if CLIENTE */}
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

                      {/* Hide other personal fields if CLIENTE */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={readOnly} placeholder="exemplo@email.com" />
                      <InputField label="Celular" name="celular" type="tel" value={formData.celular} onChange={handleInputChange} disabled={readOnly} placeholder="(00) 00000-0000" />
                      <InputField label="Telefone Fixo" name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} disabled={readOnly} placeholder="(00) 0000-0000" />
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-gray-700/50">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Endereço</h3>
                      {formData.tipo === 'CLIENTE' ? (
                        <p className="text-sm text-slate-500 dark:text-gray-400 italic">Endereço não necessário para ficha de cliente.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <InputField label="CEP" name="cep" value={formData.cep} onChange={handleInputChange} disabled={readOnly} placeholder="00000-000" />
                          <InputField label="Endereço" name="endereco" value={formData.endereco} onChange={handleInputChange} disabled={readOnly} className="md:col-span-3" placeholder="Rua, Avenida, etc" />
                          
                          <InputField label="Número" name="numero" value={formData.numero} onChange={handleInputChange} disabled={readOnly} placeholder="123" />
                          <InputField label="Complemento" name="complemento" value={formData.complemento} onChange={handleInputChange} disabled={readOnly} placeholder="Apto 101" className="md:col-span-2" />
                          <InputField label="Bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} disabled={readOnly} placeholder="Centro" />
                          
                          <InputField label="Cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} disabled={readOnly} className="md:col-span-3" placeholder="São Paulo" />
                          <InputField label="Estado" name="estado" value={formData.estado} onChange={handleInputChange} disabled={readOnly} placeholder="SP" maxLength={2} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PROFISSIONAL TAB */}
                {activeTab === 'profissional' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Profissão" name="profissao" value={formData.profissao} onChange={handleInputChange} disabled={readOnly} placeholder="Ex: Engenheiro de Software" />
                      <InputField label="Registro Profissional" name="registro_profissional" value={formData.registro_profissional} onChange={handleInputChange} disabled={readOnly} placeholder="Ex: CREA 123456" />
                    </div>
                    
                    <TextAreaField label="Resumo Profissional" name="resumo_profissional" value={formData.resumo_profissional} onChange={handleInputChange} disabled={readOnly} placeholder="Descreva suas principais qualificações e objetivos..." rows={5} />
                    
                    <TextAreaField label="Especialidades" name="especialidades" value={formData.especialidades} onChange={handleInputChange} disabled={readOnly} placeholder="Java, React, Gestão de Projetos..." />
                    
                    <TextAreaField label="Idiomas" name="idiomas" value={formData.idiomas} onChange={handleInputChange} disabled={readOnly} placeholder="Inglês Fluente, Espanhol Básico..." />
                  </div>
                )}

                {/* EXPERIÊNCIA TAB */}
                {activeTab === 'experiencia' && (
                  <div className="space-y-8">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-slate-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          Adicionar Nova Experiência
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
                          className="w-full py-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar à Lista
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {formData.experiencias.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhuma experiência cadastrada</p>
                        </div>
                      ) : (
                        formData.experiencias.map((exp: Experiencia) => (
                          <div key={exp.id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{exp.cargo}</h4>
                                <p className="text-blue-600 dark:text-blue-400 font-medium">{exp.empresa}</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                  {exp.dataInicio} - {exp.dataFim || 'Atual'}
                                </p>
                              </div>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExperiencia(exp.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                            {exp.descricao && (
                              <p className="mt-4 text-slate-600 dark:text-gray-300 text-sm leading-relaxed border-t border-slate-100 dark:border-gray-700/50 pt-4">
                                {exp.descricao}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* FORMAÇÃO TAB */}
                {activeTab === 'formacao' && (
                  <div className="space-y-8">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-slate-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          Adicionar Nova Formação
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
                              { value: 'medio', label: 'Ensino Médio' },
                              { value: 'tecnico', label: 'Técnico' },
                              { value: 'graduacao', label: 'Graduação' },
                              { value: 'pos', label: 'Pós-graduação' },
                              { value: 'mestrado', label: 'Mestrado' },
                              { value: 'doutorado', label: 'Doutorado' }
                            ]} 
                          />
                          <InputField label="Conclusão" type="date" value={novaFormacao.dataFormacao} onChange={(e: any) => setNovaFormacao({ ...novaFormacao, dataFormacao: e.target.value })} />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddFormacao}
                          className="w-full py-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar à Lista
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {formData.formacoes.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-gray-500">
                          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhuma formação cadastrada</p>
                        </div>
                      ) : (
                        formData.formacoes.map((form: Formacao) => (
                          <div key={form.id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{form.curso}</h4>
                                <p className="text-blue-600 dark:text-blue-400 font-medium">{form.instituicao}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 rounded text-xs font-medium text-slate-600 dark:text-gray-300 capitalize">
                                    {form.nivel}
                                  </span>
                                  <span className="text-sm text-slate-500 dark:text-gray-400">• {form.dataFormacao}</span>
                                </div>
                              </div>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormacao(form.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* CERTIFICADOS TAB */}
                {activeTab === 'certificados' && (
                  <div className="space-y-8">
                    {!readOnly && (
                      <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-slate-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          Adicionar Novo Certificado
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InputField label="Nome do Curso/Certificado" value={novoCertificado.nome} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, nome: e.target.value })} placeholder="Ex: AWS Cloud Practitioner" />
                          <InputField label="Instituição Emissora" value={novoCertificado.instituicao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, instituicao: e.target.value })} placeholder="Ex: Amazon Web Services" />
                          <InputField label="Data de Obtenção" type="date" value={novoCertificado.dataObtencao} onChange={(e: any) => setNovoCertificado({ ...novoCertificado, dataObtencao: e.target.value })} />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCertificado}
                          className="w-full py-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar à Lista
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.certificados.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-slate-400 dark:text-gray-500">
                          <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhum certificado cadastrado</p>
                        </div>
                      ) : (
                        formData.certificados.map((cert: Certificado) => (
                          <div key={cert.id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{cert.nome}</h4>
                                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{cert.instituicao}</p>
                                <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{cert.dataObtencao}</p>
                              </div>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCertificado(cert.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions (Mobile/Modal) */}
          {isModal && !readOnly && (
            <div className="sticky bottom-0 mt-6 p-4 bg-transparent backdrop-blur-xl flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => router.back()}
                className="group px-6 py-2.5 rounded-2xl border-2 border-white/30 dark:border-gray-600/30 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm text-slate-700 dark:text-white font-semibold hover:bg-white/20 dark:hover:bg-gray-700/20 hover:border-white/50 dark:hover:border-gray-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  Cancelar
                </span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-2xl shadow-blue-500/40 hover:shadow-blue-600/60 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center gap-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Ficha
                    </>
                  )}
                </span>
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
