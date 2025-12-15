'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Building2, Percent, AlertCircle, Loader2 } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import { apiFetch } from '@/lib/api/api'

export interface CompanyParticipation {
  id: string  // temporary UI ID
  companyName: string
  percentage: string
}

interface EmpresasSectionProps {
  companies: CompanyParticipation[]
  onCompaniesChange: (companies: CompanyParticipation[]) => void
}

interface Empresa {
  id: string
  nome: string
  cnpj?: string
  tipo: 'CONTRATANTE' | 'SOCIO'
}

export default function EmpresasSection({
  companies,
  onCompaniesChange,
}: EmpresasSectionProps) {
  const [selectedCompany, setSelectedCompany] = useState('')
  const [percentage, setPercentage] = useState('')
  const [validationError, setValidationError] = useState('')
  const [empresasSocio, setEmpresasSocio] = useState<Empresa[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)

  // Load empresas type SOCIO from API
  useEffect(() => {
    async function loadEmpresas() {
      try {
        setLoadingEmpresas(true)
        const data = await apiFetch<{ empresas: Empresa[] }>('/empresas?tipo=SOCIO')
        setEmpresasSocio(data.empresas || [])
      } catch (error) {
        console.error('Error loading empresas:', error)
      } finally {
        setLoadingEmpresas(false)
      }
    }
    loadEmpresas()
  }, [])

  // Calculate total percentage
  const totalPercentage = companies.reduce((sum, company) => {
    return sum + (parseFloat(company.percentage) || 0)
  }, 0)

  // Check if total is valid
  useEffect(() => {
    if (companies.length > 0) {
      if (totalPercentage !== 100) {
        setValidationError(`Total atual: ${totalPercentage.toFixed(2)}% (deve ser exatamente 100%)`)
      } else {
        setValidationError('')
      }
    } else {
      setValidationError('')
    }
  }, [companies, totalPercentage])

  const handleAddCompany = () => {
    if (!selectedCompany) {
      alert('Selecione uma empresa')
      return
    }

    const percentageValue = parseFloat(percentage)
    if (!percentage || isNaN(percentageValue) || percentageValue <= 0 || percentageValue > 100) {
      alert('Informe uma porcentagem válida entre 0 e 100')
      return
    }

    // Check if company already exists
    const exists = companies.find(c => c.companyName === selectedCompany)
    if (exists) {
      alert('Esta empresa já foi adicionada')
      return
    }

    const newCompany: CompanyParticipation = {
      id: `temp-${Date.now()}`,
      companyName: selectedCompany,
      percentage: percentageValue.toFixed(2),
    }

    onCompaniesChange([...companies, newCompany])
    
    // Reset fields
    setSelectedCompany('')
    setPercentage('')
  }

  const handleRemoveCompany = (id: string) => {
    onCompaniesChange(companies.filter(c => c.id !== id))
  }

  const handlePercentageChange = (id: string, newPercentage: string) => {
    // Update directly with the string value to preserve user input while typing
    onCompaniesChange(
      companies.map(c => 
        c.id === id ? { ...c, percentage: newPercentage } : c
      )
    )
  }

  return (
    <div className="space-y-8">
      {/* Title with image */}
      

      {/* Add Company Section */}
      <div className="relative group bg-gradient-to-br from-[#2f4982]/8 via-blue-50/50 to-transparent dark:from-[#2f4982]/15 dark:via-blue-900/10 rounded-2xl p-6 border-2 border-[#2f4982]/30 dark:border-[#2f4982]/40 shadow-lg hover:shadow-xl hover:shadow-[#2f4982]/10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <h3 className="relative text-lg font-bold bg-gradient-to-r from-[#2f4982] to-blue-600 bg-clip-text text-transparent dark:text-white mb-5 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#2f4982] dark:text-blue-400" />
          Adicionar Empresa e Participação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Company Select */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Empresa *
            </label>
            {loadingEmpresas && (
              <div className="absolute right-3 top-9 z-10">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            )}
            <CustomSelect
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={empresasSocio.map(empresa => ({
                value: empresa.nome,
                label: empresa.nome + (empresa.cnpj ? ` (${empresa.cnpj})` : '')
              }))}
              placeholder={loadingEmpresas ? "Carregando..." : "Selecione uma empresa"}
            />
          </div>

          {/* Percentage Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Participação (%) *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={percentage}
                onChange={(e) => {
                  // Only allow numbers and one decimal point
                  const value = e.target.value.replace(',', '.')
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value)
                    if (value === '' || (numValue >= 0 && numValue <= 100)) {
                      setPercentage(value)
                    }
                  }
                }}
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-right font-medium"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400 font-semibold pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddCompany}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Empresa
        </button>
      </div>

      {/* Validation Warning */}
      {companies.length > 0 && totalPercentage !== 100 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1">
              Atenção: Porcentagem Total Inválida
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {validationError}
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {companies.length > 0 && totalPercentage === 100 && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            ✓ Total de participação: 100% (Correto!)
          </p>
        </div>
      )}

      {/* Companies Table */}
      {companies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full" />
            Empresas Participantes ({companies.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Participação (%)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">
                      {company.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="relative inline-flex items-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={company.percentage}
                          onChange={(e) => {
                            const value = e.target.value.replace(',', '.')
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              const numValue = parseFloat(value)
                              if (value === '' || (numValue >= 0 && numValue <= 100)) {
                                handlePercentageChange(company.id, value)
                              }
                            }
                          }}
                          className="w-20 px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2f4982] focus:border-transparent text-slate-900 dark:text-white text-right font-medium transition-all"
                        />
                        <span className="absolute right-3 text-slate-500 dark:text-gray-400 font-medium pointer-events-none">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(company.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-gray-700/50 border-t border-slate-200 dark:border-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" colSpan={2}>
                    <span className={`${
                      totalPercentage === 100 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {totalPercentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {companies.length === 0 && (
        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-gray-700">
          <Building2 className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-gray-400 font-medium">Nenhuma empresa adicionada ainda</p>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Use o campo acima para adicionar empresas participantes</p>
        </div>
      )}
    </div>
  )
}
