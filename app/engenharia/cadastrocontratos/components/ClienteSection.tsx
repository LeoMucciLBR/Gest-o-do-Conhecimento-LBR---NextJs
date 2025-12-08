'use client'

import { useState } from 'react'
import PersonSearch from '@/components/ui/PersonSearch'
import { Briefcase, UserPlus, Trash2 } from 'lucide-react'
import FichaModal from '@/components/modals/FichaModal'
import { toast } from 'sonner'

export interface ClientPerson {
  id: string  // temporary UI ID
  personId: string  // ficha ID
  name: string
  role: string  // Custom role entered by user
  email: string
  phone: string
}

interface ClienteSectionProps {
  formData: {
    clientPersons: ClientPerson[]
  }
  onClientPersonsChange: (persons: ClientPerson[]) => void
}

export default function ClienteSection({
  formData,
  onClientPersonsChange,
}: ClienteSectionProps) {
  const [currentRole, setCurrentRole] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddPerson = (person?: any) => {
    const personToAdd = person || selectedPerson
    
    if (!currentRole.trim()) {
      toast.error('⚠️ Informe o cargo antes de adicionar a pessoa!')
      return
    }

    if (!personToAdd) {
      toast.error('⚠️ Selecione uma pessoa da lista antes de adicionar!')
      return
    }

    // Check if already added
    const exists = formData.clientPersons.find(p => p.personId === personToAdd.id)
    if (exists) {
      toast.warning('⚠️ Esta pessoa já foi adicionada!')
      setSelectedPerson(null)
      setSearchValue('')
      return
    }

    const newPerson: ClientPerson = {
      id: `temp-${Date.now()}`,
      personId: personToAdd.id,
      name: personToAdd.full_name || personToAdd.nome,
      role: currentRole.trim(),
      email: personToAdd.email || '',
      phone: personToAdd.celular || personToAdd.telefone || ''
    }

    onClientPersonsChange([...formData.clientPersons, newPerson])
    
    // Reset
    setCurrentRole('')
    setSelectedPerson(null)
    setSearchValue('')
  }

  const handleRemovePerson = (id: string) => {
    onClientPersonsChange(formData.clientPersons.filter(p => p.id !== id))
  }

  const handlePersonSelect = (person: any) => {
    setSelectedPerson(person)
    setSearchValue(person.full_name || person.nome)
    
    // Auto-add when person is selected
    setTimeout(() => {
      handleAddPerson(person)
    }, 100)
  }

  const handleModalSuccess = (data: any) => {
    const person = {
      id: data.id,
      full_name: data.nome,
      email: data.email,
      celular: data.celular,
      telefone: data.telefone,
    }
    handlePersonSelect(person)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedPerson && currentRole.trim()) {
      e.preventDefault()
      handleAddPerson()
    }
  }

  return (
    <div className="space-y-8">
      <FichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="create"
        defaultTipo="CLIENTE"
      />

      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-[#2f4982] dark:text-blue-400" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white">
          Clientes do Contrato
        </h2>
      </div>

      {/* Adicionar Pessoa do Cliente */}
      <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#2f4982] dark:text-blue-400" />
          Adicionar do Cliente
        </h3>

        <div className="space-y-4">
          {/* Campo de Cargo - SIMPLIFICADO */}
          <div style={{ marginBottom: '20px', position: 'relative', zIndex: 100 }}>
            <label 
              htmlFor="clientRole" 
              style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155'
              }}
            >
              Cargo *
            </label>
            <input
              type="text"
              name="clientRole"
              id="clientRole"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="Digite o cargo (ex: Gerente de Projetos)"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 100
              }}
            />
          </div>

          {/* Buscar Pessoa */}
          <PersonSearch
            label="Buscar Pessoa"
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handlePersonSelect}
            onCreateNew={() => setIsModalOpen(true)}
            placeholder="Digite nome ou email da pessoa (Enter para ver todos)"
            tipo="CLIENTE"
            excludeIds={formData.clientPersons.map(p => p.personId)}
          />

          <button
            type="button"
            onClick={() => handleAddPerson()}
            disabled={!currentRole.trim()}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#2f4982] to-blue-600 hover:from-[#2f4982]/90 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#2f4982]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar Cliente
          </button>
        </div>
      </div>

      {/* Lista de Pessoas do Cliente */}
      {formData.clientPersons.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse" />
            Pessoas do Cliente ({formData.clientPersons.length})
          </h3>

          <div className="space-y-4">
            {formData.clientPersons.map((person) => (
              <div
                key={person.id}
                className="relative group bg-gradient-to-br from-[#2f4982]/5 via-blue-50/50 to-transparent dark:from-[#2f4982]/10 dark:via-blue-900/10 rounded-xl p-5 border border-[#2f4982]/20 dark:border-[#2f4982]/30 shadow hover:shadow-lg hover:shadow-[#2f4982]/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {person.name}
                      </h4>
                      <span className="px-3 py-1 bg-[#2f4982]/10 dark:bg-[#2f4982]/20 text-[#2f4982] dark:text-blue-300 rounded-full text-sm font-semibold">
                        {person.role}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {person.email && (
                        <div>
                          <span className="font-semibold text-slate-600 dark:text-gray-400">Email:</span>{' '}
                          <span className="text-slate-900 dark:text-white">{person.email}</span>
                        </div>
                      )}
                      {person.phone && (
                        <div>
                          <span className="font-semibold text-slate-600 dark:text-gray-400">Telefone:</span>{' '}
                          <span className="text-slate-900 dark:text-white">{person.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePerson(person.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando vazio */}
      {formData.clientPersons.length === 0 && (
        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-gray-700">
          <UserPlus className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-gray-400 font-medium">Nenhuma pessoa do cliente adicionada ainda</p>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Informe o cargo e use o campo acima para buscar ou criar pessoas</p>
        </div>
      )}
    </div>
  )
}
