'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Activity, Shield, Clock, TrendingUp, Eye, Database } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardStats {
  users: {
    total: number
    active: number
  }
  contracts: {
    total: number
  }
  sessions: {
    active: number
  }
  activity: {
    last24h: number
    auditLogs: number
    loginLogs: number
  }
  recentActivity: Array<{
    id: string
    type: 'contract' | 'login'
    action: string
    created_at: string
    user: {
      name: string | null
      email: string
      picture_url: string | null
    } | null
    contract?: {
      name: string
    }
    success?: boolean
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch<DashboardStats>('/admin/dashboard')
        setStats(data)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e editar usuários do sistema',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Sessões Ativas',
      description: 'Monitorar e gerenciar sessões de usuários',
      icon: Activity,
      href: '/admin/sessions',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Logs de Auditoria',
      description: 'Rastrear atividades e mudanças no sistema',
      icon: Shield,
      href: '/admin/audit',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Segurança',
      description: 'Gerenciar bloqueios e tentativas de login',
      icon: Shield,
      href: '/admin/security',
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Fichas',
      description: 'Gerenciar fichas de não conformidade',
      icon: FileText,
      href: '/admin/fichas',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Contratos',
      description: 'Gerenciar contratos ativos e inativos',
      icon: FileText,
      href: '/admin/contracts',
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Logs do Sistema',
      description: 'Visualizar logs técnicos do sistema',
      icon: Database,
      href: '/admin/logs',
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ]

  const getActionLabel = (activity: DashboardStats['recentActivity'][0]) => {
    if (activity.type === 'login') {
      if (activity.action === 'LOGIN') return activity.success ? 'Login bem-sucedido' : 'Falha no login'
      if (activity.action === 'LOGOUT') return 'Logout'
      if (activity.action === 'PASSWORD_CHANGE') return 'Senha alterada'
      return activity.action
    }

    const labels: Record<string, string> = {
      'CONTRACT_CREATED': 'Contrato criado',
      'CONTRACT_UPDATED': 'Contrato atualizado',
      'CONTRACT_DELETED': 'Contrato excluído',
      'DOCUMENT_UPLOADED': 'Documento enviado',
      'DOCUMENT_DELETED': 'Documento excluído',
      'SOFTWARE_ADDED': 'Software adicionado',
      'SOFTWARE_UPDATED': 'Software atualizado',
      'SOFTWARE_DELETED': 'Software excluído',
    }
    return labels[activity.action] || activity.action.replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#2f4982] to-[#4a6bb5] bg-clip-text text-transparent mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-slate-600 dark:text-gray-400">
          Gerenciamento e monitoramento do sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
            ))}
          </>
        ) : stats ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Usuários Totais</p>
                  <p className="text-3xl font-bold">{stats.users.total}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    {stats.users.active} ativos
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Contratos</p>
                  <p className="text-3xl font-bold">{stats.contracts.total}</p>
                  <p className="text-green-100 text-xs mt-2">
                    Ativos no sistema
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Sessões Ativas</p>
                  <p className="text-3xl font-bold">{stats.sessions.active}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    Usuários conectados
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Atividade (24h)</p>
                  <p className="text-3xl font-bold">{stats.activity.last24h}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    {stats.activity.auditLogs} audit · {stats.activity.loginLogs} login
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#2f4982]" />
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                href={action.href}
                className="group block p-4 border-2 border-slate-200 dark:border-gray-700 rounded-lg hover:border-[#2f4982] dark:hover:border-[#4a6bb5] transition-all hover:shadow-md"
              >
                <div className={`${action.iconBg} p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {stats && stats.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2f4982]" />
              Atividade Recente
            </h2>
            <Link
              href="/admin/audit"
              className="text-sm text-[#2f4982] hover:text-[#4a6bb5] font-medium flex items-center gap-1"
            >
              Ver todos
              <Eye className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {activity.user?.picture_url ? (
                  <img
                    src={activity.user.picture_url}
                    alt={activity.user.name || 'User'}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.user?.name || 'Sistema'}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {getActionLabel(activity)}
                        {activity.contract && (
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            · {activity.contract.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      activity.type === 'login'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}>
                      {activity.type === 'login' ? 'Auth' : 'Contrato'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
