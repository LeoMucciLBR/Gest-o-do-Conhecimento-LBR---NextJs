'use client'

import { LocationField } from '@/components/ui/LocationField'
import type { LocationValue } from '@/components/ui/LocationField'

interface LocalizacaoSectionProps {
  formData: {
    localizacao: LocationValue
    localizacaoEscritorioCliente: LocationValue
    localizacaoEscritorioLbr: LocationValue
  }
  onLocalizacaoChange: (value: LocationValue) => void
  onLocalizacaoClienteChange: (value: LocationValue) => void
  onLocalizacaoLbrChange: (value: LocationValue) => void
}

export default function LocalizacaoSection({
  formData,
  onLocalizacaoChange,
  onLocalizacaoClienteChange,
  onLocalizacaoLbrChange,
}: LocalizacaoSectionProps) {
  return (
    <div className="space-y-8">
      {/* Localização da Obra/Projeto */}
      <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 rounded-2xl p-6 border-2 border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          Localização da Obra/Projeto
        </h3>

        <LocationField
          value={formData.localizacao}
          onChange={onLocalizacaoChange}
          placeholder="Digite o endereço ou localização do projeto"
          label="Endereço"
          required
        />
      </div>

      {/* Localização do Escritório Cliente */}
      <div className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 rounded-2xl p-6 border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          Localização do Escritório Cliente
        </h3>

        <LocationField
          value={formData.localizacaoEscritorioCliente}
          onChange={onLocalizacaoClienteChange}
          placeholder="Digite o endereço do escritório do cliente"
          label="Endereço"
        />
      </div>

      {/* Localização do Escritório LBR */}
      <div className="bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 rounded-2xl p-6 border-2 border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
          Localização do Escritório LBR
        </h3>

        <LocationField
          value={formData.localizacaoEscritorioLbr}
          onChange={onLocalizacaoLbrChange}
          placeholder="Digite o endereço do escritório LBR"
          label="Endereço"
        />
      </div>
    </div>
  )
}
