'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Shield } from 'lucide-react'
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
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [shake, setShake] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (index === 5 && value) {
      const fullCode = [...newCode]
      fullCode[5] = value
      if (fullCode.every(d => d)) {
        setTimeout(() => handleVerify(fullCode.join('')), 300)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      setTimeout(() => handleVerify(pastedData), 300)
    }
  }

  const handleVerify = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('')
    
    if (codeToVerify.length !== 6) {
      setError('Por favor, digite o código completo')
      triggerShake()
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch<{ verificationToken: string }>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code: codeToVerify }),
      })

      setSuccess(true)
      setTimeout(() => {
        onVerified(response.verificationToken)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Código inválido')
      triggerShake()
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    
    setResending(true)
    setError('')

    try {
      await apiFetch('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setResendCooldown(60) // 60 segundos de cooldown
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          {/* Animated Waves Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2f4982" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1e3a6b" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,100 Q150,50 300,100 T600,100 L600,0 L0,0 Z"
                fill="url(#gradient1)"
                animate={{
                  d: [
                    "M0,100 Q150,50 300,100 T600,100 L600,0 L0,0 Z",
                    "M0,100 Q150,150 300,100 T600,100 L600,0 L0,0 Z",
                    "M0,100 Q150,50 300,100 T600,100 L600,0 L0,0 Z"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,80 Q150,30 300,80 T600,80 L600,0 L0,0 Z"
                fill="url(#gradient1)"
                animate={{
                  d: [
                    "M0,80 Q150,30 300,80 T600,80 L600,0 L0,0 Z",
                    "M0,80 Q150,130 300,80 T600,80 L600,0 L0,0 Z",
                    "M0,80 Q150,30 300,80 T600,80 L600,0 L0,0 Z"
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </svg>
          </div>
          
          {/* Success Overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="text-center px-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-16 sm:w-20 h-16 sm:h-20 text-white mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Código Verificado!</h3>
                  <p className="text-white/90 mt-2 text-sm sm:text-base">Redirecionando...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative p-6 sm:p-8">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#2f4982] to-[#1e3a6b] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2f4982]/30"
              >
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Verificação de Segurança
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed px-2">
                Como é seu primeiro acesso ao sistema, precisamos verificar sua identidade.
                Digite o código enviado para <br></br>{' '}
                <span className="font-semibold text-[#2f4982] dark:text-[#5a7bc4] break-all">{email}</span>
              </p>
            </motion.div>

            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 p-3 sm:p-4 bg-[#2f4982]/10 dark:bg-[#2f4982]/20 border-2 border-[#2f4982]/30 rounded-lg flex items-start gap-2"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#2f4982] flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Após a verificação, você poderá criar sua senha de acesso permanente.
              </p>
            </motion.div>

            {/* Code Inputs - Responsivo */}
            <motion.div
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-2 sm:gap-3 mb-6"
            >
              {code.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
                >
                  <input
                    ref={(el) => { inputRefs.current[index] = el }}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading || success}
                    className={`
                      w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl
                      bg-white dark:bg-slate-700
                      border-2 transition-all duration-300 outline-none
                      ${error
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
                        : digit 
                        ? 'border-[#2f4982] shadow-lg shadow-[#2f4982]/20 scale-105' 
                        : 'border-slate-200 dark:border-slate-600'
                      }
                      ${success && 'border-green-500 dark:border-green-500'}
                      text-slate-900 dark:text-white
                      focus:border-[#2f4982] focus:ring-4 focus:ring-[#2f4982]/20 focus:scale-110
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:border-[#2f4982]/60 dark:hover:border-[#5a7bc4]
                    `}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  </motion.div>
                  <p className="text-red-600 dark:text-red-300 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 flex items-center justify-center gap-3 text-[#2f4982] dark:text-[#5a7bc4]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span className="font-medium text-sm sm:text-base">Verificando código...</span>
              </motion.div>
            )}

            {/* Resend Code with Cooldown */}
            <div className="mt-8 text-center">
              <button
                onClick={handleResendCode}
                disabled={resending || loading || resendCooldown > 0}
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-[#2f4982] dark:hover:text-[#5a7bc4] font-medium flex items-center justify-center gap-2 mx-auto transition-all disabled:opacity-50 hover:scale-105"
              >
                <motion.div
                  animate={resending ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: resending ? Infinity : 0, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                {resending 
                  ? 'Reenviando...' 
                  : resendCooldown > 0 
                  ? `Aguarde ${resendCooldown}s para reenviar` 
                  : 'Não recebeu? Reenviar código'
                }
              </button>
            </div>

            {/* Info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400 font-medium"
            >
              O código expira em 15 minutos
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
