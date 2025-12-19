/**
 * Logger estruturado para o sistema.
 * 
 * - Em desenvolvimento: todos os logs são exibidos
 * - Em produção: apenas info, warn e error são exibidos
 * 
 * Uso:
 *   import { logger } from '@/lib/logger'
 *   logger.debug('Debugging info', { data })
 *   logger.info('Operation completed')
 *   logger.warn('Warning message')
 *   logger.error('Error occurred', error)
 */

const isDev = process.env.NODE_ENV === 'development'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

export const logger = {
  /**
   * Debug logs - apenas em desenvolvimento
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('debug', message, context))
    }
  },

  /**
   * Info logs - sempre exibidos
   */
  info: (message: string, context?: LogContext) => {
    console.info(formatMessage('info', message, context))
  },

  /**
   * Warning logs - sempre exibidos
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(formatMessage('warn', message, context))
  },

  /**
   * Error logs - sempre exibidos
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorInfo = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack }
      : { error }
    console.error(formatMessage('error', message, { ...errorInfo, ...context }))
  },

  /**
   * Alias para debug - compatibilidade com console.log existente
   */
  log: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('debug', message, context))
    }
  },
}

export default logger
