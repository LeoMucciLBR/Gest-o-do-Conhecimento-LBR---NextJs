'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle2, Shield } from 'lucide-react'

/** Mesmo modelo usado na página de lista (UiContract) */
export type UiContract = {
  id: string
  name: string
  object: string
  organization?: { id: string; name: string } | null
  status: 'Ativo' | 'Inativo' | 'Pendente'
  image_url?: string | null
  data_inicio: string | null
  data_fim: string | null
  valor: string | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
}

interface ContractCardProps {
  contract: UiContract
  currentUserId?: string
}

export default function ContractCard({ contract, currentUserId }: ContractCardProps) {
  const router = useRouter()
  const isInactive = contract.status !== 'Ativo'
  const isCreator = currentUserId && contract.creator?.id === currentUserId

  const titulo = contract.name?.trim() || '(Sem título)'
  const contratante = contract.organization?.name?.trim() || '(Sem contratante)'
  const objeto = contract.object?.trim() || '(Sem objeto)'

  const goToDetails = () => {
    if (!isInactive) router.push(`/contratos/${contract.id}`)
  }

  return (
    <article
      className={`group relative flex w-full flex-col rounded-2xl bg-white dark:bg-gray-800 bg-clip-border text-gray-700 dark:text-gray-200 shadow-lg transition-all duration-500 ease-out ${
        isInactive
          ? 'opacity-50 cursor-default'
          : 'hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer'
      }`}
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
      {/* Gradiente animado no hover - borda inferior */}
      <div className="absolute bottom-1 left-4 right-4 h-1 bg-gradient-to-r from-[#2f4982] via-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center rounded-full" />
      
      {/* Gradiente de fundo sutil no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/0 via-blue-500/0 to-blue-600/0 group-hover:from-[#2f4982]/10 group-hover:via-blue-500/5 group-hover:to-blue-600/10 dark:group-hover:from-[#2f4982]/20 dark:group-hover:via-blue-500/10 dark:group-hover:to-blue-600/20 transition-all duration-500 pointer-events-none rounded-2xl" />

      {/* Imagem do Card - ELEVADA com margem negativa */}
      <div className="relative mx-4 -mt-6 h-48 overflow-hidden rounded-xl bg-clip-border text-white shadow-xl">
        {contract.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contract.image_url}
              alt={titulo}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 grid place-items-center text-gray-400 dark:text-gray-500 transition-all duration-500 group-hover:from-gray-300 group-hover:to-gray-400 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-50">📄</div>
              <div className="text-xs">Sem imagem</div>
            </div>
          </div>
        )}
        
        {/* Creator Badge - canto superior esquerdo */}
        {contract.creator && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-medium flex items-center gap-1.5 border shadow-lg transform transition-all duration-300 ${
                isCreator
                  ? 'bg-green-500/95 text-white border-green-400/50 hover:bg-green-600/95 hover:scale-105'
                  : 'bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 border-white/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:scale-105'
              }`}
            >
              {isCreator ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Seu Contrato</span>
                </>
              ) : (
                <>
                  <UserCircle2 className="w-3.5 h-3.5" />
                  <span>{contract.creator.name.split(' ')[0]}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 relative z-10">
        <h5 className="mb-2 block text-xl font-bold leading-snug text-gray-900 dark:text-gray-100 transition-colors duration-300 group-hover:text-[#2f4982] dark:group-hover:text-blue-400">
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
          <p className="font-light leading-relaxed">
            {objeto.length > 250 ? objeto.slice(0, 250) + '…' : objeto}
          </p>
        </div>
      </div>
    </article>
  )
}
