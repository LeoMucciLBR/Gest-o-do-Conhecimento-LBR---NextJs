'use client'

import React from 'react'

interface AddContractCardProps {
  onClick: () => void // Função para navegar para a página de adição
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
      className="relative flex w-full sm:w-8/12 md:w-4/4 lg:w-5/5 xl:w-3/3 mx-auto my-4 flex-col rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer justify-center items-center p-6"
    >
      <div className="text-center">
        <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center text-4xl font-light">
          <button
            title="Add New"
            className="group cursor-pointer outline-none hover:rotate-90 duration-300"
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50px"
              height="50px"
              viewBox="0 0 24 24"
              className="stroke-lbr-primary dark:stroke-blue-400 fill-none group-hover:fill-blue-100 dark:group-hover:fill-blue-900 group-active:stroke-lbr-primary dark:group-active:stroke-blue-400 group-active:fill-blue-500 group-active:duration-0 duration-300"
            >
              <path
                d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                strokeWidth="1.5"
              ></path>
              <path d="M8 12H16" strokeWidth="1.5"></path>
              <path d="M12 16V8" strokeWidth="1.5"></path>
            </svg>
          </button>
        </div>
        <h5 className="block font-sans text-xl font-semibold leading-snug tracking-normal text-gray-600 dark:text-gray-300 antialiased">
          Adicionar Novo Contrato
        </h5>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Clique para cadastrar um novo contrato.
        </p>
      </div>
    </article>
  )
}
