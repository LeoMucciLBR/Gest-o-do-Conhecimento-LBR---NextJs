'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api/api'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onVerified: (token: string) => void
}

export function VerificationModal({ isOpen, onClose, email, onVerified }: VerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  // Auto-focus next input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Only single digit
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    
    if (fullCode.length !== 6) {
      setError('Por favor, digite o código completo')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch<{ verificationToken: string }>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code: fullCode }),
      })

      onVerified(response.verificationToken)
    } catch (err: any) {
      setError(err.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    setError('')

    try {
      await apiFetch('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setCode(['', '', '', '', '', ''])
      alert('Código reenviado com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código. Tente novamente em instantes.')
    } finally {
      setResending(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Verificar Código
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Digite o código enviado para <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
              </p>
            </div>

            {/* Code Inputs */}
            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar Código
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <button
                onClick={handleResendCode}
                disabled={resending}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center justify-center gap-2 mx-auto transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
