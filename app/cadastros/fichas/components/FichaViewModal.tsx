'use client'

import { motion } from 'framer-motion'
import { X, Edit } from 'lucide-react'
import FichaProfileView from './FichaProfileView'

interface FichaViewModalProps {
  data: any
  onClose: () => void
  onEdit: () => void
}

export default function FichaViewModal({ data, onClose, onEdit }: FichaViewModalProps) {
  const isCliente = data?.tipo === 'CLIENTE'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative ${isCliente ? 'max-w-md' : 'max-w-6xl w-full'} max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close and Edit buttons */}
        <div className="sticky top-0 z-10 flex justify-end gap-2 p-4 bg-gradient-to-b from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent">
          <motion.button
            onClick={onEdit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-[#2f4982] text-white hover:bg-[#243a68] transition-colors shadow-lg"
            title="Editar"
          >
            <Edit className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Profile View Content */}
        <div className={isCliente ? 'pb-6 -mt-4' : 'pb-6 -mt-16'}>
          <FichaProfileView data={data} />
        </div>
      </motion.div>
    </motion.div>
  )
}
