'use client'

import { Fragment, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react'

// Types
type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertOptions {
  title?: string
  message: string
  type?: AlertType
  confirmText?: string
}

interface ConfirmOptions {
  title?: string
  message: string
  type?: AlertType
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<void>
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
}

// Context
const AlertContext = createContext<AlertContextType | null>(null)

// Hook
export function useCustomAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useCustomAlert must be used within AlertProvider')
  }
  return context
}

// Icon component based on type
function AlertIcon({ type, className = 'w-6 h-6' }: { type: AlertType; className?: string }) {
  switch (type) {
    case 'success':
      return <CheckCircle className={`${className} text-green-500`} />
    case 'error':
      return <XCircle className={`${className} text-red-500`} />
    case 'warning':
      return <AlertTriangle className={`${className} text-amber-500`} />
    case 'info':
    default:
      return <Info className={`${className} text-blue-500`} />
  }
}

// Get colors based on type - usar cores sólidas semelhantes ao modo claro
function getTypeColors(type: AlertType) {
  switch (type) {
    case 'success':
      return {
        bg: 'from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800',
        border: 'border-green-200 dark:border-gray-600',
        button: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
        iconBg: 'bg-green-100 dark:bg-green-100'
      }
    case 'error':
      return {
        bg: 'from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-800',
        border: 'border-red-200 dark:border-gray-600',
        button: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
        iconBg: 'bg-red-100 dark:bg-red-100'
      }
    case 'warning':
      return {
        bg: 'from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800',
        border: 'border-amber-200 dark:border-gray-600',
        button: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
        iconBg: 'bg-amber-100 dark:bg-amber-100'
      }
    case 'info':
    default:
      return {
        bg: 'from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800',
        border: 'border-blue-200 dark:border-gray-600',
        button: 'from-[#2f4982] to-blue-600 hover:from-[#3a5a9e] hover:to-blue-700',
        iconBg: 'bg-blue-100 dark:bg-blue-100'
      }
  }
}

// Alert Modal Component
function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmText = 'OK'
}: AlertOptions & { isOpen: boolean; onClose: () => void }) {
  const colors = getTypeColors(type)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-md bg-gradient-to-br ${colors.bg} rounded-2xl border ${colors.border} shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2f4982] via-blue-500 to-indigo-600" />
          
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className={`p-4 rounded-full ${colors.iconBg}`}
              >
                <AlertIcon type={type} className="w-8 h-8" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center">
              {title && (
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {title}
                </h3>
              )}
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Button */}
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`w-full py-3 px-6 bg-gradient-to-r ${colors.button} text-white font-semibold rounded-xl shadow-lg transition-all duration-200`}
              >
                {confirmText}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Confirm Modal Component
function ConfirmModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false
}: ConfirmOptions & { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  const colors = isDangerous ? getTypeColors('error') : getTypeColors(type)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-md bg-gradient-to-br ${colors.bg} rounded-2xl border ${colors.border} shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top gradient */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isDangerous ? 'from-red-500 via-rose-500 to-pink-600' : 'from-[#2f4982] via-blue-500 to-indigo-600'}`} />
          
          {/* Close button */}
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className={`p-4 rounded-full ${colors.iconBg}`}
              >
                <AlertIcon type={isDangerous ? 'error' : type} className="w-8 h-8" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center">
              {title && (
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {title}
                </h3>
              )}
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-3 px-6 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-gray-600 transition-all duration-200"
              >
                {cancelText}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={`flex-1 py-3 px-6 bg-gradient-to-r ${isDangerous ? 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' : colors.button} text-white font-semibold rounded-xl shadow-lg transition-all duration-200`}
              >
                {confirmText}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Provider Component
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean
    type: 'alert' | 'confirm'
    options: AlertOptions | ConfirmOptions
    resolve: ((value: any) => void) | null
  }>({
    isOpen: false,
    type: 'alert',
    options: { message: '' },
    resolve: null
  })

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'alert',
        options,
        resolve: () => resolve()
      })
    })
  }, [])

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'confirm',
        options,
        resolve
      })
    })
  }, [])

  const handleClose = useCallback(() => {
    if (alertState.resolve) {
      if (alertState.type === 'alert') {
        alertState.resolve(undefined)
      } else {
        alertState.resolve(false)
      }
    }
    setAlertState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [alertState])

  const handleConfirm = useCallback(() => {
    if (alertState.resolve) {
      alertState.resolve(true)
    }
    setAlertState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [alertState])

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {alertState.type === 'alert' ? (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={handleClose}
          {...(alertState.options as AlertOptions)}
        />
      ) : (
        <ConfirmModal
          isOpen={alertState.isOpen}
          onConfirm={handleConfirm}
          onCancel={handleClose}
          {...(alertState.options as ConfirmOptions)}
        />
      )}
    </AlertContext.Provider>
  )
}

// Standalone components for simple use without context
export function StandaloneAlert(props: AlertOptions & { isOpen: boolean; onClose: () => void }) {
  return <AlertModal {...props} />
}

export function StandaloneConfirm(props: ConfirmOptions & { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <ConfirmModal {...props} />
}
