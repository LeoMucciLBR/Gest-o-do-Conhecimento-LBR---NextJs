'use client'

import { Plus, X } from 'lucide-react'
import { ESTADOS } from '../lib/validation'

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
}: ObrasSectionProps) {
  return (
    <div className="space-y-6">
      {/* Pergunta inicial */}
      <div className="bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-950/20 rounded-2xl p-6 border-2 border-yellow-100 dark:border-yellow-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-4">
          O contrato contempla mais de uma obra/rodovia?
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">
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
                    <select
                      value={obra.tipo}
                      onChange={(e) => onChangeTipo(index, e.target.value as ObraTipo)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ESTADUAL">Estadual</option>
                      <option value="FEDERAL">Federal</option>
                    </select>
                  </td>

                  {/* UF */}
                  <td className="p-3">
                    <select
                      value={obra.uf}
                      onChange={(e) => onChangeUf(index, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Rodovia */}
                  <td className="p-3">
                    {obra.tipo === 'ESTADUAL' ? (
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        {(rodoviasPorUf[obra.uf] || []).map((rod) => (
                          <option key={rod.id} value={rod.id}>
                            {rod.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={obra.brCodigo}
                        onChange={(e) => onUpdateObraField(index, 'brCodigo', e.target.value)}
                        disabled={!obra.uf}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        {(brsPorUf[obra.uf] || []).map((br) => (
                          <option key={br} value={br}>
                            BR-{br}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* KM Inicial */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={obra.kmInicio}
                      onChange={(e) => onUpdateObraField(index, 'kmInicio', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  {/* KM Final */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={obra.kmFim}
                      onChange={(e) => onUpdateObraField(index, 'kmFim', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  value={obra.tipo}
                  onChange={(e) => onChangeTipo(index, e.target.value as ObraTipo)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ESTADUAL">Estadual</option>
                  <option value="FEDERAL">Federal</option>
                </select>
              </div>

              {/* UF */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  UF
                </label>
                <select
                  value={obra.uf}
                  onChange={(e) => onChangeUf(index, e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rodovia */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                  Rodovia
                </label>
                {obra.tipo === 'ESTADUAL' ? (
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {(rodoviasPorUf[obra.uf] || []).map((rod) => (
                      <option key={rod.id} value={rod.id}>
                        {rod.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={obra.brCodigo}
                    onChange={(e) => onUpdateObraField(index, 'brCodigo', e.target.value)}
                    disabled={!obra.uf}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {(brsPorUf[obra.uf] || []).map((br) => (
                      <option key={br} value={br}>
                        BR-{br}
                      </option>
                    ))}
                  </select>
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
                    placeholder="0.0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    KM Final
                  </label>
                  <input
                    type="text"
                    value={obra.kmFim}
                    onChange={(e) => onUpdateObraField(index, 'kmFim', e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
