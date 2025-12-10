'use client'

import React from 'react'
import { Plus, Sparkles } from 'lucide-react'

interface AddContractCardProps {
  onClick: () => void
}

export default function AddContractCard({ onClick }: AddContractCardProps) {
  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Adicionar novo contrato"
      className="group relative flex w-full h-[400px] flex-col rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800/50 dark:via-gray-800 dark:to-gray-800/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden"
    >


      {/* Partículas flutuantes */}
      <div className="absolute top-0 left-0 w-4 h-4 bg-blue-500/20 rounded-full blur-xl group-hover:animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-purple-500/20 rounded-full blur-xl group-hover:animate-[pulse_3s_ease-in-out_infinite] animation-delay-300" />
      <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-pink-500/20 rounded-full blur-xl group-hover:animate-[pulse_3s_ease-in-out_infinite] animation-delay-500" />

      {/* Conteúdo */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Container do ícone com efeito ripple */}
        <div className="relative mb-6">
          {/* Anéis ripple */}
          <div className="absolute inset-0 rounded-full bg-[#2f4982]/20 dark:bg-blue-500/20 animate-[ping_3s_ease-in-out_infinite] group-hover:animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute -inset-2 rounded-full bg-[#2f4982]/10 dark:bg-blue-500/10 animate-[pulse_3s_ease-in-out_infinite]" />
          
          {/* Ícone principal */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#2f4982] to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500">
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:rotate-90 transition-transform duration-500" strokeWidth={2.5} />
            
            {/* Brilho interno */}
            <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-500" />
          </div>

        </div>

        {/* Título */}
        <h5 className="block text-xl sm:text-2xl font-bold leading-snug tracking-tight text-gray-700 dark:text-gray-200 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#2f4982] group-hover:to-blue-600 dark:group-hover:from-blue-400 dark:group-hover:to-blue-600 transition-all duration-500">
          Adicionar Novo Contrato
        </h5>

        {/* Descrição */}
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-xs group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
          Clique para cadastrar um novo contrato no sistema
        </p>

        {/* Barra decorativa inferior */}
        <div className="mt-6 w-20 h-1 bg-gradient-to-r from-[#2f4982] via-blue-500 to-blue-600 rounded-full opacity-50 group-hover:opacity-100 group-hover:w-32 transition-all duration-500" />
      </div>

      {/* Overlay da borda */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-200 dark:ring-gray-700 group-hover:ring-2 group-hover:ring-[#2f4982]/30 dark:group-hover:ring-blue-500/30 transition-all duration-500 pointer-events-none" />
    </article>
  )
}
