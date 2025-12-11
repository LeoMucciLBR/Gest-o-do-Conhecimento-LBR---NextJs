'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle2, Shield, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

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
  hasNotification?: boolean
  onCardClick?: (contractId: string) => void
}

export default function ContractCard({ contract, currentUserId, hasNotification = false, onCardClick }: ContractCardProps) {
  const router = useRouter()
  const isInactive = contract.status !== 'Ativo'
  const isCreator = currentUserId && contract.creator?.id === currentUserId

  const titulo = contract.name?.trim() || '(Sem título)'
  const contratante = contract.organization?.name?.trim() || '(Sem contratante)'
  const objeto = contract.object?.trim() || '(Sem objeto)'

  const goToDetails = () => {
    if (isInactive) return
    
    if (onCardClick) {
      onCardClick(contract.id)
    } else {
      router.push(`/contratos/${contract.id}`)
    }
  }

  return (
    <article
      className={`group relative flex w-full h-[400px] flex-col rounded-2xl bg-white dark:bg-gray-800 bg-clip-border text-gray-700 dark:text-gray-200 shadow-lg transition-all duration-500 ease-out ${
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


      {/* ANIMAÇÃO: Gradiente de fundo glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f4982]/0 via-blue-500/0 to-blue-600/0 group-hover:from-[#2f4982]/10 group-hover:via-blue-500/5 group-hover:to-blue-600/10 dark:group-hover:from-[#2f4982]/20 dark:group-hover:via-blue-500/10 dark:group-hover:to-blue-600/20 transition-all duration-500 pointer-events-none rounded-2xl backdrop-blur-[2px] group-hover:backdrop-blur-[4px]" />

      {/* ANIMAÇÃO: Gradiente animado no hover - barra inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2f4982] via-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />

      {/* Imagem do Card - ELEVADA com margem negativa */}
      <div className="relative mx-4 -mt-6 h-48 overflow-hidden rounded-xl bg-gray-900 dark:bg-gray-900 bg-clip-border text-white shadow-xl z-20">
        {contract.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contract.image_url}
              alt={titulo}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
            />
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 grid place-items-center text-gray-400 dark:text-gray-500 transition-all duration-500 group-hover:from-gray-300 group-hover:via-gray-400 group-hover:to-gray-500 dark:group-hover:from-gray-600 dark:group-hover:via-gray-700 dark:group-hover:to-gray-800">
            <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
              <div className="text-5xl mb-2 opacity-40 group-hover:opacity-60 transition-opacity">📄</div>
              <div className="text-xs font-medium">Sem imagem</div>
            </div>
          </div>
        )}
        
        {/* ANIMAÇÃO: Badge premium do criador */}
        {contract.creator && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`px-3 py-1.5 rounded-full backdrop-blur-xl text-xs font-semibold flex items-center gap-1.5 border shadow-xl transform transition-all duration-300 ${
                isCreator
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400/30 hover:from-green-600 hover:to-emerald-700 hover:scale-105 hover:shadow-2xl'
                  : 'bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-200 border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 hover:scale-105'
              }`}
            >
              {isCreator ? (
                <>
                  <Shield className="w-3.5 h-3.5 animate-[pulse_3s_ease-in-out_infinite]" />
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

        {/* Badge de Notificação - Pintinho Vermelho */}
        {hasNotification && (
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
              
              {/* Badge */}
              <div className="relative w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 shadow-lg" />
            </motion.div>
          </div>
        )}

      </div>

      <div className="p-5 sm:p-6 relative z-10 flex-1 flex flex-col">
        {/* ANIMAÇÃO: Título com gradiente no hover */}
        <h5 className="mb-3 block text-lg sm:text-xl font-bold leading-snug text-gray-900 dark:text-gray-100 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#2f4982] group-hover:to-blue-600 dark:group-hover:from-blue-400 dark:group-hover:to-blue-600 line-clamp-2">
          {titulo}
        </h5>

        {/* ANIMAÇÃO: Contratante com ícone Sparkles */}
        <div className="flex items-start gap-2 mb-4">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex-1">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Contratante:</span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{contratante}</span>
          </p>
        </div>

        {/* ANIMAÇÃO: Divider com gradiente */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent mb-4" />

        {/* Objeto do contrato com barra lateral */}
        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-[#2f4982] to-blue-600 rounded-full" />
            Objeto do Contrato
          </p>
          <p className="font-light leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
            {objeto}
          </p>
        </div>

        {/* ANIMAÇÃO: Efeito de revelação sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* ANIMAÇÃO: Borda glow */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-2 group-hover:ring-[#2f4982]/50 dark:group-hover:ring-blue-500/50 transition-all duration-500" />
    </article>
  )
}
