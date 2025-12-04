'use client'

import { useState } from 'react'
import PersonSearch from '@/components/ui/PersonSearch'
import { Trash2, UserPlus } from 'lucide-react'
import FichaModal from '@/components/modals/FichaModal'

export interface TeamMember {
  id: string  // temporary UI ID
  personId: string  // ficha ID
  name: string
  role: string  // COORDENADORA, ENGENHEIRO_RESPONSAVEL, OUTRO
  email: string
  phone: string
}

interface EquipeSectionProps {
  formData: {
    teamMembers: TeamMember[]
  }
  onTeamChange: (team: TeamMember[]) => void
}

const ROLES = [
  { value: 'COORDENADORA', label: 'Coordenadora' },
  { value: 'ENGENHEIRO_RESPONSAVEL', label: 'Engenheiro Responsável' },
  { value: 'GERENTE_PROJETO', label: 'Gerente de Projeto' },
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function EquipeSection({
  formData,
  onTeamChange,
}: EquipeSectionProps) {
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [searchValue, setSearchValue] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddMember = (person?: any) => {
    const personToAdd = person || selectedPerson
    
    if (!personToAdd) {
      alert('Selecione uma pessoa da equipe')
      return
    }

    // Check if already added
    const exists = formData.teamMembers.find(m => m.personId === personToAdd.id)
    if (exists) {
      alert('Esta pessoa já foi adicionada à equipe')
      // Reset
      setSelectedPerson(null)
      setSearchValue('')
      return
    }

    // Auto-detect role from profession
    let autoRole = 'OUTRO'
    const profession = (personToAdd.profissao || '').toLowerCase()
    if (profession.includes('coordenador')) {
      autoRole = 'COORDENADORA'
    } else if (profession.includes('engenheiro')) {
      autoRole = 'ENGENHEIRO_RESPONSAVEL'
    } else if (profession.includes('gerente')) {
      autoRole = 'GERENTE_PROJETO'
    } else if (profession.includes('analista')) {
      autoRole = 'ANALISTA'
    }

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      personId: personToAdd.id,
      name: personToAdd.full_name || personToAdd.nome,
      role: autoRole,
      email: personToAdd.email || '',
      phone: personToAdd.celular || personToAdd.telefone || ''
    }

    onTeamChange([...formData.teamMembers, newMember])
    
    // Reset
    setSelectedPerson(null)
    setSearchValue('')
  }

  const handleRemoveMember = (id: string) => {
    onTeamChange(formData.teamMembers.filter(m => m.id !== id))
  }

  const handlePersonSelect = (person: any) => {
    setSelectedPerson(person)
    setSearchValue(person.full_name || person.nome)
    
    // Auto-add when person is selected
    setTimeout(() => {
      handleAddMember(person)
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedPerson) {
      e.preventDefault()
      handleAddMember()
    }
  }

  const handleModalSuccess = (data: any) => {
    const person = {
      id: data.id,
      full_name: data.nome,
      email: data.email,
      celular: data.celular,
      telefone: data.telefone,
      profissao: data.profissao
    }
    handlePersonSelect(person)
  }

  const getRoleLabel = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role)
    return roleObj?.label || role
  }

  return (
    <div className="space-y-8">
      <FichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="create"
        defaultTipo="INTERNA"
      />

      {/* Adicionar Membros */}
      <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#2f4982] dark:text-blue-400" />
          Adicionar Membro da Equipe
        </h3>

        <div className="space-y-4" onKeyPress={handleKeyPress}>
          <PersonSearch
            label="Buscar Pessoa"
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handlePersonSelect}
            onCreateNew={() => setIsModalOpen(true)}
            placeholder="Digite nome ou email da pessoa (Enter para ver todos)"
            tipo="INTERNA"
            excludeIds={formData.teamMembers.map(m => m.personId)}
          />

          <button
            type="button"
            onClick={() => handleAddMember()}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar à Equipe
          </button>
        </div>
      </div>

      {/* Tabela de Membros */}
      {formData.teamMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full" />
            Membros da Equipe ({formData.teamMembers.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Cargo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Telefone</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {formData.teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{member.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{member.phone || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensagem quando vazio */}
      {formData.teamMembers.length === 0 && (
        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-gray-700">
          <UserPlus className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-gray-400 font-medium">Nenhum membro adicionado ainda</p>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Use o campo acima para buscar e adicionar membros</p>
        </div>
      )}
    </div>
  )
}
