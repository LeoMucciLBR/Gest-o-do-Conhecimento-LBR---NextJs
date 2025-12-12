'use client'

import { Plus, X, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { ESTADOS } from '../lib/validation'
import CustomSelect from '@/components/ui/CustomSelect'
import { LocationField } from '@/components/ui/LocationField'
import type { LocationValue } from '@/components/ui/LocationField'

export type ObraTipo = 'FEDERAL' | 'ESTADUAL'

export type ObraRow = {
  tipo: ObraTipo
  uf: string
  rodoviaId: number | ''
  brCodigo: string
  kmInicio: string
  kmFim: string
}

export type RodoviaOption = {
  id: number
  codigo: string
  nome: string
  uf: string
  km_inicial?: number | null
  km_final?: number | null
}

type KmValidationError = {
  kmInicio?: string
  kmFim?: string
}

interface ObrasSectionProps {
  obras: ObraRow[]
  rodoviasPorUf: Record<string, RodoviaOption[]>
  brsPorUf: Record<string, string[]>
  hasMultipleWorks: 'sim' | 'nao'
  onHasMultipleWorksChange: (value: 'sim' | 'nao') => void
  onAddObra: () => void
  onRemoveObra: (index: number) => void
  onUpdateObraField: <K extends keyof ObraRow>(index: number, field: K, value: ObraRow[K]) => void
  onChangeTipo: (index: number, tipo: ObraTipo) => void
  onChangeUf: (index: number, uf: string) => void
  sector?: string
  localizacao?: LocationValue
  onLocalizacaoChange?: (value: LocationValue) => void
}

export default function ObrasSection({
  obras,
  rodoviasPorUf,
  brsPorUf,
  hasMultipleWorks,
  onHasMultipleWorksChange,
  onAddObra,
  onRemoveObra,
  onUpdateObraField,
  onChangeTipo,
  onChangeUf,
  sector = '',
  localizacao,
  onLocalizacaoChange,
}: ObrasSectionProps) {
  // State to track KM validation errors for each obra
  const [kmValidationErrors, setKmValidationErrors] = useState<Record<number, KmValidationError>>({})

  // Function to validate KM values against highway ranges using API
  const validateKm = async (index: number, field: 'kmInicio' | 'kmFim', value: string) => {
    const obra = obras[index]
    
    console.log('🔍 Validating KM:', { index, field, value, obra })
    
    // Clear existing error for this field
    setKmValidationErrors(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: undefined
      }
    }))

    // Only validate if we have a value and a selected highway
    if (!value || value.trim() === '') {
      console.log('⚠️ Empty value, skipping validation')
      return
    }

    const kmValue = parseFloat(value)
    if (isNaN(kmValue)) {
      console.log('⚠️ Invalid number, skipping validation')
      return
    }

    // Only validate estadual highways for now
    if (obra.tipo !== 'ESTADUAL' || !obra.rodoviaId || !obra.uf) {
      console.log('⚠️ Skipping validation - not estadual or missing data')
      return
    }

    // Need both KM values to validate the range
    const kmInicio = field === 'kmInicio' ? value : obra.kmInicio
    const kmFim = field === 'kmFim' ? value : obra.kmFim

    if (!kmInicio || !kmFim || kmInicio.trim() === '' || kmFim.trim() === '') {
      console.log('⚠️ Missing KM inicio or fim, skipping validation')
      return
    }

    try {
      console.log('📡 Calling validation API...', { rodoviaId: obra.rodoviaId, kmInicio, kmFim })
      
      const response = await fetch(`/api/rodovias/${obra.rodoviaId}/validate-km`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km_inicio: parseFloat(kmInicio),
          km_fim: parseFloat(kmFim),
        }),
      })

      const result = await response.json()
      console.log('📡 Validation result:', result)

      if (!result.valid) {
        const errorMsg = result.gaps && result.gaps.length > 0
          ? result.gaps[0].message
          : result.message

        console.log('❌ Validation failed:', errorMsg)
        
        setKmValidationErrors(prev => ({
          ...prev,
          [index]: {
            kmInicio: errorMsg,
            kmFim: errorMsg,
          }
        }))
      } else {
        console.log('✅ Validation passed!')
      }
    } catch (error) {
      console.error('Error validating KM:', error)
    }
  }

  // Function to handle KM field blur (when user leaves the field)
  const handleKmBlur = (index: number, field: 'kmInicio' | 'kmFim', value: string) => {
    validateKm(index, field, value)
  }

  // Check if sector is Rodovias to show highway selector
  const isRodoviaSector = sector === 'Rodovias'

  return (
    <div className="space-y-6">
      {/* If NOT Rodovias sector, show location field instead */}
      {!isRodoviaSector && localizacao && onLocalizacaoChange && (
        <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2f4982] rounded-full animate-pulse shadow-lg shadow-[#2f4982]/50" />
            Localização da Obra/Projeto
          </h3>

          <LocationField
            value={localizacao}
            onChange={onLocalizacaoChange}
            placeholder="Digite o endereço ou localização do projeto"
            label="Endereço"
            required
          />
        </div>
      )}

      {/* If Rodovias sector, show highway selector interface */}
      {isRodoviaSector && (
        <>
          {/* Pergunta inicial */}
          <div className="relative group bg-gradient-to-br from-amber-50/40 via-yellow-50/30 to-transparent dark:from-amber-900/10 dark:via-yellow-900/5 rounded-2xl p-6 border-2 border-amber-100 dark:border-amber-900/30 shadow-lg hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <h3 className="relative z-10 text-lg font-bold bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent dark:text-white mb-4">
              O contrato contempla mais de uma obra/rodovia?
            </h3>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => onHasMultipleWorksChange('nao')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  hasMultipleWorks === 'nao'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => onHasMultipleWorksChange('sim')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  hasMultipleWorks === 'sim'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
              >
                Sim
              </button>
            </div>
          </div>

      {/* Tabela de Obras */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Obras / Rodovias
          </h3>
          {hasMultipleWorks === 'sim' && (
            <button
              type="button"
              onClick={onAddObra}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              Adicionar Obra
            </button>
          )}
        </div>

        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-gray-700">
                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">Tipo</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">UF</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">Rodovia</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">KM Inicial</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">KM Final</th>
                {hasMultipleWorks === 'sim' && obras.length > 1 && (
                  <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-gray-300">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {obras.map((obra, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Tipo */}
                  <td className="p-3">
                    <div className="relative">
                      <select
                        value={obra.tipo}
                        onChange={(e) => onChangeTipo(index, e.target.value as ObraTipo)}
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer appearance-none"
                      >
                        <option value="ESTADUAL">Estadual</option>
                        <option value="FEDERAL">Federal</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>

                  {/* UF */}
                  <td className="p-3">
                    <div className="relative">
                      <select
                        value={obra.uf}
                        onChange={(e) => onChangeUf(index, e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer appearance-none"
                      >
                        <option value="">Selecione...</option>
                        {ESTADOS.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>

                  {/* Rodovia */}
                  <td className="p-3">
                    {obra.tipo === 'ESTADUAL' ? (
                      <div className="relative">
                        <select
                          value={obra.rodoviaId}
                          onChange={(e) =>
                            onUpdateObraField(
                              index,
                              'rodoviaId',
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          disabled={!obra.uf}
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer appearance-none"
                        >
                          <option value="">Selecione...</option>
                          {(rodoviasPorUf[obra.uf] || []).map((rod) => (
                            <option key={rod.id} value={rod.id}>
                              {rod.nome}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={obra.brCodigo}
                          onChange={(e) => onUpdateObraField(index, 'brCodigo', e.target.value)}
                          disabled={!obra.uf}
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer appearance-none"
                        >
                          <option value="">Selecione...</option>
                          {(brsPorUf[obra.uf] || []).map((br) => (
                            <option key={br} value={br}>
                              BR-{br}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* KM Inicial */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={obra.kmInicio}
                        onChange={(e) => onUpdateObraField(index, 'kmInicio', e.target.value)}
                        onBlur={(e) => handleKmBlur(index, 'kmInicio', e.target.value)}
                        placeholder="0.0"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          kmValidationErrors[index]?.kmInicio 
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                      />
                      {kmValidationErrors[index]?.kmInicio && (
                        <div className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{kmValidationErrors[index].kmInicio}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* KM Final */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={obra.kmFim}
                        onChange={(e) => onUpdateObraField(index, 'kmFim', e.target.value)}
                        onBlur={(e) => handleKmBlur(index, 'kmFim', e.target.value)}
                        placeholder="0.0"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          kmValidationErrors[index]?.kmFim 
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                      />
                      {kmValidationErrors[index]?.kmFim && (
                        <div className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{kmValidationErrors[index].kmFim}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  {hasMultipleWorks === 'sim' && obras.length > 1 && (
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onRemoveObra(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remover obra"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-4">
          {obras.map((obra, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-slate-200 dark:border-gray-600"
            >
              {/* Header com número e botão de remover */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-gray-300">
                  Obra {index + 1}
                </span>
                {hasMultipleWorks === 'sim' && obras.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveObra(index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remover obra"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tipo */}
              <div>
                <CustomSelect
                  label="Tipo"
                  value={obra.tipo}
                  onChange={(value) => onChangeTipo(index, value as ObraTipo)}
                  options={[
                    { value: 'ESTADUAL', label: 'Estadual' },
                    { value: 'FEDERAL', label: 'Federal' },
                  ]}
                  placeholder="Selecione..."
                />
              </div>

              {/* UF */}
              <div>
                <CustomSelect
                  label="UF"
                  value={obra.uf}
                  onChange={(value) => onChangeUf(index, value)}
                  options={ESTADOS.map(uf => ({ value: uf, label: uf }))}
                  placeholder="Selecione..."
                />
              </div>

              {/* Rodovia */}
              <div>
                {obra.tipo === 'ESTADUAL' ? (
                  <CustomSelect
                    label="Rodovia"
                    value={String(obra.rodoviaId)}
                    onChange={(value) => onUpdateObraField(index, 'rodoviaId', value ? Number(value) : '')}
                    options={(rodoviasPorUf[obra.uf] || []).map(rod => ({ value: String(rod.id), label: rod.nome }))}
                    placeholder="Selecione..."
                  />
                ) : (
                  <CustomSelect
                    label="Rodovia"
                    value={obra.brCodigo}
                    onChange={(value) => onUpdateObraField(index, 'brCodigo', value)}
                    options={(brsPorUf[obra.uf] || []).map(br => ({ value: br, label: `BR-${br}` }))}
                    placeholder="Selecione..."
                  />
                )}
              </div>

              {/* KMs em grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    KM Inicial
                  </label>
                  <input
                    type="text"
                    value={obra.kmInicio}
                    onChange={(e) => onUpdateObraField(index, 'kmInicio', e.target.value)}
                    onBlur={(e) => handleKmBlur(index, 'kmInicio', e.target.value)}
                    placeholder="0.0"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      kmValidationErrors[index]?.kmInicio 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                  />
                  {kmValidationErrors[index]?.kmInicio && (
                    <div className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{kmValidationErrors[index].kmInicio}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    KM Final
                  </label>
                  <input
                    type="text"
                    value={obra.kmFim}
                    onChange={(e) => onUpdateObraField(index, 'kmFim', e.target.value)}
                    onBlur={(e) => handleKmBlur(index, 'kmFim', e.target.value)}
                    placeholder="0.0"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      kmValidationErrors[index]?.kmFim 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                  />
                  {kmValidationErrors[index]?.kmFim && (
                    <div className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{kmValidationErrors[index].kmFim}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
