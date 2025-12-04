'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, Shield, Key } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { apiFetch } from '@/lib/api/api'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  token: string
  onSuccess: () => void
}

export function ChangePasswordModal({ isOpen, onClose, email, token, onSuccess }: ChangePasswordModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState<'password' | 'confirm' | null>(null)

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsDontMatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      triggerShake()
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      triggerShake()
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          verificationToken: token,
          newPassword: password,
        }),
      })

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[95vh] overflow-y-auto"
        >
          {/* Animated Waves Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2f4982" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1e3a6b" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,200 Q150,120 300,200 T600,200 L600,0 L0,0 Z"
                fill="url(#wave-gradient)"
                animate={{
                  d: [
                    "M0,200 Q150,120 300,200 T600,200 L600,0 L0,0 Z",
                    "M0,200 Q150,280 300,200 T600,200 L600,0 L0,0 Z",
                    "M0,200 Q150,120 300,200 T600,200 L600,0 L0,0 Z"
                  ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,150 Q150,70 300,150 T600,150 L600,0 L0,0 Z"
                fill="url(#wave-gradient)"
                animate={{
                  d: [
                    "M0,150 Q150,70 300,150 T600,150 L600,0 L0,0 Z",
                    "M0,150 Q150,230 300,150 T600,150 L600,0 L0,0 Z",
                    "M0,150 Q150,70 300,150 T600,150 L600,0 L0,0 Z"
                  ]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
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
                  className="text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Key className="w-20 h-20 text-white mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Senha Criada com Sucesso!</h3>
                  <p className="text-white/90">Sua conta está protegida e pronta para uso</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative p-5 sm:p-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-5"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#2f4982] to-[#1e3a6b] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#2f4982]/20"
              >
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                Criar Senha
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs px-2">
                Defina uma senha forte para proteger sua conta
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5"
              >
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Nova Senha
                </label>
                <motion.div
                  className="relative"
                  animate={focused === 'password' ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2f4982] focus:ring-4 focus:ring-[#2f4982]/20 transition-all"
                    placeholder="Digite sua nova senha"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2f4982] dark:hover:text-[#2f4982] transition-colors"
                  >
                    <motion.div
                      animate={showPassword ? { rotate: 0 } : { rotate: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.div>
                  </motion.button>
                </motion.div>
                
                <PasswordStrengthIndicator password={password} />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <motion.div
                  animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                    Confirmar Senha
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={passwordsMatch ? { scale: 1 } : { scale: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </motion.div>
                  </label>
                  <motion.div
                    className="relative"
                    animate={focused === 'confirm' ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused('confirm')}
                      onBlur={() => setFocused(null)}
                      className={`w-full px-4 py-3 pr-12 bg-white dark:bg-slate-700 border-2 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                        passwordsDontMatch
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : passwordsMatch
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                          : 'border-slate-200 dark:border-slate-600 focus:border-[#2f4982] focus:ring-[#2f4982]/20'
                      }`}
                      placeholder="Confirme sua senha"
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2f4982] dark:hover:text-[#2f4982] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.button>
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-center gap-2 text-sm ml-1 font-medium overflow-hidden ${
                        passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <motion.div
                        initial={{ rotate: -180 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: 'spring' }}
                      >
                        {passwordsMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </motion.div>
                      {passwordsMatch ? 'Senhas coincidem ✓' : 'As senhas não coincidem'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 dark:text-red-300 text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !password || password !== confirmPassword}
                className="w-full py-4 bg-gradient-to-r from-[#2f4982] to-[#1e3a6b] hover:from-[#1e3a6b] hover:to-[#2f4982] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#2f4982]/30 hover:shadow-[#2f4982]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Criando senha...
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Shield className="w-5 h-5" />
                    </motion.div>
                    Criar Senha
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 bg-[#2f4982]/10 dark:bg-[#2f4982]/20 border border-[#2f4982]/30 rounded-lg"
            >
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#2f4982]" />
                <span>
                  Use no mínimo 8 caracteres com letras, números e símbolos.
                </span>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
