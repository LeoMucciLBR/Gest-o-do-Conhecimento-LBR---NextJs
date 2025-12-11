import { X, Shield, Clock, AlertTriangle, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'BLOCKED' | 'RATE_LIMIT' | 'IP_BLOCKED' | 'COUNTRY_BLOCKED'
  data?: {
    message?: string
    cooldownUntil?: Date
    attemptsLeft?: number
    country?: string
  }
}

export function SecurityModal({ isOpen, onClose, type, data }: SecurityModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Timer para cooldown
  useEffect(() => {
    if (type === 'RATE_LIMIT' && data?.cooldownUntil) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const end = new Date(data.cooldownUntil!).getTime()
        const diff = end - now

        if (diff <= 0) {
          setTimeLeft('Você já pode tentar novamente!')
          clearInterval(interval)
          return
        }

        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${minutes}m ${seconds}s`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [type, data?.cooldownUntil])

  const getContent = () => {
    switch (type) {
      case 'BLOCKED':
        return {
          icon: Shield,
          iconColor: 'text-red-500',
          bgGradient: 'from-red-500/10 to-red-600/10',
          title: 'Conta Bloqueada',
          description: data?.message || 'Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte para mais informações.',
          action: { label: 'Falar com Suporte', onClick: () => window.open('mailto:suporte@lbreng.com.br', '_blank') }
        }
      
      case 'RATE_LIMIT':
        return {
          icon: Clock,
          iconColor: 'text-orange-500',
          bgGradient: 'from-orange-500/10 to-orange-600/10',
          title: 'Muitas Tentativas',
          description: 'Você excedeu o número de tentativas permitidas. Por favor, aguarde antes de tentar novamente.',
          timer: timeLeft,
          action: { label: 'Entendi', onClick: onClose }
        }
      
      case 'IP_BLOCKED':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgGradient: 'from-red-500/10 to-red-600/10',
          title: 'IP Bloqueado',
          description: data?.message || 'Seu endereço IP foi bloqueado pelo administrador. Entre em contato com o suporte.',
          action: { label: 'Falar com Suporte', onClick: () => window.open('mailto:suporte@lbreng.com.br', '_blank') }
        }
      
      case 'COUNTRY_BLOCKED':
        return {
          icon: Globe,
          iconColor: 'text-blue-500',
          bgGradient: 'from-blue-500/10 to-blue-600/10',
          title: 'Acesso Restrito',
          description: `Acesso permitido apenas do Brasil. Você está tentando acessar de: ${data?.country || 'localização desconhecida'}. Se você precisa acessar de outro país, contate o administrador.`,
          action: { label: 'Falar com Administrador', onClick: () => window.open('mailto:admin@lbreng.com.br', '_blank') }
        }
    }
  }

  const content = getContent()
  const Icon = content.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${content.bgGradient} opacity-50`} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>

            {/* Content */}
            <div className="relative p-8 space-y-6">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="flex justify-center"
              >
                <div className={`p-4 rounded-full bg-gradient-to-br ${content.bgGradient}`}>
                  <Icon className={`w-12 h-12 ${content.iconColor}`} />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-center text-gray-900 dark:text-white"
              >
                {content.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {content.description}
              </motion.p>

              {/* Timer (Rate Limit) */}
              {content.timer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl"
                >
                  <Clock className="w-6 h-6 text-orange-500 animate-pulse" />
                  <span className="text-2xl font-mono font-bold text-orange-700 dark:text-orange-400">
                    {content.timer}
                  </span>
                </motion.div>
              )}

              {/* Attempts Left */}
              {data?.attemptsLeft !== undefined && data.attemptsLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Tentativas restantes: <strong>{data.attemptsLeft}</strong></span>
                </motion.div>
              )}

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={content.action.onClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                {content.action.label}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
