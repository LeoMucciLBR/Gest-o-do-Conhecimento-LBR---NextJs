'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * Provider do React Query para cache e gerenciamento de estado server.
 * 
 * Configurações:
 * - staleTime: 60s - dados são considerados "frescos" por 1 minuto
 * - gcTime: 5min - dados ficam em cache por 5 minutos após não serem usados
 * - retry: 1 - tenta novamente uma vez em caso de erro
 * - refetchOnWindowFocus: false - não refaz request ao focar na janela
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tempo que os dados são considerados "frescos" (não refaz request)
            staleTime: 60 * 1000, // 1 minuto
            
            // Tempo que os dados ficam em cache após não serem mais usados
            gcTime: 5 * 60 * 1000, // 5 minutos
            
            // Não refazer request automaticamente ao focar na janela
            refetchOnWindowFocus: false,
            
            // Tentar novamente 1 vez em caso de erro
            retry: 1,
            
            // Intervalo entre tentativas
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Mostrar erro imediatamente em mutations
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
