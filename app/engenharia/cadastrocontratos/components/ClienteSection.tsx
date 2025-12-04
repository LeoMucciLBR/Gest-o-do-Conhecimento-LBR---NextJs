'use client'

import { ChangeEvent, useState } from 'react'
import PersonSearch from '@/components/ui/PersonSearch'
import { Briefcase } from 'lucide-react'
import FichaModal from '@/components/modals/FichaModal'

interface ClienteSectionProps {
  formData: {
    gestorArea: string
    emailGestor: string
    telefoneGestor: string
    gerenteEngenharia: string
    emailGerente: string
    telefoneGerente: string
  }
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function ClienteSection({
  formData,
  onChange,
}: ClienteSectionProps) {
  const [activeField, setActiveField] = useState<'gestor' | 'gerente' | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePersonSelect = (person: any, fieldPrefix: 'Gestor' | 'Gerente') => {
    // Create synthetic events to update the form data
    const createEvent = (name: string, value: string) => ({
      target: { name, value }
    }) as ChangeEvent<HTMLInputElement>

    // Update name
    onChange(createEvent(
      fieldPrefix === 'Gestor' ? 'gestorArea' : 'gerenteEngenharia',
      person.full_name || person.nome
    ))

    // Update email if available
    if (person.email) {
      onChange(createEvent(
        `email${fieldPrefix}`,
        person.email
      ))
    }

    // Update phone if available
    if (person.celular || person.telefone) {
      onChange(createEvent(
        `telefone${fieldPrefix}`,
        person.celular || person.telefone
      ))
    }
  }

  const handleModalSuccess = (data: any) => {
    if (activeField === 'gestor') {
      handlePersonSelect(data, 'Gestor')
    } else if (activeField === 'gerente') {
      handlePersonSelect(data, 'Gerente')
    }
  }

  const openModal = (field: 'gestor' | 'gerente') => {
    setActiveField(field)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8">
      <FichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="create"
        defaultTipo="CLIENTE"
        defaultCargo={activeField === 'gestor' ? 'GESTOR_AREA' : 'GERENTE_ENGENHARIA'}
      />

      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-[#2f4982] dark:text-blue-400" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white">
          Clientes do Contrato
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gestor de Área */}
        <div className="relative group bg-gradient-to-br from-[#2f4982]/5 via-blue-50/50 to-transparent dark:from-[#2f4982]/10 dark:via-blue-900/10 rounded-2xl p-6 border border-[#2f4982]/20 dark:border-[#2f4982]/30 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <h3 className="relative text-lg font-bold text-[#2f4982] dark:text-blue-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse" />
            Gestor da Área
          </h3>
          
          <div className="relative space-y-4">
            <PersonSearch
              label="Nome do Gestor"
              value={formData.gestorArea}
              onChange={(val) => onChange({ target: { name: 'gestorArea', value: val } } as any)}
              onSelect={(p) => handlePersonSelect(p, 'Gestor')}
              onCreateNew={() => openModal('gestor')}
              placeholder="Busque por nome..."
              tipo="CLIENTE"
              role="GESTOR_AREA"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="emailGestor"
                value={formData.emailGestor}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-[#2f4982] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2f4982]/20 dark:focus:ring-blue-500/20 transition-all duration-200"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="telefoneGestor"
                value={formData.telefoneGestor}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-[#2f4982] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2f4982]/20 dark:focus:ring-blue-500/20 transition-all duration-200"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Gerente de Engenharia */}
        <div className="relative group bg-gradient-to-br from-[#2f4982]/5 via-blue-50/50 to-transparent dark:from-[#2f4982]/10 dark:via-blue-900/10 rounded-2xl p-6 border border-[#2f4982]/20 dark:border-[#2f4982]/30 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <h3 className="relative text-lg font-bold text-[#2f4982] dark:text-blue-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse" />
            Gerente de Engenharia
          </h3>
          
          <div className="relative space-y-4">
            <PersonSearch
              label="Nome do Gerente"
              value={formData.gerenteEngenharia}
              onChange={(val) => onChange({ target: { name: 'gerenteEngenharia', value: val } } as any)}
              onSelect={(p) => handlePersonSelect(p, 'Gerente')}
              onCreateNew={() => openModal('gerente')}
              placeholder="Busque por nome..."
              tipo="CLIENTE"
              role="GERENTE_ENGENHARIA"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="emailGerente"
                value={formData.emailGerente}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-[#2f4982] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2f4982]/20 dark:focus:ring-blue-500/20 transition-all duration-200"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="telefoneGerente"
                value={formData.telefoneGerente}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-[#2f4982] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2f4982]/20 dark:focus:ring-blue-500/20 transition-all duration-200"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
