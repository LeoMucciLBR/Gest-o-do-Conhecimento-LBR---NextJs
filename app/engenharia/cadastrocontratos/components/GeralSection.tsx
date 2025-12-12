'use client'

import { useEffect, useState } from 'react'
import InputWithValidation from './InputWithValidation'
import { LocationField } from '@/components/ui/LocationField'
import type { LocationValue } from '@/components/ui/LocationField'
import { FileText,  Image as ImageIcon, X } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import CustomSelect from '@/components/ui/CustomSelect'
import EmpresasSection from './EmpresasSection'

interface GeralSectionProps {
  formData: {
    nomeContrato: string
    contratante: string
    setor: string
    objetoContrato: string
    escopoContrato: string
    caracteristicas: string
    dataInicio: string
    dataFim: string
    valorContrato: string
    lamina: File | null
    imagemContrato: File | null
    companyParticipations: Array<{id: string; companyName: string; percentage: string}>
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onCompaniesChange: (companies: Array<{id: string; companyName: string; percentage: string}>) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
  onRemoveImage: () => void
  existingImageUrl?: string | null
  existingLaminaFilename?: string | null
}

export default function GeralSection({
  formData,
  onChange,
  onCompaniesChange,
  onFileChange,
  onImageChange,
  onRemoveFile,
  onRemoveImage,
  existingImageUrl,
  existingLaminaFilename,
}: GeralSectionProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (formData.imagemContrato) {
      const url = URL.createObjectURL(formData.imagemContrato)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImagePreview(null)
    }
  }, [formData.imagemContrato])

  return (
    <div className="space-y-8">
      {/* Image Upload */}
      <div className="bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 rounded-2xl p-6 border-2 border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
          Imagem do Contrato
        </h3>

        {imagePreview || existingImageUrl ? (
          <div className="relative group">
            <img
              src={imagePreview || existingImageUrl!}
              alt="Preview"
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="hidden"
            />
            <div className="p-8 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-md text-center bg-purple-50/50 dark:bg-purple-900/10">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">
                Clique para selecionar uma imagem
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                PNG, JPG ou WebP (máx. 10MB)
              </p>
            </div>
          </label>
        )}
      </div>

      {/* Informações Básicas */}
      <div className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 rounded-2xl p-6 border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <InputWithValidation
              label="Nome do Contrato"
              name="nomeContrato"
              value={formData.nomeContrato}
              onChange={onChange}
              placeholder="Ex: Contrato de Consultoria Técnica"
              required
            />
          </div>

          <CustomSelect
            label="Contratante / Empresa"
            value={formData.contratante}
            onChange={(value) => onChange({ target: { name: 'contratante', value } } as any)}
            options={[
              { value: 'Agência Nacional de Transportes Terrestres - ANTT', label: 'Agência Nacional de Transportes Terrestres - ANTT' },
              { value: 'Departamento de Estradas de Rodagem - DER/SP', label: 'Departamento de Estradas de Rodagem - DER/SP' },
              { value: 'Secretaria de Infraestrutura e Meio Ambiente', label: 'Secretaria de Infraestrutura e Meio Ambiente' },
              { value: 'Desenvolvimento Rodoviário S.A. - DERSA', label: 'Desenvolvimento Rodoviário S.A. - DERSA' },
              { value: 'Companhia de Desenvolvimento Urbano - CDHU', label: 'Companhia de Desenvolvimento Urbano - CDHU' },
            ]}
            placeholder="Selecione o contratante"
            required
          />

          <CustomSelect
            label="Setor"
            value={formData.setor}
            onChange={(value) => onChange({ target: { name: 'setor', value } } as any)}
            options={[
              { value: 'Infraestrutura', label: 'Infraestrutura' },
              { value: 'Rodovias', label: 'Rodovias' },
              { value: 'Hidrovias', label: 'Hidrovias' },
              { value: 'Ferrovias', label: 'Ferrovias' },
              { value: 'Edificações/habitação', label: 'Edificações/habitação' },
              { value: 'Escolas/habitações', label: 'Escolas/habitações' },
            ]}
            placeholder="Selecione um setor"
          />

          {/* Empresas e Participações */}
          <div className="md:col-span-2">
            <EmpresasSection
              companies={formData.companyParticipations}
              onCompaniesChange={onCompaniesChange}
            />
          </div>

          <div className="md:col-span-2">
            <InputWithValidation
              label="Objeto do Contrato"
              name="objetoContrato"
              value={formData.objetoContrato}
              onChange={onChange}
              placeholder="Descreva o objeto principal do contrato"
              as="textarea"
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <RichTextEditor
              label="Escopo do Contrato"
              value={formData.escopoContrato}
              onChange={(value) => onChange({ target: { name: 'escopoContrato', value } } as any)}
              placeholder="Descreva o escopo completo"
              required
            />
          </div>

          <div className="md:col-span-2">
            <RichTextEditor
              label="Características"
              value={formData.caracteristicas}
              onChange={(value) => onChange({ target: { name: 'caracteristicas', value } } as any)}
              placeholder="Descreva as características principais do contrato"
            />
          </div>

          <InputWithValidation
            label="Data de Início"
            name="dataInicio"
            type="date"
            value={formData.dataInicio}
            onChange={onChange}
            placeholder="dd/mm/aaaa"
            required
          />

          <InputWithValidation
            label="Data de Término"
            name="dataFim"
            type="date"
            value={formData.dataFim}
            onChange={onChange}
            placeholder="dd/mm/aaaa"
            required
          />

          <div className="md:col-span-2">
            <InputWithValidation
              label="Valor do Contrato"
              name="valorContrato"
              type="currency"
              value={formData.valorContrato}
              onChange={onChange}
              placeholder="R$ 0,00"
            />
          </div>
        </div>
      </div>

      {/* Upload de Lâmina (PDF) */}
      <div className="bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20 rounded-2xl p-6 border-2 border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
          Documentos
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">
              Lâmina do Contrato (PDF)
            </label>
            <div className="flex items-center gap-3">
              {formData.lamina ? (
                <div className="flex-1 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-left duration-300">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-300">
                    {formData.lamina.name}
                  </span>
                  <button
                    type="button"
                    onClick={onRemoveFile}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ) : existingLaminaFilename ? (
                <div className="flex-1 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-300">
                    {existingLaminaFilename} (arquivo existente)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    Selecione um novo arquivo para substituir
                  </span>
                </div>
              ) : (
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <div className="p-6 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-md text-center bg-orange-50/50 dark:bg-orange-900/10">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-orange-400" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-gray-300">
                      Clique para selecionar arquivo PDF
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      Tamanho máximo: 50MB
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
