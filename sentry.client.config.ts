/**
 * Configuração do Sentry para error tracking
 * 
 * Para ativar:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um projeto Next.js
 * 3. Adicione NEXT_PUBLIC_SENTRY_DSN ao .env.local
 * 4. Descomente o código abaixo
 */

// import * as Sentry from '@sentry/nextjs'

/*
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release (versão do app)
  release: process.env.npm_package_version,
  
  // Ignore errors
  ignoreErrors: [
    // Erros de rede comuns
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Erros de extensões do browser
    'ResizeObserver loop limit exceeded',
  ],
  
  // Antes de enviar, pode filtrar/modificar o evento
  beforeSend(event) {
    // Não enviar erros em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  },
})
*/

export {}
