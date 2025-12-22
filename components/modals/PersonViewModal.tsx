'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    User,
    Mail,
    Phone,
    Building2,
    Briefcase,
    MapPin,
    Calendar,
    Globe,
    Award,
    GraduationCap,
    FileText,
    Users
} from 'lucide-react'

interface Person {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    office: string | null
}

interface PersonViewModalProps {
    isOpen: boolean
    onClose: () => void
    person: Person | null
    personType: 'INTERNA' | 'CLIENTE'
    role?: string
    customRole?: string | null
}

// Helper to format role names
function formatRole(role: string, customRole?: string | null): string {
    if (customRole) return customRole

    const roleNames: Record<string, string> = {
        'GESTOR_AREA': 'Gestor de Área',
        'GERENTE_ENGENHARIA': 'Gerente de Engenharia',
        'COORDENADORA': 'Coordenadora',
        'ENGENHEIRO_RESPONSAVEL': 'Engenheiro Responsável',
        'GERENTE_PROJETO': 'Gerente de Projeto',
        'ANALISTA': 'Analista',
        'OUTRO': 'Outro'
    }

    return roleNames[role?.toUpperCase()] || role || 'Não informado'
}

export default function PersonViewModal({
    isOpen,
    onClose,
    person,
    personType,
    role,
    customRole
}: PersonViewModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen || !person) return null

    const isTeam = personType === 'INTERNA'
    const accentColor = isTeam ? 'emerald' : 'violet'
    const gradientFrom = isTeam ? 'from-emerald-500' : 'from-violet-500'
    const gradientTo = isTeam ? 'to-teal-500' : 'to-purple-500'

    const infoItems = [
        {
            icon: Mail,
            label: 'Email',
            value: person.email,
            color: 'blue'
        },
        {
            icon: Phone,
            label: 'Telefone',
            value: person.phone,
            color: 'green'
        },
        {
            icon: Building2,
            label: 'Escritório',
            value: person.office,
            color: 'orange'
        },
        {
            icon: Briefcase,
            label: 'Cargo',
            value: formatRole(role || '', customRole),
            color: isTeam ? 'emerald' : 'violet'
        },
    ].filter(item => item.value)

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={onClose}
                >
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ backdropFilter: 'blur(0px)' }}
                        animate={{ backdropFilter: 'blur(12px)' }}
                        exit={{ backdropFilter: 'blur(0px)' }}
                        className="absolute inset-0 bg-black/60"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            duration: 0.3
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg overflow-hidden"
                    >
                        {/* Glassmorphism card */}
                        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">

                            {/* Gradient header */}
                            <div className={`relative h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} overflow-hidden`}>
                                {/* Decorative circles */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                                <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                                {/* Close button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>

                                {/* Type badge */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="absolute top-4 left-4"
                                >
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider">
                                        <Users className="w-3.5 h-3.5" />
                                        {isTeam ? 'Equipe LBR' : 'Cliente'}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Avatar */}
                            <div className="relative -mt-16 flex justify-center">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        damping: 15,
                                        stiffness: 200,
                                        delay: 0.1
                                    }}
                                    className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} p-1 shadow-xl`}
                                >
                                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                        <span className={`text-4xl font-bold bg-gradient-to-br ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
                                            {person.full_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-8 pt-4">
                                {/* Name */}
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-center mb-6"
                                >
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                        {person.full_name}
                                    </h2>
                                    <p className={`text-${accentColor}-600 dark:text-${accentColor}-400 font-medium`}>
                                        {formatRole(role || '', customRole)}
                                    </p>
                                </motion.div>

                                {/* Info grid */}
                                <div className="space-y-3">
                                    {infoItems.map((item, index) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 + index * 0.05 }}
                                            className="group flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all duration-300 cursor-default"
                                        >
                                            <div className={`p-3 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                                                    {item.label}
                                                </p>
                                                <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
                                                    {item.value || 'Não informado'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {infoItems.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-center py-8"
                                        >
                                            <User className="w-12 h-12 mx-auto text-slate-300 dark:text-gray-600 mb-3" />
                                            <p className="text-slate-500 dark:text-gray-400">
                                                Nenhuma informação adicional disponível
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex gap-3 mt-6"
                                >
                                    {person.email && (
                                        <a
                                            href={`mailto:${person.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>Email</span>
                                        </a>
                                    )}
                                    {person.phone && (
                                        <a
                                            href={`tel:${person.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>Ligar</span>
                                        </a>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
