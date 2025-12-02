'use client'

import { useState } from 'react'
import InputWithValidation from './InputWithValidation'
import PersonSearch from '@/components/ui/PersonSearch'
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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function ClienteSection({
  formData,
  onChange,
}: ClienteSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeField, setActiveField] = useState<'gestor' | 'gerente' | null>(null)

  const handleOpenModal = (field: 'gestor' | 'gerente') => {
    setActiveField(field)
    setModalOpen(true)
  }

  const updateField = (name: string, value: string) => {
    const event = {
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>
    onChange(event)
  }

  const handlePersonSelect = (person: any, type: 'gestor' | 'gerente') => {
    if (type === 'gestor') {
      updateField('gestorArea', person.full_name)
      updateField('emailGestor', person.email || '')
      updateField('telefoneGestor', person.celular || person.telefone || '')
    } else {
      updateField('gerenteEngenharia', person.full_name)
      updateField('emailGerente', person.email || '')
      updateField('telefoneGerente', person.celular || person.telefone || '')
    }
  }

  const handleModalSuccess = (data: any) => {
    if (activeField) {
      // Map ficha fields to person format
      const mappedPerson = {
        full_name: data.nome,
        email: data.email,
        celular: data.celular,
        telefone: data.telefone,
        endereco: data.endereco
      }
      handlePersonSelect(mappedPerson, activeField)
    }
  }

  return (
    <div className="space-y-8">
      <FichaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="create"
        defaultTipo="CLIENTE"
      />

      {/* Gestor de Área */}
      <div className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 rounded-2xl p-6 border-2 border-emerald-100 dark:border-emerald-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-600 rounded-full" />
          Gestor de Área
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PersonSearch
            label="Nome"
            value={formData.gestorArea}
            onChange={(val) => updateField('gestorArea', val)}
            onSelect={(p) => handlePersonSelect(p, 'gestor')}
            onCreateNew={() => handleOpenModal('gestor')}
            placeholder="Busque por nome ou cadastre novo"
            role="GESTOR_AREA"
          />
          <InputWithValidation
            label="Email"
            name="emailGestor"
            value={formData.emailGestor}
            onChange={onChange}
            placeholder="email@exemplo.com"
            type="email"
          />
          <InputWithValidation
            label="Telefone"
            name="telefoneGestor"
            value={formData.telefoneGestor}
            onChange={onChange}
            placeholder="(11) 99999-9999"
            type="tel"
          />
        </div>
      </div>

      {/* Gerente de Engenharia */}
      <div className="bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-950/20 rounded-2xl p-6 border-2 border-indigo-100 dark:border-indigo-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-600 rounded-full" />
          Gerente de Engenharia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PersonSearch
            label="Nome"
            value={formData.gerenteEngenharia}
            onChange={(val) => updateField('gerenteEngenharia', val)}
            onSelect={(p) => handlePersonSelect(p, 'gerente')}
            onCreateNew={() => handleOpenModal('gerente')}
            placeholder="Busque por nome ou cadastre novo"
            role="GERENTE_ENGENHARIA"
          />
          <InputWithValidation
            label="Email"
            name="emailGerente"
            value={formData.emailGerente}
            onChange={onChange}
            placeholder="email@exemplo.com"
            type="email"
          />
          <InputWithValidation
            label="Telefone"
            name="telefoneGerente"
            value={formData.telefoneGerente}
            onChange={onChange}
            placeholder="(11) 99999-9999"
            type="tel"
          />
        </div>
      </div>
    </div>
  )
}
