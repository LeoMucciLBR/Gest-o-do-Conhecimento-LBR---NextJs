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
    <div className="space-y-6">
      {/* Localização do Escritório Cliente */}
      <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse shadow-lg shadow-[#2f4982]/50" />
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
      <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse shadow-lg shadow-[#2f4982]/50" />
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
