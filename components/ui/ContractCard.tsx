'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

/** Mesmo modelo usado na página de lista (UiContract) */
export type UiContract = {
  id: string
  nome: string // mapeado de api.name
  objeto: string // mapeado de api.object
  nomeContrato: string // mapeado de api.organization?.name
  status: 'Ativo' | 'Inativo' | 'Pendente'
  imagemUrl?: string | null // mapeado de api.image_url ou lamina_url
}

interface ContractCardProps {
  contract: UiContract
}

export default function ContractCard({ contract }: ContractCardProps) {
  const router = useRouter()
  const isInactive = contract.status !== 'Ativo'

  const inactiveClasses = isInactive
    ? 'opacity-50 cursor-default'
    : 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer'

  const titulo = contract.nome?.trim() || '(Sem título)'
  const contratante = contract.nomeContrato?.trim() || '(Sem contratante)'
  const objeto = contract.objeto?.trim() || '(Sem objeto)'

  const goToDetails = () => {
    if (!isInactive) router.push(`/contratos/${contract.id}`)
  }

  return (
    <article
      className={`relative flex w-full sm:w-8/12 md:w-4/4 lg:w-5/5 xl:w-3/3 mx-auto my-4 flex-col rounded-xl bg-white dark:bg-gray-800 bg-clip-border text-gray-700 dark:text-gray-200 shadow-md ${inactiveClasses}`}
      onClick={goToDetails}
      role={isInactive ? 'article' : 'button'}
      tabIndex={isInactive ? -1 : 0}
      onKeyDown={(e) => {
        if (!isInactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          goToDetails()
        }
      }}
      aria-label={isInactive ? undefined : `Abrir contrato ${titulo}`}
    >
      {/* Imagem do Card */}
      <div className="relative mx-4 -mt-6 h-48 overflow-hidden rounded-xl bg-clip-border text-white shadow-lg">
        {contract.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contract.imagemUrl}
            alt={titulo}
            className="w-full h-full object-cover opacity-80 transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 grid place-items-center text-gray-400 dark:text-gray-500">
            Sem imagem
          </div>
        )}
      </div>

      <div className="p-6">
        <h5 className="mb-1 block text-xl font-semibold leading-snug text-blue-gray-900 dark:text-gray-100">
          {titulo}
        </h5>

        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Contratante:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">{contratante}</span>
        </p>

        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Objeto do Contrato:
          </p>
          <p className="font-light">
            {objeto.length > 250 ? objeto.slice(0, 250) + '…' : objeto}
          </p>
        </div>
      </div>

      <div className="p-6 pt-0 flex justify-end items-center">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            contract.status === 'Ativo'
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : contract.status === 'Pendente'
              ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {contract.status}
        </span>
      </div>
    </article>
  )
}
